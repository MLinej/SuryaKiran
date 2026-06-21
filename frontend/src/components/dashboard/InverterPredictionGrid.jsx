import React, { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { api } from '@/services/api';
import { Clock, Upload } from 'lucide-react';

const PredictionCell = ({ power, risk }) => {
    const getRiskColor = (r) => {
        if (r === 'Unpredicted') return '#94a3b8';
        if (r < 30) return '#22c55e';
        if (r < 60) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div style={{
            padding: '16px',
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            transition: 'all 0.2s ease'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontFamily: "'DM Mono', monospace" }}>Power Output</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: power === 'Unpredicted' ? '#94a3b8' : '#0f172a' }}>
                    {power === 'Unpredicted' ? 'Unpredicted' : `${power.toFixed(2)} kW`}
                </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontFamily: "'DM Mono', monospace" }}>Risk Score</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: getRiskColor(risk) }}>
                    {risk === 'Unpredicted' ? 'Unpredicted' : `${risk.toFixed(1)}%`}
                </span>
            </div>
        </div>
    );
};

export function InverterPredictionGrid({ inverters = [], onUploadClick, refreshTrigger = 0 }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [forecastData, setForecastData] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    useEffect(() => {
        let timeoutId;

        const syncToMinute = () => {
            const now = new Date();
            setCurrentDate(now);
            const msUntilNextMinute = 60000 - (now.getTime() % 60000);
            timeoutId = setTimeout(syncToMinute, msUntilNextMinute);
        };

        syncToMinute();
        return () => clearTimeout(timeoutId);
    }, []);

    // Clear specific forecast data when a refresh is triggered
    useEffect(() => {
        if (refreshTrigger > 0) {
            setForecastData({});
        }
    }, [refreshTrigger]);

    useEffect(() => {
        inverters.forEach((inv) => {
            // Only fetch if we don't have data OR if we're explicitly told to refresh (handled by clearing state above)
            if (!forecastData[inv.id] && inv.status !== 'Untrained') {
                api.getForecastAll(inv.id)
                    .then((res) => {
                        if (!res.error) {
                            setForecastData((prev) => ({ ...prev, [inv.id]: res }));
                        }
                    })
                    .catch((e) => console.error('Forecast fetch error for', inv.id, e));
            }
        });
    }, [inverters, forecastData, refreshTrigger]);

    const formatTime = (date, offsetMins = 0) => {
        const newDate = new Date(date.getTime() + offsetMins * 60000);
        return newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const currentMinuteOfDay = currentDate.getHours() * 60 + currentDate.getMinutes();

    // Pagination logic
    const totalPages = Math.ceil(inverters.length / pageSize);
    const displayedInverters = inverters.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Clock size={18} color='#0f172a' />
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>Inverter Prediction Grid</h3>
                </div>
                <button
                    onClick={onUploadClick}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: '#0f172a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        transition: 'background 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#1e293b'}
                    onMouseOut={(e) => e.target.style.background = '#0f172a'}
                >
                    <Upload size={14} />
                    Upload Forecast CSV
                </button>
            </div>

            <div style={{ overflowX: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '12px' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '120px', textAlign: 'left', padding: '8px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'DM Mono', monospace" }}>Inverter</th>
                            <th style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'DM Mono', monospace" }}>t + 1m ({formatTime(currentDate, 1)})</th>
                            <th style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'DM Mono', monospace" }}>t + 2m ({formatTime(currentDate, 2)})</th>
                            <th style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'DM Mono', monospace" }}>t + 3m ({formatTime(currentDate, 3)})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inverters.length === 0 ? (
                            <tr>
                                <td colSpan='4' style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                                    No inverters mapped. Add an inverter to view predictions.
                                </td>
                            </tr>
                        ) : (
                            displayedInverters.map((inv) => {
                                const fData = forecastData[inv.id];

                                const getPredictionForOffset = (offsetMinutes) => {
                                    const index = (currentMinuteOfDay + offsetMinutes) % 1440;

                                    if (fData && fData.power && fData.risk && fData.power.length > index) {
                                        const rawRisk = Number(fData.risk[index] || 0);
                                        const normalizedRisk = rawRisk <= 1 ? rawRisk * 100 : rawRisk;
                                        return { power: Number(fData.power[index] || 0), risk: normalizedRisk };
                                    }

                                    return {
                                        power: 'Unpredicted',
                                        risk: 'Unpredicted',
                                    };
                                };

                                return (
                                    <tr key={inv.id}>
                                        <td style={{ verticalAlign: 'middle' }}>
                                            <div style={{
                                                padding: '12px',
                                                background: '#f8fafc',
                                                borderRadius: '6px',
                                                fontFamily: "'DM Mono', monospace",
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                color: '#0f172a',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                {inv.id}
                                            </div>
                                        </td>
                                        {inv.status === 'Untrained' ? (
                                            <td colSpan="3" style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                                Untrained Model — Upload CSV to enable live predictions.
                                            </td>
                                        ) : (
                                            <>
                                                <td><PredictionCell power={getPredictionForOffset(1).power} risk={getPredictionForOffset(1).risk} /></td>
                                                <td><PredictionCell power={getPredictionForOffset(2).power} risk={getPredictionForOffset(2).risk} /></td>
                                                <td><PredictionCell power={getPredictionForOffset(3).power} risk={getPredictionForOffset(3).risk} /></td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            style={{
                                padding: '6px 12px',
                                background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                color: currentPage === 1 ? '#cbd5e1' : '#0f172a'
                            }}
                        >
                            Previous
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            style={{
                                padding: '6px 12px',
                                background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                color: currentPage === totalPages ? '#cbd5e1' : '#0f172a'
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
}
