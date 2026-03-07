"""
forecast.py
═══════════════════════════════════════════════════════════════════
ADD-ON MODULE — does NOT touch inverter_ml_pipeline.py or app.py

Expected CSV columns (one row per minute per inverter):
    timestamp       | Unix ms or ISO string
    inverter_id     | e.g. "INV-00"
    hour            | 0–23
    minute          | 0–59
    sin_time        | sin(2π * (hour*60+minute) / 1440)
    cos_time        | cos(2π * (hour*60+minute) / 1440)
    power_t-1       | power 1 minute ago (kW)
    power_t-3       | power 3 minutes ago (kW)
    power_t-5       | power 5 minutes ago (kW)
    power_t-10      | power 10 minutes ago (kW)
    rolling_mean_5  | rolling mean of last 5 power readings
    rolling_std_5   | rolling std of last 5 power readings
    pv_voltage      | DC/PV voltage (V)
    pv_current      | DC/PV current (A)
    target_power    | actual power at this minute (kW) — ground truth

HOW TO ADD TO YOUR EXISTING app.py (only 2 lines):
    from forecast import forecast_bp
    app.register_blueprint(forecast_bp)

ENDPOINTS:
    POST /forecast/upload               → upload today's CSV, pre-compute forecast
    GET  /forecast/next?inverter_id=INV-00&current_minute=720
                                        → called every 1 min, returns t+1, t+2, t+3
    GET  /forecast/all?inverter_id=INV-00
                                        → full 1440-min forecast for chart rendering
═══════════════════════════════════════════════════════════════════
"""

import io
import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import xgboost as xgb
from flask import Blueprint, request, jsonify
import warnings
warnings.filterwarnings("ignore")


forecast_bp = Blueprint("forecast", __name__)

# Pre-computed forecasts: { "INV-00": { power: [...], risk: [...], ... } }
FORECAST_STORE = {}

# ─────────────────────────────────────────────────────────────────
# FEATURE COLUMNS (exactly matching CSV structure)
# ─────────────────────────────────────────────────────────────────

FEATURE_COLS = [
    "hour", "minute", "sin_time", "cos_time",
    "power_t-1", "power_t-3", "power_t-5", "power_t-10",
    "rolling_mean_5", "rolling_std_5",
    "pv_voltage", "pv_current",
]
TARGET_COL = "target_power"


# ─────────────────────────────────────────────────────────────────
# CSV PARSER
# ─────────────────────────────────────────────────────────────────

def parse_csv(content: str) -> dict:
    """
    Parses uploaded CSV content.
    Returns { "INV-00": df, "INV-01": df, ... }
    Each df is sorted by timestamp with all required columns.
    """
    df = pd.read_csv(io.StringIO(content))

    # Parse timestamp — handles both Unix ms and ISO string
    if pd.api.types.is_numeric_dtype(df["timestamp"]):
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    else:
        df["timestamp"] = pd.to_datetime(df["timestamp"])

    df = df.sort_values(["inverter_id", "timestamp"]).reset_index(drop=True)

    # Validate required columns
    required = FEATURE_COLS + [TARGET_COL, "inverter_id", "timestamp"]
    missing  = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in CSV: {missing}")

    # Split by inverter
    inverters = {}
    for inv_id, group in df.groupby("inverter_id"):
        inverters[str(inv_id)] = group.reset_index(drop=True)

    return inverters


# ─────────────────────────────────────────────────────────────────
# GENERATE NEXT-MINUTE FEATURES
# Given current state, build feature row for t+N prediction
# ─────────────────────────────────────────────────────────────────

