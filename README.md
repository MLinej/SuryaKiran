# ☀️ SuryaKiran
### AI-Driven Solar Inverter Intelligence Platform
> HACKaMINeD '26

---

## 📋 Problem Statement

Solar power plants rely on inverters to convert electricity from photovoltaic (PV) panels into usable AC power. When an inverter degrades or fails, power generation drops significantly — and most plants only detect this **after** it happens.

This leads to:
- Reduced energy generation
- Lower plant performance ratio (PR)
- Increased downtime
- Significant financial losses

**SuryaKiran** predicts potential inverter failures within a **7–10 day window** so operators can intervene before energy loss occurs.

---

## 🏗️ System Architecture

```
SuryaKiran/
│
├── data/                 → Raw + processed dataset storage
├── models/               → Trained ML models (.pkl)
├── notebooks/            → Experimentation & EDA notebooks
├── src/                  → Core application code
├── config/               → YAML configuration files
├── scripts/              → Training / execution CLI scripts
├── utils/                → Helper utilities
├── requirements.txt      → Python dependencies
└── main.py               → Main execution entrypoint
```

---

## 🔁 Execution Pipeline

```
          +------------------+
          |   Raw Dataset    |
          +--------+---------+
                   |
                   ▼
        +----------+----------+
        |   Data Preprocess   |
        +----------+----------+
                   |
                   ▼
        +----------+----------+
        |  Feature Engineering|
        +----------+----------+
                   |
                   ▼
        +----------+----------+
        |   Model Training    |
        +----------+----------+
                   |
                   ▼
        +----------+----------+
        |  Model Evaluation   |
        +----------+----------+
                   |
                   ▼
        +----------+----------+
        |    Saved Model      |
        +---------------------+
```

---

## 🧱 Layered Architecture

```
  ┌─────────────────────────────────┐
  │      Presentation Layer         │  scripts/ · notebooks/ · main.py
  ├─────────────────────────────────┤
  │      Application Layer          │  src/ modules
  ├─────────────────────────────────┤
  │     ML Intelligence Layer       │  training · inference · explainability
  ├─────────────────────────────────┤
  │         Data Layer              │  datasets · serialized models
  └─────────────────────────────────┘
```

---

## 🗂️ Layer Breakdown

### 1. Presentation Layer

| Component | Description |
|---|---|
| `notebooks/` | EDA, model experiments, feature analysis — research only, not production |
| `scripts/` | CLI commands: `train_model.py`, `preprocess_data.py`, `run_inference.py` |
| `main.py` | Master entrypoint — orchestrates the full pipeline end-to-end |

```bash
# Example workflow
python scripts/preprocess_data.py
python scripts/train_model.py
python scripts/run_inference.py
```

---

### 2. Application Layer (`src/`)

```
src/
├── data_loader.py         → CSV ingestion, schema validation, DataFrame creation
├── preprocessing.py       → Cleaning, normalization, encoding, outlier removal
├── feature_engineering.py → Time features, rolling averages, domain indicators
├── model_training.py      → Train/test split, model fit, serialization
├── inference.py           → Load model, run prediction on new data
└── evaluation.py          → MAE, RMSE, R², Accuracy, Precision, Recall, F1
```

**Data flow through `src/`:**

```
CSV File → data_loader → preprocessing → feature_engineering → model_training → evaluation → models/
                                                                      ↓
                                                               inference.py
                                                                      ↓
                                                            prediction output
```

---

### 3. ML Intelligence Layer

| Model | Role |
|---|---|
| **XGBoost** | Predicts inverter failure probability within 7–10 days |
| **Isolation Forest** | Detects anomalous / unusual telemetry patterns |
| **SHAP** | Explains *why* a prediction was made (feature importance) |
| **Gemini / GPT (LLM)** | Generates natural language summaries and maintenance recommendations |

**SHAP → LLM pipeline (key design decision):**

```
XGBoost Prediction
       ↓
SHAP Feature Importance
       ↓
LLM (Gemini / GPT)
       ↓
Plain-language operator guidance
```

