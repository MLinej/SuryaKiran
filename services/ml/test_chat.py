import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

url = "http://localhost:5001/chat"

# Example mock data that the Node.js backend would normally retrieve from Neon DB
mock_fleet_context = """
Block B Summary (Last 24h):
INV_02
Block: B
Risk Score: 0.81
Status: FAULT
Temperature: 78°C
Voltage fluctuation: High

INV_04
Block: B
Risk Score: 0.69
Status: WARNING
Temperature: 72°C
Voltage fluctuation: Normal

INV_07
Block: B
Risk Score: 0.22
Status: NORMAL
Temperature: 55°C
Voltage fluctuation: Normal
"""

payload = {
    "message": "how do we resolve the risk ?",
    "api_key": os.environ.get("GEMINI_API_KEY", ""), # Or replace with your hardcoded key for quick testing: "AIzaSy..."
    "fleet_context": mock_fleet_context
}

headers = {
    "Content-Type": "application/json"
}

print(f"Sending request to {url}...\n")
print(f"User Message: {payload['message']}\n")

try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    data = response.json()
    print("=== GEMINI RESPONSE ===")
    print(data.get("reply", "No reply in response."))
    print("=======================")
except requests.exceptions.ConnectionError:
    print("Error: Could not connect to the ML API. Is it running on port 5001?")
except Exception as e:
    print(f"An error occurred: {e}")
    if 'response' in locals() and response.text:
        print(f"Response body: {response.text}")
