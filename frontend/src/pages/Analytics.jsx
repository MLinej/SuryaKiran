// src/pages/Analytics.jsx
import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Card } from "@/components/Card";
import { Calendar, Download, TrendingDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const res = await api.getAnalytics(days);
            setData(res);
            setLoading(false);
        }
        loadData();
    }, [days]);

    const exportCsv = () => {
        if (!data) return;
        const rows = [
            ["date", "actual_pr", "predicted_pr"],
            ...data.performanceRatio.map((r) => [r.date, r.actual, r.predicted])
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analytics_${days}d.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>Crunching historical data...</div>;

    return (
        <div style={{ animation: "fadeSlideIn 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Analytics & Reports</h1>
                    <p style={{ color: "#64748b", fontSize: 15 }}>Historical performance, loss estimates, and model accuracy.</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => setDays((prev) => prev === 7 ? 30 : 7)} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12,
                        background: "white", border: "1px solid #e2e8f0", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                        color: "#475569", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                    }}>
                        <Calendar size={16} /> Last {days} Days
                    </button>
                    <button onClick={exportCsv} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12,
                        background: "#0f172a", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                        color: "white", cursor: "pointer", boxShadow: "0 4px 12px rgba(15,23,42,0.2)"
                    }}>
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>

                {/* PR Trend */}
                <Card style={{ display: "flex", flexDirection: "column", height: 400 }}>
                    <div style={{ marginBottom: 24 }}>
                        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Performance Ratio (PR) Trend</h3>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748b" }}>Actual vs Predicted generation efficiency.</p>
                    </div>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.performanceRatio} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} dy={10} />
                                <YAxis domain={[65, 90]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} dx={-10} />
                                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }} />
                                <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                                <Area type="monotone" dataKey="predicted" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredicted)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", gap: 20, marginTop: 16, justifyContent: "center", fontSize: 13, color: "#475569" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 4, borderRadius: 2, background: "#3b82f6" }} /> Actual PR</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 4, borderRadius: 2, background: "#94a3b8" }} /> Expected PR (Model Baseline)</div>
                    </div>
                </Card>

                {/* Energy Loss */}
                <Card style={{ display: "flex", flexDirection: "column", height: 400, background: "linear-gradient(135deg, #fff 0%, #fef2f2 100%)", borderColor: "#fca5a5" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                            <TrendingDown size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "#7f1d1d" }}>Estimated Loss</h3>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#b91c1c", textTransform: "uppercase" }}>Last 7 Days</p>
                        </div>
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800, color: "#ef4444", marginBottom: 32, lineHeight: 1 }}>
                        {data.energyLoss.totalEstimate}
                    </div>
                    <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#991b1b", marginBottom: 16 }}>Loss Breakdown by Block</h4>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={data.energyLoss.byBlock} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#991b1b" }} width={60} />
                                <Tooltip cursor={{ fill: '#fee2e2' }} contentStyle={{ borderRadius: 12, border: "none" }} />
                                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16}>
                                    {data.energyLoss.byBlock.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? "#ef4444" : index === 1 ? "#f87171" : "#fca5a5"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

            </div>
        </div>
    );
}
