from flask import Blueprint, request, jsonify
import json
import os
import google.generativeai as genai
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
        genai.configure(api_key=api_key)
        
        model = genai.GenerativeModel('gemini-2.5-flash')

        system_prompt = """
You are a solar operations assistant. Only use the data provided in <DATA> to answer.
If something is not in <DATA>, say that it is unknown.

TASKS:
1. Briefly classify the inverter(s) as LOW/MEDIUM/HIGH risk based on ensemble_fault_prob and risk_level.
2. List the top 3 contributing factors, each backed by one of the numeric features.
3. Recommend concrete operator actions for the next 7-10 days (e.g., thermal inspection, string checks, schedule maintenance), explicitly referencing the features.

Answer in this JSON format with no extra text:
{
  "summary": "...",
  "factors": [
    {"feature": "...", "reason": "..."},
    {"feature": "...", "reason": "..."},
    {"feature": "...", "reason": "..."}
  ],
  "recommendations": ["...", "..."]
}
"""

        context_data = "<DATA>\n"

        # Inject fleet-wide context if provided by Node.js proxy (simulating the <TABLE> requirement)
        if fleet_context:
            context_data += f"Fleet Overview / Tabular View:\n{fleet_context}\n"

        if inverter_id and load_model(inverter_id):
            df_test = readings_to_dataframe(HISTORY[inverter_id])
            pipe = PIPELINES[inverter_id]
            results = pipe.predict(df_test)
            output = pipe.to_api_response(results)
            
            p1 = output.get("prediction_1", {})
            p2 = output.get("prediction_2", {})
            p3 = output.get("prediction_3", {})
            
            # Formatting to match the user's requested data structure
            inverter_summary = f"""
inverter_id: {inverter_id}
ensemble_fault_prob: {p1.get('ensemble_score', 0):.3f}
risk_level: {p1.get('current_status', 'UNKNOWN')}
days_to_fault: {p2.get('eta_hours', 0) / 24 if p2.get('eta_hours') else 'Unknown'}
main_cause: {p3.get('primary_cause', 'Unknown')}
top_features: {json.dumps(p3.get('top_features', []))}
"""
            context_data += inverter_summary
            
        context_data += "</DATA>\n"

        prompt = f"""
{system_prompt}

{context_data}

USER QUESTION:
{user_message}
"""

        # Using generation config to enforce JSON if possible, otherwise rely on the prompt instructing pure JSON
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json")
        )
        
        return jsonify({
            "status": "ok",
            "reply": response.text
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500