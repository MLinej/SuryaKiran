import React, { useState, useCallback } from 'react';
import { X, AlertCircle, FileUp, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

const EXPECTED_COLUMNS = [
    "timestamp", "inverter_id", "hour", "minute", "sin_time", "cos_time",
    "power_t-10", "power_t-5", "power_t-3", "power_t-1",
    "rolling_mean_5", "rolling_std_5", "pv_voltage", "pv_current", "target_power"
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 5;

export function CSVUploadModal({ isOpen, onClose, onUploadSuccess }) {
    const [files, setFiles] = useState([]);
    const [globalError, setGlobalError] = useState(null);

    if (!isOpen) return null;

    const validateCSV = (text) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) return "CSV file is empty or missing data.";

        const headers = lines[0].split(",").map(h => h.trim());
        if (headers.length !== EXPECTED_COLUMNS.length) {
            return `Invalid format. Expected ${EXPECTED_COLUMNS.length} columns, found ${headers.length}.`;
        }

        for (let i = 0; i < EXPECTED_COLUMNS.length; i++) {
            if (headers[i] !== EXPECTED_COLUMNS[i]) {
                return `Invalid format. Column ${i + 1} should be "${EXPECTED_COLUMNS[i]}".`;
            }
        }
        return null;
    };

    const uploadFile = async (file) => {
        const fileId = Math.random().toString(36).substring(7);
        const newFile = { id: fileId, name: file.name, progress: 0, status: 'uploading', error: null };

        setFiles(prev => [...prev, newFile]);

        // Validation
        if (file.size > MAX_FILE_SIZE) {
            updateFileState(fileId, { status: 'error', error: 'File exceeds 20MB limit' });
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            const validationError = validateCSV(content);
            if (validationError) {
                updateFileState(fileId, { status: 'error', error: validationError });
                return;
            }

            try {
                await api.uploadForecast(content, (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    updateFileState(fileId, { progress: percentCompleted });
                });
                updateFileState(fileId, { status: 'success', progress: 100 });
                if (onUploadSuccess) onUploadSuccess();
            } catch (err) {
                const msg = err.response?.data?.error || "Upload failed";
                updateFileState(fileId, { status: 'error', error: msg });
            }
        };

        reader.onerror = () => {
            updateFileState(fileId, { status: 'error', error: 'Failed to read file' });
        };

        reader.readAsText(file);
    };

    const updateFileState = (id, updates) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setGlobalError(null);

        if (files.length + selectedFiles.length > MAX_FILES) {
            setGlobalError(`You can only upload up to ${MAX_FILES} files.`);
            return;
        }

        selectedFiles.forEach(uploadFile);
    };

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeSlideIn 0.3s ease"
        }}>
            <div style={{
                background: "white",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "550px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                overflow: "hidden"
            }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Upload Forecast Dataset</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
                </div>

                <div style={{ padding: "24px" }}>
                    <div style={{
                        border: "2px dashed #e2e8f0",
                        borderRadius: "12px",
                        padding: "32px 24px",
                        textAlign: "center",
                        background: "#f8fafc",
                        position: "relative",
                        marginBottom: "24px"
                    }}>
                        <FileUp size={40} color="#94a3b8" style={{ marginBottom: "12px" }} />
                        <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>Select CSV files</h4>
                        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "0" }}>Max 20MB per file, up to 5 files</p>

                        <input
                            type="file"
                            accept=".csv"
                            multiple
                            onChange={handleFileChange}
                            style={{
                                position: "absolute",
                                inset: 0,
                                opacity: 0,
                                cursor: "pointer"
                            }}
                        />
                    </div>

                    {globalError && (
                        <div style={{ marginBottom: "16px", padding: "12px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
                            <AlertCircle size={16} color="#ef4444" />
                            <p style={{ fontSize: "13px", color: "#991b1b", margin: 0 }}>{globalError}</p>
                        </div>
                    )}

                    {files.length > 0 && (
                        <div style={{ marginBottom: "24px" }}>
                            <h5 style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>File Submissions</h5>
                            <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                                {files.map((file) => (
                                    <div key={file.id} style={{ padding: "16px", borderBottom: file === files[files.length - 1] ? "none" : "1px solid #f1f5f9" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: file.status === 'uploading' ? "8px" : "0" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                                                <FileText size={18} color="#64748b" />
                                                <span style={{ fontSize: "14px", fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>
                                            </div>
                                            <div>
                                                {file.status === 'success' && <CheckCircle2 size={18} color="#10b981" />}
                                                {file.status === 'error' && <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 600 }}>{file.error}</span>}
                                                {file.status === 'uploading' && <span style={{ fontSize: "12px", color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{file.progress}%</span>}
                                            </div>
                                        </div>

                                        {file.status === 'uploading' && (
                                            <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                                                <div style={{
                                                    width: `${file.progress}%`,
                                                    height: "100%",
                                                    background: "#2563EB",
                                                    transition: "width 0.3s ease",
                                                    borderRadius: "10px"
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ padding: "16px", background: "#f1f5f9", borderRadius: "8px" }}>
                        <h5 style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Required Columns:</h5>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {EXPECTED_COLUMNS.slice(0, 8).map(col => (
                                <span key={col} style={{ fontSize: "10px", background: "white", padding: "3px 8px", borderRadius: "4px", color: "#64748b", border: "1px solid #e2e8f0", fontFamily: "'DM Mono', monospace" }}>{col}</span>
                            ))}
                            <span style={{ fontSize: "10px", background: "white", padding: "3px 8px", borderRadius: "4px", color: "#64748b", border: "1px solid #e2e8f0" }}>...and {EXPECTED_COLUMNS.length - 8} more</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

