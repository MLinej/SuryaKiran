const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const getPrediction = async (reading) => {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/predict/single`, reading, {
            timeout: 30000,
        });

        const rawOutput = response.data || {};
        const results = rawOutput.results || {};
        const p1 = results.prediction_1 || {};
        const p2 = results.prediction_2 || {};
        const p3 = results.prediction_3 || {};
        const p4 = results.prediction_4 || {};

        const rawScore = Number(p1.current_score ?? 0);
        const risk_score = Math.round(rawScore * 100);

        const statusLabel = String(p1.current_status || '').toLowerCase();
        let risk_level = 'Healthy';
        if (statusLabel.includes('fault') || risk_score >= 80) {
            risk_level = 'Critical';
        } else if (statusLabel.includes('warn') || risk_score >= 50) {
            risk_level = 'High';
        }

        const cause = p3.primary_cause || 'Unknown';
        const eta = p2.eta_display || 'Unknown';
        const totalLoss = p4.total_loss_inr
            ? `INR ${Number(p4.total_loss_inr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
            : null;

        const explanation = [
            `Risk score: ${risk_score}/100.`,
            `Primary cause: ${cause}.`,
            `Estimated time to fault: ${eta}.`,
            totalLoss ? `Financial impact: ${totalLoss} over 15 days.` : null,
        ].filter(Boolean).join(' ');

        return {
            risk_score,
            risk_level,
            explanation,
            current_status: p1.current_status || null,
            current_score: rawScore,
            eta_display: p2.eta_display || null,
            eta_hours: p2.eta_hours ?? null,
            primary_cause: p3.primary_cause || null,
            total_loss_inr: p4.total_loss_inr ?? null,
            total_loss_kwh: p4.total_loss_kwh ?? null,
            per_model_probs: p1.per_model_probs || null,
            daily_table: p4.daily_table || null,
            model_output: rawOutput,
        };
    } catch (error) {
        console.warn('[mlService] ML service error:', error.response?.data || error.message);

        const temp = Number(reading.inverter_temp_c || 0);
        const alarmCode = Number(reading.alarm_code || 0);
        let risk_score = 10;
        let risk_level = 'Healthy';
        let explanation = 'Normal operation. No significant anomalies detected.';

        if (alarmCode > 0 || temp > 75) {
            risk_score = 85;
            risk_level = 'Critical';
            explanation = `Elevated temperature (${temp} C) or active alarm (code ${alarmCode}) detected. Immediate inspection recommended.`;
        } else if (temp > 60) {
            risk_score = 55;
            risk_level = 'High';
            explanation = `Inverter temperature (${temp} C) is above normal threshold. Monitor closely and schedule inspection.`;
        }

        return {
            risk_score,
            risk_level,
            explanation,
            current_status: risk_level,
            current_score: risk_score / 100,
            eta_display: null,
            eta_hours: null,
            primary_cause: null,
            total_loss_inr: null,
            total_loss_kwh: null,
            per_model_probs: null,
            daily_table: null,
            model_output: null,
        };
    }
};

module.exports = { getPrediction };
