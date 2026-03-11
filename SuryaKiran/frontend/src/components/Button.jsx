// src/components/Button.jsx
export function Button({ children, variant = "primary", onClick, style = {}, className = "", icon }) {

    const baseStyle = {
        display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center",
        padding: "12px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.2s ease",
        border: "none", outline: "none"
    };

    const variants = {
        primary: {
            background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white",
            boxShadow: "0 4px 12px rgba(245,158,11,0.25)",
        },
        outline: {
            background: "transparent", color: "#475569", border: "1.5px solid #cbd5e1"
        },
        danger: {
            background: "#fee2e2", color: "#ef4444",
        },
        ghost: {
            background: "transparent", color: "#64748b"
        }
    };

    return (
        <button
            className={`btn-${variant} ${className}`}
            onClick={onClick}
            style={{ ...baseStyle, ...variants[variant], ...style }}
            onMouseEnter={e => {
                if (variant === "primary") e.currentTarget.style.transform = "translateY(-1px)";
                if (variant === "outline") e.currentTarget.style.borderColor = "#f59e0b";
                if (variant === "ghost") e.currentTarget.style.color = "#0f172a";
            }}
            onMouseLeave={e => {
                if (variant === "primary") e.currentTarget.style.transform = "translateY(0)";
                if (variant === "outline") e.currentTarget.style.borderColor = "#cbd5e1";
                if (variant === "ghost") e.currentTarget.style.color = "#64748b";
            }}
        >
            {icon && icon}
            {children}
        </button>
    );
}
