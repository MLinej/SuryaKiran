"""
╔══════════════════════════════════════════════════════════════════════╗
║       SOLAR INVERTER FAULT PREDICTION — FULL ML PIPELINE            ║
║                                                                      ║
║  INPUT  : Hourly real-life sensor readings per inverter              ║
║  MODELS : RF + XGBoost + LightGBM + CatBoost + IF (sentinel)        ║
║                                                                      ║
║  PREDICTION 1 — IS IT FAULTY?   (NORMAL / WARNING / FAULT)          ║
║  PREDICTION 2 — WHEN?           (ETA in hours)                      ║
║  PREDICTION 3 — WHY?            (Root cause category breakdown)      ║
║  PREDICTION 4 — FINANCIAL LOSS  (15-day daily loss in ₹)            ║
╚══════════════════════════════════════════════════════════════════════╝

ENSEMBLE FORMULA:
    Score = 0.265·P_RF + 0.265·P_XGB + 0.265·P_LGBM + 0.265·P_CB
          + 0.10 · I[agreement >= 3/4]

    FAULT   if Score >= 0.30
    WARNING if Score >= 0.15
    NORMAL  if Score <  0.15

DEGRADATION → LOSS MAPPING (Prediction 4):
    score < 0.15        →  0%   loss  (NORMAL)
    score 0.15 – 0.30   →  5–20% loss (WARNING,  linear)
    score 0.30 – 0.60   →  20–60% loss (FAULT,   linear)
    score 0.60 – 1.00   →  60–100% loss (CRITICAL, linear)

AUC-BASED WEIGHT FORMULA:
    w_i = max(AUC_i - 0.5, 0) / Σ max(AUC_j - 0.5, 0)
"""

import numpy as np
import pandas as pd
import warnings
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    roc_auc_score, f1_score, precision_score, recall_score,
    accuracy_score, confusion_matrix, matthews_corrcoef,
    balanced_accuracy_score
)
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostClassifier

warnings.filterwarnings("ignore")


# ─────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────

CONFIG = {
    # Fault states — adjust per plant
    # Plant 1: [2]  |  Plant 3: [3, 8]
    "fault_states":        [3, 8],

    # Ensemble thresholds
    "fault_threshold":     0.30,
    "warning_threshold":   0.15,

    # Agreement bonus
    "agreement_bonus":     0.10,
    "agreement_min":       3,           # out of 4 supervised models

    # ETA slope window
    "eta_r2_min":          0.10,
    "eta_window_steps":    48,          # 48h at hourly intervals

    # Isolation Forest
    "if_n_estimators":     100,
    "if_contamination":    0.05,
    "if_max_samples":      8000,

    # Random Forest
    "rf_n_estimators":     200,
    "rf_max_depth":        12,
    "rf_min_samples_leaf": 10,

    # XGBoost
    "xgb_n_estimators":    300,
    "xgb_max_depth":       6,
    "xgb_lr":              0.05,
    "xgb_subsample":       0.8,
    "xgb_colsample":       0.8,

    # LightGBM
    "lgb_n_estimators":    300,
    "lgb_max_depth":       6,
    "lgb_lr":              0.05,

    # CatBoost
    "cb_iterations":       300,
    "cb_depth":            6,
    "cb_lr":               0.05,

    # Feature filters (healthy = these ranges)
    "power_min_w":         100,
    "temp_min_c":          5,
    "temp_max_c":          80,

    # Financial loss degradation bands
    # (score_min, score_max, loss_pct_min, loss_pct_max)
    "loss_bands": [
        (0.00, 0.15, 0.00, 0.00),   # NORMAL   → 0% loss
        (0.15, 0.30, 0.05, 0.20),   # WARNING  → 5–20% loss
        (0.30, 0.60, 0.20, 0.60),   # FAULT    → 20–60% loss
        (0.60, 1.00, 0.60, 1.00),   # CRITICAL → 60–100% loss
    ],

    # Root cause → feature mapping
    "root_cause_map": {
        "Power / Efficiency Loss": [
            "power_kw", "pv1_power_kw", "dc_ac_eff", "power_zscore",
            "power_delta", "power_roll_mean", "power_roll_std",
            "ewm_power_short", "lag_1_power", "lag_6_power"
        ],
        "Thermal / Overheating": [
            "inverter_temp_c", "thermal_rise", "temp_power_ratio",
            "temp_delta", "temp_roll_mean", "temp_roll_std",
            "ewm_temp_short", "lag_1_temp"
        ],
        "Grid / Electrical": [
            "freq_deviation", "ac_voltage_v", "ac_current_a", "voltage_deviation"
        ],
        "DC / String Loss": [
            "dc_voltage_v", "dc_current_a", "dc_power_calc", "dc_ac_ratio"
        ],
        "Composite Risk Pattern": [
            "rolling_fault_proxy", "alarm_code"
        ],
    }
}


# ─────────────────────────────────────────────────────────────────
# REAL-LIFE INPUT SCHEMA
# This is what comes in per hourly reading from the user via API
# ─────────────────────────────────────────────────────────────────

