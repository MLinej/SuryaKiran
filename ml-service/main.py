from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from predictor import predict_risk

app = FastAPI(title="SuryaKiran ML Prediction Service", version="1.0.0")

class TelemetryData(BaseModel):
    temperature: float = Field(..., description="Inverter temperature")
    voltage: float = Field(..., description="Inverter voltage")
    current: float = Field(..., description="Inverter current")
    power_output: float = Field(..., description="Inverter power output")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ML Prediction Service"}

@app.post("/predict")
def predict_telemetry(telemetry: TelemetryData):
    try:
        # Pass telemetry data to predictor which handles the loaded model simulation
        result = predict_risk(
            temperature=telemetry.temperature,
            voltage=telemetry.voltage,
            current=telemetry.current,
            power_output=telemetry.power_output
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
