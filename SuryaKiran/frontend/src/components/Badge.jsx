// src/components/Badge.jsx
export function Badge({ children, variant = "default", style = {} }) {
    const getColors = () => {
        switch (variant) {
            case "danger":
            case "High Risk":
            case "Critical":
                return { bg: "#fef2f2", color: "#ef4444", border: "#fca5a5" };
            case "warning":
            case "Medium Risk":
            case "Warning":
                return { bg: "#fffbeb", color: "#f59e0b", border: "#fcd34d" };
            case "success":
            case "Healthy":
                return { bg: "#f0fdf4", color: "#22c55e", border: "#86efac" };
            case "info":
            case "Info":
                return { bg: "#eff6ff", color: "#3b82f6", border: "#93c5fd" };
            default:
                return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
        }
    };

    const colors = getColors();

    return (
        <span style={{
            display: "inline-flex", alignItems: "center", padding: "4px 12px",
            background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`,
            borderRadius: 99, fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 600,
            ...style
        }}>
            {children}
        </span>
    );
}