---

### 4. Data Layer

```
data/
├── raw/          → Original unmodified source datasets
├── interim/      → Intermediate transformed data (staging)
└── processed/    → Cleaned, normalized, feature-engineered datasets

models/
├── trained_model.pkl    → Serialized XGBoost model
├── scaler.pkl           → Normalization scaler
└── feature_encoder.pkl  → Label encoders
```

Flow: `raw/ → interim/ → processed/`

This separation ensures reproducibility, clean pipeline stages, and easier debugging.

---

### 5. Configuration Layer

```
config/
├── config.yaml       → General application config
└── parameters.yaml   → Model hyperparameters
```

```yaml
model:
  learning_rate: 0.01
  epochs: 50

data:
  train_split: 0.8
```

---

### 6. Utilities Layer

```
utils/
├── logger.py        → Logging setup
├── helpers.py       → Common transformations and helpers
└── file_manager.py  → File operations and config loading
```

---

## 🧠 Models Used

### Failure Prediction — XGBoost
A gradient boosting algorithm trained on inverter telemetry to predict whether an inverter will fail or underperform within the next **7–10 days**.

### Anomaly Detection — Isolation Forest
An unsupervised model that flags abnormal inverter behavior and unusual telemetry patterns as an additional risk signal.

### Explainability — SHAP
SHapley Additive Explanations identify which telemetry features (e.g. temperature rise, power output drop) are driving each prediction.

### Generative AI — Gemini / GPT
A Large Language Model generates human-readable explanations of model predictions and suggests actionable maintenance steps for operators.

---

## 💡 Key Features

- **Predictive Failure Detection** — 7–10 day forecast window per inverter
- **Explainable AI** — SHAP + LLM produce operator-readable root cause summaries
- **Risk Scoring Dashboard** — Per-inverter risk scores, telemetry trends, alert notifications
- **Business Impact Visibility** — Estimated energy loss (kWh) and revenue loss
- **Maintenance Recommendations** — Actionable steps prioritized by financial impact

---

## 🛠️ Tech Stack

| Category | Tools |
|---|---|
| Language | Python |
| ML / AI | XGBoost, Isolation Forest, SHAP, scikit-learn, LightGBM |
| Generative AI | Gemini, GPT |
| Data | pandas, numpy |
| Visualization | matplotlib, seaborn |
| Model Persistence | joblib, pickle |
| Containerization | Docker, Docker Compose |

---

## 🚀 Getting Started

```bash
# Install dependencies
pip install -r requirements.txt

# Run full pipeline
python main.py

# Or run individual stages
python scripts/preprocess_data.py
python scripts/train_model.py
python scripts/run_inference.py
```

---

## 📁 Repository Structure (Full)

```
SuryaKiran/
│
├── backend/                  → API server
├── frontend/                 → Operator dashboard (React / JS)
├── services/
│   └── ml/                   → ML model service
├── docs/                     → Architecture diagrams
│
├── data/
│   ├── raw/
│   ├── interim/
│   └── processed/
│
├── models/
│   ├── trained_model.pkl
│   ├── scaler.pkl
│   └── feature_encoder.pkl
│
├── notebooks/
│   ├── EDA.ipynb
│   ├── Model_Experiments.ipynb
│   └── Feature_Analysis.ipynb
│
├── src/
│   ├── data_loader.py
│   ├── preprocessing.py
│   ├── feature_engineering.py
│   ├── model_training.py
│   ├── inference.py
│   └── evaluation.py
│
├── config/
│   ├── config.yaml
│   └── parameters.yaml
│
├── scripts/
│   ├── train_model.py
│   ├── preprocess_data.py
│   └── run_inference.py
│
├── utils/
│   ├── logger.py
│   ├── helpers.py
│   └── file_manager.py
│
├── docker-compose.yml
├── requirements.txt
└── main.py
```

---

*HACKaMINeD '26 — SuryaKiran Team*