REQUIRED_INPUT_FIELDS = [
    "inverter_id",          # e.g. "INV-00"
    "timestamp",            # e.g. "2026-03-06 14:00:00"
    "power_kw",             # AC power output (kW)
    "pv1_power_kw",         # DC input / PV1 power (kW)
    "daily_kwh",            # energy generated so far today (kWh)
    "inverter_temp_c",      # inverter body temperature (°C)
    "ac_voltage_v",         # AC voltage (V)
    "dc_voltage_v",         # DC voltage (V)
    "ac_current_a",         # AC current (A)
    "dc_current_a",         # DC current (A)
    "frequency_hz",         # grid frequency (Hz)
    "alarm_code",           # 0 = no alarm
    "price_per_kwh_inr",    # ₹ per unit — user sets this once
]

OPTIONAL_INPUT_FIELDS = [
    "ambient_temp_c",       # ambient/outside temperature (°C)
    "op_state",             # operating state code (if available)
]


def validate_inputs(data: dict) -> tuple:
    """
    Validates incoming hourly reading dict.
    Returns (is_valid: bool, missing_fields: list)
    """
    missing = [f for f in REQUIRED_INPUT_FIELDS if f not in data]
    return len(missing) == 0, missing


def readings_to_dataframe(readings: list) -> pd.DataFrame:
    """
    Convert list of hourly reading dicts → DataFrame.
    Each dict = one hour of sensor data for one inverter.
    """
    df = pd.DataFrame(readings)
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, format="ISO8601")
    df = df.sort_values("timestamp").reset_index(drop=True)

    # Fill optional fields with defaults if missing
    if "ambient_temp_c" not in df.columns:
        df["ambient_temp_c"] = df["inverter_temp_c"] - 10.0
    if "op_state" not in df.columns:
        df["op_state"] = -1     # unknown

    return df


# ─────────────────────────────────────────────────────────────────
# FEATURE ENGINEERING  (from real sensor inputs)
# ─────────────────────────────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df = df.sort_values("timestamp").reset_index(drop=True)

    p = df["power_kw"].clip(lower=0)
    t = df["inverter_temp_c"]

    # ── Power features ────────────────────────────────────────────
    df["power_delta"]      = p.diff().fillna(0)
    df["power_roll_mean"]  = p.rolling(12, min_periods=1).mean()
    df["power_roll_std"]   = p.rolling(12, min_periods=1).std().fillna(0)
    df["ewm_power_short"]  = p.ewm(span=4).mean()
    df["power_zscore"]     = ((p - p.rolling(48, min_periods=1).mean())
                              / (p.rolling(48, min_periods=1).std() + 1e-6))
    df["lag_1_power"]      = p.shift(1).fillna(p.mean())
    df["lag_6_power"]      = p.shift(6).fillna(p.mean())

    # ── Temperature features ──────────────────────────────────────
    df["temp_delta"]       = t.diff().fillna(0)
    df["thermal_rise"]     = t - t.rolling(12, min_periods=1).min()
    df["temp_roll_mean"]   = t.rolling(12, min_periods=1).mean()
    df["temp_roll_std"]    = t.rolling(12, min_periods=1).std().fillna(0)
    df["ewm_temp_short"]   = t.ewm(span=4).mean()
    df["lag_1_temp"]       = t.shift(1).fillna(t.mean())

    # ── Composite thermal-power ───────────────────────────────────
    df["temp_power_ratio"] = t / (p + 1e-3)        # high = hot + low power
    df["dc_ac_eff"]        = p / (df["pv1_power_kw"] + 1e-3)

    # ── Electrical features ───────────────────────────────────────
    df["freq_deviation"]   = (df["frequency_hz"] - 50.0).abs()
    df["dc_power_calc"]    = df["dc_voltage_v"] * df["dc_current_a"] / 1000.0  # kW
    df["dc_ac_ratio"]      = df["dc_power_calc"] / (p + 1e-3)
    df["voltage_deviation"] = (df["ac_voltage_v"] - df["ac_voltage_v"]
                               .rolling(48, min_periods=1).mean()).abs()

    # ── Rolling fault proxy ───────────────────────────────────────
    drop_flag                 = (df["power_delta"] < -0.20 * df["power_roll_mean"]).astype(int)
    df["rolling_fault_proxy"] = drop_flag.rolling(6, min_periods=1).sum()

    return df


FEATURE_COLS = [
    # Power
    "power_kw", "pv1_power_kw", "dc_ac_eff",
    "power_delta", "power_roll_mean", "power_roll_std",
    "ewm_power_short", "power_zscore", "lag_1_power", "lag_6_power",
    # Temperature
    "inverter_temp_c", "thermal_rise", "temp_power_ratio",
    "temp_delta", "temp_roll_mean", "temp_roll_std",
    "ewm_temp_short", "lag_1_temp",
    # Electrical
    "ac_voltage_v", "dc_voltage_v", "ac_current_a", "dc_current_a",
    "freq_deviation", "dc_power_calc", "dc_ac_ratio", "voltage_deviation",
    # Alarm / Status
    "alarm_code", "rolling_fault_proxy",
]


# ─────────────────────────────────────────────────────────────────
# LABEL STRATEGY
# ─────────────────────────────────────────────────────────────────

