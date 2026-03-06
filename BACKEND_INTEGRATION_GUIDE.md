# HackaMind Solar Inverter AI - Comprehensive Backend & Frontend Integration Guide

Welcome to the AI backend documentation for the HackaMind Solar Inverter Fault Prediction system! This document is designed to give the Node.js backend team and Frontend team a complete, from-scratch understanding of how the AI model works, the architecture flow, and how to integrate it seamlessly.

---

## 1. Project Overview & Architecture

We have built a highly accurate, ensemble Machine Learning pipeline (using Random Forest, XGBoost, LightGBM, CatBoost, and Isolation Forest) that monitors solar inverters. 

The primary goal is to take live, hourly sensor readings from the solar plant and return 4 crucial predictions:
1. **IS IT FAULTY?** (Current status: NORMAL / WARNING / FAULT)
2. **WHEN WILL IT FAIL?** (Estimated Time to Fault in hours based on a 48-hour trend)
3. **WHY IS IT FAILING?** (Root cause analysis broken down by categories like Thermal, Grid, DC Loss)
4. **HOW MUCH MONEY WILL BE LOST?** (A 15-day financial loss projection based on the current degradation trend)

### The Data Flow Architecture

```text
[ FRONTEND ] 
    |  User inputs hourly sensor readings (or bulk updates)
    |  Sends JSON to Node.js backend
    v
[ NODE.JS BACKEND ]
    |  Acts as the main application server.
    |  Receives the data, handles authentication/DB storage (if any).
    |  Forwards the exact same sensor data via HTTP POST to the Python AI Server.
    v
[ PYTHON FLASK AI SERVER (app.py) ]
    |  Listens on http://localhost:5000
    |  Receives the hourly reading.
    |  Appends it to the inverter's historical memory (last 2000 hours).
    |  Runs the ML Ensemble Pipeline on the updated data.
    |  Generates all 4 predictions, saves state to disk, and formats a JSON response.
    |  Returns JSON to Node.js.
    v
[ NODE.JS BACKEND ]
    |  Receives AI predictions.
    |  Stores the results in a DB (optional) and formats it for the frontend.
    |  Returns to Frontend.
    v
[ FRONTEND ]
    Displays the beautiful dashboards, charts, and 15-day financial loss tables!
```

---

## 2. What files are you receiving?

You will receive a ZIP file containing ONLY what is necessary to run the predictions seamlessly. **The models have already been trained** on the massive raw datasets, so you do not need the original CSVs or training scripts.

*   `app.py`: The Flask server script. This is the entry point for the Python server.
*   `inverter_pip_line.py`: The core Machine Learning logic containing all the data processing and predictive models.
*   `requirements.txt`: The list of Python packages required to run the server.
*   `saved_models/` (Directory): **CRITICAL!** This folder contains the pre-trained `.pkl` model files and historical memory (`.json`) for all 12 inverters (`INV-00` to `INV-11`). Do not delete this folder.

---

## 3. Setup Instructions (For the Node.js / Python Host)

1.  **Install Python:** Ensure Python 3.8+ is installed on the machine hosting the AI server.
2.  **Unzip the files** into a dedicated folder (e.g., `ai-microservice`).
3.  **Install Dependencies:** Open the terminal in that folder and run:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Start the Server:**
    ```bash
    python app.py
    ```
5.  The AI server is now securely running on `http://localhost:5000`.

---

## 4. How the AI Context Works (Important for Backend)

The AI needs to track **trends** over time (like calculating the slope of degradation over the last 48 hours to predict an ETA). 
*   Because of this, the `app.py` server automatically maintains a rolling memory of the last 2000 hours of readings for every inverter inside the `saved_models/` folder.
*   When you push a new single hourly reading to `/predict/single`, the Flask app automatically appends that new hour to the end of the history array, saves it to disk seamlessly, and runs the ML model on the updated timeline.
*   **You do not need to send the entire history every time.** You just send the *newest* hour, and the Python server remembers the rest!

---

## 5. API Documentation

### A. Health & Status Check
Use this endpoint to verify the Flask server is running and to see which inverters are successfully loaded into memory.

**Endpoint:** `GET http://localhost:5000/status`
**Response:**
```json
{
  "status": "running",
  "trained_inverters": ["INV-00", "INV-01", "INV-02", "INV-03", "..."]
}
```

### B. The Main Prediction Endpoint (Real-time updating)
You will trigger this endpoint from Node.js every time the frontend (or IoT device) registers a new hourly sensor reading.

**Endpoint:** `POST http://localhost:5000/predict/single`  
**Content-Type:** `application/json`

