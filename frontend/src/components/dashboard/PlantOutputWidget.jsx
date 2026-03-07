import React from 'react';
import { Card } from '@/components/Card';
import { Zap } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export function PlantOutputWidget({ output = "0 MW", trendData = [] }) {
    return (
        <Card style={{ flex: "1 1 Minimum", display: "flex", flexDirection: "column", background: "#0f172a", color: "white", padding: 24, position: "relative", overflow: "hidden" }}>
            {/* Background Glow */}
            <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: "rgba(245,158,11,0.15)", filter: "blur(30px)", borderRadius: "50%" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                        Plant Output
                    </p>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: "#f8fafc", margin: 0, lineHeight: 1 }}>
                        {output}
                    </h2>
                </div>

                {/* Animated Icon */}
                <div style={{
                    background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 8, padding: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    animation: "pulse-ring 2s infinite"
                }}>
                    <Zap size={24} color="#f59e0b" />
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 60, marginTop: "auto" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData.length ? trendData : [{ time: 'Now', power: 0 }]}>
                        <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                        <Line type="monotone" dataKey="power" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
