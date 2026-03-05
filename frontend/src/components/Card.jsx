// src/components/Card.jsx
export function Card({ children, className = "", style = {}, noPadding = false }) {
    return (
        <div
            className={className}
            style={{
                background: "white",
                borderRadius: 24,
                padding: noPadding ? 0 : "32px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
                border: "1px solid #e2e8f0",
                ...style
            }}
        >
            {children}
        </div>
    );
}

export function StatisticCard({ title, value, subtitle, icon, accentColor = "#f59e0b" }) {
    return (
        <Card style={{ position: "relative", overflow: "hidden" }}>
            <div style={{
                position: "absolute", top: -20, right: -20,
                width: 100, height: 100, borderRadius: "50%",
                background: `${accentColor}10`,
            }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                        {title}
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: 8 }}>
                        {value}
                    </div>
                    {subtitle && (
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94a3b8" }}>
                            {subtitle}
                        </div>
                    )}
                </div>
                {icon && (
                    <div style={{
                        width: 48, height: 48, borderRadius: 16,
                        background: `${accentColor}15`, display: "flex", alignItems: "center", justifyContent: "center",
                        color: accentColor
                    }}>
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    )
}
