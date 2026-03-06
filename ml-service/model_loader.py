class ModelLoader:
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        """Simulates loading an ML model into memory once on startup."""
        print("Loading ML model into memory...")
        # In a real scenario, this would be:
        # self.model = joblib.load('path_to_model.pkl')
        self.model = "SimulatedModel_v1"
        print("Model loaded successfully.")

    def get_model(self):
        return self.model

# Singleton instance
model_loader_instance = ModelLoader()
