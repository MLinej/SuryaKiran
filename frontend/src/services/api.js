import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const http = axios.create({
    baseURL: API_BASE,
    timeout: 15000
});

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
        power: inv.latest_power_kw || 0
    };
};

export const api = {
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
            totalPower: `${(totalPowerKw / 1000).toFixed(2)} MW`
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

        const [{ data: alerts }, { data: maintenance }] = await Promise.all([
            http.get("/api/alerts"),
            http.get("/api/maintenance")
        ]);

        const relatedAlerts = alerts
            .filter((a) => a.inverter_id === id)
            .slice(0, 6)
            .map((a) => ({
                date: new Date(a.created_at).toISOString().slice(0, 10),
                alert: a.message,
                status: a.status === "Dismissed" ? "Resolved" : "Open"
            }));

        const relatedMaintenance = maintenance
            .filter((m) => m.inverter_id === id)
            .slice(0, 6)
            .map((m) => ({
                date: new Date(m.scheduled_date || Date.now()).toISOString().slice(0, 10),
                alert: m.issue,
                status: m.status === "Resolved" ? "Resolved" : "Open"
            }));

        return {
            id: inverter.id,
            block: inverter.block,
            riskScore: Number(latestPrediction.risk_score || 0),
            status: severityFromRisk(Number(latestPrediction.risk_score || 0)),
            predictions: [
                { day: "Current", risk: Number(latestPrediction.risk_score || 0) },
                { day: "D+1", risk: Number(latestPrediction.risk_score || 0) },
                { day: "D+2", risk: Number(latestPrediction.risk_score || 0) },
                { day: "D+3", risk: Number(latestPrediction.risk_score || 0) }
            ],
            telemetry: [
                {
                    time: new Date(latestTelemetry.timestamp || Date.now()).toLocaleTimeString(),
                    temp: Number(latestTelemetry.inverter_temp_c || 0),
                    voltage: Number(latestTelemetry.dc_voltage_v || 0),
                    power: Number(latestTelemetry.power_kw || 0)
                }
            ],
            shapFeatures: [
                { name: "Inverter Temp", contribution: Number(latestTelemetry.inverter_temp_c || 0) },
                { name: "AC Voltage", contribution: Number(latestTelemetry.ac_voltage_v || 0) },
                { name: "DC Voltage", contribution: Number(latestTelemetry.dc_voltage_v || 0) },
                { name: "AC Current", contribution: Number(latestTelemetry.ac_current_a || 0) },
                { name: "Power", contribution: Number(latestTelemetry.power_kw || 0) }
            ].sort((a, b) => b.contribution - a.contribution),
            aiExplanation: latestPrediction.explanation || "No prediction explanation available.",
            tickets: [...relatedAlerts, ...relatedMaintenance].slice(0, 8)
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
            status: alert.status
        }));
    },

    async updateAlertStatus(id, status) {
        const { data } = await http.patch(`/api/alerts/${id}/status`, { status });
        return data;
    },

    async getAnalytics(days = 7) {
        const { data } = await http.get("/api/analytics", { params: { days } });
        return data;
    },

    async askCopilot(prompt) {
        const [inverters, alerts, maintenance] = await Promise.all([
            this.getInverters(),
            this.getAlerts(),
            http.get("/api/maintenance")
        ]);

        const highRisk = inverters.filter((i) => i.status === "High Risk").map((i) => i.id);
        const openTickets = maintenance.data.filter((t) => t.status !== "Resolved").length;
        const activeAlerts = alerts.filter((a) => a.status === "Active").length;

        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes("risk")) {
            return highRisk.length
                ? `High risk inverters right now: ${highRisk.join(", ")}. Active alerts: ${activeAlerts}.`
                : "No high risk inverters currently. Continue normal monitoring.";
        }
        if (lowerPrompt.includes("maintenance") || lowerPrompt.includes("ticket")) {
            return `There are ${openTickets} open maintenance tickets. Prioritize inverters with active critical alerts first.`;
        }
        return `Fleet snapshot: ${inverters.length} inverters, ${highRisk.length} high risk, ${activeAlerts} active alerts, ${openTickets} open maintenance tickets.`;
    },

    async createReport(payload) {
        const { data } = await http.post("/api/reports", payload);
        return data;
    }
};
