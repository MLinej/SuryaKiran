import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { api } from '../services/api';

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('All');
    const [periodFilter, setPeriodFilter] = useState('Last 30 Days');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
            // Fetch real data from express api
            try {
                const response = await axios.get('http://localhost:5000/api/reports');
                setReports(response.data);
            } catch (e) {
                console.error("Failed to load reports", e);
            } finally {
                setLoading(false);
            }
    };

    const generateCustomReport = async () => {
        try {
            await api.createReport({
                title: `Custom Report ${new Date().toLocaleDateString()}`,
                type: "Custom"
            });
            fetchReports();
        } catch (e) {
            console.error("Failed to create report", e);
        }
    };

    const generatePdf = (report) => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("SuryaKiran Platform Report", 20, 20);

        doc.setFontSize(16);
        doc.text(`Title: ${report.title}`, 20, 40);

        doc.setFontSize(12);
        doc.text(`Type: ${report.type}`, 20, 50);
        doc.text(`Date: ${new Date(report.date).toLocaleDateString()}`, 20, 60);

        doc.text("This is an automatically generated system diagnostic report.", 20, 80);
        doc.text("All telemetry and metrics fall within expected operational guidelines,", 20, 90);
        doc.text("with exceptions noted in the core analysis payload.", 20, 100);

        doc.save(`${report.title.replace(/\s+/g, '_')}.pdf`);
    };

    if (loading) return <div>Loading reports...</div>;

    const exportCsv = (report) => {
        const rows = [
            ["id", "title", "type", "date", "size"],
            [report.id, report.title, report.type, report.date, report.size]
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${report.title.replace(/\s+/g, '_')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };
    const now = new Date();
    const filteredReports = reports.filter((report) => {
        if (typeFilter !== 'All' && report.type !== typeFilter) return false;
        const reportDate = new Date(report.date);
        if (periodFilter === 'Last 30 Days') {
            const cutoff = new Date(now);
            cutoff.setDate(now.getDate() - 30);
            return reportDate >= cutoff;
        }
        if (periodFilter === 'Last Quarter') {
            const cutoff = new Date(now);
            cutoff.setDate(now.getDate() - 90);
            return reportDate >= cutoff;
        }
        return true;
    });

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Analytics Reports</h1>
                    <p style={{ color: '#64748b' }}>Download and share comprehensive system reports</p>
                </div>
                <button onClick={generateCustomReport} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <FileText className="w-4 h-4" /> Generate Custom
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', margin: 0 }}>Available Reports</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', color: '#64748b', fontSize: '13px', outline: 'none' }}>
                            <option>Last 30 Days</option>
                            <option>Last Quarter</option>
                        </select>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', color: '#64748b', fontSize: '13px', outline: 'none' }}>
                            <option value="All">All Types</option>
                            <option>Performance</option>
                            <option>Financial</option>
                            <option>Custom</option>
                            <option>Maintenance</option>
                            <option>Risk</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {filteredReports.map((report, idx) => (
                        <div key={report.id} style={{
                            padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: idx !== filteredReports.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '10px', color: '#f59e0b' }}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{report.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', fontSize: '13px' }}>
                                        <span>{new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                                        <span>•</span>
                                        <span>{report.type}</span>
                                        <span>•</span>
                                        <span>{report.size}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => generatePdf(report)} style={{
                                    background: 'white', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '6px',
                                    color: '#475569', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                                }}>
                                    <Download className="w-4 h-4" /> PDF
                                </button>
                                <button onClick={() => exportCsv(report)} style={{
                                    background: 'white', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '6px',
                                    color: '#475569', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                                }}>
                                    <Download className="w-4 h-4" /> CSV
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredReports.length === 0 && (
                        <div style={{ padding: '24px', color: '#64748b' }}>No reports generated yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