def build_future_features(df: pd.DataFrame, steps_ahead: int) -> pd.DataFrame:
    """
    Extrapolates feature rows for t+1, t+2, t+3 from last known rows.
    Uses last row as base and updates time + lag features.
    """
    last = df.iloc[-1].copy()
    last_ts = df["timestamp"].iloc[-1]
    rows = []

    # Keep a rolling buffer of recent power predictions for lag features
    recent_powers = list(df[TARGET_COL].values[-10:])

    for step in range(1, steps_ahead + 1):
        future_ts  = last_ts + timedelta(minutes=step)
        total_mins = future_ts.hour * 60 + future_ts.minute
        sin_t      = np.sin(2 * np.pi * total_mins / 1440)
        cos_t      = np.cos(2 * np.pi * total_mins / 1440)

        # Lag features from recent power buffer
        p_t1  = recent_powers[-1]  if len(recent_powers) >= 1  else 0
        p_t3  = recent_powers[-3]  if len(recent_powers) >= 3  else p_t1
        p_t5  = recent_powers[-5]  if len(recent_powers) >= 5  else p_t1
        p_t10 = recent_powers[-10] if len(recent_powers) >= 10 else p_t1

        last5        = recent_powers[-5:] if len(recent_powers) >= 5 else recent_powers
        roll_mean_5  = float(np.mean(last5))
        roll_std_5   = float(np.std(last5))

        row = {
            "timestamp":      future_ts,
            "hour":           future_ts.hour,
            "minute":         future_ts.minute,
            "sin_time":       round(sin_t, 6),
            "cos_time":       round(cos_t, 6),
            "power_t-1":      round(p_t1, 4),
            "power_t-3":      round(p_t3, 4),
            "power_t-5":      round(p_t5, 4),
            "power_t-10":     round(p_t10, 4),
            "rolling_mean_5": round(roll_mean_5, 4),
            "rolling_std_5":  round(roll_std_5, 4),
            "pv_voltage":     float(last["pv_voltage"]),   # carry forward
            "pv_current":     float(last["pv_current"]),   # carry forward
        }
        rows.append(row)

        # Add predicted power to buffer for next step's lag features
        # Will be filled after model prediction (recursive forecasting)
        recent_powers.append(None)   # placeholder

    return pd.DataFrame(rows), recent_powers


# ─────────────────────────────────────────────────────────────────
# POWER FORECAST MODEL
# XGBoost trained on CSV features
# Dynamic weight ensemble: XGBoost + Exp Smoothing + Linear
# ─────────────────────────────────────────────────────────────────

def train_xgb_power(df: pd.DataFrame) -> xgb.XGBRegressor:
    """Train XGBoost on feature columns → target_power."""
    X = df[FEATURE_COLS].fillna(0).values
    y = df[TARGET_COL].fillna(0).values
    model = xgb.XGBRegressor(
        n_estimators=300, max_depth=5, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        random_state=42, n_jobs=-1, verbosity=0,
    )
    model.fit(X, y)
    return model


def xgb_recursive_forecast(
    model: xgb.XGBRegressor,
    df: pd.DataFrame,
    total_minutes: int
) -> np.ndarray:
    """
    Recursively forecast total_minutes ahead using XGBoost.
    Each predicted value feeds back as lag feature for next step.
    """
    recent_powers = list(df[TARGET_COL].values[-10:])
    last_ts       = df["timestamp"].iloc[-1]
    last_row      = df.iloc[-1].copy()
    preds         = []

    for step in range(1, total_minutes + 1):
        future_ts  = last_ts + timedelta(minutes=step)
        total_mins = future_ts.hour * 60 + future_ts.minute
        sin_t      = np.sin(2 * np.pi * total_mins / 1440)
        cos_t      = np.cos(2 * np.pi * total_mins / 1440)

        p_t1  = recent_powers[-1]  if len(recent_powers) >= 1  else 0
        p_t3  = recent_powers[-3]  if len(recent_powers) >= 3  else p_t1
        p_t5  = recent_powers[-5]  if len(recent_powers) >= 5  else p_t1
        p_t10 = recent_powers[-10] if len(recent_powers) >= 10 else p_t1
        last5 = recent_powers[-5:] if len(recent_powers) >= 5  else recent_powers

        X = np.array([[
            future_ts.hour, future_ts.minute, sin_t, cos_t,
            p_t1, p_t3, p_t5, p_t10,
            float(np.mean(last5)), float(np.std(last5)),
            float(last_row["pv_voltage"]), float(last_row["pv_current"]),
        ]])

        pred = max(float(model.predict(X)[0]), 0)
        preds.append(pred)
        recent_powers.append(pred)

    return np.array(preds)


def exp_smoothing_forecast(series: np.ndarray, steps: int, alpha: float = 0.3) -> np.ndarray:
    last = float(series[-1])
    return np.array([last] * steps)


def linear_forecast(series: np.ndarray, steps: int, window: int = 10) -> np.ndarray:
    recent = series[-window:] if len(series) >= window else series
    slope  = np.polyfit(np.arange(len(recent), dtype=float), recent, 1)[0]
    last   = float(recent[-1])
    return np.array([max(last + slope * (i + 1), 0) for i in range(steps)])


