import React, { useState } from 'react';
import { Card } from '@/components/Card';
import { useNavigate } from 'react-router-dom';
import { Map } from 'lucide-react';

export function SolarPlantMap({ inverters = [] }) {
    const navigate = useNavigate();
    const [hoveredInv, setHoveredInv] = useState(null);

    // Group inverters by Block securely
    const blocks = inverters.reduce((acc, inv) => {
        if (!acc[inv.block]) acc[inv.block] = [];
        acc[inv.block].push(inv);
        return acc;
    }, {});

    // Sort blocks alphabetically
    const sortedBlockKeys = Object.keys(blocks).sort();

    const getStatusColor = (status) => {
        if (status === "High Risk") return "#ef4444";
        if (status === "Medium Risk") return "#f59e0b";
        return "#22c55e";
    };

    return (
        <Card style={{ flex: 1, display: "flex", flexDirection: "column", background: "#ffffff", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Map size={18} color="#0f172a" />
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>Solar Plant Map</h3>
                </div>

                {/* Legend */}
                <div style={{ display: "flex", gap: 16, fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#64748b" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, background: "#22c55e", borderRadius: 2 }} /> Healthy
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, background: "#f59e0b", borderRadius: 2 }} /> Warning
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, background: "#ef4444", borderRadius: 2 }} /> Critical
                    </div>
                </div>
            </div>

            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", gap: 32, overflowY: "auto", position: "relative" }}>
                {sortedBlockKeys.length === 0 && (
                    <div style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", paddingTop: 24 }}>
                        No inverters added yet. Click Add Inverter to begin monitoring.
                    </div>
                )}

                {sortedBlockKeys.map(blockName => (
                    <div key={blockName}>
                        <h4 style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                            {blockName}
                        </h4>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {blocks[blockName].map(inv => (
                                <div
                                    key={inv.id}
                                    onClick={() => navigate(`/inverter/${inv.id}`)}
                                    onMouseEnter={() => setHoveredInv(inv)}
                                    onMouseLeave={() => setHoveredInv(null)}
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 6,
                                        background: getStatusColor(inv.status),
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        position: "relative",
                                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                        transform: hoveredInv?.id === inv.id ? "scale(1.1) translateY(-2px)" : "none",
                                        boxShadow: hoveredInv?.id === inv.id ? `0 8px 16px ${getStatusColor(inv.status)}40` : "none",
                                        border: "1px solid rgba(0,0,0,0.1)"
                                    }}
                                >
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "white", fontWeight: 700 }}>
                                        {inv.id.replace("INV-", "")}
                                    </span>

                                    {/* Tooltip rendering logic handled below for simpler positioning */}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Floating Tooltip outside block relative flow so it doesnt clip */}
                {hoveredInv && (
                    <div style={{
                        position: "absolute",
                        top: 24, // Fixed near top, or could be dynamic
                        right: 24,
                        background: "#0f172a",
                        color: "white",
                        padding: "12px 16px",
                        borderRadius: 8,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                        zIndex: 10,
                        pointerEvents: "none",
                        width: 180,
                        animation: "fadeSlideIn 0.2s ease"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <strong style={{ fontFamily: "'DM Mono', monospace", fontSize: 14 }}>{hoveredInv.id}</strong>
                            <span style={{ fontSize: 12, color: getStatusColor(hoveredInv.status), fontWeight: 700 }}>{hoveredInv.status}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 4 }}>Risk Score: <strong style={{ color: "white" }}>{hoveredInv.riskScore}/100</strong></div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>Updated {hoveredInv.lastUpdated}</div>
                    </div>
                )}

            </div>
        </Card>
    );
}




