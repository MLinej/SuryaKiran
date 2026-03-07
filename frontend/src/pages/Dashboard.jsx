import { useState, useEffect } from "react";
import { api } from "@/services/api";

import { PlantOutputWidget } from "@/components/dashboard/PlantOutputWidget";
import { RiskGaugeWidget } from "@/components/dashboard/RiskGaugeWidget";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { InverterPredictionGrid } from "@/components/dashboard/InverterPredictionGrid";
import { CSVUploadModal } from "@/components/dashboard/CSVUploadModal";
import { AIInsightsFeed } from "@/components/dashboard/AIInsightsFeed";

import { InverterTable } from "@/components/dashboard/InverterTable";

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [inverters, setInverters] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const handleUploadSuccess = async (csvContent) => {
        try {
            await api.uploadForecast(csvContent);
            // Refresh dashboard data or trigger forecast-specific fetch
            const [sumData, invData] = await Promise.all([
                api.getFleetSummary(),
                api.getInverters()
            ]);
            setSummary(sumData);
            setInverters(invData);
            alert("Forecast data uploaded and processed successfully!");
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to process forecast data on the server.");
        }
    };


    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [sumData, invData, alertsData] = await Promise.all([
                api.getFleetSummary(),
                api.getInverters(),
                api.getAlerts()
            ]);
            setSummary(sumData);
            setInverters(invData);
            setAlerts(alertsData);
            setLoading(false);
        }
        fetchData();
    }, []);

    // Derived stats for UI
    // Mock risk level: a simple calc based on high risk inverters vs total, scaled for visual effect.
    // In reality, this would come from a plant-level ML score endpoint.
    const riskLevel = summary && summary.totalInverters > 0 ? Math.min(100, Math.round(((summary.highRisk * 15 + summary.mediumRisk * 5) / summary.totalInverters) * 100)) : 0;

    const alertStats = {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'Critical').length,
        warning: alerts.filter(a => a.severity === 'Warning').length,
        info: alerts.filter(a => a.severity === 'Info').length
    };
    const insights = alerts.slice(0, 6).map((a) => ({
        id: a.id,
        text: a.type,
        inverter: a.inverterId,
        time: a.timestamp,
        severity: a.severity.toLowerCase() === 'critical' ? 'high' : a.severity.toLowerCase() === 'warning' ? 'medium' : 'low'
    }));
    const outputTrend = inverters.slice(0, 12).map((inv, idx) => ({
        time: `T${idx + 1}`,
        power: Number(inv.power || 0)
    }));

    return (
        <div style={{ animation: "fadeSlideIn 0.4s ease", paddingBottom: 40 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Operations Control Room</h1>
                    <p style={{ color: "#64748b", fontSize: 14 }}>Real-time telemetry and predictive ML assessments.</p>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>Loading telemetry data...</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                    {/* TOP SECTION: SYSTEM OVERVIEW */}
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", minHeight: 180 }}>
                        <PlantOutputWidget output={summary?.totalPower} trendData={outputTrend} />
                        <RiskGaugeWidget riskLevel={riskLevel} />
                        <AlertsWidget alerts={alertStats} />
                    </div>

                    {/* CENTER SECTION: INVERTER PREDICTION GRID (REPLACES SOLAR MAP) */}
                    <div style={{ display: "flex" }}>
                        <InverterPredictionGrid
                            inverters={inverters}
                            onUploadClick={() => setIsUploadModalOpen(true)}
                        />
                    </div>

                    <CSVUploadModal
                        isOpen={isUploadModalOpen}
                        onClose={() => setIsUploadModalOpen(false)}
                        onUploadSuccess={handleUploadSuccess}
                    />


                    {/* BOTTOM SECTION: OPERATIONS PANEL */}
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", minHeight: 500 }}>
                        <div style={{ flex: "1 1 350px", display: "flex" }}>
                            <AIInsightsFeed insights={insights} />
                        </div>
                        <div style={{ flex: "2 1 600px", display: "flex", overflow: "hidden" }}>
                            <InverterTable inverters={inverters} />
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

