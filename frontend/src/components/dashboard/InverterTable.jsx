import React, { useState } from 'react';
import { Card } from '../Card';
import { Table, TableRow } from '../Table';
import { Badge } from '../Badge';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export function InverterTable({ inverters = [] }) {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [blockFilter, setBlockFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    // Run filters
    const filteredInverters = inverters.filter(inv => {
        if (search && !inv.id.toLowerCase().includes(search.toLowerCase())) return false;
        if (blockFilter !== "All" && inv.block !== blockFilter) return false;
        if (statusFilter !== "All" && inv.status !== statusFilter) return false;
        return true;
    });

    // Extract unique blocks for filter dropdown
    const uniqueBlocks = ["All", ...new Set(inverters.map(inv => inv.block))].sort();

    return (
        <Card style={{ flex: "2 1 600px", padding: 0 }}>
            {/* Header and Controls */}
            <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>Inverter Status</h3>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
                    {/* Search Box */}
                    <div style={{ position: "relative", minWidth: 200 }}>
                        <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                            type="text"
                            placeholder="Search by ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: "100%", padding: "10px 12px 10px 36px",
                                border: "1px solid #e2e8f0", borderRadius: 8,
                                fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                                outline: "none"
                            }}
                        />
                    </div>

                    {/* Block Filter */}
                    <select
                        value={blockFilter}
                        onChange={e => setBlockFilter(e.target.value)}
                        style={{
                            padding: "10px 16px", border: "1px solid #e2e8f0", borderRadius: 8,
                            fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#0f172a",
                            cursor: "pointer", background: "white"
                        }}
                    >
                        {uniqueBlocks.map(b => (
                            <option key={b} value={b}>{b === "All" ? "All Blocks" : b}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{
                            padding: "10px 16px", border: "1px solid #e2e8f0", borderRadius: 8,
                            fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#0f172a",
                            cursor: "pointer", background: "white"
                        }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="High Risk">High Risk</option>
                        <option value="Medium Risk">Medium Risk</option>
                        <option value="Healthy">Healthy</option>
                    </select>
                </div>
            </div>

            {/* Embedded Table Component */}
            <Table headers={["ID", "Block", "Risk Score", "Status", "Last Updated"]}>
                {filteredInverters.map((inv, i) => (
                    <TableRow
                        key={inv.id}
                        isLast={i === filteredInverters.length - 1}
                        onRowClick={() => navigate(`/inverter/${inv.id}`)}
                    >
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{inv.id}</div>
                        <div style={{ color: "#64748b" }}>{inv.block}</div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>{inv.riskScore}</div>
                        <div>
                            <Badge variant={
                                inv.status === "High Risk" ? "danger" :
                                    inv.status === "Medium Risk" ? "warning" : "success"
                            }>
                                {inv.status}
                            </Badge>
                        </div>
                        <div style={{ color: "#94a3b8" }}>{inv.lastUpdated}</div>
                    </TableRow>
                ))}
                {filteredInverters.length === 0 && (
                    <TableRow>
                        <td colSpan={5} style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>No inverters found matching criteria</td>
                    </TableRow>
                )}
            </Table>
        </Card>
    );
}
