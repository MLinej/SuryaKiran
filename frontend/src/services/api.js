import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const http = axios.create({
    baseURL: API_BASE,
    timeout: 300000,  // 5 minutes — ML training on large CSVs takes time
});

http.interceptors.request.use((config) => {
    const token = localStorage.getItem("suryakiran_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

http.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRequest = error.config && error.config.url && error.config.url.includes('/api/auth');

        if (error.response && error.response.status === 401 && !isAuthRequest) {
            localStorage.removeItem("suryakiran_token");
            localStorage.removeItem("suryakiran_user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

const severityFromRisk = (score) => {
    if (score >= 80) return "High Risk";
    if (score >= 50) return "Medium Risk";
    return "Healthy";
};

const relativeTime = (dateString) => {
    if (!dateString) return "N/A";
    const ms = Date.now() - new Date(dateString).getTime();
    const mins = Math.max(1, Math.floor(ms / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};


const parseMaybeJson = (value, fallback = {}) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (_e) {
            return fallback;
        }
    }
    return fallback;
};
const mapInverterRow = (inv) => {
    const riskScore = Number(inv.latest_risk_score || 0);
    return {
        id: inv.id,
        block: inv.block || "Unknown",
        riskScore,
        status: severityFromRisk(riskScore),
        rawStatus: inv.status,
        lastUpdated: relativeTime(inv.last_updated),
        last_updated: inv.last_updated,
        power: inv.latest_power_kw || 0,
    };
};

export const api = {
    async register(payload) {
        const { data } = await http.post("/api/auth/register", payload);
        return data;
    },

    async login(payload) {
        const { data } = await http.post("/api/auth/login", payload);
        return data;
    },

    async submitPrediction(payload) {
        const { data } = await http.post("/predict", payload);
        return data;
    },

    async getFleetSummary() {
        const { data } = await http.get("/api/inverters");
        const inverters = data.map(mapInverterRow);

        const highRisk = inverters.filter((i) => i.status === "High Risk").length;
        const mediumRisk = inverters.filter((i) => i.status === "Medium Risk").length;
        const healthy = inverters.filter((i) => i.status === "Healthy").length;
        const totalPowerKw = inverters.reduce((sum, i) => sum + Number(i.power || 0), 0);

        return {
            totalInverters: inverters.length,
            highRisk,
            mediumRisk,
            healthy,
            totalPower: `${(totalPowerKw / 1000).toFixed(2)} MW`,
        };
    },

    async getInverters(filters = {}) {
        const { data } = await http.get("/api/inverters");
        let rows = data.map(mapInverterRow);
        if (filters.status && filters.status !== "All") {
            rows = rows.filter((r) => r.status === filters.status);
        }
        if (filters.block && filters.block !== "All") {
            rows = rows.filter((r) => r.block === filters.block);
        }
        return rows;
    },

    async getInverterById(id) {
        const { data } = await http.get(`/api/inverters/${id}`);
        const inverter = data.inverter || {};
        const latestTelemetry = data.latest_telemetry || {};
        const latestPrediction = data.latest_prediction || {};
        const parsedModelOutput = parseMaybeJson(latestPrediction.model_output, {});
        const modelOutput = parsedModelOutput.results || parsedModelOutput || {};
        const p3 = modelOutput.prediction_3 || {};
        const topFeatures = Array.isArray(p3.top_features) ? p3.top_features : [];

        const [{ data: alerts }, { data: maintenance }] = await Promise.all([
            http.get("/api/alerts"),
            http.get("/api/maintenance"),
        ]);

        const relatedAlerts = alerts
            .filter((a) => a.inverter_id === id)
            .slice(0, 6)
            .map((a) => ({
                date: new Date(a.created_at).toISOString().slice(0, 10),
                alert: a.message,
                status: a.status === "Dismissed" ? "Resolved" : "Open",
            }));

        const relatedMaintenance = maintenance
            .filter((m) => m.inverter_id === id)
            .slice(0, 6)
            .map((m) => ({
                date: new Date(m.scheduled_date || Date.now()).toISOString().slice(0, 10),
                alert: m.issue,
                status: m.status === "Resolved" ? "Resolved" : "Open",
            }));

        const riskScore = Number(latestPrediction.risk_score || 0);
        const fallbackFeatures = [
            { feature: "inverter_temp_c", importance: Number(latestTelemetry.inverter_temp_c || 0) },
            { feature: "ac_voltage_v", importance: Number(latestTelemetry.ac_voltage_v || 0) },
            { feature: "dc_voltage_v", importance: Number(latestTelemetry.dc_voltage_v || 0) },
            { feature: "ac_current_a", importance: Number(latestTelemetry.ac_current_a || 0) },
            { feature: "power_kw", importance: Number(latestTelemetry.power_kw || 0) },
        ];

        return {
            id: inverter.id,
            block: inverter.block,
            riskScore,
            status: severityFromRisk(riskScore),
            predictions: [
                { day: "Current", risk: riskScore },
                { day: "D+1", risk: riskScore },
                { day: "D+2", risk: riskScore },
                { day: "D+3", risk: riskScore },
            ],
            telemetry: [
                {
                    time: new Date(latestTelemetry.timestamp || Date.now()).toLocaleTimeString(),
                    temp: Number(latestTelemetry.inverter_temp_c || 0),
                    voltage: Number(latestTelemetry.dc_voltage_v || 0),
                    power: Number(latestTelemetry.power_kw || 0),
                },
            ],
            shapFeatures: (topFeatures.length ? topFeatures : fallbackFeatures)
                .map((f) => ({
                    name: String(f.feature || f.name || "").replaceAll("_", " "),
                    contribution: Number(f.importance || f.contribution || 0),
                }))
                .sort((a, b) => b.contribution - a.contribution),
            aiExplanation: latestPrediction.explanation || "No prediction explanation available.",
            etaDisplay: latestPrediction.eta_display || "N/A",
            primaryCause: latestPrediction.primary_cause || "N/A",
            totalLossInr: Number(latestPrediction.total_loss_inr || 0),
            tickets: [...relatedAlerts, ...relatedMaintenance].slice(0, 8),
        };
    },

    async getAlerts() {
        const { data } = await http.get("/api/alerts");
        return data.map((alert) => ({
            id: alert.id,
            severity: alert.severity === "High" ? "Critical" : alert.severity === "Healthy" ? "Info" : alert.severity,
            inverterId: alert.inverter_id,
            type: alert.message.split(":")[0] || "System Alert",
            riskScore: alert.risk_score || 0,
            timestamp: relativeTime(alert.created_at),
            explanation: alert.message,
            status: alert.status,
        }));
    },

    async updateAlertStatus(id, status) {
        const { data } = await http.patch(`/api/alerts/${id}/status`, { status });
        return data;
    },

    async getMaintenance(status = "All") {
        const { data } = await http.get("/api/maintenance", { params: { status } });
        return data;
    },

    async createMaintenance(payload) {
        const { data } = await http.post("/api/maintenance", payload);
        return data;
    },

    async updateMaintenance(id, payload) {
        const { data } = await http.put(`/api/maintenance/${id}`, payload);
        return data;
    },

    async getEnergyImpact() {
        const { data } = await http.get("/api/energy/impact");
        return data;
    },

    async getReports(type = "All") {
        const params = type && type !== "All" ? { type } : {};
        const { data } = await http.get("/api/reports", { params });
        return data;
    },

    async getAnalytics(days = 7) {
        const { data } = await http.get("/api/analytics", { params: { days } });
        return data;
    },

    async askCopilot(prompt, inverterId = null) {
        const { data } = await http.post("/api/chat", {
            message: prompt,
            inverter_id: inverterId || null,
        });
        return data.reply || "I couldn't generate a response. Please try again.";
    },

    async uploadForecast(csvContent) {
        const { data } = await http.post("/api/forecast/upload", { file_content: csvContent });
        return data;
    },

    async getForecastNext(inverterId, currentMinute) {
        const { data } = await http.get("/api/forecast/next", {
            params: { inverter_id: inverterId, current_minute: currentMinute }
        });
        return data;
    },

    async getForecastAll(inverterId) {
        const { data } = await http.get("/api/forecast/all", {
            params: { inverter_id: inverterId }
        });

        if (Array.isArray(data.forecast)) {
            return {
                inverter_id: data.inverter_id || inverterId,
                power: data.forecast.map((p) => Number(p.predicted_power_kw || 0)),
                risk: data.forecast.map((p) => Number(p.risk_score || 0)),
                timestamps: data.forecast.map((p) => p.timestamp || null),
                source: data.source || "unknown",
            };
        }

        return {
            inverter_id: data.inverter_id || inverterId,
            power: Array.isArray(data.power) ? data.power.map(Number) : [],
            risk: Array.isArray(data.risk) ? data.risk.map(Number) : [],
            timestamps: Array.isArray(data.timestamps) ? data.timestamps : [],
            source: data.source || "unknown",
        };
    },

    async createReport(payload) {
        const { data } = await http.post("/api/reports", payload);
        return data;
    },
};



