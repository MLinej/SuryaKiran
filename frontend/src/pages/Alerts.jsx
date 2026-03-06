// src/pages/Alerts.jsx
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Badge } from "../components/Badge";
import { Table, TableRow } from "../components/Table";
import { Button } from "../components/Button";
import { Filter, ThumbsUp, XCircle, ChevronRight } from "lucide-react";

export default function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterSeverity, setFilterSeverity] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");

    async function loadData() {
        setLoading(true);
        const res = await api.getAlerts();
        setAlerts(res);
        setLoading(false);
    }

    useEffect(() => {
        loadData();
    }, []);

    const filteredAlerts = alerts.filter((a) => {
        if (filterSeverity !== "All" && a.severity !== filterSeverity) return false;
        if (filterStatus !== "All" && a.status !== filterStatus) return false;
        return true;
    });

    const handleUpdateStatus = async (id, status) => {
        await api.updateAlertStatus(id, status);
        await loadData();
    };

    return (
        <div style={{ animation: "fadeSlideIn 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Alert Center</h1>
                    <p style={{ color: "#64748b", fontSize: 15 }}>Severity-tiered alarm feed with GenAI root cause analysis.</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <select
                        value={filterSeverity}
                        onChange={e => setFilterSeverity(e.target.value)}
                        style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontFamily: "'DM Sans', sans-serif" }}
                    >
                        <option value="All">All Severities</option>
                        <option value="Critical">Critical</option>
                        <option value="Warning">Warning</option>
                        <option value="Info">Info</option>
                    </select>
                    <button onClick={() => setFilterStatus((prev) => prev === "All" ? "Active" : prev === "Active" ? "Acknowledged" : prev === "Acknowledged" ? "Dismissed" : "All")} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12,
                        background: "white", border: "1px solid #e2e8f0", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                        color: "#475569", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                    }}>
                        <Filter size={16} /> Status: {filterStatus}
                    </button>
                </div>
            </div>

            <div style={{ background: "white", borderRadius: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>Loading alerts...</div>
                ) : (
                    <Table headers={["Severity", "Inverter", "System Alert", "AI Analysis", "Risk", "Actions"]}>
                        {filteredAlerts.map((alert, i) => (
                            <TableRow key={alert.id} isLast={i === filteredAlerts.length - 1}>
                                <div><Badge variant={alert.severity}>{alert.severity}</Badge></div>
                                <div style={{ fontWeight: 600, color: "#0f172a" }}>{alert.inverterId}</div>
                                <div>
                                    <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>{alert.type}</div>
                                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{alert.timestamp}</div>
                                </div>
                                <div style={{ maxWidth: 280, fontSize: 13, lineHeight: 1.5, color: "#64748b" }}>
                                    <span style={{ color: "#0ea5e9", fontWeight: 600, marginRight: 4 }}>GenAI:</span>
                                    {alert.explanation}
                                </div>
                                <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: alert.riskScore > 80 ? "#ef4444" : alert.riskScore > 50 ? "#f59e0b" : "#22c55e" }}>
                                    {alert.riskScore}
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button title="Acknowledge" onClick={() => handleUpdateStatus(alert.id, "Acknowledged")} style={{ width: 32, height: 32, borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                        <ThumbsUp size={14} />
                                    </button>
                                    <button title="Dismiss" onClick={() => handleUpdateStatus(alert.id, "Dismissed")} style={{ width: 32, height: 32, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                        <XCircle size={14} />
                                    </button>
                                    <button title="View Details" onClick={() => window.alert(`${alert.inverterId}\n${alert.explanation}`)} style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </TableRow>
                        ))}
                        {filteredAlerts.length === 0 && (
                            <TableRow>
                                <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>No alerts found for selected filter.</td>
                            </TableRow>
                        )}
                    </Table>
                )}
            </div>
        </div>
    );
}