def make_labels(df: pd.DataFrame, fault_states: list):
    if "op_state" not in df.columns or (df["op_state"] == -1).all():
        print("  ⚠  op_state unavailable — using IF proxy labels")
        return None, False
    labels   = df["op_state"].isin(fault_states).astype(int)
    n_fault  = int(labels.sum())
    if n_fault == 0:
        print("  ⚠  0 faults found in labels — falling back to IF proxy")
        return None, False
    n_normal = int(len(labels) - n_fault)
    print(f"  ✓  Labels: FAULT={n_fault:,}  NORMAL={n_normal:,}  ratio 1:{n_normal//max(n_fault,1)}")
    return labels, True


def make_if_proxy_labels(df: pd.DataFrame, X_scaled: np.ndarray) -> np.ndarray:
    healthy = (
        (df["power_kw"] > CONFIG["power_min_w"] / 1000) &
        (df["inverter_temp_c"].between(CONFIG["temp_min_c"], CONFIG["temp_max_c"]))
    ).values
    if healthy.sum() < 10:
        healthy = np.ones(len(df), dtype=bool)

    if_tmp = IsolationForest(
        n_estimators  = CONFIG["if_n_estimators"],
        contamination = CONFIG["if_contamination"],
        max_samples   = min(CONFIG["if_max_samples"], healthy.sum()),
        random_state  = 42, n_jobs=-1,
    )
    if_tmp.fit(X_scaled[healthy])
    proxy   = (if_tmp.predict(X_scaled) == -1).astype(int)
    n_fault = int(proxy.sum())
    print(f"  ✓  IF proxy labels: FAULT={n_fault:,}  NORMAL={(len(proxy)-n_fault):,}")
    return proxy


# ─────────────────────────────────────────────────────────────────
# MODEL TRAINING
# ─────────────────────────────────────────────────────────────────

def _spw(y):
    n = max(int(y.sum()), 1)
    return (len(y) - n) / n


def train_isolation_forest(X_healthy: np.ndarray) -> IsolationForest:
    print("  Training Isolation Forest...")
    m = IsolationForest(
        n_estimators  = CONFIG["if_n_estimators"],
        contamination = CONFIG["if_contamination"],
        max_samples   = min(CONFIG["if_max_samples"], len(X_healthy)),
        random_state  = 42, n_jobs=-1,
    )
    m.fit(X_healthy)
    print("  ✓  IF done")
    return m


def train_random_forest(X, y) -> RandomForestClassifier:
    print("  Training Random Forest...")
    m = RandomForestClassifier(
        n_estimators     = CONFIG["rf_n_estimators"],
        max_depth        = CONFIG["rf_max_depth"],
        min_samples_leaf = CONFIG["rf_min_samples_leaf"],
        max_features     = "sqrt",
        class_weight     = {0: 1, 1: _spw(y)},
        random_state     = 42, n_jobs=-1,
    )
    m.fit(X, y)
    print("  ✓  RF done")
    return m


def train_xgboost(X, y) -> xgb.XGBClassifier:
    print("  Training XGBoost...")
    m = xgb.XGBClassifier(
        n_estimators      = CONFIG["xgb_n_estimators"],
        max_depth         = CONFIG["xgb_max_depth"],
        learning_rate     = CONFIG["xgb_lr"],
        subsample         = CONFIG["xgb_subsample"],
        colsample_bytree  = CONFIG["xgb_colsample"],
        reg_alpha         = 0.1, reg_lambda=1.0,
        scale_pos_weight  = _spw(y),
        use_label_encoder = False,
        eval_metric       = "logloss",
        random_state      = 42, n_jobs=-1,
    )
    m.fit(X, y)
    print("  ✓  XGBoost done")
    return m


def train_lightgbm(X, y) -> lgb.LGBMClassifier:
    print("  Training LightGBM...")
    m = lgb.LGBMClassifier(
        n_estimators     = CONFIG["lgb_n_estimators"],
        max_depth        = CONFIG["lgb_max_depth"],
        learning_rate    = CONFIG["lgb_lr"],
        scale_pos_weight = _spw(y),
        random_state     = 42, n_jobs=-1, verbose=-1,
    )
    m.fit(X, y)
    print("  ✓  LightGBM done")
    return m


def train_catboost(X, y) -> CatBoostClassifier:
    print("  Training CatBoost...")
    m = CatBoostClassifier(
        iterations       = CONFIG["cb_iterations"],
        depth            = CONFIG["cb_depth"],
        learning_rate    = CONFIG["cb_lr"],
        scale_pos_weight = _spw(y),
        random_seed      = 42, verbose=0,
    )
    m.fit(X, y)
    print("  ✓  CatBoost done")
    return m


# ─────────────────────────────────────────────────────────────────
# AUC-BASED WEIGHT COMPUTATION
# w_i = max(AUC_i - 0.5, 0) / Σ max(AUC_j - 0.5, 0)
# ─────────────────────────────────────────────────────────────────

