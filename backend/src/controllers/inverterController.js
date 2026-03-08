const prisma = require('../config/database');

const getInverters = async (req, res, next) => {
    try {
        const inverters = await prisma.inverters.findMany({
            include: {
                Predictions: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                },
                Telemetry: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                }
            }
        });

        const formattedInverters = inverters.map((inv) => {
            const latestPrediction = inv.Predictions[0] || null;
            return {
                id: inv.id,
                block: inv.block,
                status: inv.status,
                last_updated: inv.last_updated,
                latest_risk_score: latestPrediction ? latestPrediction.risk_score : null,
                latest_risk_level: latestPrediction ? latestPrediction.risk_level : null,
                latest_power_kw: inv.Telemetry[0]?.power_kw ?? null,
                latest_telemetry_at: inv.Telemetry[0]?.timestamp ?? null,
                latest_prediction_at: latestPrediction?.created_at ?? null,
            };
        });

        res.json(formattedInverters);
    } catch (error) {
        next(error);
    }
};

const getInverterById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const inverter = await prisma.inverters.findUnique({ where: { id } });

        if (!inverter) {
            return res.status(404).json({ error: 'Inverter not found' });
        }

        const [latestTelemetry, latestPrediction] = await Promise.all([
            prisma.telemetry.findFirst({
                where: { inverter_id: id },
                orderBy: { timestamp: 'desc' }
            }),
            prisma.predictions.findFirst({
                where: { inverter_id: id },
                orderBy: { created_at: 'desc' }
            })
        ]);

        res.json({
            inverter,
            latest_telemetry: latestTelemetry || null,
            latest_prediction: latestPrediction || null
        });
    } catch (error) {
        next(error);
    }
};

const createInverter = async (req, res, next) => {
    try {
        const { id, block } = req.body;

        const inverter = await prisma.inverters.upsert({
            where: { id },
            update: { last_updated: new Date() },
            create: { id, block: block || 'A', status: 'Healthy' }
        });

        res.status(201).json(inverter);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInverters,
    getInverterById,
    createInverter
};
