# <img src="https://img.shields.io/badge/☀️-SuryaKiran-orange?style=flat-square" alt="SuryaKiran"> SuryaKiran

<div align="center">
---

## 👥 Team

Developed as part of an **AI-powered renewable energy analytics project**, combining expertise in machine learning, full-stack engineering, and solar energy systems.
## 👥 Contributors
## 👥 Team Contributors

| Name | Role | College | Graduation Year | Email / Phone | GitHub |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **[Nirbhay]** | Team Leader (ML) | [Nirma University] | 2028 | [24bce268@nirmauni.ac.in](mailto:24bce268@nirmauni.ac.in) / [8320586268] | [@itatshu](https://github.com/itatshu) |
| **[Het]** | Backend Engineer | [Nirma University] | 2028 | [24bce261@nirmauni.ac.in](mailto:24bce261@nirmauni.ac.in) / [9023226077] | [@shah_6518](https://github.com/shah_6518) |
| **[Darshan]** | ML Engineer | [Nirma University] | 2028 | [24bce233@nirmauni.ac.in](mailto:24bce233@nirmauni.ac.in) / [9328325601] | [@darshanNhb](https://github.com/darshanNhb) |
| **[Jenil]** | Frontend Engineer | [Nirma University] | 2028 | [24bce267@nirmauni.ac.in](mailto:24bce267@nirmauni.ac.in) / [9316130701] | [@MLinej](https://github.com/MLinej) |

---

<h3>⚡ AI-Powered Solar Inverter Predictive Maintenance Platform</h3>

<p><em>From reactive alerts to predictive intelligence — keep your solar plant running at peak performance.</em></p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-Enabled-FF6600?style=for-the-badge)](https://xgboost.readthedocs.io)
[![CatBoost](https://img.shields.io/badge/CatBoost-Enabled-FFCC00?style=for-the-badge)](https://catboost.ai)

<br/>

> **SuryaKiran** (Sanskrit: *सूर्यकिरण* — "Ray of the Sun") is an end-to-end AI platform that transforms raw solar inverter telemetry into **fault predictions, root cause explanations, and actionable maintenance insights** — hours before a failure occurs.

</div>

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
- [Feature Engineering](#-feature-engineering)
- [Time-to-Failure Prediction](#-time-to-failure-prediction)
- [Root Cause Analysis](#-root-cause-analysis)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Dashboard Pages](#-dashboard-pages)
- [Alert System](#-alert-system)
- [Global Language Support](#-global-language-support)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Example Output](#-example-prediction-output)
- [Future Roadmap](#-future-roadmap)
- [Team](#-team)

---

## ⚡ Problem Statement

Solar plants continuously generate vast volumes of **inverter telemetry data** — temperature readings, AC/DC power output, voltage, current, grid frequency, and alarm codes. Despite this data abundance, most traditional monitoring systems remain entirely **reactive**: they only alert operators *after* equipment has already failed.

| Challenge | Impact |
|---|---|
| 🔴 Reactive-only monitoring | Failures discovered too late |
| 🔴 Fault events are rare (<4% of data) | Hard to train models / detect patterns |
| 🔴 Root cause identification is manual | Slow and error-prone diagnosis |
| 🔴 No time-to-failure estimates | Maintenance is unplanned and costly |
| 🔴 Multi-language operator teams | Accessibility barriers |

**SuryaKiran** solves all of these using a **multi-model ML ensemble + AI Copilot**, shifting operations from reactive firefighting to **predictive, data-driven maintenance**.

---

## 🚀 Key Features

### 🔍 Predictive Fault Detection
ML ensemble predicts inverter faults **hours before they happen** with calibrated probability scores, giving operators time to act.

### ⏱ Time-to-Failure Estimation
Tracks fault probability trends over time, extrapolates to failure thresholds, and outputs a precise **estimated time to failure (ETA in hours)**.

### 🧠 Root Cause Analysis
CatBoost feature attribution + cross-validation against RF/XGB importance identifies **why** a fault is likely — thermal stress, power drop, grid instability, and more.

### 📊 Real-Time Monitoring Dashboard
Interactive React dashboard with:
- Live inverter telemetry visualization
- Per-inverter fault probability gauges
- Health status indicators
- Alert history and trends

### 🤖 AI Copilot Assistant
Natural language Q&A powered by LLM integration. Operators can ask:
> *"Why is Inverter 3 showing abnormal behavior?"*
> *"Which inverters are at risk this week?"*

The Copilot generates **contextual explanations** using live system data and model predictions via Retrieval Augmented Prompting.

### 🌍 Universal Language Support
Google Translate Widget provides **multi-language dashboard access** for diverse operator teams worldwide.

### 📈 Energy & Revenue Loss Analytics
Quantifies the **cost of inefficiency** — calculates estimated energy loss (kWh) and revenue impact (₹ / $) from underperforming inverters.

### 📄 Analytics Report Download
One-click downloadable maintenance reports for management, audits, and insurance records.

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Solar Inverter Sensors                     │
│     (Temperature · AC/DC Power · Voltage · Current ·        │
│      Grid Frequency · Alarm Codes)                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ Raw Telemetry
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Feature Engineering Layer (Python)             │
│   25 Features: Lag Features · Rolling Stats ·               │
│   Change Detection · Z-Score · Physical Ratios              │
└──────────────────────────┬──────────────────────────────────┘
                           │ Engineered Feature Vectors
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            ML Ensemble Prediction Engine                    │
│                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │  Random  │  │ XGBoost  │  │LightGBM  │  │CatBoost  │  │
│   │  Forest  │  │          │  │          │  │          │  │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│        └─────────────┴──────────────┴──────────────┘        │
│                         │ Weighted Ensemble                  │
│              Fault Probability Score (0.0 – 1.0)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
    ┌──────────────┐ ┌──────────┐ ┌────────────┐
    │  Time-to-    │ │  Root    │ │  Alert     │
    │  Failure ETA │ │  Cause   │ │  Trigger   │
    │  Estimation  │ │  Analysis│ │  Engine    │
    └──────┬───────┘ └────┬─────┘ └─────┬──────┘
           └──────────────┴─────────────┘
                          │ Prediction API
                          ▼
            ┌─────────────────────────────┐
            │     Node.js / Express        │
            │     Backend + Prisma ORM     │
            │     JWT Auth Middleware      │
            └──────────────┬──────────────┘
                           │
                           ▼
            ┌─────────────────────────────┐
            │     React Dashboard          │
            │     Tailwind CSS · Charts    │
            └──────────────┬──────────────┘
                           │
                  ┌────────┴─────────┐
                  ▼                  ▼
          ┌──────────────┐  ┌──────────────────┐
          │  AI Copilot  │  │ Analytics Reports │
          │  (LLM + RAP) │  │ Energy/Revenue    │
          └──────────────┘  └──────────────────┘
```

---

## 🧠 Machine Learning Pipeline

### Model Ensemble

SuryaKiran uses a **4-model weighted ensemble** to maximize both precision and recall on rare fault events:

| Model | Role | Weight |
|---|---|---|
| **Random Forest** | Robust baseline, handles noisy data | `0.241` |
| **XGBoost** | Gradient boosting, high fault precision | `0.259` |
| **LightGBM** | Fast training, effective on imbalanced data | `0.253` |
| **CatBoost** | Feature attribution + categorical handling | `0.247` |
| **Isolation Forest** | Detect Outliers + Anomaly handling | `0 / 0.1` |


### Ensemble Scoring Formula

```
Score_final = (0.241 × P_RF)
            + (0.259 × P_XGB)
            + (0.253 × P_LGBM)
            + (0.247 × P_CatBoost)
            + Agreement_Bonus
```

> **Agreement Bonus**: When 3 or more models independently agree a fault is likely, a confidence multiplier is applied to further elevate the ensemble score.

### Why an Ensemble?

- **Fault events are rare** — single models tend to underfit or overfit
- **Each model captures different signal types** — temporal, statistical, physical
- **Agreement bonus reduces false positives** — only high-confidence predictions trigger alerts

---

## ⚙ Feature Engineering

Raw telemetry is transformed into **25 engineered features** that capture inverter behavior patterns invisible in raw signals alone.

### Temporal Lag Features
```
lag_1_power    → Power output 1 timestep ago
lag_6_power    → Power output 6 timesteps ago (short-term trend)
lag_1_temp     → Temperature 1 timestep ago
```

### Rolling Window Statistics
```
power_roll_mean    → Smoothed power trend
power_roll_std     → Volatility in power output
temp_roll_mean     → Average temperature over window
temp_roll_std      → Temperature variability
```

### Change Detection Features
```
power_delta    → Instantaneous change in power output
temp_delta     → Instantaneous change in temperature
```

### Statistical Anomaly Indicators
```
power_zscore   → How many standard deviations from mean power
```

### Physical Relationship Features
```
temp_power_ratio    → Temperature per unit of power (thermal inefficiency proxy)
thermal_rise        → Rate of temperature increase relative to load
dc_ac_efficiency    → DC-to-AC conversion efficiency ratio
```

> These features allow the models to detect **early-stage inverter degradation** that would be invisible from raw telemetry alone.

---

## 📉 Time-to-Failure Prediction

The system continuously estimates **when** a fault might occur, not just **if** one will occur.

### Algorithm

```
1. Collect fault probability scores over a rolling time window
2. Fit a linear trend to the probability trajectory
3. Calculate the slope of the trend line
4. Extrapolate to reach the failure threshold (default: 0.75)

ETA (hours) = (threshold - current_probability) / slope
```

### Reliability Filter

Predictions are only surfaced to operators when:

```
R² ≥ 0.10
```

This ensures only **statistically meaningful trends** trigger ETAs, preventing noisy or spurious alerts.

---

## 🔎 Root Cause Analysis

CatBoost's built-in feature importance + SHAP-style attribution identifies the **top contributing factors** behind each fault prediction.

### Example RCA Output

| Feature | Contribution | Interpretation |
|---|---|---|
| `temp_power_ratio` | 🔴 High | Overheating under load (thermal stress) |
| `power_delta` | 🟠 Medium | Sudden power output drop |
| `thermal_rise` | 🟡 Low-Medium | Rapid temperature spike |
| `dc_ac_efficiency` | 🟡 Low-Medium | Conversion efficiency degradation |

### Cross-Validation
RCA results are validated by comparing CatBoost attribution against:
- Random Forest feature importance rankings
- XGBoost `gain`-based feature importance

This multi-model cross-check ensures **reliable and explainable diagnoses**.

---

## 💻 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React.js 18** | UI framework |
| **Tailwind CSS** | Styling and responsive layout |
| **Axios** | API communication |
| **Chart Libraries** | Telemetry and analytics visualizations |
| **Google Translate Widget** | Multi-language support |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express.js** | REST API server |
| **Prisma ORM** | Database access layer |
| **JWT Authentication** | Secure session management |
| **Postgre SQL** | Database Used |

### Machine Learning
| Technology | Purpose |
|---|---|
| **Python 3.10+** | ML pipeline runtime |
| **Scikit-Learn** | Random Forest, preprocessing, evaluation |
| **XGBoost** | Gradient boosted trees |
| **LightGBM** | Efficient gradient boosting |
| **CatBoost** | Feature attribution + categorical support |
| **Pandas + NumPy** | Data processing and feature engineering |

### AI Copilot
| Technology | Purpose |
|---|---|
| **LLM API** | Natural language generation |
| **Retrieval Augmented Prompting** | Context-aware, data-grounded responses |

---

## 📂 Project Structure

```
suryakiran/
│
├── backend/
│   ├── config/               # DB and environment configuration
│   ├── routes/               # API route definitions
│   ├── middleware/            # Auth, error handling, logging
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic layer
│   └── server.js             # Express server entry point
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # Dashboard, Login, Alerts, etc.
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API call utilities
│   │   └── App.jsx           # Root component
│   └── public/
│
├── ml/
│   ├── data/                 # Raw and processed telemetry data
│   ├── features/             # Feature engineering scripts
│   ├── models/               # Trained model artifacts (.pkl / .cbm)
│   ├── training/             # Model training scripts
│   ├── inference/            # Prediction API (FastAPI / Flask)
│   └── evaluation/           # Model metrics and validation
│
├── docs/                     # Architecture diagrams and documentation
├── .env.example              # Environment variable template
├── package.json
└── README.md
```

### Backend Request Flow

```
Frontend Request
      │
      ▼
   Routes          → URL mapping and method routing
      │
      ▼
  Middleware        → JWT validation, rate limiting, logging
      │
      ▼
  Controllers       → Input validation, response formatting
      │
      ▼
   Services         → Business logic, ML inference calls
      │
      ▼
Database / ML API   → Prisma ORM / Python prediction service
      │
      ▼
Response to Frontend
```

---

## 📊 Dashboard Pages

| Page | Description |
|---|---|
| **Landing Page** | Product overview and feature highlights |
| **Login / Register** | Secure JWT-authenticated access |
| **Main Dashboard** | Fleet-wide inverter health overview |
| **Inverter Detail Page** | Per-inverter telemetry, probability trends, RCA |
| **AI Copilot** | Natural language assistant interface |
| **Alert Center** | Active alerts, history, and acknowledgment |
| **Maintenance Recommendations** | Prioritized action items by risk level |
| **Energy & Revenue Loss** | Loss quantification and impact analytics |
| **Analytics Report Download** | PDF/CSV export for management and audits |

---

## ⚠ Alert System

Alerts are triggered automatically when the ensemble fault probability crosses a configurable threshold:

```
fault_probability > threshold (default: 0.60)
```

### Alert Categories

| Alert Type | Trigger Condition |
|---|---|
| 🌡 **Overheating** | `temp_power_ratio` exceeds baseline |
| ⚡ **Power Efficiency Drop** | `dc_ac_efficiency` falls below threshold |
| 🔌 **Grid Instability** | Grid frequency deviation detected |
| 🔆 **Panel/String Imbalance** | Asymmetric DC input patterns detected |

Each alert includes:
- **Severity level** (Warning / Critical)
- **Fault probability score**
- **Time-to-failure estimate** (if available)
- **Top root cause factor**
- **Recommended action**

---

## 🌍 Global Language Support

The dashboard integrates the **Google Translate Widget**, enabling multilingual access for diverse operator teams.

**Supported Languages Include:**

🇬🇧 English · 🇮🇳 Hindi · 🇮🇳 Gujarati · 🇪🇸 Spanish · 🇫🇷 French · 🇩🇪 German · 🇨🇳 Chinese

> Additional languages are supported via automatic Google Translate detection.

---

## 📦 Installation

### Prerequisites

- Node.js `v18+`
- Python `3.10+`
- PostgreSQL (or compatible Prisma database)

### Clone the Repository

```bash
git clone https://github.com/MLinej/SuryaKiran.git
cd suryakiran
```

### Backend Setup

```bash
cd backend
npm install
npx prisma migrate dev     # Initialize database schema
npm run dev                # Start backend server (port 5000)
```

### Frontend Setup

```bash
cd frontend
npm install
npm start                  # Start React app (port 3000)
```

### ML Inference Service Setup

```bash
cd ml
pip install -r requirements.txt
python inference/app.py    # Start prediction API (port 8000)
```

---

## 🔧 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/suryakiran

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# AI Copilot
GEMINI_API_KEY=your_gemini_api_key_here

# ML Service
ML_SERVICE_URL=http://localhost:8000
```

---

## 📈 Example Prediction Output

```json
{
  "inverter_id": "INV-003",
  "timestamp": "2025-03-07T14:30:00Z",
  "status": "WARNING",
  "fault_probability": 0.62,
  "model_scores": {
    "random_forest": 0.58,
    "xgboost": 0.63,
    "lightgbm": 0.61,
    "catboost": 0.66
  },
  "ensemble_score": 0.62,
  "agreement_bonus": 0.04,
  "time_to_failure_hours": 70,
  "trend_r2": 0.84,
  "root_cause": {
    "primary": "Thermal Stress",
    "feature": "temp_power_ratio",
    "contribution": 0.41
  },
  "recommended_action": "Schedule inspection within 48 hours. Check cooling system and panel connections."
}
```

---

## 🌍 Real-World Inspiration

SuryaKiran's architecture is conceptually inspired by predictive maintenance platforms in **industrial IoT** — including approaches used by Siemens, GE, and leading solar energy operators — where continuous telemetry analysis using ML detects anomalies and forecasts equipment failures before they impact production.

The platform adapts these patterns specifically for **distributed solar inverter fleets**, where fault rarity, sensor noise, and multilingual teams pose unique operational challenges.

---

## 🔮 Future Roadmap

- [ ] **Real-time streaming** — WebSocket-based live telemetry ingestion
- [ ] **Remaining Useful Life (RUL) prediction** — Extended lifespan forecasting
- [ ] **SCADA system integration** — Direct plant control system connectivity
- [ ] **Edge AI deployment** — On-device inference at inverter level
- [ ] **Automated maintenance scheduling** — Calendar integration and work order generation
- [ ] **Anomaly explainability upgrade** — Full SHAP value integration across all models
- [ ] **Mobile app** — Field technician companion app


## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ☀️ to power a cleaner, smarter energy future.**

*SuryaKiran — Predict. Prevent. Perform.*

</div>
