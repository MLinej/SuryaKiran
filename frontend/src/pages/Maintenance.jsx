import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle, Clock, AlertTriangle, PlayCircle, Eye } from 'lucide-react';
import { api } from '@/services/api';

export default function Maintenance() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [selectedTask, setSelectedTask] = useState(null);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await api.getMaintenance();
            setTasks(data);
        } catch (error) {
            console.error("Failed to load maintenance tasks", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            const resolutionNotes = newStatus === 'Resolved'
                ? window.prompt('Add resolution notes (optional):') || undefined
                : undefined;
            await api.updateMaintenance(id, { status: newStatus, resolution_notes: resolutionNotes });
            fetchTasks(); // Refresh list after update
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status.");
        }
    };

    const filteredTasks = tasks.filter(task => (filter === 'All' ? true : task.status === filter));

    if (loading && tasks.length === 0) return <div>Loading maintenance data...</div>;

    const tabs = [
        { label: 'All Tickets', value: 'All' },
        { label: 'Pending', value: 'Pending' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Resolved', value: 'Resolved' }
    ];

    return (
        <div style={{ padding: '24px', animation: "fadeSlideIn 0.4s ease" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a' }}>Maintenance & Repairs</h1>
            </div>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Manage and resolve faulty inverter tickets</p>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'white', padding: '6px', borderRadius: '12px', width: 'fit-content', border: '1px solid #e2e8f0' }}>
                {tabs.map(t => (
                    <button
                        key={t.value}
                        onClick={() => setFilter(t.value)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: filter === t.value ? '#f1f5f9' : 'transparent',
                            color: filter === t.value ? '#0f172a' : '#64748b',
                            fontWeight: filter === t.value ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredTasks.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <CheckCircle style={{ width: 48, height: 48, color: '#10b981', margin: '0 auto 16px' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>All Clear!</h3>
                        <p style={{ color: '#64748b' }}>No {filter !== 'All' ? filter.toLowerCase() : ''} maintenance tasks found.</p>
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <div key={task.id} style={{
                            background: 'white', borderRadius: '12px', padding: '24px',
                            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '20px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{
                                background: task.status === 'Pending' ? '#fef2f2' : task.status === 'In Progress' ? '#fffbeb' : '#ecfdf5',
                                padding: '16px', borderRadius: '12px'
                            }}>
                                {task.status === 'Resolved' ? <CheckCircle style={{ color: '#10b981' }} /> :
                                    task.status === 'In Progress' ? <Wrench style={{ color: '#d97706' }} /> :
                                        <AlertTriangle style={{ color: '#ef4444' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                                        {task.Inverter ? task.Inverter.id : task.inverter_id} - {task.issue}
                                    </h3>
                                    <span style={{
                                        background: task.status === 'Pending' ? '#fef2f2' : task.status === 'In Progress' ? '#fffbeb' : '#ecfdf5',
                                        color: task.status === 'Pending' ? '#ef4444' : task.status === 'In Progress' ? '#d97706' : '#10b981',
                                        padding: '4px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 600
                                    }}>
                                        {task.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
                                    <Clock className="w-4 h-4" />
                                    Scheduled: {task.scheduled_date ? new Date(task.scheduled_date).toLocaleDateString() : 'TBD'}
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                    <button onClick={() => setSelectedTask(task)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}>
                                        <Eye className="w-4 h-4" /> View Details
                                    </button>

                                    {task.status === 'Pending' && (
                                        <button onClick={() => updateStatus(task.id, 'In Progress')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: '#e0e7ff', color: '#4f46e5', border: 'none', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}>
                                            <PlayCircle className="w-4 h-4" /> Mark In Progress
                                        </button>
                                    )}

                                    {task.status !== 'Resolved' && (
                                        <button onClick={() => updateStatus(task.id, 'Resolved')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', background: '#d1fae5', color: '#059669', border: 'none', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}>
                                            <CheckCircle className="w-4 h-4" /> Mark Resolved
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedTask && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: 560, padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, color: '#0f172a' }}>Ticket Details</h3>
                            <button onClick={() => setSelectedTask(null)} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                        </div>
                        <p><strong>Inverter:</strong> {selectedTask.inverter_id}</p>
                        <p><strong>Issue:</strong> {selectedTask.issue}</p>
                        <p><strong>Details:</strong> {selectedTask.details || 'N/A'}</p>
                        <p><strong>Status:</strong> {selectedTask.status}</p>
                        <p><strong>Scheduled:</strong> {selectedTask.scheduled_date ? new Date(selectedTask.scheduled_date).toLocaleString() : 'TBD'}</p>
                        <p><strong>Created:</strong> {selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleString() : 'N/A'}</p>
                        <p><strong>Resolved At:</strong> {selectedTask.resolved_at ? new Date(selectedTask.resolved_at).toLocaleString() : 'Not resolved'}</p>
                        <p><strong>Resolution Notes:</strong> {selectedTask.resolution_notes || 'N/A'}</p>
                    </div>
                </div>
            )}
        </div>
    );
}


