import { Link, useLocation, Outlet } from "react-router-dom";
import { Copy, Activity, AlertTriangle, MessageSquare, BarChart2 } from "lucide-react";

export default function AppLayout() {
    const location = useLocation();

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: <Activity className="w-5 h-5" /> },
        { path: "/alerts", label: "Alerts", icon: <AlertTriangle className="w-5 h-5" /> },
        { path: "/copilot", label: "AI Copilot", icon: <MessageSquare className="w-5 h-5" /> },
        { path: "/analytics", label: "Analytics", icon: <BarChart2 className="w-5 h-5" /> },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7fa", fontFamily: "'DM Sans', sans-serif" }}>
            {/* Sidebar */}
            <aside style={{
                width: 260, background: "#0f172a", color: "white", padding: "24px 0",
                display: "flex", flexDirection: "column", flexShrink: 0
            }}>
                <div style={{ padding: "0 24px", marginBottom: 40, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#f59e0b,#d97706)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>☀️</div>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>
                        Surya<span style={{ color: "#f59e0b" }}>Kiran</span>
                    </span>
                </div>

                <nav style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px" }}>
                    {navItems.map(item => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link key={item.path} to={item.path} style={{
                                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                                borderRadius: 12, textDecoration: "none",
                                background: isActive ? "rgba(245,158,11,0.15)" : "transparent",
                                color: isActive ? "#fcd34d" : "#94a3b8",
                                fontWeight: isActive ? 600 : 500,
                                transition: "all 0.2s"
                            }}>
                                <span style={{ color: isActive ? "#f59e0b" : "#64748b" }}>{item.icon}</span>
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div style={{ marginTop: "auto", padding: "0 16px" }}>
                    <Link to="/" style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                        borderRadius: 12, textDecoration: "none",
                        color: "#94a3b8", fontWeight: 500, transition: "all 0.2s"
                    }}>
                        <Copy className="w-5 h-5" style={{ color: "#64748b" }} />
                        Back to Site
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Top Header */}
                <header style={{
                    height: 66, background: "white", borderBottom: "1px solid #e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 32px",
                    flexShrink: 0
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ textAlign: "right", lineHeight: 1.2 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Plant Admin</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>Rajesh Mehta</div>
                        </div>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>RM</div>
                    </div>
                </header>

                {/* Page Content Viewport */}
                <div style={{ flex: 1, overflowY: "auto", padding: "32px", scrollBehavior: "smooth" }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
