"""
Flask API — Solar Inverter Fault Prediction
Node.js sends POST /predict → runs ML pipeline → returns JSON with 4 predictions

Refactored to use modular Flask Blueprints for clean architecture.
"""

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load background environment variables from .env
load_dotenv()

# Import Blueprints
from ml_routes import ml_bp
from chat_routes import chat_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register isolated modules
    app.register_blueprint(ml_bp)
    app.register_blueprint(chat_bp)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5001, debug=True)