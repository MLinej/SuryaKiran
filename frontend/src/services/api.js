// src/services/api.js
import { fleetSummary, inverterDataList, inverterDetailMock, mockAlerts, mockAnalyticsData } from "./mockData";

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    getFleetSummary: async () => {
        await delay(300);
        return fleetSummary;
    },

    getInverters: async (filters = {}) => {
        await delay(400);
        let data = [...inverterDataList];
        if (filters.status && filters.status !== "All") {
            data = data.filter(inv => inv.status === filters.status);
        }
        if (filters.block && filters.block !== "All") {
            data = data.filter(inv => inv.block === filters.block);
        }
        return data;
    },

    getInverterById: async (id) => {
        await delay(500);
        return inverterDetailMock(id);
    },

    getAlerts: async () => {
        await delay(300);
        return [...mockAlerts];
    },

    getAnalytics: async () => {
        await delay(600);
        return mockAnalyticsData;
    },

    predictRisk: async (telemetryData) => {
        await delay(1000);
        return { riskScore: Math.floor(Math.random() * 100), prediction: "Based on telemetry, risk is estimated." };
    },

    askCopilot: async (prompt) => {
        await delay(1500);
        // Rough mock responses based on prompt keywords
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes("risk") || lowerPrompt.includes("flagged")) {
            return "INV-204 and INV-312 are currently flagged as High Risk. The primary driver for INV-204 is a rapidly increasing IGBT temperature likely due to a failing cooling fan. INV-312 is showing a severe DC voltage drop.";
        }
        if (lowerPrompt.includes("maintenance") || lowerPrompt.includes("schedule")) {
            return "I recommend scheduling immediate inspection of the cooling fan assembly for INV-204 today. Additionally, INV-418 is due for routine filter cleaning within the next 5 days.";
        }
        if (lowerPrompt.includes("hello") || lowerPrompt.includes("hi")) {
            return "Hello! I'm the SuryaKiran AI Copilot. I'm monitoring your 124 inverters. How can I help you optimize your fleet today?";
        }
        return "Based on the current fleet telemetry, performance is stable, but I've noted a 4% performance ratio anomaly in Block B. Would you like me to generate a detailed diagnostic report for Block B?";
    }
};