def compute_weights(models: dict, X_val, y_val) -> tuple:
    aucs = {}
    for name in ["rf", "xgb", "lgbm", "cb"]:
        if name not in models:
            continue
        prob = models[name].predict_proba(X_val)[:, 1]
        try:
            aucs[name] = roc_auc_score(y_val, prob)
        except Exception:
            aucs[name] = 0.5

    floored = {k: max(v - 0.5, 0.0) for k, v in aucs.items()}
    total   = sum(floored.values()) or 1.0
    weights = {k: v / total for k, v in floored.items()}

    print("\n  Ensemble weights (AUC-based):")
    for k in weights:
        print(f"    {k.upper():6s}  AUC={aucs[k]:.4f}  w={weights[k]:.4f}")

    return weights, aucs


# ─────────────────────────────────────────────────────────────────
# PREDICTION 1 — IS IT FAULTY?
# Score = Σ w_i · P_i  +  0.10 · I[agreement >= 3/4]
# ─────────────────────────────────────────────────────────────────

def ensemble_score(models: dict, weights: dict, X: np.ndarray) -> tuple:
    probs = {
        n: models[n].predict_proba(X)[:, 1]
        for n in ["rf", "xgb", "lgbm", "cb"]
        if n in models and n in weights
    }
    score  = sum(weights[n] * p for n, p in probs.items())
    flags  = np.stack([(p >= CONFIG["fault_threshold"]).astype(int)
                       for p in probs.values()], axis=1)
    bonus  = (flags.sum(axis=1) >= CONFIG["agreement_min"]).astype(float)
    score += CONFIG["agreement_bonus"] * bonus
    return np.clip(score, 0, 1), probs


def classify(score: np.ndarray) -> np.ndarray:
    out = np.zeros(len(score), dtype=int)
    out[score >= CONFIG["warning_threshold"]] = 1
    out[score >= CONFIG["fault_threshold"]]   = 2
    return out


def status_label(code: int) -> str:
    return {0: "NORMAL", 1: "WARNING", 2: "FAULT"}.get(code, "UNKNOWN")


# ─────────────────────────────────────────────────────────────────
# PREDICTION 2 — WHEN?
# ETA = (fault_threshold - current_score) / slope_48h
# ─────────────────────────────────────────────────────────────────

def predict_eta(score_series: np.ndarray, step_minutes: int = 60) -> dict:
    window = CONFIG["eta_window_steps"]
    s      = score_series[-window:] if len(score_series) >= window else score_series
    x      = np.arange(len(s), dtype=float)

    coeffs = np.polyfit(x, s, 1)
    slope  = coeffs[0]
    y_hat  = np.polyval(coeffs, x)
    ss_res = np.sum((s - y_hat) ** 2)
    ss_tot = np.sum((s - s.mean()) ** 2)
    r2     = 1.0 - ss_res / (ss_tot + 1e-12)

    current  = float(s[-1])
    reliable = (r2 >= CONFIG["eta_r2_min"]) and (slope > 0)
    eta_h    = max((CONFIG["fault_threshold"] - current) / slope * step_minutes / 60, 0) \
               if reliable else None

    return {
        "eta_hours":     eta_h,
        "eta_display":   f"~{eta_h:.1f} hours" if reliable else "No fault trend",
        "slope":         float(slope),
        "r2":            float(r2),
        "reliable":      reliable,
        "current_score": current,
    }


# ─────────────────────────────────────────────────────────────────
# PREDICTION 3 — WHY?
# CatBoost (50%) + RF (25%) + XGB gain (25%)
# ─────────────────────────────────────────────────────────────────

def root_cause_analysis(models: dict, feature_names: list) -> dict:
    imp = {}

    if "cb" in models:
        raw       = models["cb"].get_feature_importance()
        imp["cb"] = dict(zip(feature_names, raw / (raw.sum() or 1)))

    if "rf" in models:
        raw       = models["rf"].feature_importances_
        imp["rf"] = dict(zip(feature_names, raw / (raw.sum() or 1)))

    if "xgb" in models:
        raw   = models["xgb"].get_booster().get_score(importance_type="gain")
        total = sum(raw.values()) or 1
        imp["xgb"] = {k: v / total for k, v in raw.items()}

    attr_w = {"cb": 0.50, "rf": 0.25, "xgb": 0.25}
    ensemble_imp = {
        feat: sum(attr_w.get(src, 0) * imp[src].get(feat, 0) for src in imp)
        for feat in feature_names
    }

    cat_scores = {
        cat: sum(ensemble_imp.get(f, 0) for f in feats)
        for cat, feats in CONFIG["root_cause_map"].items()
    }
    total   = sum(cat_scores.values()) or 1
    cat_pct = {k: round(v / total * 100, 1) for k, v in cat_scores.items()}
    top_feats = sorted(ensemble_imp.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "category_pct":  cat_pct,
        "top_features":  top_feats,
        "primary_cause": max(cat_pct, key=cat_pct.get),
    }


# ─────────────────────────────────────────────────────────────────
# PREDICTION 4 — FINANCIAL LOSS FORECAST (15 days)
#
# For each future day (1–15):
#   1. Project ensemble score using slope from last 48h
#   2. Map score → degradation % using loss bands
#   3. Expected daily kWh = avg of last 30 days of daily_kwh readings
#   4. Lost kWh = expected_kwh × degradation %
#   5. Lost ₹  = lost_kwh × price_per_kwh_inr
#
# Final output: DataFrame with daily breakdown + total row
# ─────────────────────────────────────────────────────────────────

