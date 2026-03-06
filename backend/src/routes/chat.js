/**
 * POST /api/chat
 * Proxies to the Flask Gemini chatbot with full fleet-wide context
 * loaded from the database, so the AI can answer questions about
 * any inverter or the entire plant.
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const prisma = require('../config/database');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

router.post('/', async (req, res, next) => {
    try {
        const { message, inverter_id } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'message is required' });
        }

        // ── 1. Load fleet-wide context from DB ─────────────────────────────
        const [inverters, recentAlerts, openMaintenance] = await Promise.all([
            prisma.inverters.findMany({
                include: {
                    Predictions: { orderBy: { created_at: 'desc' }, take: 1 },
                    Telemetry: { orderBy: { timestamp: 'desc' }, take: 1 },
                }
            }),
            prisma.alerts.findMany({
                where: { status: 'Active' },
                orderBy: { created_at: 'desc' },
                take: 20,
            }),
            prisma.maintenance.findMany({
                where: { status: { not: 'Resolved' } },
                orderBy: { created_at: 'desc' },
                take: 10,
            }),
        ]);

        // Build a concise fleet snapshot string
        const fleetSummary = inverters.map(inv => {
            const pred = inv.Predictions[0];
            const tele = inv.Telemetry[0];
            const riskScore = pred?.risk_score ?? 'N/A';
            const riskLevel = pred?.risk_level ?? 'Unknown';
            const temp = tele?.inverter_temp_c ?? 'N/A';
            const power = tele?.power_kw ?? 'N/A';
            return `${inv.id} [Block ${inv.block}]: Risk=${riskScore}/100 (${riskLevel}), Temp=${temp}°C, Power=${power}kW`;
        }).join('\n');

        const alertSummary = recentAlerts.length > 0
            ? recentAlerts.map(a => `• [${a.severity}] ${a.inverter_id}: ${a.message}`).join('\n')
            : 'No active alerts.';

        const maintSummary = openMaintenance.length > 0
            ? openMaintenance.map(m => `• ${m.inverter_id}: ${m.issue} (${m.status})`).join('\n')
            : 'No open maintenance tickets.';

        const fleetContext = `
=== FLEET-WIDE LIVE STATUS ===
Total inverters: ${inverters.length}
High/Critical risk: ${inverters.filter(i => ['Critical', 'High'].includes(i.Predictions[0]?.risk_level)).length}

--- Inverter Status ---
${fleetSummary || 'No inverters registered yet.'}

--- Active Alerts (${recentAlerts.length}) ---
${alertSummary}

--- Open Maintenance Tickets (${openMaintenance.length}) ---
${maintSummary}
`;

        // ── 2. Forward to Flask /chat with fleet context as extra context ───
        const flaskResponse = await axios.post(`${ML_SERVICE_URL}/chat`, {
            message,
            api_key: GEMINI_API_KEY,
            inverter_id: inverter_id || null,
            fleet_context: fleetContext,         // Flask will inject this into the prompt
        }, { timeout: 60000 });

        return res.json({ reply: flaskResponse.data.reply });

    } catch (error) {
        console.error('[chat] Error:', error.response?.data || error.message);

        // Friendly fallback if Flask is unreachable
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return res.json({
                reply: "I'm having trouble connecting to the AI engine right now. Please ensure the ML service is running and try again in a moment."
            });
        }

        next(error);
    }
});

module.exports = router;