#### Request Payload from Node.js:
Send exactly this structure for a given inverter.
```json
{
  "inverter_id": "INV-00",
  "timestamp": "2024-05-06 14:00:00",
  "power_kw": 45.2,
  "pv1_power_kw": 46.8,
  "daily_kwh": 312.4,
  "inverter_temp_c": 48.3,
  "ac_voltage_v": 230.5,
  "dc_voltage_v": 620.0,
  "ac_current_a": 196.5,
  "dc_current_a": 75.4,
  "frequency_hz": 50.02,
  "alarm_code": 0,
  "price_per_kwh_inr": 4.50
}
```
*Note: `price_per_kwh_inr` is set by the user (or fetched from their profile in Node.js) to accurately calculate the financial INR losses.*

#### Python AI Server Response:
The server processes the exact timeline, predicts faults, and calculates losses, immediately returning this comprehensive JSON to your Node.js server:

```json
{
  "inverter_id": "INV-00",
  "status": "ok",
  "results": {
    "prediction_1": {
      "current_status": "NORMAL",         // Can be NORMAL, WARNING, or FAULT
      "current_score": 0.0432,            // Score from 0 to 1. >= 0.30 is FAULT
      "n_fault": 0,
      "n_warning": 0,
      "n_normal": 1,
      "per_model_probs": {
        "rf": 0.05,
        "xgb": 0.04,
        "lgbm": 0.04,
        "cb": 0.05
      }
    },
    "prediction_2": {
      "eta_display": "No fault trend",    // Automatically calculates if a fault is incoming
      "eta_hours": null,                  // If trending towards fault, this will be hours remaining (or null if healthy)
      "r2": 0.0134,
      "reliable": false,                  // True if the ETA calculation has high statistical confidence
      "slope": 0.0001
    },
    "prediction_3": {
      "primary_cause": "Grid / Electrical", // The highest probability root-cause category
      "category_pct": {
        "Grid / Electrical": 46.1,          // 46.1% probability the grid is causing the current data signature
        "DC / String Loss": 27.6,
        "Power / Efficiency Loss": 19.3,
        "Thermal / Overheating": 7.0,
        "Composite Risk Pattern": 0.0
      },
      "top_features": [                     // Specific sensor metrics causing the issue ordered by importance
        {"feature": "ac_voltage_v", "importance": 0.2858},
        {"feature": "dc_power_calc", "importance": 0.1768},
        {"feature": "freq_deviation", "importance": 0.1755}
      ]
    },
    "prediction_4": {                       // Financial tracking (15 Days Projection)
      "avg_daily_loss_inr": 0.0,            // Average money lost per day if nothing is done
      "avg_expected_kwh": 1540.14,          // Baseline normal energy generation calculated from historical average
      "price_per_kwh_inr": 4.5,
      "total_loss_inr": 0.0,                // Total money lost across the 15-day window
      "total_loss_kwh": 0.0,
      "daily_table": [                      // Pass this array directly to a Frontend Data Table component!
        {
          "Day": 1,                         // Forecast Day 1
          "Date": "2024-05-07",
          "Projected_Score": 0.0,
          "Status": "NORMAL",
          "Expected_kWh": 1540.14,          // What we SHOULD generate
          "Actual_kWh": 1540.14,            // What we WILL ACTUALY generate based on current degradation
          "Degradation_%": 0.0,             // The % efficiency loss today
          "Lost_kWh": 0.0,                  // Energy lost today
          "Loss_INR": 0.0                   // Money lost today
        },
        // ... Contains items for Day 1 through Day 15
        {
          "Day": "TOTAL",                   // The very last item in the array is the TOTAL summary row!
          "Date": "",
          "Projected_Score": "",
          "Status": "",
          "Expected_kWh": 23102.1,
          "Actual_kWh": 23102.1,
          "Degradation_%": "",
          "Lost_kWh": 0.0,
          "Loss_INR": 0.0
        }
      ]
    },
    "metrics": null
  }
}
```

---

## 6. Frontend Integration Advice

The JSON structure from the AI was engineered specifically for extremely easy React/Vue/Angular UI integration. 
*   **Dashboards / Widgets:** Use `prediction_1.current_status` to turn UI indicators green (NORMAL), yellow (WARNING), or red (FAULT).
*   **ETA Countdown:** Simply display `prediction_2.eta_display`.
*   **Root Cause Graph:** Wrap `prediction_3.category_pct` into a modern Bar Chart or Doughnut Chart to display exactly what system subsystem needs maintenance.
*   **Financial Tables:** Render an HTML table looping directly over `prediction_4.daily_table`. Since the last item in the array has `"Day": "TOTAL"`, and the rest of its fields already contain the 15-day sums, you can seamlessly render it as the sticky footer row summarizing the 15-day revenue hit. No math required on the frontend!

---
**Summary:** You are fully equipped to connect to the backend. Ensure `app.py` stays running in your server environment, format your Node.js POST requests correctly to send JSON payloads to port `5000` (or whichever port you expose it on), and map the JSON results exactly as described! Happy Hacking.