def score_to_degradation(score: float) -> float:
    """Map ensemble score → degradation fraction (0.0 to 1.0)"""
    for s_min, s_max, d_min, d_max in CONFIG["loss_bands"]:
        if s_min <= score < s_max:
            # Linear interpolation within the band
            t = (score - s_min) / (s_max - s_min)
            return d_min + t * (d_max - d_min)
    # score == 1.0 edge case
    return 1.0


def project_future_scores(
    score_series: np.ndarray,
    days: int = 15,
    hours_per_day: int = 24
) -> np.ndarray:
    """
    Project ensemble scores forward for `days` days (hourly steps).
    Uses linear slope from last 48 hours.
    Clamps projected scores to [0, 1].
    """
    window = CONFIG["eta_window_steps"]
    s      = score_series[-window:] if len(score_series) >= window else score_series
    x      = np.arange(len(s), dtype=float)
    coeffs = np.polyfit(x, s, 1)
    slope  = coeffs[0]

    current    = float(s[-1])
    total_steps = days * hours_per_day
    future_scores = []

    for step in range(1, total_steps + 1):
        projected = current + slope * step
        future_scores.append(float(np.clip(projected, 0, 1)))

    return np.array(future_scores)


def predict_financial_loss(
    score_series: np.ndarray,
    df_readings: pd.DataFrame,
    days: int = 15
) -> dict:
    """
    PREDICTION 4: 15-day financial loss forecast.

    Parameters:
        score_series   : historical ensemble scores (hourly)
        df_readings    : DataFrame with columns daily_kwh, price_per_kwh_inr, timestamp
        days           : forecast horizon (default 15)

    Returns:
        {
          "daily_table": DataFrame with columns:
                Day, Date, Projected_Score, Status,
                Expected_kWh, Degradation_pct, Lost_kWh, Loss_INR
          "total_loss_kwh": float
          "total_loss_inr": float
          "avg_daily_loss_inr": float
          "price_per_kwh_inr": float
          "avg_expected_kwh": float
        }
    """

    # Average expected daily kWh from last 30 days of actual readings
    # Group by date and take the max daily_kwh reading (end-of-day meter value)
    df_readings = df_readings.copy()
    df_readings["date"] = df_readings["timestamp"].dt.date
    daily_gen   = df_readings.groupby("date")["daily_kwh"].max()
    avg_kwh     = float(daily_gen.tail(30).mean()) if len(daily_gen) > 0 else 0.0

    # Price per kWh — take latest value provided by user
    price_per_kwh = float(df_readings["price_per_kwh_inr"].iloc[-1])

    # Project scores for next 15 days (hourly), then take daily average
    future_scores_hourly = project_future_scores(score_series, days=days)
    future_scores_daily  = future_scores_hourly.reshape(days, 24).mean(axis=1)

    # Build daily table
    last_date = df_readings["timestamp"].dt.date.max()
    rows = []

    for i, day_score in enumerate(future_scores_daily, start=1):
        forecast_date  = last_date + timedelta(days=i)
        degradation    = score_to_degradation(day_score)
        lost_kwh       = avg_kwh * degradation
        expected_kwh   = avg_kwh
        actual_kwh     = expected_kwh - lost_kwh
        loss_inr       = lost_kwh * price_per_kwh
        s_code         = classify(np.array([day_score]))[0]

        rows.append({
            "Day":            i,
            "Date":           str(forecast_date),
            "Projected_Score": round(day_score, 4),
            "Status":         status_label(s_code),
            "Expected_kWh":   round(expected_kwh, 2),
            "Actual_kWh":     round(actual_kwh, 2),
            "Degradation_%":  round(degradation * 100, 1),
            "Lost_kWh":       round(lost_kwh, 2),
            "Loss_INR":       round(loss_inr, 2),
        })

    daily_df = pd.DataFrame(rows)

    # Total row
    total_row = {
        "Day":             "TOTAL",
        "Date":            "",
        "Projected_Score": "",
        "Status":          "",
        "Expected_kWh":    round(daily_df["Expected_kWh"].sum(), 2),
        "Actual_kWh":      round(daily_df["Actual_kWh"].sum(), 2),
        "Degradation_%":   "",
        "Lost_kWh":        round(daily_df["Lost_kWh"].sum(), 2),
        "Loss_INR":        round(daily_df["Loss_INR"].sum(), 2),
    }
    daily_df = pd.concat([daily_df, pd.DataFrame([total_row])], ignore_index=True)

    total_loss_inr = float(daily_df[daily_df["Day"] != "TOTAL"]["Loss_INR"].sum())
    total_loss_kwh = float(daily_df[daily_df["Day"] != "TOTAL"]["Lost_kWh"].sum())

    return {
        "daily_table":       daily_df,
        "total_loss_inr":    round(total_loss_inr, 2),
        "total_loss_kwh":    round(total_loss_kwh, 2),
        "avg_daily_loss_inr": round(total_loss_inr / days, 2),
        "price_per_kwh_inr": price_per_kwh,
        "avg_expected_kwh":  round(avg_kwh, 2),
    }


# ─────────────────────────────────────────────────────────────────
# METRICS
# ─────────────────────────────────────────────────────────────────

