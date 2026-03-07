import React from 'react';
import { Card } from '@/components/Card';

export function RiskGaugeWidget({ riskLevel = 31 }) {

    // Determine color based on risk level
    const getColor = (level) => {
        if (level < 30) return "#22c55e"; // Green
        if (level < 60) return "#f59e0b"; // Yellow
        return "#ef4444"; // Red
    };

    const color = getColor(riskLevel);
    const strokeDasharray = `${(riskLevel / 100) * 283} 283`; // Circumference of r=45 is ~283

    return (
        <Card style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "#1e293b", color: "white", border: "1px solid #334155" }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
                Risk Gauge
            </p>

            <div style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Outer Ring / Bezel */}
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "4px solid #0f172a", boxShadow: "inset 0 4px 10px rgba(0,0,0,0.5), 0 2px 4px rgba(255,255,255,0.05)" }} />

                {/* SVG Dial */}
                <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#0f172a" strokeWidth="8" />
                    <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                        style={{ transition: "stroke-dasharray 1s ease-out, stroke 1s ease-out" }}
                    />
                </svg>

                {/* Inner Readout */}
                <div style={{ position: "absolute", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0f172a", width: 80, height: 80, borderRadius: "50%", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>
                        {riskLevel}<span style={{ fontSize: 14 }}>%</span>
                    </span>
                </div>
            </div>
        </Card>
    );
}
