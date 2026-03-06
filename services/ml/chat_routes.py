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
You are an AI assistant for a Solar Inverter Monitoring System.

Your job is to help solar plant operators understand inverter health and what action they should take.

IMPORTANT RULES:

1. Use very simple and clear English.
2. Keep answers short and easy to read.
3. Use plain text only.
4. DO NOT use markdown, stars (*), bold, headings, or special formatting.
5. Do NOT write symbols like ** or ***.
6. Use normal sentences or simple numbered points.

ABOUT THE SYSTEM:

Solar plants use machines called inverters to convert solar energy into electricity.
If an inverter performs poorly or may fail soon, the plant can lose power and money.

Our system analyzes inverter data and predicts possible problems before they happen.

YOUR TASK:

Using the provided system data:
- Explain the inverter condition in simple words.
- Tell the user if an inverter needs attention.
- Explain the main reason for the risk using the provided data.
- Give clear actions the operator should take.

CONTEXT RULES:

- Use ONLY the data given to you.
- Do NOT invent numbers or causes.
- If data is missing, say you do not have enough information.

STYLE RULES:

Good response style:

INV-01 needs immediate inspection. The temperature is very high and power output is dropping. This may mean the inverter is overheating.

Action:
1. Check cooling fans.
2. Inspect air vents.
3. Check electrical connections.

Always keep the response clean, short, and easy to read.
"""

        context_data = ""

        # Inject fleet-wide context if provided by Node.js proxy
        if fleet_context:
            context_data += f"\n{fleet_context}\n"

        if inverter_id and load_model(inverter_id):
            df_test = readings_to_dataframe(HISTORY[inverter_id])
            pipe = PIPELINES[inverter_id]
            results = pipe.predict(df_test)
            output = pipe.to_api_response(results)
            latest_status = output if output else {}

            context_data += f"\n=== INVERTER DATA FOR {inverter_id} ===\n{json.dumps(latest_status, indent=2)}\n"

        prompt = f"""
{system_prompt}

SYSTEM DATA:
{context_data}

USER QUESTION:
{user_message}

Answer in simple English:
"""

        response = model.generate_content(prompt)
        
        return jsonify({
            "status": "ok",
            "reply": response.text
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500