def compute_metrics(y_true, y_pred_binary, scores=None) -> dict:
    if len(np.unique(y_true)) < 2:
        print("  ⚠  Only one class in y_true — metrics not meaningful")
        return None

    tn, fp, fn, tp = confusion_matrix(y_true, y_pred_binary, labels=[0, 1]).ravel()
    m = {
        "accuracy":          round(accuracy_score(y_true, y_pred_binary), 4),
        "balanced_accuracy": round(balanced_accuracy_score(y_true, y_pred_binary), 4),
        "precision":         round(precision_score(y_true, y_pred_binary, zero_division=0), 4),
        "recall":            round(recall_score(y_true, y_pred_binary, zero_division=0), 4),
        "f1":                round(f1_score(y_true, y_pred_binary, zero_division=0), 4),
        "mcc":               round(matthews_corrcoef(y_true, y_pred_binary), 4),
        "tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn),
    }
    if scores is not None:
        try:
            m["roc_auc"] = round(roc_auc_score(y_true, scores), 4)
        except Exception:
            m["roc_auc"] = None
    return m


# ─────────────────────────────────────────────────────────────────
# FULL PIPELINE CLASS
# ─────────────────────────────────────────────────────────────────

class InverterFaultPipeline:
    """
    Full pipeline — train on historical readings, predict on new readings.

    Usage:
        # 1. Convert hourly reading dicts to DataFrame
        df = readings_to_dataframe(list_of_hourly_dicts)

        # 2. Split train / test (80/20 temporal)
        split = int(len(df) * 0.8)
        df_train, df_test = df.iloc[:split], df.iloc[split:]

        # 3. Train
        pipe = InverterFaultPipeline(fault_states=[3, 8])
        pipe.fit(df_train)

        # 4. Predict — returns all 4 predictions
        results = pipe.predict(df_test)
        pipe.print_report(results)

        # 5. Get JSON-serializable output for API response
        output = pipe.to_api_response(results)
    """

    def __init__(self, fault_states: list = None):
        self.fault_states = fault_states or CONFIG["fault_states"]
        self.models       = {}
        self.weights      = {}
        self.aucs         = {}
        self.scaler       = StandardScaler()
        self.feature_cols = None
        self.has_labels   = False
        self.is_fitted    = False

    # ── FIT ──────────────────────────────────────────────────────
    def fit(self, df_train: pd.DataFrame, df_val: pd.DataFrame = None):
        print("\n" + "─"*60)
        print("▶ STEP 1 — FEATURE ENGINEERING")
        df_train          = engineer_features(df_train)
        self.feature_cols = [c for c in FEATURE_COLS if c in df_train.columns]

        print("\n▶ STEP 2 — LABEL STRATEGY")
        y_train, self.has_labels = make_labels(df_train, self.fault_states)

        X_sc = self.scaler.fit_transform(
            df_train[self.feature_cols].fillna(0).values
        )

        if not self.has_labels:
            y_train = make_if_proxy_labels(df_train, X_sc)

        print("\n▶ STEP 3 — TRAINING MODELS")
        healthy = (y_train == 0)
        self.models["if"]   = train_isolation_forest(X_sc[healthy])
        self.models["rf"]   = train_random_forest(X_sc, y_train)
        self.models["xgb"]  = train_xgboost(X_sc, y_train)
        self.models["lgbm"] = train_lightgbm(X_sc, y_train)
        self.models["cb"]   = train_catboost(X_sc, y_train)

        print("\n▶ STEP 4 — COMPUTING AUC-BASED WEIGHTS")
        if df_val is not None:
            df_val   = engineer_features(df_val)
            y_val, _ = make_labels(df_val, self.fault_states)
            if y_val is None:
                y_val = make_if_proxy_labels(df_val,
                    self.scaler.transform(df_val[self.feature_cols].fillna(0).values))
            X_val_sc = self.scaler.transform(df_val[self.feature_cols].fillna(0).values)
        else:
            X_val_sc, y_val = X_sc, y_train

        self.weights, self.aucs = compute_weights(self.models, X_val_sc, y_val)
        self.is_fitted = True
        print("\n✓ Pipeline fitted\n" + "─"*60)
        return self

    # ── PREDICT ──────────────────────────────────────────────────
    def predict(self, df_test: pd.DataFrame) -> dict:
        assert self.is_fitted, "Call .fit() first"

        df_test = engineer_features(df_test)
        X_sc    = self.scaler.transform(df_test[self.feature_cols].fillna(0).values)

        # ── PREDICTION 1: IS IT FAULTY? ──────────────────────────
        scores, per_model_probs = ensemble_score(self.models, self.weights, X_sc)
        status_codes = classify(scores)
        pred_binary  = (scores >= CONFIG["fault_threshold"]).astype(int)

        prediction_1 = {
            "ensemble_score":  scores,
            "status_code":     status_codes,
            "status_label":    [status_label(c) for c in status_codes],
            "current_status":  status_label(int(status_codes[-1])),
            "per_model_probs": {k: float(v[-1]) for k, v in per_model_probs.items()},
            "n_fault":         int((status_codes == 2).sum()),
            "n_warning":       int((status_codes == 1).sum()),
            "n_normal":        int((status_codes == 0).sum()),
        }

        # ── PREDICTION 2: WHEN? ───────────────────────────────────
        prediction_2 = predict_eta(scores)

        # ── PREDICTION 3: WHY? ────────────────────────────────────
        prediction_3 = root_cause_analysis(self.models, self.feature_cols)

        # ── PREDICTION 4: FINANCIAL LOSS (15 days) ───────────────
        prediction_4 = predict_financial_loss(scores, df_test)

        # ── METRICS ──────────────────────────────────────────────
        metrics = None
        if "op_state" in df_test.columns and not (df_test["op_state"] == -1).all():
            y_true  = make_labels(df_test, self.fault_states)[0]
            metrics = compute_metrics(y_true, pred_binary, scores)

        return {
            "prediction_1": prediction_1,
            "prediction_2": prediction_2,
            "prediction_3": prediction_3,
            "prediction_4": prediction_4,
            "metrics":      metrics,
        }

    # ── API RESPONSE (JSON serializable) ─────────────────────────
    def to_api_response(self, results: dict) -> dict:
        p1 = results["prediction_1"]
        p2 = results["prediction_2"]
        p3 = results["prediction_3"]
        p4 = results["prediction_4"]
        m  = results["metrics"]

        # Convert daily_table DataFrame → list of dicts for JSON
        daily_table = p4["daily_table"].to_dict(orient="records")

        return {
            "prediction_1": {
                "current_status":   p1["current_status"],
                "current_score":    round(float(p1["ensemble_score"][-1]), 4),
                "per_model_probs":  p1["per_model_probs"],
                "n_fault":          p1["n_fault"],
                "n_warning":        p1["n_warning"],
                "n_normal":         p1["n_normal"],
            },
            "prediction_2": {
                "eta_display":   p2["eta_display"],
                "eta_hours":     p2["eta_hours"],
                "slope":         round(p2["slope"], 6),
                "r2":            round(p2["r2"], 4),
                "reliable":      bool(p2["reliable"]),
                "current_score": round(p2["current_score"], 4),
            },
            "prediction_3": {
                "primary_cause":  p3["primary_cause"],
                "category_pct":   p3["category_pct"],
                "top_features":   [{"feature": f, "importance": round(i, 4)}
                                   for f, i in p3["top_features"][:5]],
            },
            "prediction_4": {
                "daily_table":        daily_table,
                "total_loss_inr":     p4["total_loss_inr"],
                "total_loss_kwh":     p4["total_loss_kwh"],
                "avg_daily_loss_inr": p4["avg_daily_loss_inr"],
                "price_per_kwh_inr":  p4["price_per_kwh_inr"],
                "avg_expected_kwh":   p4["avg_expected_kwh"],
            },
            "metrics": m,
        }

    # ── PRINT REPORT ─────────────────────────────────────────────
    def print_report(self, results: dict):
        p1 = results["prediction_1"]
        p2 = results["prediction_2"]
        p3 = results["prediction_3"]
        p4 = results["prediction_4"]
        m  = results["metrics"]

        print("\n" + "═"*65)
        print("║  SOLAR INVERTER FAULT PREDICTION — FULL REPORT")
        print("═"*65)

        # Prediction 1
        print("\n🔴 PREDICTION 1 — IS IT FAULTY?")
        print(f"   Current Score  : {p2['current_score']:.4f}")
        print(f"   Current Status : {p1['current_status']}")
        print(f"   FAULT rows     : {p1['n_fault']:,}")
        print(f"   WARNING rows   : {p1['n_warning']:,}")
        print(f"   NORMAL rows    : {p1['n_normal']:,}")
        print(f"   Per-model (latest reading):")
        for name, prob in p1["per_model_probs"].items():
            print(f"     {name.upper():6s}  P(FAULT)={prob:.4f}  w={self.weights.get(name, 0):.3f}")

        # Prediction 2
        print("\n⏱  PREDICTION 2 — WHEN?")
        print(f"   ETA            : {p2['eta_display']}")
        print(f"   Slope/hour     : {p2['slope']:+.6f}")
        print(f"   R²             : {p2['r2']:.4f}  {'✓ reliable' if p2['reliable'] else '✗ low confidence'}")

        # Prediction 3
        print("\n🔍 PREDICTION 3 — WHY?")
        print(f"   Primary Cause  : {p3['primary_cause']}")
        for cat, pct in sorted(p3["category_pct"].items(),
                               key=lambda x: x[1], reverse=True):
            bar = "█" * int(pct / 3)
            print(f"     {cat:<30s} {bar:<20s} {pct:.1f}%")
        print(f"\n   Top 5 Features:")
        for feat, imp in p3["top_features"][:5]:
            print(f"     {feat:<30s}  {imp:.4f}")

        # Prediction 4
        print("\n💰 PREDICTION 4 — 15-DAY FINANCIAL LOSS FORECAST")
        print(f"   Avg expected generation : {p4['avg_expected_kwh']} kWh/day")
        print(f"   Price per unit          : ₹{p4['price_per_kwh_inr']}/kWh")
        print(f"   Total projected loss    : ₹{p4['total_loss_inr']:,.2f}  ({p4['total_loss_kwh']} kWh)")
        print(f"   Avg daily loss          : ₹{p4['avg_daily_loss_inr']:,.2f}/day")
        print()
        tbl = p4["daily_table"]
        print(f"   {'Day':<5} {'Date':<13} {'Score':<8} {'Status':<10} "
              f"{'Exp kWh':<10} {'Act kWh':<10} {'Deg%':<7} {'Lost kWh':<10} {'Loss ₹'}")
        print(f"   {'─'*90}")
        for _, row in tbl.iterrows():
            print(f"   {str(row['Day']):<5} {str(row['Date']):<13} "
                  f"{str(row['Projected_Score']):<8} {str(row['Status']):<10} "
                  f"{str(row['Expected_kWh']):<10} {str(row['Actual_kWh']):<10} "
                  f"{str(row['Degradation_%']):<7} {str(row['Lost_kWh']):<10} "
                  f"₹{str(row['Loss_INR'])}")

        # Metrics
        if m:
            print("\n📊 MODEL METRICS")
            print(f"   Accuracy          : {m['accuracy']}")
            print(f"   Balanced Accuracy : {m['balanced_accuracy']}")
            print(f"   Precision         : {m['precision']}")
            print(f"   Recall            : {m['recall']}")
            print(f"   F1 Score          : {m['f1']}")
            auc = m.get("roc_auc")
            print(f"   ROC-AUC           : {auc}" if auc else "   ROC-AUC           : N/A")
            print(f"   MCC               : {m['mcc']}")
            print(f"   TP={m['tp']:,}  FP={m['fp']:,}  TN={m['tn']:,}  FN={m['fn']:,}")

        print("\n" + "═"*65)


