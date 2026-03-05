// src/services/mockData.js

export const fleetSummary = {
    totalInverters: 124,
    highRisk: 4,
    mediumRisk: 12,
    healthy: 108,
    totalPower: "42.5 MW",
};

export const inverterDataList = [
    { id: "INV-204", block: "Block B", riskScore: 88, status: "High Risk", lastUpdated: "2 mins ago", temp: 72, voltage: 380, power: 340 },
    { id: "INV-112", block: "Block A", riskScore: 65, status: "Medium Risk", lastUpdated: "5 mins ago", temp: 68, voltage: 400, power: 410 },
    { id: "INV-305", block: "Block C", riskScore: 82, status: "High Risk", lastUpdated: "1 min ago", temp: 75, voltage: 370, power: 310 },
    { id: "INV-108", block: "Block A", riskScore: 12, status: "Healthy", lastUpdated: "8 mins ago", temp: 45, voltage: 415, power: 480 },
    { id: "INV-401", block: "Block D", riskScore: 8, status: "Healthy", lastUpdated: "3 mins ago", temp: 42, voltage: 418, power: 490 },
    { id: "INV-209", block: "Block B", riskScore: 55, status: "Medium Risk", lastUpdated: "4 mins ago", temp: 62, voltage: 395, power: 430 },
    { id: "INV-312", block: "Block C", riskScore: 91, status: "High Risk", lastUpdated: "just now", temp: 78, voltage: 360, power: 290 },
    { id: "INV-115", block: "Block A", riskScore: 15, status: "Healthy", lastUpdated: "6 mins ago", temp: 44, voltage: 416, power: 485 },
    { id: "INV-418", block: "Block D", riskScore: 48, status: "Medium Risk", lastUpdated: "2 mins ago", temp: 58, voltage: 405, power: 440 },
    { id: "INV-221", block: "Block B", riskScore: 18, status: "Healthy", lastUpdated: "7 mins ago", temp: 46, voltage: 414, power: 475 },
];

export const inverterDetailMock = (id) => ({
    id: id || "INV-204",
    block: id?.includes("1") ? "Block A" : id?.includes("3") ? "Block C" : id?.includes("4") ? "Block D" : "Block B",
    riskScore: id === "INV-204" ? 88 : id === "INV-312" ? 91 : id === "INV-112" ? 65 : 15,
    status: id === "INV-204" || id === "INV-312" ? "High Risk" : id === "INV-112" ? "Medium Risk" : "Healthy",
    predictions: [
        { day: "Day 1", risk: 20 }, { day: "Day 2", risk: 25 }, { day: "Day 3", risk: 35 },
        { day: "Day 4", risk: 50 }, { day: "Day 5", risk: 68 }, { day: "Day 6", risk: 82 },
        { day: "Day 7", risk: 88 },
    ],
    telemetry: [
        { time: "08:00", temp: 45, voltage: 415, power: 450 },
        { time: "10:00", temp: 55, voltage: 410, power: 480 },
        { time: "12:00", temp: 68, voltage: 390, power: 410 },
        { time: "14:00", temp: 72, voltage: 380, power: 340 },
        { time: "16:00", temp: 70, voltage: 385, power: 350 },
    ],
    shapFeatures: [
        { name: "IGBT Temp", contribution: 45 },
        { name: "DC Voltage Drop", contribution: 30 },
        { name: "Fan Speed Anomaly", contribution: 15 },
        { name: "Output Current Var", contribution: 8 },
        { name: "Grid Frequency", contribution: 2 },
    ],
    aiExplanation: "The GenAI model has detected a strong correlation between rapidly increasing IGBT temperatures and a sustained drop in DC string voltage over the past 4 hours. This specific pattern strongly indicates a failing cooling fan leading to thermal throttling. Recommend inspecting cooling fan array #2 immediately to prevent complete thermal shutdown.",
    tickets: [
        { date: "2026-03-05", alert: "Thermal Throttling Detected", status: "Open" },
        { date: "2026-02-18", alert: "Grid Overvoltage", status: "Resolved" }
    ]
});

export const mockAlerts = [
    { id: 1, severity: "Critical", inverterId: "INV-312", type: "Thermal Runaway Imminent", riskScore: 91, timestamp: "2 mins ago", explanation: "IGBT temperature exceeding 85°C with power output dropping rapidly." },
    { id: 2, severity: "Critical", inverterId: "INV-204", type: "Cooling System Degradation", riskScore: 88, timestamp: "15 mins ago", explanation: "Fan speed anomalous compared to ambient temperature and load." },
    { id: 3, severity: "Warning", inverterId: "INV-112", type: "String Current Mismatch", riskScore: 65, timestamp: "1 hour ago", explanation: "DC current on String 4 is 15% lower than fleet average for current irradiance." },
    { id: 4, severity: "Warning", inverterId: "INV-209", type: "Communication Timeout", riskScore: 55, timestamp: "3 hours ago", explanation: "Intermittent telemetry drops detected from datalogger." },
    { id: 5, severity: "Info", inverterId: "INV-418", type: "Scheduled Maintenance Due", riskScore: 48, timestamp: "1 day ago", explanation: "Routine filter cleaning recommended within 5 days." },
];

export const mockAnalyticsData = {
    performanceRatio: [
        { date: "Mar 1", actual: 82, predicted: 84 },
        { date: "Mar 2", actual: 80, predicted: 83 },
        { date: "Mar 3", actual: 79, predicted: 82 },
        { date: "Mar 4", actual: 75, predicted: 81 },
        { date: "Mar 5", actual: 71, predicted: 80 },
    ],
    energyLoss: {
        totalEstimate: "14.2 MWh",
        byBlock: [
            { name: "Block B", value: 8.5 },
            { name: "Block C", value: 4.2 },
            { name: "Block D", value: 1.0 },
            { name: "Block A", value: 0.5 },
        ]
    }
};
