from model_loader import model_loader_instance

def predict_risk(temperature: float, voltage: float, current: float, power_output: float) -> dict:
    model = model_loader_instance.get_model()
    
    # We use a simple rule-based simulation since actual model weights aren't provided.
    risk_score = 10
    explanation = "Inverter is operating normally."
    risk_level = "Low"

    # Analyze temperature
    if temperature > 80:
        risk_score += 40
        explanation = "Critical temperature spike detected. Cooling system failure likely."
        risk_level = "Critical"
    elif temperature > 65:
        risk_score += 20
        explanation = "Elevated temperature detected. Monitoring recommended."
        risk_level = "Medium"

    # Analyze power vs voltage/current (Basic efficiency check simulation)
    expected_power = (voltage * current) / 1000 # Convert to kW roughly if V and A are standard units
    if power_output < (expected_power * 0.5) and risk_level != "Critical":
        risk_score += 30
        explanation = "Significant drop in expected power output."
        if risk_level == "Medium":
            risk_level = "High"
            explanation = "Elevated temperature combined with significant power drop."
        else:
            risk_level = "Medium"

    # Cap at 100
    risk_score = min(risk_score, 100)

    # Risk level refinement
    if risk_score >= 80:
        risk_level = "Critical"
    elif risk_score >= 60:
        risk_level = "High"
    elif risk_score >= 40:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "explanation": explanation
    }
