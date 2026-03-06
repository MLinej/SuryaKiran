import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus } from 'lucide-react';
import { SolarPlantMap } from '../components/dashboard/SolarPlantMap';

export default function Inverters() {
    const [inverters, setInverters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        inverter_id: '',
        block: 'A',
        power_kw: '',
        pv1_power_kw: '',
        daily_kwh: '',
        inverter_temp_c: '',
        ambient_temp_c: '',
        ac_voltage_v: '',
        dc_voltage_v: '',
        ac_current_a: '',
        dc_current_a: '',
        frequency_hz: '',
        alarm_code: 0,
        op_state: 1,
        price_per_kwh_inr: ''
    });
    const [addStatus, setAddStatus] = useState(null);

    const fetchInverters = async () => {
        setLoading(true);
        try {
            const res = await api.getInverters();
            // Format for SolarPlantMap compatibility
            const formatted = res.map(inv => ({
                id: inv.id,
                block: inv.block || 'A',
                status: inv.status,
                riskScore: inv.riskScore || 0,
                lastUpdated: inv.lastUpdated
            }));
            setInverters(formatted);
        } catch (error) {
            console.error("Failed to fetch inverters", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInverters();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'inverter_id' || name === 'block') ? value : value
        }));
    };

    const handleAddInverter = async (e) => {
        e.preventDefault();
        try {
            setAddStatus({ loading: true, error: null });

            // Feed the telemetry and prediction engine (which simultaneously upserts Inverter)
            // Note: block is sent to predictController, which maps the UI visually immediately, but is kept stripped from the downstream Python ML model
            await api.submitPrediction({
                ...formData,
                power_kw: Number(formData.power_kw),
                pv1_power_kw: Number(formData.pv1_power_kw),
                daily_kwh: Number(formData.daily_kwh),
                inverter_temp_c: Number(formData.inverter_temp_c),
                ambient_temp_c: Number(formData.ambient_temp_c),
                ac_voltage_v: Number(formData.ac_voltage_v),
                dc_voltage_v: Number(formData.dc_voltage_v),
                ac_current_a: Number(formData.ac_current_a),
                dc_current_a: Number(formData.dc_current_a),
                frequency_hz: Number(formData.frequency_hz),
                alarm_code: Number(formData.alarm_code),
                op_state: Number(formData.op_state),
                price_per_kwh_inr: Number(formData.price_per_kwh_inr),
                timestamp: new Date().toISOString()
            });

            setAddStatus({ loading: false, success: true });
            setShowAddModal(false);
            fetchInverters(); // Refresh map
        } catch (err) {
            setAddStatus({ loading: false, error: err.response?.data?.details || err.message || "Failed to add." });
        }
    };

    return (
        <div style={{ padding: '24px', animation: "fadeSlideIn 0.4s ease" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>Inverter Overview</h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Geospatial distribution and real-time risk map</p>
                </div>
                <button onClick={() => setShowAddModal(true)} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <Plus className="w-4 h-4" /> Add Inverter
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading Inverter Map...</div>
            ) : (
                <div style={{ height: '600px', display: 'flex' }}>
                    <SolarPlantMap inverters={inverters} />
                </div>
            )}

            {/* Add Inverter Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Add Inverter / Telemetry</h2>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                        </div>

                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Timestamp is auto-captured from this device clock at submit time.</p>

                        <form onSubmit={handleAddInverter} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Inverter ID</label>
                                    <input required type="text" name="inverter_id" value={formData.inverter_id} onChange={handleInputChange} placeholder="INV-00" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Block Area</label>
                                    <select required name="block" value={formData.block} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', backgroundColor: 'white' }}>
                                        <option value="A">Block A</option>
                                        <option value="B">Block B</option>
                                        <option value="C">Block C</option>
                                        <option value="D">Block D</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Power (kW)</label>
                                    <input required min="0.01" type="number" step="0.1" name="power_kw" value={formData.power_kw} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>PV1 Power (kW)</label>
                                    <input required min="0.01" type="number" step="0.1" name="pv1_power_kw" value={formData.pv1_power_kw} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Daily (kWh)</label>
                                    <input required min="0.01" type="number" step="0.1" name="daily_kwh" value={formData.daily_kwh} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Inv. Temp (°C)</label>
                                    <input required type="number" step="0.1" name="inverter_temp_c" value={formData.inverter_temp_c} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Amb. Temp (°C)</label>
                                    <input required type="number" step="0.1" name="ambient_temp_c" value={formData.ambient_temp_c} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>AC V</label>
                                    <input required type="number" step="0.1" name="ac_voltage_v" value={formData.ac_voltage_v} onChange={handleInputChange} style={{ width: '100%', padding: '8px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>DC V</label>
                                    <input required type="number" step="0.1" name="dc_voltage_v" value={formData.dc_voltage_v} onChange={handleInputChange} style={{ width: '100%', padding: '8px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>AC I</label>
                                    <input required type="number" step="0.1" name="ac_current_a" value={formData.ac_current_a} onChange={handleInputChange} style={{ width: '100%', padding: '8px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>DC I</label>
                                    <input required type="number" step="0.1" name="dc_current_a" value={formData.dc_current_a} onChange={handleInputChange} style={{ width: '100%', padding: '8px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Freq (Hz)</label>
                                    <input required type="number" step="0.01" name="frequency_hz" value={formData.frequency_hz} onChange={handleInputChange} style={{ width: '100%', padding: '8px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Alarm Code</label>
                                    <select required name="alarm_code" value={formData.alarm_code} onChange={handleInputChange} style={{ width: '100%', padding: '8px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', backgroundColor: 'white' }}>
                                        <option value={0}>0 - No Alarm</option>
                                        <option value={100}>100 - Grid Overvoltage</option>
                                        <option value={210}>210 - Inverter Overtemperature</option>
                                        <option value={300}>300 - DC Arc Fault</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Op State</label>
                                    <select required name="op_state" value={formData.op_state} onChange={handleInputChange} style={{ width: '100%', padding: '8px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', backgroundColor: 'white' }}>
                                        <option value={0}>0 - Off</option>
                                        <option value={1}>1 - Running Normally</option>
                                        <option value={2}>2 - Fault</option>
                                        <option value={3}>3 - Maintenance / Standby</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Price (INR)</label>
                                    <input required min="0.01" type="number" step="0.1" name="price_per_kwh_inr" value={formData.price_per_kwh_inr} onChange={handleInputChange} style={{ width: '100%', padding: '8px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
                                </div>
                            </div>

                            {addStatus?.error && (
                                <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', marginTop: '8px', fontSize: '13px', border: '1px solid #fecaca' }}>
                                    {addStatus.error}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={addStatus?.loading} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 600, cursor: addStatus?.loading ? 'wait' : 'pointer' }}>
                                    {addStatus?.loading ? 'Processing...' : 'Add Inverter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


