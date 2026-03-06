const mlService = require('../services/mlService');
const prisma = require('../config/database');

const predictProbability = async (req, res, next) => {
    try {
        const {
            inverter_id,
            block,
            power_kw,
            pv1_power_kw,
            daily_kwh,
            inverter_temp_c,
            ambient_temp_c,
            ac_voltage_v,
            dc_voltage_v,
            ac_current_a,
            dc_current_a,
            frequency_hz,
            alarm_code,
            op_state,
            price_per_kwh_inr,
            timestamp,
        } = req.body;

        const predictionResult = await mlService.getPrediction({
            inverter_id,
            timestamp: timestamp || new Date().toISOString(),
            power_kw,
            pv1_power_kw,
            daily_kwh,
            inverter_temp_c,
            ambient_temp_c,
            ac_voltage_v,
            dc_voltage_v,
            ac_current_a,
            dc_current_a,
            frequency_hz,
            alarm_code,
            op_state,
            price_per_kwh_inr,
        });

        const {
            risk_score,
            risk_level,
            explanation,
            current_status,
            current_score,
            eta_display,
            eta_hours,
            primary_cause,
            total_loss_inr,
            total_loss_kwh,
            per_model_probs,
            daily_table,
            model_output,
        } = predictionResult;

        await prisma.inverters.upsert({
            where: { id: inverter_id },
            update: {
                last_updated: new Date(),
                status: risk_level === 'High' || risk_level === 'Critical' ? 'At Risk' : 'Healthy',
                block,
            },
            create: {
                id: inverter_id,
                block,
                status: risk_level === 'High' || risk_level === 'Critical' ? 'At Risk' : 'Healthy',
            },
        });

        await prisma.$transaction([
            prisma.telemetry.create({
                data: {
                    inverter_id,
                    power_kw,
                    pv1_power_kw,
                    daily_kwh,
                    inverter_temp_c,
                    ambient_temp_c,
                    ac_voltage_v,
                    dc_voltage_v,
                    ac_current_a,
                    dc_current_a,
                    frequency_hz,
                    alarm_code,
                    op_state,
                    price_per_kwh_inr,
                    timestamp: timestamp ? new Date(timestamp) : undefined,
                },
            }),
            prisma.predictions.create({
                data: {
                    inverter_id,
                    risk_score,
                    risk_level,
                    explanation,
                    current_status,
                    current_score,
                    eta_display,
                    eta_hours,
                    primary_cause,
                    total_loss_inr,
                    total_loss_kwh,
                    per_model_probs,
                    daily_table,
                    model_output,
                },
            }),
        ]);

        if (risk_level === 'High' || risk_level === 'Critical') {
            await prisma.alerts.create({
                data: {
                    inverter_id,
                    severity: risk_level,
                    message: `High risk detected for inverter ${inverter_id}: ${explanation}`,
                },
            });
        }

        res.json({
            inverter_id,
            risk_score,
            risk_level,
            explanation,
            eta_display,
            primary_cause,
            total_loss_inr,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    predictProbability,
};
