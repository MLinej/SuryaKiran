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
            timestamp
        } = req.body;

        // 1. Call ML Service (Mapping to basic API for mock if needed)
        const predictionResult = await mlService.getPrediction({
            temperature: inverter_temp_c,
            voltage: ac_voltage_v,
            current: ac_current_a,
            power_output: power_kw,
        });

        const { risk_score, risk_level, explanation } = predictionResult;

        // 2. Ensure inverter exists before creating telemetry
        await prisma.inverters.upsert({
            where: { id: inverter_id },
            update: { last_updated: new Date(), status: risk_level === 'High' || risk_level === 'Critical' ? 'At Risk' : 'Healthy', block },
            create: { id: inverter_id, block, status: risk_level === 'High' || risk_level === 'Critical' ? 'At Risk' : 'Healthy' }
        });

        // 3. Save prediction and telemetry to database concurrently
        const [telemetry, prediction] = await prisma.$transaction([
            prisma.telemetry.create({
                data: {
                    inverter_id, power_kw, pv1_power_kw, daily_kwh,
                    inverter_temp_c, ambient_temp_c, ac_voltage_v,
                    dc_voltage_v, ac_current_a, dc_current_a,
                    frequency_hz, alarm_code, op_state, price_per_kwh_inr,
                    timestamp: timestamp ? new Date(timestamp) : undefined
                },
            }),
            prisma.predictions.create({
                data: {
                    inverter_id,
                    risk_score,
                    risk_level,
                    explanation,
                },
            }),
        ]);

        // 4. Optional: Create an alert if risk is high
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
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    predictProbability,
};
