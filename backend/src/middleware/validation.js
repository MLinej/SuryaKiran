const { z } = require('zod');

const predictionSchema = z.object({
    inverter_id: z.string({ required_error: 'inverter_id is required' }).min(1, 'inverter_id cannot be empty'),
    block: z.string({ required_error: 'block is required' }).min(1, 'block is required'),
    power_kw: z.coerce.number(),
    pv1_power_kw: z.coerce.number(),
    daily_kwh: z.coerce.number(),
    inverter_temp_c: z.coerce.number(),
    ambient_temp_c: z.coerce.number(),
    ac_voltage_v: z.coerce.number(),
    dc_voltage_v: z.coerce.number(),
    ac_current_a: z.coerce.number(),
    dc_current_a: z.coerce.number(),
    frequency_hz: z.coerce.number(),
    alarm_code: z.coerce.number(),
    op_state: z.coerce.number(),
    price_per_kwh_inr: z.coerce.number(),
    timestamp: z.string().optional(),
});

const validatePredictionInput = (req, res, next) => {
    try {
        predictionSchema.parse(req.body);
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    validatePredictionInput,
};
