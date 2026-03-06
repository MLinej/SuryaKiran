import os
import json
import pickle

# ─────────────────────────────────────────────────────────────────
# Models persistence and state
# ─────────────────────────────────────────────────────────────────
PIPELINES   = {}    # { inverter_id: InverterFaultPipeline }
HISTORY     = {}    # { inverter_id: [list of hourly reading dicts] }
FAULT_STATES = [2]   # fault state for trained models

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)


def save_model(inv_id):
    """Save pipeline and history to disk."""
    if inv_id in PIPELINES:
        with open(os.path.join(MODEL_DIR, f"{inv_id}_pipe.pkl"), "wb") as f:
            pickle.dump(PIPELINES[inv_id], f)
    if inv_id in HISTORY:
        with open(os.path.join(MODEL_DIR, f"{inv_id}_history.json"), "w") as f:
            json.dump(HISTORY[inv_id], f)


def _get_any_trained_model():
    """
    Returns (pipeline, history) for any trained model found on disk.
    Used as a fallback for new inverters that don't have their own model yet.
    """
    # First check in-memory
    if PIPELINES:
        first_id = next(iter(PIPELINES))
        return PIPELINES[first_id], HISTORY.get(first_id, [])

    # Then check disk
    for fname in os.listdir(MODEL_DIR):
        if fname.endswith("_pipe.pkl"):
            fallback_id = fname.replace("_pipe.pkl", "")
            hist_path = os.path.join(MODEL_DIR, f"{fallback_id}_history.json")
            pipe_path = os.path.join(MODEL_DIR, fname)
            if os.path.exists(hist_path):
                with open(pipe_path, "rb") as f:
                    pipe = pickle.load(f)
                with open(hist_path, "r") as f:
                    hist = json.load(f)
                print(f"[ml_service] Using fallback model from '{fallback_id}' for new inverter.")
                return pipe, hist

    return None, None


def load_model(inv_id):
    """
    Load pipeline and history from disk if not in memory.
    Returns True if model loaded successfully.
    """
    if inv_id in PIPELINES and inv_id in HISTORY:
        return True

    pipe_path = os.path.join(MODEL_DIR, f"{inv_id}_pipe.pkl")
    hist_path = os.path.join(MODEL_DIR, f"{inv_id}_history.json")

    if os.path.exists(pipe_path) and os.path.exists(hist_path):
        with open(pipe_path, "rb") as f:
            PIPELINES[inv_id] = pickle.load(f)
        with open(hist_path, "r") as f:
            HISTORY[inv_id] = json.load(f)
        print(f"[ml_service] Loaded '{inv_id}' model from disk cache.")
        return True

    # ── FALLBACK: use any available trained model ─────────────────
    pipe, hist = _get_any_trained_model()
    if pipe is not None:
        # Register it under the new inverter_id so predict works correctly
        PIPELINES[inv_id] = pipe
        HISTORY[inv_id] = hist
        print(f"[ml_service] No specific model for '{inv_id}'. Using global fallback pipeline.")
        return True

    return False
