const express = require('express');
const axios = require('axios');
const prisma = require('../config/database');

const router = express.Router();

function parseModelOutput(rawValue) {
    if (!rawValue) return {};
    if (typeof rawValue === 'object') return rawValue;
    if (typeof rawValue !== 'string') return {};
    try {
        return JSON.parse(rawValue);
    } catch (_err) {
        return {};
    }
}

async function fetchContext(inverterId) {
    const [inverters, alerts, maintenance] = await Promise.all([
        prisma.inverters.findMany({
            include: {
                Predictions: { orderBy: { created_at: 'desc' }, take: 1 },
                Telemetry: { orderBy: { timestamp: 'desc' }, take: 1 },
            },
        }),
        prisma.alerts.findMany({ orderBy: { created_at: 'desc' }, take: 20 }),
        prisma.maintenance.findMany({ where: { status: { not: 'Resolved' } }, orderBy: { created_at: 'desc' }, take: 10 }),
    ]);

    const inventory = inverters.map((inv) => {
        const latestPred = inv.Predictions[0] || null;
        const latestTele = inv.Telemetry[0] || null;
        return {
            inverter_id: inv.id,
            block: inv.block,
            status: inv.status,
            last_updated: inv.last_updated,
            telemetry: latestTele,
            prediction: latestPred,
            model_output: parseModelOutput(latestPred?.model_output),
        };
    });

    const selected = inverterId ? inventory.find((i) => i.inverter_id === inverterId) || null : null;

    return {
        inverter_data: selected || inventory.slice(0, 20),
        alerts: alerts.map((a) => ({
            inverter_id: a.inverter_id,
            severity: a.severity,
            message: a.message,
            status: a.status,
            created_at: a.created_at,
        })),
        model_prediction: selected?.prediction || null,
        maintenance: maintenance.map((m) => ({
            inverter_id: m.inverter_id,
            issue: m.issue,
            status: m.status,
            details: m.details,
            scheduled_date: m.scheduled_date,
        })),
        fleet_summary: {
            total_inverters: inventory.length,
            critical_or_high: inventory.filter((i) => ['Critical', 'High'].includes(i.prediction?.risk_level)).length,
            active_alerts: alerts.filter((a) => a.status === 'Active').length,
        },
    };
}

function buildPrompt(question, context) {
    // PRE-FILTER DATA to send absolute minimum tokens to Gemini to avoid 429 Exhausted Rate Limits
    const highRisk = context.inverter_data.filter(i => ['High', 'Critical'].includes(i.prediction?.risk_level));
    const activeAlerts = context.alerts.filter(a => a.status === 'Active').slice(0, 3);
    const openMaint = context.maintenance.filter(m => m.status !== 'Resolved').slice(0, 3);

    // Create an extremely minimal string context payload
    const smallContext = `
    Fleet Status: ${context.fleet_summary.total_inverters} total, ${context.fleet_summary.critical_or_high} critical.
    Active Alerts: ${activeAlerts.length ? activeAlerts.map(a => `${a.inverter_id}: ${a.message}`).join(' | ') : 'None'}
    High Risk Inverters: ${highRisk.length ? highRisk.map(i => `${i.inverter_id} (${i.prediction?.risk_level})`).join(', ') : 'None'}
    Open Maintenance: ${openMaint.length ? openMaint.map(m => `${m.inverter_id}: ${m.issue}`).join(', ') : 'None'}
    `;

    return [
        'You are SuryaKiran Copilot for solar plant operators. Answer in simple, short language.',
        'Use short sections: Summary, What Happened, What To Do Next.',
        '',
        `Live Data: ${smallContext.trim()}`,
        '',
        `Operator Question: ${question}`
    ].join('\n');
}

async function callOpenAI(prompt) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    try {
        const { data } = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model,
                temperature: 0.2,
                messages: [
                    { role: 'system', content: 'You are a reliable solar-operations assistant.' },
                    { role: 'user', content: prompt },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 60000,
            }
        );

        return {
            answer: data?.choices?.[0]?.message?.content?.trim() || 'No response generated.',
            confidence: 0.9,
            provider: 'openai',
        };
    } catch (error) {
        console.error('[copilot][openai] request failed:', error.response?.status || error.message);
        return null;
    }
}

async function callGemini(prompt, history = []) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { error: 'Gemini API key is missing. Please check your .env file.', provider: 'gemini' };

    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Transform history to Gemini format: { role: "user" | "model", parts: [{ text: "..." }] }
    // Gemini roles are "user" and "model".
    const contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    // Add current prompt
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    try {
        const { data } = await axios.post(
            url,
            { contents },
            { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
        );

        const answer = (data?.candidates || [])
            .flatMap((c) => c?.content?.parts || [])
            .map((p) => p?.text)
            .filter(Boolean)
            .join('\n')
            .trim();

        return {
            answer: answer || 'No response generated.',
            confidence: 0.85,
            provider: 'gemini',
        };
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error('[copilot][gemini] request failed:', errorMsg);
        return {
            error: `Gemini API Error: ${errorMsg}`,
            provider: 'gemini',
            status: error.response?.status || 500
        };
    }
}

