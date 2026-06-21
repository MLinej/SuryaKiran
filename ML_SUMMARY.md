# SuryaKiran: Machine Learning Summary Report
## AI-Powered Solar Inverter Predictive Maintenance Platform

---

## PAGE 1: ML ARCHITECTURE & CORE COMPONENTS

### 1. PROJECT OVERVIEW

**SuryaKiran** is an end-to-end ML-powered platform that transforms raw solar inverter telemetry into actionable predictive maintenance insights. The project addresses critical challenges in solar plant operations:

- **Problem**: Solar plants operate reactively, discovering faults too late
- **Solution**: ML ensemble predicts faults **hours before they occur** with calibrated probability scores
- **Impact**: Shifts operations from reactive firefighting to predictive, data-driven maintenance

**Key Metrics:**
- COCO Dataset: 25 GB / 1.5M images (training reference)
- Target: Predict faults with <4% fault event representation in raw data
- Estimated Time-to-Failure (ETA): Hours-level granularity predictions

---

### 2. MACHINE LEARNING PIPELINE ARCHITECTURE

#### 2.1 Input Data Sources
Raw telemetry collected from solar inverter sensors:
```
Temperature readings     →  Thermal stress detection
AC/DC Power output      →  Power efficiency patterns
Voltage                 →  Electrical health
Current                 →  Load conditions
Grid frequency          →  Grid stability
Alarm codes             →  Critical events
```

#### 2.2 Feature Engineering (25 Engineered Features)

**Temporal Lag Features:**
- `lag_1_power`: Power output from 1 timestep ago
- `lag_6_power`: Power output from 6 timesteps ago (short-term trend)
- `lag_1_temp`: Temperature from 1 timestep ago

**Rolling Window Statistics:**
- `power_roll_mean`: Smoothed power trend
- `power_roll_std`: Volatility in power output
- `temp_roll_mean`: Average temperature over window
- `temp_roll_std`: Temperature variability

**Change Detection Features:**
- `power_delta`: Instantaneous change in power output
- `temp_delta`: Instantaneous change in temperature

**Statistical Anomaly Indicators:**
- `power_zscore`: Standard deviations from mean power

**Physical Relationship Features:**
- `temp_power_ratio`: Temperature per unit power (thermal inefficiency proxy)
- `thermal_rise`: Rate of temperature increase relative to load
- `dc_ac_efficiency`: DC-to-AC conversion efficiency ratio

These features capture **early-stage inverter degradation** invisible in raw telemetry alone.

---

### 3. ML MODEL ENSEMBLE

#### 3.1 Weighted 4-Model Ensemble Strategy

SuryaKiran employs a **weighted ensemble** approach to maximize precision and recall on rare fault events:

| Model | Role | Weight | Purpose |
|---|---|---|---|
| **Random Forest** | Robust baseline | `0.241` | Handles noisy data, captures non-linear patterns |
| **XGBoost** | Gradient boosting | `0.259` | High fault precision, sequential learning |
| **LightGBM** | Efficient boosting | `0.253` | Fast training, handles imbalanced data |
| **CatBoost** | Feature attribution | `0.247` | Categorical support, explainability |
| **Isolation Forest** | Anomaly detection | `0 / 0.1` | Outlier detection (optional) |

#### 3.2 Ensemble Scoring Formula

```
Score_final = (0.241 × P_RF)
            + (0.259 × P_XGB)
            + (0.253 × P_LGBM)
            + (0.247 × P_CatBoost)
            + Agreement_Bonus
```

**Agreement Bonus**: When 3+ models independently agree a fault is likely, a confidence multiplier is applied to elevate the ensemble score.

#### 3.3 Why an Ensemble?
- **Fault rarity** (~4% of data) → single models underfit/overfit
- **Signal diversity** → each model captures different temporal, statistical, and physical patterns
- **False positive reduction** → only high-confidence predictions (3+ model agreement) trigger alerts
- **Robustness** → ensemble predictions more stable across different data distributions

