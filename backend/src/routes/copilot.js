const express = require('express');
const axios = require('axios');
const prisma = require('../config/database');

const router = express.Router();

// MINIFIED SCHEMA FOR AI PROMPT
const PRISMA_SCHEMA_CONTEXT = `
Model Inverters { id (String, PK), block (String), status (String), last_updated (DateTime) }
Model Telemetry { id, inverter_id (FK), power_kw (Float), inverter_temp_c (Float), ac_voltage_v (Float), dc_voltage_v (Float), timestamp (DateTime) }
Model Alerts { id, inverter_id (FK), severity (String: 'Critical'|'High'|'Warning'|'Info'), message (String), status (String: 'Active'|'Resolved'), created_at (DateTime) }
Model Maintenance { id, inverter_id (FK), issue (String), status (String: 'Pending'|'In Progress'|'Resolved'), scheduled_date (DateTime) }
`;

async function callLLM(prompt, isJSON = false) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error(`Gemini API key missing`);

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
        const { data } = await axios.post(url, {
            contents: [{ parts: [{ text: isJSON ? `${prompt}\nReturn ONLY valid JSON.` : prompt }] }]
        }, { timeout: 30000 });

        const text = data.candidates[0].content.parts[0].text;
        return isJSON ? text.replace(/```json|```/g, '').trim() : text;
    } catch (error) {
        console.error('[Copilot] Gemini API Error:', error.response?.data || error.message);
        throw error;
    }
}

async function generateRetrievalPlan(question) {
    const prompt = `
    Task: Create a database retrieval plan for a solar plant monitoring app.
    Schema: ${PRISMA_SCHEMA_CONTEXT}
    
    User Question: "${question}"
    
    Return a JSON object with this structure:
    {
      "explanation": "why these tables are needed",
      "queries": [
        { "model": "Alerts"|"Telemetry"|"Maintenance"|"Inverters", "action": "findMany"|"findFirst", "args": { "where": { ... }, "take": 5, "orderBy": { "created_at": "desc" } } }
      ]
    }
    Rules:
    - Current Date Context: ${new Date().toISOString()}
    - Use 'inverter_id' filters if the user mentions a specific inverter (e.g., INV-01).
    - Limit 'take' max 10.
    - Only use READ actions.
    - For date filters, use placeholders: "DATETIME_NOW", "DATETIME_TODAY_START", "DATETIME_SEVEN_DAYS_AGO", "DATETIME_THIRTY_DAYS_AGO".
    `;
    const result = await callLLM(prompt, true);
    return JSON.parse(result);
}

function resolveDatePlaceholders(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key in obj) {
        const val = obj[key];
        if (typeof val === 'string' && val.startsWith('DATETIME_')) {
            if (val === 'DATETIME_NOW') obj[key] = new Date();
            else if (val === 'DATETIME_TODAY_START') obj[key] = new Date(new Date().setHours(0, 0, 0, 0));
            else if (val === 'DATETIME_SEVEN_DAYS_AGO') obj[key] = new Date(Date.now() - 7 * 86400000);
            else if (val === 'DATETIME_THIRTY_DAYS_AGO') obj[key] = new Date(Date.now() - 30 * 86400000);
        } else if (typeof val === 'object') {
            resolveDatePlaceholders(val);
        }
    }
    return obj;
}

async function executeRetrievalPlan(plan) {
    const results = {};
    for (const q of (plan.queries || [])) {
        if (!['Inverters', 'Telemetry', 'Alerts', 'Maintenance'].includes(q.model)) continue;
        if (!['findMany', 'findFirst', 'findUnique'].includes(q.action)) continue;

        try {
            const table = q.model.toLowerCase();
            const resolvedArgs = resolveDatePlaceholders(JSON.parse(JSON.stringify(q.args || {})));
            const data = await prisma[table][q.action](resolvedArgs);
            results[q.model] = data;
        } catch (err) {
            console.error(`[Copilot] Query failed for ${q.model}:`, err.message);
        }
    }
    return results;
}

const localFallback = (question) => ({
    answer: "I'm currently having trouble connecting to my advanced reasoning engine. However, looking at your question, I recommend checking the Inverter Prediction Grid and Active Alerts panel for any immediate issues.",
    confidence: 0.5,
    provider: 'fallback'
});

async function processCopilotRequest(req, res, next) {
    try {
        const question = String(req.body?.question || req.body?.message || '').trim();
        if (!question) return res.status(400).json({ error: 'question is required' });

        console.log(`[Copilot] Pass 1: Generating Retrieval Plan for: "${question}"`);
        let plan;
        try {
            plan = await generateRetrievalPlan(question);
        } catch (err) {
            console.error('[Copilot] Plan generation failed:', err.message);
            return res.json(localFallback(question));
        }

        console.log(`[Copilot] Pass 2: Executing Data Retrieval...`);
        const contextData = await executeRetrievalPlan(plan);

        console.log(`[Copilot] Pass 3: Crafting Final Answer...`);
        const finalPrompt = `
        You are SuryaKiran AI Copilot. Use the following data to answer the operator's question.
        
        Context Data: ${JSON.stringify(contextData)}
        
        Question: "${question}"
        
        Instructions:
        - Be professional, concise, and easy to read.
        - **FOR INVERTER LISTS**: Wrap the raw data in a <ui_table> tag as a JSON array. 
          Format: <ui_table>[{"id": "...", "risk": 100, "issue": "...", "impact": "..."}]</ui_table>
        - Use bold text for critical warnings outside the table.
        - If the data is empty, explain that no matching records were found.
        - Suggest clear "Next Steps".
        `;

        const answer = await callLLM(finalPrompt);

        return res.json({
            answer,
            confidence: 0.9,
            provider: 'gemini',
            question,
            plan: plan.explanation,
            retrieved_models: Object.keys(contextData)
        });
    } catch (error) {
        console.error('[Copilot] Request error:', error.response?.data || error.message);
        if (error.response?.status === 429) {
            return res.status(429).json({ error: 'AI limit reached. Using local analysis...', ...localFallback(req.body?.question) });
        }
        return next(error);
    }
}

router.post('/chat', processCopilotRequest);
router.post('/', processCopilotRequest);

module.exports = router;