# ─────────────────────────────────────────────────────────────────
# MAIN — HOW TO USE WITH REAL DATA
# ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":

    # ── REAL DATA USAGE ──────────────────────────────────────────
    # Step 1: Load your CSV (hourly readings)
    # df = pd.read_csv("your_inverter_data.csv")
    # df["timestamp"] = pd.to_datetime(df["timestamp"])
    #
    # Rename columns to match schema if needed:
    # df = df.rename(columns={
    #     "power":       "power_kw",
    #     "pv1_power":   "pv1_power_kw",
    #     "temp":        "inverter_temp_c",
    #     "ac_voltage":  "ac_voltage_v",
    #     "dc_voltage":  "dc_voltage_v",
    #     "ac_current":  "ac_current_a",
    #     "dc_current":  "dc_current_a",
    #     "frequency":   "frequency_hz",
    #     "daily_yield": "daily_kwh",
    # })
    # df["price_per_kwh_inr"] = 4.50   # set your electricity price
    #
    # split    = int(len(df) * 0.80)
    # df_train = df.iloc[:split].copy()
    # df_test  = df.iloc[split:].copy()
    #
    # pipe    = InverterFaultPipeline(fault_states=[3, 8])
    # pipe.fit(df_train)
    # results = pipe.predict(df_test)
    # pipe.print_report(results)
    #
    # # For API response (Node.js):
    # import json
    # api_out = pipe.to_api_response(results)
    # print(json.dumps(api_out, indent=2))

    # ── DEMO WITH SYNTHETIC DATA ──────────────────────────────────
    print("Running demo with synthetic hourly data...\n")
    np.random.seed(42)
    n = 2000   # ~83 days of hourly data

    timestamps = pd.date_range("2024-01-01", periods=n, freq="h")
    daily_kwh_base = 450.0

    df = pd.DataFrame({
        "timestamp":         timestamps,
        "power_kw":          np.random.normal(50, 5, n).clip(0),
        "pv1_power_kw":      np.random.normal(52, 5, n).clip(0),
        "daily_kwh":         np.random.normal(daily_kwh_base, 30, n).clip(0),
        "inverter_temp_c":   np.random.normal(45, 5, n).clip(5, 80),
        "ambient_temp_c":    np.random.normal(35, 4, n).clip(5, 50),
        "ac_voltage_v":      np.random.normal(230, 2, n),
        "dc_voltage_v":      np.random.normal(620, 10, n),
        "ac_current_a":      np.random.normal(196, 5, n),
        "dc_current_a":      np.random.normal(75, 3, n),
        "frequency_hz":      np.random.normal(50, 0.05, n),
        "alarm_code":        np.random.choice([0, 0, 0, 0, 1], n),
        "op_state":          np.random.choice([4, 4, 4, 4, 4, 0, 3, 8], n),
        "price_per_kwh_inr": 4.50,
    })

    # Inject realistic fault signatures
    fault_mask = df["op_state"].isin([3, 8])
    df.loc[fault_mask, "power_kw"]        *= 0.4
    df.loc[fault_mask, "inverter_temp_c"] += 15
    df.loc[fault_mask, "alarm_code"]       = 1
    df.loc[fault_mask, "daily_kwh"]       *= 0.4

    split    = int(n * 0.80)
    df_train = df.iloc[:split].copy()
    df_test  = df.iloc[split:].copy()

    pipe    = InverterFaultPipeline(fault_states=[3, 8])
    pipe.fit(df_train)
    results = pipe.predict(df_test)
    pipe.print_report(results)

    import json

    api_out = pipe.to_api_response(results)
    print(json.dumps(api_out, indent=2, default=str))