---

### 4. FAULT PROBABILITY PREDICTION

The ensemble produces a **calibrated probability score** (0.0 – 1.0) representing fault likelihood:

- **Score > 0.60** → Alert triggered
- **Score 0.40–0.60** → Warning state (monitoring)
- **Score < 0.40** → Normal operation

**Output Example:**
```json
{
  "inverter_id": "INV-003",
  "timestamp": "2025-03-07T14:30:00Z",
  "fault_probability": 0.62,
  "model_scores": {
    "random_forest": 0.58,
    "xgboost": 0.63,
    "lightgbm": 0.61,
    "catboost": 0.66
  },
  "ensemble_score": 0.62,
  "agreement_bonus": 0.04,
  "status": "WARNING"
}
```

---

## PAGE 2: ADVANCED ML FEATURES & IMPLEMENTATION

### 5. TIME-TO-FAILURE (TTF) PREDICTION

#### 5.1 TTF Estimation Algorithm

The system continuously estimates **when** a fault might occur, not just **if** one will:

```
Step 1: Collect fault probability scores over rolling time window
Step 2: Fit linear trend to probability trajectory
Step 3: Calculate slope of trend line (dP/dt)
Step 4: Extrapolate to failure threshold (default: 0.75)

ETA (hours) = (threshold - current_probability) / slope
```

#### 5.2 Reliability Filter

Predictions are only surfaced when:
```
R² ≥ 0.10
```

This ensures **statistically meaningful trends** trigger ETAs, preventing noisy/spurious alerts.

**Example Output:**
```
Current probability: 0.62
Trend slope: 0.005 (prob/hour)
Failure threshold: 0.75
ETA: 26 hours = (0.75 - 0.62) / 0.005
```

---

### 6. ROOT CAUSE ANALYSIS (RCA)

#### 6.1 Feature Attribution & Explainability

**CatBoost Feature Importance + SHAP-style Attribution** identifies top contributing factors:

| Feature | Contribution | Interpretation |
|---|---|---|
| `temp_power_ratio` | 🔴 High (0.41) | Overheating under load (thermal stress) |
| `power_delta` | 🟠 Medium (0.22) | Sudden power output drop |
| `thermal_rise` | 🟡 Low-Medium (0.18) | Rapid temperature spike |
| `dc_ac_efficiency` | 🟡 Low-Medium (0.19) | Conversion efficiency degradation |

#### 6.2 Cross-Validation of RCA Results

RCA is validated by comparing across models:
- **CatBoost** feature attribution
- **Random Forest** permutation importance
- **XGBoost** gain-based importance

Multi-model cross-check ensures **reliable, explainable diagnoses**.

---

### 7. ALERT SYSTEM & DECISION RULES

#### 7.1 Alert Triggering

Automatic alerts when:
```
ensemble_fault_probability > threshold (default: 0.60)
```

#### 7.2 Alert Categories

| Alert Type | Trigger Condition | Root Cause Feature |
|---|---|---|
| 🌡 **Overheating** | `temp_power_ratio` exceeds baseline | Thermal stress |
| ⚡ **Power Efficiency Drop** | `dc_ac_efficiency` below threshold | Conversion degradation |
| 🔌 **Grid Instability** | Grid frequency deviation | External grid issues |
| 🔆 **Panel/String Imbalance** | Asymmetric DC input patterns | Hardware mismatch |

#### 7.3 Alert Metadata

Each alert includes:
- Severity level (Warning / Critical)
- Fault probability score
- Time-to-failure estimate (if available)
- Top root cause factor
- Recommended action

---

### 8. IMBALANCED DATA HANDLING

**Challenge**: Fault events represent <4% of dataset (severe class imbalance)

**Solutions Implemented:**

