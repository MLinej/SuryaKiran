import traceback
import google.generativeai as genai
import os
from dotenv import load_dotenv

try:
    load_dotenv()
    genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content('test')
    print("SUCCESS")
    print(response.text)
except Exception as e:
    print("FAILED")
    print(e)
    traceback.print_exc()