def compute_dynamic_weights(model, df: pd.DataFrame) -> dict:
    """
    Validate on last 30 rows → compute MAE per model → inverse weight.
    """
    val_size = min(30, len(df) - 10)
    if val_size <= 0 or model is None:
        return {"xgb": 0.60, "exp": 0.20, "lin": 0.20}

    df_train = df.iloc[:-val_size]
    df_val   = df.iloc[-val_size:]

    power_series = df_train[TARGET_COL].values

    xgb_e, exp_e, lin_e = [], [], []
    for i, (_, row) in enumerate(df_val.iterrows()):
        true_val = row[TARGET_COL]
        hist     = np.append(power_series, df_val[TARGET_COL].values[:i])

        # XGBoost — one step
        X = np.array([[
            row["hour"], row["minute"], row["sin_time"], row["cos_time"],
            row["power_t-1"], row["power_t-3"], row["power_t-5"], row["power_t-10"],
            row["rolling_mean_5"], row["rolling_std_5"],
            row["pv_voltage"], row["pv_current"],
        ]])
        xgb_pred = max(float(model.predict(X)[0]), 0)

        exp_pred = float(hist[-1])
        lin_pred = max(float(hist[-1]) + np.polyfit(
            np.arange(min(10, len(hist)), dtype=float),
            hist[-min(10, len(hist)):], 1
        )[0], 0)

        xgb_e.append(abs(true_val - xgb_pred))
        exp_e.append(abs(true_val - exp_pred))
        lin_e.append(abs(true_val - lin_pred))

    mae = {"xgb": np.mean(xgb_e), "exp": np.mean(exp_e), "lin": np.mean(lin_e)}
    inv = {k: 1.0 / (v + 1e-6) for k, v in mae.items()}
    tot = sum(inv.values())
    w   = {k: v / tot for k, v in inv.items()}

    print(f"    MAE  → XGB:{mae['xgb']:.3f}  EXP:{mae['exp']:.3f}  LIN:{mae['lin']:.3f}")
    print(f"    Weights → XGB:{w['xgb']:.3f}  EXP:{w['exp']:.3f}  LIN:{w['lin']:.3f}")

    return w


# ─────────────────────────────────────────────────────────────────
# RISK SCORE FORECAST
# Linear extrapolation from last 60 minutes of quick risk signal
# ─────────────────────────────────────────────────────────────────

def quick_risk_series(df: pd.DataFrame) -> np.ndarray:
    """
    Lightweight risk signal from CSV features.
    power drop + rolling std spike → higher risk
    """
    power     = df[TARGET_COL].clip(lower=0).values
    roll_mean = df["rolling_mean_5"].values
    roll_std  = df["rolling_std_5"].values

    # Power below rolling mean = anomaly
    power_drop = np.clip((roll_mean - power) / (roll_mean + 1e-3), 0, 1)

    # High std = unstable = risky
    max_std    = roll_std.max() + 1e-6
    std_signal = np.clip(roll_std / max_std, 0, 1)

    risk = 0.60 * power_drop + 0.40 * std_signal
    return np.clip(risk, 0, 1)


def compute_risk_forecast(risk_series: np.ndarray, total_minutes: int) -> np.ndarray:
    window = min(60, len(risk_series))
    s      = risk_series[-window:]
    slope  = np.polyfit(np.arange(len(s), dtype=float), s, 1)[0]
    last   = float(s[-1])
    return np.array([
        float(np.clip(last + slope * (i + 1), 0, 1))
        for i in range(total_minutes)
    ])


# ─────────────────────────────────────────────────────────────────
# ENDPOINT 1 — POST /forecast/upload
# ─────────────────────────────────────────────────────────────────

