// src/pages/Copilot.jsx
import { useState, useRef, useEffect } from "react";
import { api } from "@/services/api";
import { Copy, Plus, Send, User, MessageSquareText, Flame, Zap, Wrench } from "lucide-react";

export default function Copilot() {
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hello! I'm the SuryaKiran AI Copilot. Ask me about inverter risk, alerts, maintenance, or plant performance." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef(null);

    const suggestedPrompts = [
        { text: "Which inverters are at risk this week?", icon: <Flame size={14} color="#ef4444" /> },
        { text: "Why is INV-204 flagged?", icon: <Zap size={14} color="#f59e0b" /> },
        { text: "What maintenance should be scheduled today?", icon: <Wrench size={14} color="#3b82f6" /> }
    ];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSend = async (text) => {
        const prompt = text || input;
        if (!prompt.trim()) return;

        // Add user message
        setMessages(prev => [...prev, { role: "user", content: prompt }]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await api.askCopilot(prompt);
            setMessages(prev => [...prev, { role: "assistant", content: response }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: "assistant", content: "I encountered an error querying the telemetry database. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", height: "calc(100vh - 130px)", gap: 24, animation: "fadeSlideIn 0.4s ease" }}>

            {/* Sidebar History (Mocked) */}
            <div style={{ flex: "0 0 260px", background: "white", borderRadius: 24, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", padding: 24 }}>
                <button style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12,
                    background: "linear-gradient(135deg,#f5f7fa,#eef2f6)", border: "1px dashed #cbd5e1",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#475569",
                    cursor: "pointer", transition: "all 0.2s"
                }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#94a3b8"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                    onClick={() => setMessages([{ role: "assistant", content: "Hello! I'm the SuryaKiran AI Copilot. How can I help you?" }])}>
                    <Plus size={16} /> New Chat
                </button>

                <div style={{ marginTop: 32, flex: 1, overflowY: "auto" }}>
                    <h4 style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Recent Context</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[].map((item, i) => (
                            <div key={i} style={{
                                padding: "10px 12px", borderRadius: 8, fontSize: 13, color: "#475569",
                                cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                            }} onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <MessageSquareText size={14} style={{ display: "inline", verticalAlign: "bottom", marginRight: 8, color: "#94a3b8" }} />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ flex: 1, background: "white", borderRadius: 24, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
                    {messages.map((msg, i) => (
                        <div key={i} style={{
                            display: "flex", gap: 16, maxWidth: "85%",
                            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                            flexDirection: msg.role === "user" ? "row-reverse" : "row"
                        }}>

                            <div style={{
                                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                                background: msg.role === "user" ? "#f1f5f9" : "linear-gradient(135deg,#f59e0b,#d97706)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: msg.role === "user" ? "#64748b" : "white"
                            }}>
                                {msg.role === "user" ? <User size={18} /> : "☀️"}
                            </div>

                            <div style={{
                                padding: "18px 24px", borderRadius: 24,
                                borderTopRightRadius: msg.role === "user" ? 4 : 24,
                                borderTopLeftRadius: msg.role === "assistant" ? 4 : 24,
                                background: msg.role === "user" ? "#f1f5f9" : "#fffbeb",
                                color: "#1e293b", fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.6,
                                border: msg.role === "assistant" ? "1px solid #fef3c7" : "1px solid transparent"
                            }}>
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div style={{ display: "flex", gap: 16, maxWidth: "85%", alignSelf: "flex-start" }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>☀️</div>
                            <div style={{ padding: "18px 24px", borderRadius: 24, borderTopLeftRadius: 4, background: "#fffbeb", border: "1px solid #fef3c7", display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", animation: "pulse 1s infinite" }} />
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", animation: "pulse 1s infinite 0.2s" }} />
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", animation: "pulse 1s infinite 0.4s" }} />
                                <style>{`@keyframes pulse { 0%,100% { opacity: 0.4; transform: scale(0.8) } 50% { opacity: 1; transform: scale(1.1) } }`}</style>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div style={{ padding: "0 40px 32px 40px" }}>

                    {/* Suggested Prompts */}
                    {messages.length === 1 && (
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, justifyContent: "center" }}>
                            {suggestedPrompts.map((p, i) => (
                                <button key={i} onClick={() => handleSend(p.text)} style={{
                                    background: "white", border: "1px solid #e2e8f0", borderRadius: 50, padding: "8px 16px",
                                    display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                                    color: "#475569", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                                }} onMouseEnter={e => e.currentTarget.style.borderColor = "#cbd5e1"} onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                                    {p.icon} {p.text}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{ position: "relative" }}>
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Ask anything about your fleet..."
                            style={{
                                width: "100%", padding: "20px 60px 20px 24px", borderRadius: 20, border: "1px solid #e2e8f0",
                                fontFamily: "'DM Sans', sans-serif", fontSize: 15, outline: "none", resize: "none",
                                boxShadow: "0 10px 40px rgba(0,0,0,0.04)", minHeight: 64, maxHeight: 120
                            }}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            style={{
                                position: "absolute", right: 16, bottom: 16, width: 36, height: 36, borderRadius: "50%",
                                background: input.trim() && !isLoading ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#f1f5f9",
                                border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                                color: input.trim() && !isLoading ? "white" : "#cbd5e1",
                                cursor: input.trim() && !isLoading ? "pointer" : "default", transition: "all 0.2s"
                            }}
                        >
                            <Send size={16} style={{ marginLeft: -2 }} />
                        </button>
                    </div>
                    <div style={{ textAlign: "center", marginTop: 12, fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#94a3b8" }}>
                        Predictions and insights are AI-generated and should be verified by operators.
                    </div>
                </div>
            </div>
        </div>
    );
}