function localFallback(question, context) {
    const summary = context.fleet_summary;
    const topAlerts = context.alerts.slice(0, 2).map((a) => `${a.inverter_id} (${a.severity})`).join(', ') || 'none';

    return {
        answer: [
            'Summary: External AI is not reachable right now, but I analyzed your live data.',
            `What happened: ${summary.critical_or_high} inverter(s) are high/critical risk. Active alerts: ${summary.active_alerts}. Top alerts: ${topAlerts}.`,
            'What to do next: Inspect highest-risk inverter first, validate temperature/voltage trends, then close open maintenance items in priority order.',
            `Question received: ${question}`,
        ].join('\n\n'),
        confidence: 0.6,
        provider: 'fallback',
    };
}

async function processCopilotRequest(req, res, next) {
    try {
        const question = String(req.body?.question || req.body?.message || '').trim();
        const inverterId = req.body?.inverter_id || null;
        const sessionId = req.body?.sessionId || null;

        if (!question) {
            return res.status(400).json({ error: 'question is required' });
        }

        // Fetch history if sessionId is provided
        let history = [];
        if (sessionId) {
            const session = await prisma.chatSession.findUnique({
                where: { id: sessionId },
                include: { Messages: { orderBy: { createdAt: 'asc' } } }
            });
            if (session && session.userId === req.user.id) {
                history = session.Messages.map(m => ({ role: m.role, content: m.content }));
            }
        }

        const context = await fetchContext(inverterId);
        const prompt = buildPrompt(question, context);

        let llmResult = null;
        const preferred = (process.env.COPILOT_PROVIDER || '').toLowerCase();

        if (preferred === 'openai') {
            llmResult = await callOpenAI(prompt);
            if (!llmResult) llmResult = await callGemini(prompt, history);
        } else if (preferred === 'gemini') {
            llmResult = await callGemini(prompt, history);
            // If Gemini returned an error object, we'll return it instead of falling back
            if (llmResult && llmResult.error) {
                return res.status(llmResult.status || 500).json({
                    error: llmResult.error,
                    provider: 'gemini',
                    question
                });
            }
            if (!llmResult) llmResult = await callOpenAI(prompt);
        } else {
            llmResult = await callOpenAI(prompt);
            if (!llmResult) llmResult = await callGemini(prompt, history);
        }

        const result = llmResult || localFallback(question, context);

        // Handle case where fallback was needed but error object came from provider
        if (result.error) {
            return res.status(result.status || 500).json({
                error: result.error,
                provider: result.provider,
                question
            });
        }

        return res.json({
            answer: result.answer,
            confidence: result.confidence,
            provider: result.provider,
            question,
            inverter_data: context.inverter_data,
            alerts: context.alerts,
            model_prediction: context.model_prediction,
        });
    } catch (error) {
        console.error('[copilot] error:', error.response?.data || error.message);
        return next(error);
    }
}

router.get('/sessions', async (req, res, next) => {
    try {
        const sessions = await prisma.chatSession.findMany({
            where: { userId: req.user.id },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(sessions);
    } catch (error) {
        next(error);
    }
});

router.post('/sessions', async (req, res, next) => {
    try {
        const { title } = req.body;
        const session = await prisma.chatSession.create({
            data: {
                userId: req.user.id,
                title: title || 'New Chat'
            }
        });
        res.status(201).json(session);
    } catch (error) {
        next(error);
    }
});

router.get('/sessions/:sessionId', async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            include: {
                Messages: { orderBy: { createdAt: 'asc' } }
            }
        });
        if (!session || session.userId !== req.user.id) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (error) {
        next(error);
    }
});

router.post('/sessions/:sessionId/messages', async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { role, content } = req.body;

        const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
        if (!session || session.userId !== req.user.id) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const message = await prisma.chatMessage.create({
            data: { sessionId, role, content }
        });

        // Update session updatedAt and potentially title if it's the first message
        const updateData = { updatedAt: new Date() };
        if (session.title === 'New Chat' && role === 'user') {
            updateData.title = content.substring(0, 50);
        }

        await prisma.chatSession.update({
            where: { id: sessionId },
            data: updateData
        });

        res.status(201).json(message);
    } catch (error) {
        next(error);
    }
});

router.delete('/sessions/:sessionId', async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
        if (!session || session.userId !== req.user.id) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await prisma.chatSession.delete({ where: { id: sessionId } });
        res.json({ message: 'Session deleted' });
    } catch (error) {
        next(error);
    }
});

router.post('/chat', processCopilotRequest);
router.post('/', processCopilotRequest);

module.exports = router;
