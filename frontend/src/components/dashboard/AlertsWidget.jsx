import React from 'react';
import { Card } from '../Card';
import { AlertCircle } from 'lucide-react';

export function AlertsWidget({ alerts = { total: 0, critical: 0, warning: 0, info: 0 } }) {
    const hasCritical = alerts.critical > 0;

    return (
        <Card style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", padding: 24, background: "#0f172a", color: "white", border: "1px solid #1e293b", position: "relative", overflow: "hidden" }}>
            {/* Alert Glow */}
            {hasCritical && (
                <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, background: "rgba(239, 68, 68, 0.15)", filter: "blur(30px)", borderRadius: "50%" }} />
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                        Active Alerts
                    </p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: hasCritical ? "#ef4444" : "#f8fafc", margin: 0, lineHeight: 1 }}>
                            {alerts.total}
                        </h2>
                    </div>
                </div>

                {/* Animated Icon */}
                <div style={{
                    background: hasCritical ? "rgba(239, 68, 68, 0.1)" : "rgba(148, 163, 184, 0.1)",
                    border: hasCritical ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 8, padding: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    animation: hasCritical ? "pulse-ring 2s infinite" : "none"
                }}>
                    <AlertCircle size={24} color={hasCritical ? "#ef4444" : "#94a3b8"} />
                </div>
            </div>

            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Mono', monospace" }}>
                    <span style={{ color: "#ef4444" }}>Critical</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{alerts.critical}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Mono', monospace" }}>
                    <span style={{ color: "#f59e0b" }}>Warning</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{alerts.warning}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontFamily: "'DM Mono', monospace" }}>
                    <span style={{ color: "#3b82f6" }}>Info</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{alerts.info}</span>
                </div>
            </div>
        </Card>
    );
}