@forecast_bp.route("/forecast/upload", methods=["POST"])
def forecast_upload():
    """
    Accepts CSV file upload or JSON with filepath.

    Option A — file upload (multipart form from frontend):
        key: "file" → CSV file

    Option B — JSON (from Node.js backend):
        { "filepath": "path/to/today.csv" }
    """
    # ── Parse input ───────────────────────────────────────────────
    if request.files and "file" in request.files:
        content = request.files["file"].read().decode("utf-8")
    elif request.is_json:
        body = request.get_json() or {}
        if body.get("file_content"):
            content = body.get("file_content")
        else:
            filepath = body.get("filepath")
            if not filepath:
                return jsonify({"error": "filepath or file_content is required"}), 400
            with open(filepath, "r") as f:
                content = f.read()
    else:
        return jsonify({"error": "Send CSV file or JSON with filepath"}), 400

    # ── Parse CSV ─────────────────────────────────────────────────
    try:
        inverter_dfs = parse_csv(content)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"CSV parse failed: {str(e)}"}), 500

    if not inverter_dfs:
        return jsonify({"error": "No inverter data found in CSV"}), 400

    # ── Train + pre-compute forecast per inverter ─────────────────
    results = {}

    for inv_id, df in inverter_dfs.items():
        print(f"\n  Processing {inv_id} ({len(df)} rows)...")

        if len(df) < 15:
            print(f"  ⚠  {inv_id} skipped — not enough rows")
            continue

        total_minutes = 1440   # full next day

        # Train XGBoost power model
        model = train_xgb_power(df)

        # Dynamic weights
        w = compute_dynamic_weights(model, df)

        # Power forecast
        power_series  = df[TARGET_COL].values
        xgb_preds     = xgb_recursive_forecast(model, df, total_minutes)
        exp_preds      = exp_smoothing_forecast(power_series, total_minutes)
        lin_preds      = linear_forecast(power_series, total_minutes)
        power_forecast = np.clip(
            w["xgb"] * xgb_preds + w["exp"] * exp_preds + w["lin"] * lin_preds,
            0, None
        )

        # Risk score forecast
        risk_series    = quick_risk_series(df)
        risk_forecast  = compute_risk_forecast(risk_series, total_minutes)

        # Timestamps for next day
        last_ts    = df["timestamp"].iloc[-1]
        timestamps = [
            (last_ts + timedelta(minutes=i + 1)).isoformat()
            for i in range(total_minutes)
        ]

        FORECAST_STORE[inv_id] = {
            "power":         power_forecast.tolist(),
            "risk":          risk_forecast.tolist(),
            "timestamps":    timestamps,
            "weights":       w,
            "last_ts":       last_ts.isoformat(),
            "total_minutes": total_minutes,
        }

        results[inv_id] = {
            "status":           "forecast_ready",
            "rows_used":        len(df),
            "total_minutes":    total_minutes,
            "last_data_ts":     last_ts.isoformat(),
            "forecast_weights": w,
        }
        print(f"  ✓  {inv_id} forecast ready")

    return jsonify({
        "status":    "ok",
        "inverters": results,
        "message":   (
            f"Forecast pre-computed for {len(results)} inverter(s). "
            "Call GET /forecast/next?inverter_id=INV-00&current_minute=0 every minute."
        ),
    })


# ─────────────────────────────────────────────────────────────────
# ENDPOINT 2 — GET /forecast/next  (called every 1 minute)
# ─────────────────────────────────────────────────────────────────

def initialize_fallback_if_needed(inv_id: str) -> bool:
    """
    If no CSV was uploaded for this inverter, generate a synthetic forecast 
    using the pre-trained joblib bundle so the dashboard isn't completely empty.
    """
    if inv_id in FORECAST_STORE:
        return True
        
    bundle_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../website_power_risk_bundle.joblib'))
    if not os.path.exists(bundle_path):
        return False
        
    try:
        data = joblib.load(bundle_path)
        models_dict = data.get("models", {})
        if not models_dict:
            return False
            
        # Use any available trained model as generic fallback
        model = list(models_dict.values())[0]
    except Exception as e:
        print(f"Fallback load failed: {str(e)}")
        return False
        
    total_minutes = 1440
    now = datetime.now()
    # Normalize to start of today so it matches the UI timeline nicely
    start_ts = pd.Timestamp(now).replace(hour=0, minute=0, second=0, microsecond=0)
    
    recent_powers = [0.0] * 10
    preds = []
    
    for step in range(1, total_minutes + 1):
        future_ts = start_ts + timedelta(minutes=step)
        total_mins = future_ts.hour * 60 + future_ts.minute
        sin_t = np.sin(2 * np.pi * total_mins / 1440)
        cos_t = np.cos(2 * np.pi * total_mins / 1440)
        
        p_t1  = recent_powers[-1]
        p_t3  = recent_powers[-3]
        p_t5  = recent_powers[-5]
        p_t10 = recent_powers[-10]
        last5 = recent_powers[-5:]
        
        X = np.array([[
            future_ts.hour, future_ts.minute, sin_t, cos_t,
            p_t1, p_t3, p_t5, p_t10,
            float(np.mean(last5)), float(np.std(last5)),
            500.0, 10.0   # Mock healthy PV voltage & current
        ]])
        
        # Zero out night time power for realism
        if future_ts.hour < 6 or future_ts.hour >= 19:
            pred = 0.0
        else:
            pred = max(float(model.predict(X)[0]), 0)
            
        preds.append(pred)
        recent_powers.append(pred)
        
    # Mock a safe baseline risk score
    risk_forecast = [0.05] * total_minutes

    timestamps = [
        (start_ts + timedelta(minutes=i + 1)).isoformat()
        for i in range(total_minutes)
    ]

    FORECAST_STORE[inv_id] = {
        "power": preds,
        "risk": risk_forecast,
        "timestamps": timestamps,
        "weights": {"xgb": 1.0, "exp": 0.0, "lin": 0.0},
        "last_ts": start_ts.isoformat(),
        "total_minutes": total_minutes
    }
    
    print(f"  [Fallback] Generated cold-start forecast for '{inv_id}' using website_power_risk_bundle")
    return True