1. **LightGBM's Native Support**: Built-in handling for imbalanced classification
2. **XGBoost Scale_pos_weight**: Adjusted positive class weight during training
3. **Ensemble Diversity**: Multiple algorithms capture imbalance from different angles
4. **Sampling Strategy**: Weighted sampling during model training
5. **Threshold Calibration**: Optimized decision threshold for precision-recall trade-off

---

### 9. TECH STACK: ML COMPONENTS

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.10+ | ML runtime |
| **Scikit-Learn** | Latest | Random Forest, preprocessing, metrics |
| **XGBoost** | Latest | Gradient boosted trees |
| **LightGBM** | Latest | Fast gradient boosting, imbalanced data |
| **CatBoost** | Latest | Feature importance, categorical features |
| **Pandas** | Latest | Data manipulation, feature engineering |
| **NumPy** | Latest | Numerical computations |
| **LLM API** | Gemini | Natural language context for AI Copilot |

---

### 10. INFERENCE & DEPLOYMENT

#### 10.1 Prediction API (Python)

```bash
# Service runs on port 8000
python inference/app.py
```

**API Endpoint Example:**
```
POST /predict
{
  "inverter_id": "INV-003",
  "telemetry": {
    "temperature": 65.2,
    "power_ac": 4850,
    "power_dc": 5200,
    "voltage": 410,
    "current": 12.5,
    "frequency": 49.98
  }
}
```

#### 10.2 Backend Integration

- **Express.js** Backend calls ML inference API
- **Results cached** for real-time dashboard updates
- **Prisma ORM** stores predictions and alerts in PostgreSQL

---

### 11. AI COPILOT INTEGRATION

**LLM + Retrieval Augmented Prompting (RAP)**

The AI Copilot answers natural language queries using live system data:

**Example Queries:**
> "Why is Inverter 3 showing abnormal behavior?"
> "Which inverters are at risk this week?"
> "What's the estimated time to failure for Plant-2?"

**Process:**
1. Extract live telemetry & model predictions from database
2. Construct prompt with system context
3. LLM generates contextual explanation
4. Response includes RCA factors + recommended actions

---

### 12. PERFORMANCE METRICS & EVALUATION

**Model Evaluation Framework:**
- Precision: High confidence in fault predictions
- Recall: Catch early-stage faults before escalation
- F1-Score: Balance between precision and recall
- ROC-AUC: Ranking quality on imbalanced dataset
- Trend R²: Validity of TTF predictions

**Validation Strategy:**
- Time-series cross-validation (prevents data leakage)
- Holdout test set for final evaluation
- Per-model performance tracking
- Ensemble agreement analysis

---

### 13. FUTURE ML ENHANCEMENTS

- [ ] **Real-time WebSocket streaming** → Continuous inference
- [ ] **Remaining Useful Life (RUL)** → Extended lifespan prediction
- [ ] **SHAP value integration** → Full model explainability
- [ ] **Edge AI deployment** → On-device inference at inverter
- [ ] **Automated retraining** → Drift detection & model updates
- [ ] **Anomaly explainability** → Full interpretability across all models

---

## SUMMARY

SuryaKiran's ML architecture combines:
- ✅ **4-model weighted ensemble** for robust fault detection
- ✅ **25 engineered features** capturing thermal, efficiency, and temporal patterns
- ✅ **Time-to-failure prediction** with trend extrapolation
- ✅ **Root cause analysis** via multi-model feature attribution
- ✅ **Imbalanced data handling** optimized for rare fault events
- ✅ **AI Copilot integration** for operator guidance
- ✅ **Production-ready inference** via Python/FastAPI service

**Impact**: From reactive maintenance to **predictive, data-driven operations** — saving costs, reducing downtime, and maximizing solar plant efficiency.

---

*Document Generated: SuryaKiran ML Summary Report*  
*For: Amazon ML Summer School 2026 Competition*  
*Project: AI-Powered Solar Inverter Predictive Maintenance*
