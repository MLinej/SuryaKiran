from flask import Blueprint, request, jsonify
import json
import os
import time
from google import genai
from ml_service import load_model, PIPELINES, HISTORY
from inverter_pip_line import readings_to_dataframe

chat_bp = Blueprint('chat', __name__)

# ─────────────────────────────────────────────────────────────────
# POST /chat
# ─────────────────────────────────────────────────────────────────
@chat_bp.route("/chat", methods=["POST"])
def chat():
    body = request.get_json()
    user_message = body.get("message")
    api_key = body.get("api_key", os.environ.get("GEMINI_API_KEY", ""))
    inverter_id = body.get("inverter_id", None)
    fleet_context = body.get("fleet_context", "")  # Fleet-wide context from Node.js proxy
    
    if not user_message:
        return jsonify({"error": "message is required"}), 400
    
    if not api_key:
        return jsonify({"error": "Gemini API key is required. Pass 'api_key' in request or set GEMINI_API_KEY env var."}), 400
        
    try:
        client = genai.Client(api_key=api_key)

        system_prompt = """You are SuryaKiran AI Copilot — a friendly, knowledgeable solar plant operations assistant.

Use the live fleet data provided in <DATA> to answer the operator's question.
If the data does not contain sufficient information to answer, say so honestly.

Guidelines:
- Answer in clear, concise plain text (NOT JSON).
- Use numbered lists for actionable steps or multiple items.
- Classify inverter risk as Low / Medium / High when relevant.
- When recommending actions, be specific (e.g. "Schedule thermal inspection for INV-204 within 3 days").
- Keep answers practical and operator-friendly.
- If asked about a specific inverter, focus on that inverter's data.
- If asked a general question, summarise the fleet-wide situation first.
"""

        context_data = "<DATA>\n"

        # Inject fleet-wide context if provided by Node.js proxy
        if fleet_context:
            context_data += f"Fleet Overview:\n{fleet_context}\n"

        if inverter_id and load_model(inverter_id):
            try:
                df_test = readings_to_dataframe(HISTORY[inverter_id])
                pipe = PIPELINES[inverter_id]
                results = pipe.predict(df_test)
                output = pipe.to_api_response(results)
                
                p1 = output.get("prediction_1", {})
                p2 = output.get("prediction_2", {})
                p3 = output.get("prediction_3", {})
                
                inverter_summary = f"""
Specific Inverter Detail:
  inverter_id: {inverter_id}
  ensemble_fault_prob: {p1.get('ensemble_score', 0):.3f}
  risk_level: {p1.get('current_status', 'UNKNOWN')}
  days_to_fault: {p2.get('eta_hours', 0) / 24 if p2.get('eta_hours') else 'Unknown'}
  main_cause: {p3.get('primary_cause', 'Unknown')}
  top_features: {json.dumps(p3.get('top_features', []))}
"""
                context_data += inverter_summary
            except Exception as model_err:
                context_data += f"\n(Model data unavailable for {inverter_id}: {model_err})\n"
            
        context_data += "</DATA>\n"

        prompt = f"""{system_prompt}

{context_data}

Operator question: {user_message}
"""

        # Retry up to 2 times on transient / rate-limit errors
        last_error = None
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                )
                
                reply_text = response.text if response.text else "I couldn't generate a response. Please try again."
                
                return jsonify({
                    "status": "ok",
                    "reply": reply_text
                })
            except Exception as api_err:
                last_error = api_err
                err_str = str(api_err).lower()
                # Retry on rate-limit / resource-exhausted errors
                if "429" in err_str or "resource" in err_str or "quota" in err_str or "retry" in err_str:
                    wait_secs = 2 ** attempt  # 1s, 2s, 4s
                    print(f"[chat] Gemini rate-limited, retrying in {wait_secs}s (attempt {attempt+1}/3)...")
                    time.sleep(wait_secs)
                    continue
                else:
                    raise  # Non-retryable error

        # All retries exhausted
        return jsonify({
            "status": "ok",
            "reply": "I'm experiencing high demand right now. Please try again in a minute."
        })

    except Exception as e:
        print(f"[chat] Error: {e}")
        return jsonify({"error": str(e)}), 500
