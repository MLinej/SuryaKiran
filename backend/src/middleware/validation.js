const { z } = require('zod');

const predictionSchema = z.object({
    inverter_id: z.string({ required_error: "inverter_id is required" }).regex(/^INV-\d{2,3}$/, "inverter_id must match pattern: INV-XXX or INV-XX"),
    block: z.enum(["A", "B", "C", "D"], { required_error: "block is required", invalid_type_error: "block must be A, B, C, or D" }),
    power_kw: z.number().positive("power_kw must be positive"),
    pv1_power_kw: z.number().positive("pv1_power_kw must be positive"),
    daily_kwh: z.number().positive("daily_kwh must be positive"),
    inverter_temp_c: z.number().min(-20).max(120),
    ambient_temp_c: z.number().min(-20).max(80),
    ac_voltage_v: z.number().min(0).max(1000),
    dc_voltage_v: z.number().min(0).max(1000),
    ac_current_a: z.number().min(0).max(200),
    dc_current_a: z.number().min(0).max(200),
    frequency_hz: z.number(),
    alarm_code: z.coerce.number().refine(val => [0, 100, 210, 300].includes(val), {
        message: "alarm_code must be exactly 0, 100, 210, or 300"
    }),
    op_state: z.coerce.number().refine(val => [0, 1, 2, 3].includes(val), {
        message: "op_state must be exactly 0, 1, 2, or 3"
    }),
    price_per_kwh_inr: z.number().positive("price_per_kwh_inr must be positive"),
    timestamp: z.string().datetime().optional()
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