@forecast_bp.route("/forecast/next", methods=["GET"])
def forecast_next():
    """
    Query params:
        inverter_id    : "INV-00"
        current_minute : int — minutes elapsed since upload (start at 0)

    Returns t+1, t+2, t+3 predictions.
    Frontend increments current_minute by 1 every minute.

    Response:
    {
      "inverter_id": "INV-00",
      "current_minute": 720,
      "forecast": [
        { "minute": 721, "timestamp": "...", "predicted_power_kw": 45.2, "risk_score": 0.12 },
        { "minute": 722, "timestamp": "...", "predicted_power_kw": 44.8, "risk_score": 0.13 },
        { "minute": 723, "timestamp": "...", "predicted_power_kw": 44.5, "risk_score": 0.14 }
      ]
    }
    """
    inv_id  = request.args.get("inverter_id")
    cur_min = int(request.args.get("current_minute", 0))

    if not inv_id:
        return jsonify({"error": "inverter_id is required"}), 400

    if not initialize_fallback_if_needed(inv_id):
        return jsonify({
            "error": f"No forecast found for {inv_id}. Call POST /forecast/upload first, or ensure a fallback model is available."
        }), 404

    store   = FORECAST_STORE[inv_id]
    total   = store["total_minutes"]
    forecast = []

    for h in range(1, 4):   # t+1, t+2, t+3
        idx = cur_min + h - 1
        if idx >= total:
            break
        forecast.append({
            "minute":               cur_min + h,
            "timestamp":            store["timestamps"][idx],
            "predicted_power_kw":   round(store["power"][idx], 4),
            "risk_score":           round(store["risk"][idx], 4),
        })

    if not forecast:
        return jsonify({
            "error": "Forecast window exhausted for today. Upload tomorrow's CSV."
        }), 400

    return jsonify({
        "inverter_id":    inv_id,
        "current_minute": cur_min,
        "forecast":       forecast,
    })


# ─────────────────────────────────────────────────────────────────
# ENDPOINT 3 — GET /forecast/all  (full next-day chart data)
# ─────────────────────────────────────────────────────────────────

@forecast_bp.route("/forecast/all", methods=["GET"])
def forecast_all():
    """
    Query params:
        inverter_id : "INV-00"

    Returns full 1440-minute forecast.
    Use this to render the full next-day chart on page load.
    """
    inv_id = request.args.get("inverter_id")

    if not inv_id:
        return jsonify({"error": "inverter_id is required"}), 400

    if not initialize_fallback_if_needed(inv_id):
        return jsonify({
            "error": f"No forecast found for {inv_id}. Call POST /forecast/upload first, or ensure a fallback model is available."
        }), 404

    store = FORECAST_STORE[inv_id]

    full = [
        {
            "minute":               i + 1,
            "timestamp":            store["timestamps"][i],
            "predicted_power_kw":   round(store["power"][i], 4),
            "risk_score":           round(store["risk"][i], 4),
        }
        for i in range(store["total_minutes"])
    ]

    return jsonify({
        "inverter_id":   inv_id,
        "total_minutes": store["total_minutes"],
        "last_data_ts":  store["last_ts"],
        "weights_used":  store["weights"],
        "forecast":      full,
    })


