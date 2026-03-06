from flask import Blueprint, request, jsonify
import json
import os
import pickle
import pandas as pd

from inverter_pip_line import (
    InverterFaultPipeline,
    readings_to_dataframe,
    validate_inputs,
)
from ml_service import save_model, load_model, PIPELINES, HISTORY, FAULT_STATES, MODEL_DIR

ml_bp = Blueprint('ml', __name__)

# ─────────────────────────────────────────────────────────────────
# POST /train
# ─────────────────────────────────────────────────────────────────
@ml_bp.route("/train", methods=["POST"])
def train():
    body       = request.get_json()
    inv_id     = body.get("inverter_id")
    readings   = body.get("readings", [])

    if not inv_id:
        return jsonify({"error": "inverter_id is required"}), 400
    if len(readings) < 100:
        return jsonify({"error": "Need at least 100 hourly readings to train"}), 400

    df    = readings_to_dataframe(readings)
    split = int(len(df) * 0.80)
    df_train = df.iloc[:split].copy()
    df_val   = df.iloc[split:].copy()

    pipe = InverterFaultPipeline(fault_states=FAULT_STATES)
    pipe.fit(df_train, df_val)

    PIPELINES[inv_id] = pipe
    HISTORY[inv_id]   = readings     # store for future prediction context
    
    save_model(inv_id)

    return jsonify({
        "status":      "trained",
        "inverter_id": inv_id,
        "rows_trained": len(df_train),
        "fault_states": FAULT_STATES,
    })


# ─────────────────────────────────────────────────────────────────
# POST /predict
# ─────────────────────────────────────────────────────────────────
@ml_bp.route("/predict", methods=["POST"])
def predict():
    body     = request.get_json()
    inv_id   = body.get("inverter_id")
    readings = body.get("readings", [])

    if not inv_id:
        return jsonify({"error": "inverter_id is required"}), 400

    if not load_model(inv_id):
        return jsonify({"error": f"No trained model for {inv_id}. Call /train first."}), 404

    # Validate inputs
    for r in readings:
        valid, missing = validate_inputs(r)
        if not valid:
            return jsonify({"error": f"Missing fields: {missing}"}), 400

    # Append new readings to history for score continuity
    HISTORY[inv_id] = (HISTORY.get(inv_id, []) + readings)[-2000:]   # keep last 2000
    save_model(inv_id) # Save the updated history for future use

    df_test = readings_to_dataframe(HISTORY[inv_id])
    pipe    = PIPELINES[inv_id]
    results = pipe.predict(df_test)
    output  = pipe.to_api_response(results)

    return jsonify({
        "inverter_id": inv_id,
        "status":      "ok",
        "results":     output,
    })


# ─────────────────────────────────────────────────────────────────
# POST /predict/single
# ─────────────────────────────────────────────────────────────────
@ml_bp.route("/predict/single", methods=["POST"])
def predict_single():
    reading = request.get_json()
    inv_id  = reading.get("inverter_id")

    if not inv_id:
        return jsonify({"error": "inverter_id is required"}), 400

    if not load_model(inv_id):
        return jsonify({"error": f"No trained model for {inv_id}. Call /train first."}), 404

    valid, missing = validate_inputs(reading)
    if not valid:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    # Append single reading to history
    HISTORY[inv_id] = (HISTORY.get(inv_id, []) + [reading])[-2000:]
    save_model(inv_id) # Save the updated history

    df_test = readings_to_dataframe(HISTORY[inv_id])
    pipe    = PIPELINES[inv_id]
    results = pipe.predict(df_test)
    output  = pipe.to_api_response(results)

    return jsonify({
        "inverter_id": inv_id,
        "status":      "ok",
        "results":     output,
    })


# ─────────────────────────────────────────────────────────────────
# GET /status
# ─────────────────────────────────────────────────────────────────
@ml_bp.route("/status", methods=["GET"])
def status():
    # Load available models from the directory just to show them
    trained = list(PIPELINES.keys())
    if os.path.exists(MODEL_DIR):
        for f in os.listdir(MODEL_DIR):
            if f.endswith("_pipe.pkl"):
                idx = f.replace("_pipe.pkl", "")
                if idx not in trained:
                    trained.append(idx)
                    
    return jsonify({
        "status":           "running",
        "trained_inverters": trained,
    })
