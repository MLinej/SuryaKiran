import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EnergyImpact() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchImpact = async () => {
            try {
                const result = await api.getEnergyImpact();
                setData(result);
            } catch (error) {
                console.error("Failed to load energy impact data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchImpact();
    }, []);

    if (loading || !data) return <div>Loading energy impact data...</div>;

    return (
        <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Energy & Revenue Impact</h1>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Financial metrics and preventable loss analysis</p>

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#ef4444' }}>📉</span> Predicted Financial Impact
                    <span style={{ marginLeft: 'auto', fontSize: '13px', background: '#f1f5f9', padding: '4px 12px', borderRadius: '6px', color: '#64748b' }}>This Month Projection</span>
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                    <div>
                        <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Estimated Energy Loss</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{data.estimated_loss.toLocaleString()} <span style={{ fontSize: '16px', fontWeight: 500, color: '#64748b' }}>kWh</span></div>
                        <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px', background: '#fef2f2', display: 'inline-block', padding: '4px 8px', borderRadius: '4px' }}>
                            ↗ +12% vs last month
                        </div>
                    </div>
                    <div>
                        <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Revenue at Risk</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>₹{data.revenue_at_risk.toLocaleString()}</div>
                        <div style={{ color: '#64748b', fontSize: '13px', marginTop: '8px' }}>Based on current PPA rates</div>
                    </div>
                    <div>
                        <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Preventable Savings</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>₹{data.preventable_savings.toLocaleString()}</div>
                        <div style={{ color: '#64748b', fontSize: '13px', marginTop: '8px' }}>With AI predictive maintenance</div>
                    </div>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Revenue Loss Comparison (INR)</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Historic baseline vs AI-optimized operations</p>

                <div style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.comparison_data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => `₹${value.toLocaleString()}`} />
                            <Legend iconType="circle" />
                            <Bar dataKey="standardLoss" name="Standard Loss" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="aiOptimizedLoss" name="With PredictAI" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

