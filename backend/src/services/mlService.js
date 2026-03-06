const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000';

const getPrediction = async (telemetryData) => {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/predict`, telemetryData);
        return response.data;
    } catch (error) {
        console.warn('ML Service unreachable, falling back to mock prediction:', error.message);

        // Mock fallback so the frontend and database flow can still be tested globally
        const riskLevel = telemetryData.temperature > 80 ? 'High' : 'Healthy';
        const riskScore = telemetryData.temperature > 80 ? 85 : 12;

        return {
            risk_score: riskScore,
            risk_level: riskLevel,
            explanation: riskLevel === 'High' ? "Elevated temperature detected by fallback mock." : "Normal operation."
        };
    }
};

module.exports = {
    getPrediction,
};
