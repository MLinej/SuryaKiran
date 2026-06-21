// src/components/Table.jsx
import React from 'react';

export function Table({ headers, children }) {
    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left" }}>
                <thead>
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} style={{
                                padding: "16px 24px",
                                borderBottom: "1px solid #e2e8f0",
                                color: "#64748b", fontFamily: "'DM Mono', monospace", fontSize: 12,
                                textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600,
                                whiteSpace: "nowrap"
                            }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#0f172a" }}>
                    {children}
                </tbody>
            </table>
        </div>
    );
}

export function TableRow({ children, isLast = false, onRowClick }) {
    return (
        <tr
            onClick={onRowClick}
            style={{
                cursor: onRowClick ? "pointer" : "default",
                transition: "background 0.2s ease"
            }}
            onMouseEnter={e => {
                if (onRowClick) e.currentTarget.style.background = "#f8fafc"
            }}
            onMouseLeave={e => {
                if (onRowClick) e.currentTarget.style.background = "transparent"
            }}
        >
            {React.Children.map(children, (child) => (
                <td style={{
                    padding: "20px 24px",
                    borderBottom: isLast ? "none" : "1px solid #f1f5f9",
                    verticalAlign: "middle"
                }}>
                    {child}
                </td>
            ))}
        </tr>
    )
}
