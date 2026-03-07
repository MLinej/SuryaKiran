import React, { useState } from 'react';
import { X, AlertCircle, FileUp, CheckCircle2 } from 'lucide-react';

const EXPECTED_COLUMNS = [
    "timestamp", "inverter_id", "hour", "minute", "sin_time", "cos_time",
    "power_t-10", "power_t-5", "power_t-3", "power_t-1",
    "rolling_mean_5", "rolling_std_5", "pv_voltage", "pv_current", "target_power"
];

export function CSVUploadModal({ isOpen, onClose, onUploadSuccess }) {
    const [error, setError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const validateCSV = (rows) => {
        if (rows.length === 0) return "CSV file is empty.";

        const headers = Object.keys(rows[0]);

        // 1. Check all required columns exist and match exactly
        if (headers.length !== EXPECTED_COLUMNS.length) {
            return `Invalid CSV format. Expected ${EXPECTED_COLUMNS.length} columns, found ${headers.length}.`;
        }

        for (let i = 0; i < EXPECTED_COLUMNS.length; i++) {
            if (headers[i] !== EXPECTED_COLUMNS[i]) {
                return `Invalid CSV format. Column ${i + 1} should be "${EXPECTED_COLUMNS[i]}" but found "${headers[i]}".`;
            }
        }

        // 2. Check for null/empty values
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            for (const col of EXPECTED_COLUMNS) {
                if (row[col] === undefined || row[col] === null || row[col].toString().trim() === "") {
                    return `Missing data at row ${i + 1}, column "${col}". All fields must be valid and complete.`;
                }
            }
        }

        return null;
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError(null);
        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

            if (lines.length < 2) {
                setError("Invalid CSV format. The file is empty or missing data.");
                setIsUploading(false);
                return;
            }

            const headers = lines[0].split(",");
            const rows = lines.slice(1).map(line => {
                const values = line.split(",");
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header.trim()] = values[i];
                });
                return obj;
            });

            const validationError = validateCSV(rows);
            if (validationError) {
                setError(validationError);
                setIsUploading(false);
                return;
            }

            try {
                // Send JSON-ified data to backend proxy
                // The ML service expects { "filepath": ... } or multipart, 
                // but we can also modify it to accept raw content if needed.
                // For now, let's assume we send the content as a string.
                onUploadSuccess(text);
                onClose();
            } catch (err) {
                setError("Failed to process prediction data. Please try again.");
            } finally {
                setIsUploading(false);
            }
        };

        reader.onerror = () => {
            setError("Error reading file.");
            setIsUploading(false);
        };

        reader.readAsText(file);
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
                maxWidth: "500px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                overflow: "hidden"
            }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Upload Forecast Dataset</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
                </div>

                <div style={{ padding: "32px 24px" }}>
                    <div style={{
                        border: "2px dashed #e2e8f0",
                        borderRadius: "12px",
                        padding: "40px 24px",
                        textAlign: "center",
                        background: "#f8fafc",
                        position: "relative"
                    }}>
                        <FileUp size={48} color="#94a3b8" style={{ marginBottom: "16px" }} />
                        <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>Drop CSV file here</h4>
                        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>or click to browse from your computer</p>

                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            style={{
                                position: "absolute",
                                inset: 0,
                                opacity: 0,
                                cursor: "pointer"
                            }}
                        />

                        {isUploading && (
                            <div style={{ marginTop: "16px", fontSize: "14px", color: "#3b82f6", fontWeight: 600 }}>
                                Validating schema...
                            </div>
                        )}
                    </div>

                    {error && (
                        <div style={{
                            marginTop: "20px",
                            padding: "16px",
                            background: "#fef2f2",
                            border: "1px solid #fee2e2",
                            borderRadius: "8px",
                            display: "flex",
                            gap: "12px"
                        }}>
                            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                            <p style={{ fontSize: "13px", color: "#991b1b", lineHeight: 1.5, margin: 0 }}>{error}</p>
                        </div>
                    )}

                    <div style={{ marginTop: "24px", padding: "16px", background: "#f1f5f9", borderRadius: "8px" }}>
                        <h5 style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Required Schema Order:</h5>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {EXPECTED_COLUMNS.map(col => (
                                <span key={col} style={{ fontSize: "10px", background: "white", padding: "4px 8px", borderRadius: "4px", color: "#64748b", border: "1px solid #e2e8f0", fontFamily: "'DM Mono', monospace" }}>{col}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
