import React from 'react';
import { Card } from '@/components/Card';
import { Activity } from 'lucide-react';

export function AIInsightsFeed({ insights = [] }) {

    const getSeverityColor = (sev) => {
        switch (sev) {
            case 'high': return '#ef4444'; // Red
            case 'medium': return '#f59e0b'; // Yellow
            case 'low': return '#22c55e'; // Green
            default: return '#3b82f6'; // Blue
        }
    };

    return (
        <Card style={{ flex: 1, display: "flex", flexDirection: "column", background: "#ffffff", padding: 0 }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
                <Activity size={18} color="#0f172a" />
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>AI Insights Feed</h3>
            </div>

            {/* Feed List */}
            <div style={{ overflowY: "auto", flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                {insights.map((insight, index) => (
                    <div key={insight.id} style={{ display: "flex", gap: 16 }}>
                        {/* Timeline dot */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: getSeverityColor(insight.severity), marginTop: 6, boxShadow: `0 0 8px ${getSeverityColor(insight.severity)}50` }} />
                            {index !== insights.length - 1 && <div style={{ width: 2, flex: 1, background: "#f1f5f9", marginTop: 4 }} />}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, paddingBottom: index === insights.length - 1 ? 0 : 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                                    {insight.text} — <span style={{ color: "#64748b" }}>{insight.inverter}</span>
                                </span>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#94a3b8" }}>
                                    {insight.time}
                                </span>
                            </div>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                                AI Model detected abnormal behavior deviating from nominal operating parameters. Review recommended.
                            </p>
                        </div>
                    </div>
                ))}
                {insights.length === 0 && (
                    <div style={{ color: "#94a3b8", fontSize: 13 }}>No live insights available.</div>
                )}
            </div>
        </Card>
    );
}
