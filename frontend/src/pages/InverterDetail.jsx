// src/pages/InverterDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Table, TableRow } from "../components/Table";
import { ArrowLeft, Zap, Wrench, MessageSquare, AlertTriangle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

import axios from 'axios';

export default function InverterDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [maintLoading, setMaintLoading] = useState(false);
    const [maintSuccess, setMaintSuccess] = useState(false);
    const [copilotLoading, setCopilotLoading] = useState(false);

    const handleMaintenance = async () => {
        setMaintLoading(true);
        try {
            await axios.post('http://localhost:5000/api/maintenance', {
                inverter_id: data.id,
                issue: 'User Triggered Inspection Request',
                scheduled_date: new Date().toISOString()
            });
            setMaintSuccess(true);
        } catch (err) {
            console.error("Failed to add maintenance", err);
        } finally {
            setMaintLoading(false);
        }
    };

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const res = await api.getInverterById(id);
            setData(res);
            setLoading(false);
        }
        loadData();
    }, [id]);

    if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>Loading {id} data...</div>;
    if (!data) return <div>Inverter not found</div>;

    const handleCopilot = async () => {
        setCopilotLoading(true);
        try {
            const response = await api.askCopilot(`Provide details for inverter ${id}`);
            window.alert(response);
        } finally {
            setCopilotLoading(false);
        }
    };

    return (
        <div style={{ animation: "fadeSlideIn 0.4s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <Link to="/dashboard" style={{
                    width: 40, height: 40, borderRadius: "50%", background: "white",
                    border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#64748b", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}>
                    <ArrowLeft size={18} />
                </Link>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{data.id}</h1>
                        <Badge variant={data.status}>{data.status}</Badge>
                    </div>
                    <p style={{ color: "#64748b", fontSize: 14 }}>{data.block} • Last updated just now</p>
                </div>
                <Button variant="outline" icon={<Wrench size={16} />} onClick={handleMaintenance} disabled={maintLoading || maintSuccess}>
                    {maintLoading ? 'Generating...' : maintSuccess ? 'Ticket Created' : 'Generate Maintenance Ticket'}
                </Button>
            </div>

            {/* Top Row: AI Insight & Risk Gauge */}
            <div style={{ display: "flex", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>

                <Card style={{ flex: "1 1 500px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "white", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(245,158,11,0.1)" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                        <MessageSquare size={20} color="#f59e0b" />
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#fcd34d", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>AI Generated Insight</span>
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.8, color: "#cbd5e1" }}>
                        {data.aiExplanation}
                    </p>
                    <div style={{ marginTop: 20 }}>
                        <Button onClick={handleCopilot} disabled={copilotLoading} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
                            {copilotLoading ? "Asking..." : "Ask Copilot for more details →"}
                        </Button>
                    </div>
                </Card>

                <Card style={{ flex: "0 0 320px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Current Risk Score</h3>
                    <div style={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 16 }}>
                        {/* Fake Gauge implementation for UI */}
                        <svg width="160" height="160" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                            <circle cx="80" cy="80" r="70" fill="none" stroke={data.riskScore > 80 ? "#ef4444" : data.riskScore > 50 ? "#f59e0b" : "#22c55e"} strokeWidth="12" strokeDasharray={`${(data.riskScore / 100) * 440} 440`} strokeLinecap="round" transform="rotate(-90 80 80)" />
                        </svg>
                        <div style={{ position: "absolute", textAlign: "center" }}>
                            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{data.riskScore}</div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#94a3b8" }}>/ 100</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Middle Row: Trend & SHAP */}
            <div style={{ display: "flex", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>

                <Card style={{ flex: "2 1 500px", height: 350, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 24 }}>7-Day Predictive Risk Trend</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.predictions} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} domain={[0, 100]} />
                            <RechartsTooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }} />
                            <Line type="monotone" dataKey="risk" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <Card style={{ flex: "1 1 300px", height: 350, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Feature Importance (SHAP)</h3>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#64748b", marginBottom: 24 }}>Top factors contributing to risk score.</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={data.shapFeatures} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569" }} width={120} />
                            <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: "none" }} />
                            <Bar dataKey="contribution" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16}>
                                {data.shapFeatures.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? "#ef4444" : index === 1 ? "#f59e0b" : "#8b5cf6"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Bottom Row: Telemetry & Alarms */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>

                <Card style={{ flex: "1 1 400px", display: "flex", flexDirection: "column" }}>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Live Telemetry (Today)</h3>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.telemetry} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                                <RechartsTooltip />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
                                <Line yAxisId="left" type="monotone" name="DC Voltage (V)" dataKey="voltage" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                <Line yAxisId="right" type="monotone" name="Temperature (°C)" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card style={{ flex: "1 1 400px" }} noPadding>
                    <div style={{ padding: "24px 32px", borderBottom: "1px solid #e2e8f0" }}>
                        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700 }}>Recent Tickets / Alarms</h3>
                    </div>
                    <Table headers={["Date", "Alert Type", "Status"]}>
                        {data.tickets.map((t, i) => (
                            <TableRow key={i} isLast={i === data.tickets.length - 1}>
                                <div style={{ color: "#64748b" }}>{t.date}</div>
                                <div style={{ fontWeight: 600, color: "#0f172a" }}>{t.alert}</div>
                                <div><Badge variant={t.status === "Open" ? "warning" : "success"}>{t.status}</Badge></div>
                            </TableRow>
                        ))}
                        {data.tickets.length === 0 && (
                            <TableRow>
                                <td colSpan={3} style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>No recent history</td>
                            </TableRow>
                        )}
                    </Table>
                </Card>
            </div>
        </div>
    );
}
