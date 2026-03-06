import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── useInView ───────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// ─── FeatureTabShowcase ──────────────────────────────────────────────────────
function FeatureTabShowcase({ inView }) {
  const [active, setActive] = useState(0);
  const features = [
    { icon: "📊", title: "Fleet Dashboard", desc: "Per-inverter risk scores in a color-coded grid. Sort and filter by block, risk level, or alert status. Auto-refreshes on a configurable interval. Monitor hundreds of inverters at a glance with instant visual cues for risk severity.", accent: "#f59e0b" },
    { icon: "📉", title: "Inverter Detail View", desc: "7–10 day risk trend chart, AC/DC telemetry plots, SHAP feature bar chart, and the GenAI narrative — all for a single inverter. Drill down from fleet-level to individual component health in one click.", accent: "#22c55e" },
    { icon: "🤖", title: "AI Copilot Chat", desc: "Multi-turn conversational Q&A powered by RAG. Grounded in your fleet data. Hallucination guardrails ensure answers are always based on real readings. Ask in natural language, get precise data-backed answers.", accent: "#3b82f6" },
    { icon: "🚨", title: "Alert Center", desc: "Severity-tiered alert feed with AI-generated one-liners per alert. Acknowledge, escalate, or dismiss — and track resolution. Smart deduplication ensures you never drown in noise.", accent: "#ef4444" },
    { icon: "📈", title: "Analytics & Reports", desc: "Historical performance ratio trends, energy loss estimates, heatmaps by block, and prediction accuracy charts. Export to CSV or PDF. Drill into any time window with interactive controls.", accent: "#8b5cf6" },
    { icon: "🔧", title: "Maintenance Tickets", desc: "The agentic AI layer can autonomously draft a maintenance ticket when risk is detected — ready for operator review and dispatch. Integrates with your existing workflow and ticketing systems.", accent: "#0ea5e9" },
  ];

  return (
    <div style={{
      display: "flex", gap: 0, flexWrap: "wrap",
      opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(30px)",
      transition: "all 0.7s ease",
    }}>
      {/* Left tab list */}
      <div style={{ flex: "0 0 320px", minWidth: 260 }}>
        {features.map((f, i) => (
          <button key={f.title} onClick={() => setActive(i)} style={{
            display: "flex", alignItems: "center", gap: 14,
            width: "100%", textAlign: "left", padding: "18px 22px",
            background: active === i ? "white" : "transparent",
            border: "none", borderLeft: `3px solid ${active === i ? f.accent : "transparent"}`,
            borderRadius: active === i ? "0 16px 16px 0" : 0,
            boxShadow: active === i ? "0 4px 20px rgba(0,0,0,0.06)" : "none",
            cursor: "pointer", transition: "all 0.3s ease",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <span style={{
              width: 42, height: 42, borderRadius: 12,
              background: active === i ? `${f.accent}18` : "#f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, transition: "all 0.3s ease", flexShrink: 0,
            }}>{f.icon}</span>
            <div>
              <div style={{
                fontSize: 15, fontWeight: active === i ? 700 : 500,
                color: active === i ? "#0f172a" : "#64748b",
                fontFamily: "'Syne', sans-serif",
                transition: "all 0.3s ease",
              }}>{f.title}</div>
              <div style={{
                fontSize: 12, color: active === i ? f.accent : "#94a3b8",
                fontFamily: "'DM Mono', monospace",
                transition: "color 0.3s ease",
              }}>After login</div>
            </div>
          </button>
        ))}
      </div>

      {/* Right detail panel */}
      <div style={{ flex: 1, minWidth: 300 }}>
        <div key={active} style={{
          background: "white", borderRadius: 24, padding: "48px 44px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
          minHeight: 380, display: "flex", flexDirection: "column", justifyContent: "center",
          animation: "fadeSlideIn 0.4s ease",
          position: "relative", overflow: "hidden",
        }}>
          <style>{`@keyframes fadeSlideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 160, height: 160, borderRadius: "50%",
            background: `${features[active].accent}08`,
          }} />
          <div style={{
            position: "absolute", bottom: -40, left: -40,
            width: 120, height: 120, borderRadius: "50%",
            background: `${features[active].accent}06`,
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{ fontSize: 48, display: "block", marginBottom: 20 }}>{features[active].icon}</span>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 11, color: features[active].accent,
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
            }}>Platform Feature</div>
            <h3 style={{
              fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800,
              color: "#0f172a", marginBottom: 18, letterSpacing: "-0.02em",
            }}>{features[active].title}</h3>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 16,
              color: "#64748b", lineHeight: 1.85, marginBottom: 28,
            }}>{features[active].desc}</p>
            <div style={{
              width: 48, height: 4, borderRadius: 99,
              background: `linear-gradient(to right, ${features[active].accent}, ${features[active].accent}55)`,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Login Modal ──────────────────────────────────────────────────────────────
function LoginModal({ onClose }) {
  const [tab, setTab] = useState("login");
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(10,22,40,0.75)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: "rgba(255,255,255,0.99)", borderRadius: 28, padding: "44px 40px",
        maxWidth: 420, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
        position: "relative",
        animation: "modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }} onClick={e => e.stopPropagation()}>
        <style>{`@keyframes modalIn { from { transform: scale(0.88) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }`}</style>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, background: "#f1f5f9",
          border: "none", borderRadius: "50%", width: 32, height: 32,
          cursor: "pointer", fontSize: 18, color: "#64748b", lineHeight: 1,
        }}>×</button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#f59e0b,#d97706)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>☀️</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
            Surya<span style={{ color: "#f59e0b" }}>Kiran</span>
          </span>
        </div>

        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 28 }}>
          {["login", "signup"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "10px 0", border: "none", borderRadius: 10,
              background: tab === t ? "white" : "transparent",
              boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
              color: tab === t ? "#0f172a" : "#64748b", cursor: "pointer",
              transition: "all 0.2s",
            }}>{tab === t && t === "login" ? "Sign In" : tab === t ? "Create Account" : t === "login" ? "Sign In" : "Create Account"}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tab === "signup" && (
            <input placeholder="Full Name" style={{ padding: "14px 16px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none", background: "#f8fafc", color: "#0f172a" }} />
          )}
          <input placeholder="Email address" type="email" style={{ padding: "14px 16px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none", background: "#f8fafc", color: "#0f172a" }} />
          <input placeholder="Password" type="password" style={{ padding: "14px 16px", border: "1.5px solid #e2e8f0", borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none", background: "#f8fafc", color: "#0f172a" }} />
          <button onClick={() => window.location.href = '/dashboard'} style={{
            padding: "15px", background: "linear-gradient(135deg,#f59e0b,#d97706)",
            border: "none", borderRadius: 12, color: "white",
            fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
            cursor: "pointer", marginTop: 4, boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
          }}>
            {tab === "login" ? "Sign In to Dashboard →" : "Create Account →"}
          </button>
        </div>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 20 }}>
          {tab === "login" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: "#f59e0b", cursor: "pointer", fontWeight: 600 }} onClick={() => setTab(tab === "login" ? "signup" : "login")}>
            {tab === "login" ? "Sign up free" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── ProcessCards (GSAP Stacking Animation) ──────────────────────────────────
function ProcessCards() {
  const containerRef = useRef(null);
  const steps = [
    { icon: "📡", step: 1, title: "Ingest", desc: "Telemetry, KPIs, and alarm data are ingested from every inverter at regular intervals across your solar plant.", accent: "#f59e0b", bg: "#0f172a", z: 1 },
    { icon: "🧠", step: 2, title: "Predict", desc: "A production-grade ML model computes a failure risk score with SHAP explainability for the 7–10 day window ahead.", accent: "#22c55e", bg: "#1e293b", z: 2 },
    { icon: "💬", step: 3, title: "Explain", desc: "An LLM generates a plain-English narrative: why the inverter is at risk, what the likely cause is, and what to do.", accent: "#3b82f6", bg: "#334155", z: 3 },
    { icon: "⚡", step: 4, title: "Act", desc: "Operators receive prioritized alerts and can query the AI Copilot to plan and schedule preventive maintenance.", accent: "#8b5cf6", bg: "#475569", z: 4 },
  ];

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.process-card');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 1,
          start: "top 15%",
          end: `+=${cards.length * 80}%`,
        }
      });

      cards.forEach((card, index) => {
        if (index === 0) return;

        // Cards slide in horizontally from the right
        tl.fromTo(card,
          { x: "120%", opacity: 0, rotate: 3 },
          { x: "0%", opacity: 1, rotate: 0, duration: 1, ease: "power2.out" }
        );

        // Scale down and push up the cards underneath
        tl.to(cards.slice(0, index), {
          scale: () => 1 - (index * 0.05),
          y: () => -(index * 20),
          duration: 1,
          ease: "none"
        }, "<");
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="how-it-works" style={{ background: "#fff" }}>
      <div style={{ height: "15vh" }} />
      <div ref={containerRef} className="cards-wrapper" style={{ minHeight: "80vh", padding: "0 5%" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>The Process</p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(30px,4vw,50px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            From raw telemetry to actionable insight
          </h2>
        </div>
        <div className="cards-container" style={{ position: "relative", width: "100%", maxWidth: 840, height: 320, margin: "0 auto" }}>
          {steps.map((s, i) => (
            <div className="process-card" key={s.title} style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: s.bg, borderRadius: 32, zIndex: s.z,
              padding: "40px 48px", color: "white", boxShadow: "0 -20px 50px rgba(0,0,0,0.15)",
              display: "flex", flexDirection: "column", justifyContent: "center",
              transformOrigin: "top center", willChange: "transform, opacity"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>{s.icon}</div>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: s.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Step {s.step}</div>
                  <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{s.title}</h1>
                </div>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#cbd5e1", lineHeight: 1.6, maxWidth: 650 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: "15vh" }} />
    </section>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function SuryaKiranLanding() {
  const [heroVisible, setHeroVisible] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { setTimeout(() => setHeroVisible(true), 120); }, []);

  const [benefitsRef, benefitsInView] = useInView();
  const [whyRef, whyInView] = useInView();
  const [howRef, howInView] = useInView();
  const [featRef, featInView] = useInView();
  const [trustRef, trustInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  const benefits = [
    { icon: "🔮", title: "7–10 Day Failure Prediction", desc: "Our ML model looks at 30 days of telemetry history to predict which inverters are likely to shut down or underperform — before it happens.", accent: "#f59e0b" },
    { icon: "💬", title: "AI-Generated Explanations", desc: "Every risk alert comes with a plain-English explanation of the cause and a recommended action — powered by an LLM grounded in your actual data.", accent: "#22c55e" },
    { icon: "📊", title: "SHAP Feature Transparency", desc: "See exactly why the model flagged an inverter. Top 5 contributing factors are shown for every prediction so operators always understand the reasoning.", accent: "#3b82f6" },
    { icon: "🤖", title: "Natural Language Q&A", desc: "Ask questions like 'Which inverters in Block B are at risk this week?' and get data-backed answers instantly — no dashboard hunting required.", accent: "#8b5cf6" },
    { icon: "🚨", title: "Intelligent Alert System", desc: "Severity-tiered alerts with AI one-liners, acknowledgement flows, and escalation paths. Fewer false alarms, more signal.", accent: "#ef4444" },
    { icon: "📈", title: "Performance Analytics", desc: "Track fleet-wide performance ratio, energy loss estimates, and prediction accuracy over time in a clean analytics view.", accent: "#0ea5e9" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f5f7fa", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.1); } }
        @keyframes floatY { 0%,100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-14px) rotate(1deg); } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.55; } 100% { transform: scale(1.7); opacity: 0; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .nav-btn {
          background: linear-gradient(135deg,#f59e0b,#d97706); color: white; border: none;
          padding: 11px 26px; border-radius: 50px; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(245,158,11,0.35); transition: all 0.3s ease;
        }
        .nav-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(245,158,11,0.5); }
        .cta-primary {
          background: linear-gradient(135deg,#f59e0b,#d97706); color: white; border: none;
          padding: 18px 44px; border-radius: 50px; font-size: 17px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 6px 24px rgba(245,158,11,0.4); transition: all 0.3s ease;
        }
        .cta-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(245,158,11,0.55); }
        .cta-outline {
          background: transparent; color: #94a3b8; border: 2px solid #1e2f45;
          padding: 16px 42px; border-radius: 50px; font-size: 17px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.3s ease;
        }
        .cta-outline:hover { border-color: #f59e0b; color: #f59e0b; transform: translateY(-2px); }
        .cta-outline-light {
          background: transparent; color: #0f172a; border: 2px solid #cbd5e1;
          padding: 16px 42px; border-radius: 50px; font-size: 17px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.3s ease;
        }
        .cta-outline-light:hover { border-color: #f59e0b; color: #d97706; transform: translateY(-2px); }
        .nav-link { color: #475569; font-size: 14px; font-weight: 500; cursor: pointer; transition: color 0.2s; text-decoration: none; }
        .nav-link:hover { color: #f59e0b; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f5f7fa; }
        ::-webkit-scrollbar-thumb { background: #f59e0b55; border-radius: 10px; }
        .benefit-row:hover .benefit-accent-bar { transform: scaleY(1.15); }
        .benefit-row:hover { transform: translateX(6px); }
        .timeline-node:hover { transform: scale(1.15); }
      `}</style>



      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(245,247,250,0.88)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.8)",
        padding: "0 5%", height: 66,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#f59e0b,#d97706)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>☀️</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
            Surya<span style={{ color: "#f59e0b" }}>Kiran</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#benefits" className="nav-link">Benefits</a>
          <a href="#about" className="nav-link">About</a>
          <button className="nav-btn" onClick={() => navigate('/login')}>Sign In →</button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          HERO  — heading forced to 2–3 lines
      ══════════════════════════════════════════════ */}
      <section style={{ minHeight: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingTop: 66 }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(150deg,#07111f 0%,#0c1e35 55%,#071523 100%)" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1800&q=80')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.14, animation: "kenBurns 20s ease-in-out infinite alternate" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.07) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(circle,rgba(245,158,11,0.1) 0%,transparent 65%)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 180, background: "linear-gradient(to bottom,transparent,#f5f7fa)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 1100, padding: "0 5%" }}>
          {/* Animated sun */}
          <div style={{
            width: 80, height: 80, margin: "0 auto 36px",
            background: "linear-gradient(135deg,#f59e0b,#d97706)", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
            position: "relative", animation: "floatY 5s ease-in-out infinite",
            opacity: heroVisible ? 1 : 0, transition: "opacity 0.6s ease",
          }}>
            ☀️
            <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "2px solid rgba(245,158,11,0.3)", animation: "pulse-ring 2s ease-out infinite" }} />
            <div style={{ position: "absolute", inset: -20, borderRadius: "50%", border: "1px solid rgba(245,158,11,0.15)", animation: "pulse-ring 2s ease-out 0.5s infinite" }} />
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px,4.2vw,56px)",
            fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: 26,
            letterSpacing: "-0.025em",
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(32px)",
            transition: "all 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.25s",
          }}>
            Predict Solar Inverter{" "}
            <span style={{ background: "linear-gradient(135deg,#f59e0b,#fcd34d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Failures</span>
            {" "}Before They Happen
          </h1>

          <p style={{
            fontSize: "clamp(15px,1.8vw,19px)", color: "#94a3b8", lineHeight: 1.8,
            maxWidth: 600, margin: "0 auto 48px",
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s ease 0.5s",
          }}>
            SuryaKiran uses AI and machine learning to analyze inverter telemetry and{" "}
            <strong style={{ color: "#e2e8f0" }}>predict shutdown risk 7–10 days in advance</strong>
            {" "}— so your team acts before energy is lost.
          </p>

          <div style={{
            display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s ease 0.7s",
          }}>
            <button className="cta-primary" onClick={() => navigate('/login')}>Get Started Free →</button>
          </div>

          {/* Chips */}
          <div style={{
            display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 52,
            opacity: heroVisible ? 1 : 0, transition: "opacity 0.7s ease 1s",
          }}>
            {["🔒 No credit card", "⚡ 7–10 day predictions", "🤖 AI-generated insights", "📊 SHAP explainability"].map(c => (
              <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 50, padding: "8px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94a3b8" }}>{c}</span>
            ))}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", opacity: heroVisible ? 0.5 : 0, transition: "opacity 1s ease 1.4s" }}>
          <div style={{ width: 1, height: 44, background: "linear-gradient(to bottom,#f59e0b,transparent)", margin: "0 auto" }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PROBLEM SECTION
      ══════════════════════════════════════════════ */}
      <section style={{ padding: "100px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 72, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ maxWidth: 480 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>The Problem</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 22 }}>
              Solar plants lose revenue to failures they could have prevented.
            </h2>
            <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.8, marginBottom: 28 }}>
              Most operators only know an inverter has failed after it stops producing power. By then, energy is already lost, performance ratios drop, and maintenance is reactive and expensive.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                "Failures detected hours or days too late",
                "No explanation for why a fault occurred",
                "Operators overwhelmed by raw alarms",
                "No proactive maintenance scheduling possible",
              ].map(text => (
                <div key={text} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, marginTop: 2 }}>🔴</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#475569" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 280, maxWidth: 420 }}>
            <div style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", borderRadius: 28, padding: "40px 36px", border: "1px solid #fcd34d", boxShadow: "0 16px 48px rgba(245,158,11,0.15)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, background: "rgba(245,158,11,0.15)", borderRadius: "50%" }} />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#92400e", marginBottom: 20, fontWeight: 600 }}>⚠ Industry Reality</div>
              {[
                { label: "Avg detection delay", value: "6–18 hrs" },
                { label: "Revenue lost per inverter/day", value: "₹8,000+" },
                { label: "Reactive maintenance premium", value: "3× cost" },
                { label: "Inverter downtime (annual)", value: "~120 hrs" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(180,120,0,0.15)" }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#78350f" }}>{label}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: "#b45309" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BENEFITS — Alternating Feature Rows
      ══════════════════════════════════════════════ */}
      <section id="benefits" ref={benefitsRef} style={{ padding: "100px 5%", background: "#f5f7fa" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Why SuryaKiran</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(30px,4vw,50px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 16 }}>
              Built for solar operations teams
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#64748b", maxWidth: 520, margin: "0 auto" }}>
              From predictive ML to plain-English AI explanations, SuryaKiran replaces reactive monitoring with proactive intelligence.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {benefits.map((b, i) => {
              const isEven = i % 2 === 0;
              return (
                <div
                  className="benefit-row"
                  key={b.title}
                  style={{
                    display: "flex", alignItems: "stretch", gap: 0,
                    flexDirection: isEven ? "row" : "row-reverse",
                    opacity: benefitsInView ? 1 : 0,
                    transform: benefitsInView
                      ? "translateX(0)"
                      : isEven ? "translateX(-40px)" : "translateX(40px)",
                    transition: `all 0.65s cubic-bezier(0.34,1.56,0.64,1) ${i * 120}ms`,
                    cursor: "default",
                  }}
                >
                  {/* Accent bar */}
                  <div
                    className="benefit-accent-bar"
                    style={{
                      width: 4, background: `linear-gradient(to bottom, ${b.accent}, ${b.accent}33)`,
                      borderRadius: 99, flexShrink: 0,
                      transition: "transform 0.3s ease",
                    }}
                  />

                  {/* Content */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 22,
                    padding: "28px 32px",
                    borderBottom: i < benefits.length - 1 ? "1px solid #e2e8f0" : "none",
                    flex: 1,
                    transition: "transform 0.3s ease",
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: `${b.accent}12`,
                      border: `2px solid ${b.accent}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 26, flexShrink: 0,
                      boxShadow: `0 0 24px ${b.accent}15`,
                    }}>
                      {b.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontFamily: "'Syne', sans-serif", fontSize: 19, fontWeight: 700,
                        color: "#0f172a", marginBottom: 6,
                      }}>{b.title}</h4>
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#64748b",
                        lineHeight: 1.75,
                      }}>{b.desc}</p>
                    </div>

                    {/* Number tag — now clearly visible */}
                    <div style={{
                      fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800,
                      color: b.accent, opacity: 0.2, flexShrink: 0,
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ProcessCards />

      {/* ══════════════════════════════════════════════
          WHY CHOOSE US
      ══════════════════════════════════════════════ */}
      <section id="about" ref={whyRef} style={{ padding: "100px 5%", background: "#0f172a" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 80, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Why Choose Us</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: 16 }}>
              Not another dashboard. An intelligence platform.
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 17, lineHeight: 1.8, marginBottom: 36 }}>
              SuryaKiran goes beyond displaying raw data. It turns telemetry into decisions, and alarms into understandable guidance that any operator can act on immediately.
            </p>
            <button className="cta-primary" onClick={() => navigate('/login')}>Start Free →</button>
          </div>
          <div style={{ flex: 1, minWidth: 300, maxWidth: 520, display: "flex", flexDirection: "column", gap: 28 }}>
            {[
              { number: "01", title: "Production-Ready ML Pipeline", desc: "Cross-validated, walk-forward trained model with precision, recall, F1, and AUC reported. No toy notebooks — real engineering.", accent: "#f59e0b" },
              { number: "02", title: "GenAI Copilot with Guardrails", desc: "RAG-based Q&A grounded in your inverter data. Hallucination guardrails ensure the LLM never fabricates sensor readings or risk scores.", accent: "#22c55e" },
              { number: "03", title: "Multi-Class Risk Output", desc: "No binary alarms. Get three levels: No Risk, Degradation Risk, and Shutdown Risk — so teams can prioritize across a whole fleet.", accent: "#3b82f6" },
              { number: "04", title: "Anomaly Detection Layer", desc: "An unsupervised anomaly detector runs in parallel with the ML model, catching unusual inverter behavior before it becomes a failure.", accent: "#8b5cf6" },
            ].map((item, i) => (
              <div key={item.title} style={{
                display: "flex", gap: 20, alignItems: "flex-start",
                opacity: whyInView ? 1 : 0,
                transform: whyInView ? "translateX(0)" : "translateX(-40px)",
                transition: `all 0.7s ease ${i * 120}ms`,
              }}>
                <div style={{
                  minWidth: 52, height: 52, borderRadius: 16,
                  background: `${item.accent}18`, border: `2px solid ${item.accent}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: item.accent,
                }}>{item.number}</div>
                <div>
                  <h4 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>{item.title}</h4>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#94a3b8", lineHeight: 1.75 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          IMPACT NUMBERS — Horizontal Stats Bar
      ══════════════════════════════════════════════ */}
      <section ref={trustRef} style={{ padding: "100px 5%", background: "#f5f7fa" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>The Impact</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(30px,4vw,50px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              What SuryaKiran delivers
            </h2>
          </div>

          {/* Single horizontal bar */}
          <div style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            borderRadius: 28, padding: "48px 24px",
            display: "flex", flexWrap: "wrap", justifyContent: "center",
            position: "relative", overflow: "hidden",
            boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
            opacity: trustInView ? 1 : 0,
            transform: trustInView ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
            transition: "all 0.8s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            {/* Background shimmer */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.04), transparent)",
              backgroundSize: "200% 100%",
              animation: "shimmer 4s ease infinite",
            }} />
            {/* Dot grid overlay */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.06) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }} />

            {[
              { value: "7–10", suffix: " days", label: "Prediction window ahead of failure", accent: "#f59e0b" },
              { value: "↓60", suffix: "%", label: "Reduction in unplanned downtime", accent: "#22c55e" },
              { value: "3×", suffix: " faster", label: "Maintenance response time", accent: "#3b82f6" },
              { value: "100", suffix: "%", label: "Predictions explained in plain English", accent: "#8b5cf6" },
            ].map(({ value, suffix, label, accent }, i, arr) => (
              <div key={label} style={{
                flex: "1 1 200px", textAlign: "center",
                padding: "16px 28px",
                position: "relative", zIndex: 1,
                display: "flex", flexDirection: "column", alignItems: "center",
                borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}>
                <div style={{
                  fontFamily: "'Syne', sans-serif", fontSize: 44, fontWeight: 800,
                  color: accent, lineHeight: 1, marginBottom: 10,
                  textShadow: `0 0 30px ${accent}30`,
                }}>
                  {value}<span style={{ fontSize: 22, opacity: 0.7 }}>{suffix}</span>
                </div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  color: "#94a3b8", lineHeight: 1.5, maxWidth: 180,
                }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div style={{
            marginTop: 48, borderRadius: 24, padding: "40px 44px",
            maxWidth: 720, margin: "48px auto 0",
            background: "white",
            borderLeft: "4px solid #f59e0b",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            opacity: trustInView ? 1 : 0, transform: trustInView ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s ease 0.5s",
          }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#334155", lineHeight: 1.8, fontStyle: "italic", marginBottom: 20 }}>
              Instead of waiting for an alarm after the inverter stops, SuryaKiran flags it days before. The AI explanation told us exactly what to check. Maintenance was done in 2 hours instead of a full-day emergency shutdown.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>R</div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "#0f172a", fontSize: 14 }}>Rajesh Mehta</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#94a3b8", fontSize: 13 }}>Plant Operations Lead, 50 MW Solar Facility</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PLATFORM FEATURES — Tabbed Showcase
      ══════════════════════════════════════════════ */}
      <section id="features" ref={featRef} style={{ padding: "100px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#f59e0b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Platform Features</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(30px,4vw,50px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 14 }}>
              Everything inside the platform
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#94a3b8" }}>
              All features below are available after sign-in.
            </p>
          </div>

          <FeatureTabShowcase inView={featInView} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section ref={ctaRef} style={{ padding: "110px 5%", background: "linear-gradient(135deg,#07111f 0%,#0c1e35 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: "radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 65%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{
          maxWidth: 660, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1,
          opacity: ctaInView ? 1 : 0, transform: ctaInView ? "translateY(0)" : "translateY(32px)",
          transition: "all 0.9s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <div style={{ fontSize: 52, marginBottom: 24 }}>☀️</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(30px,4.5vw,54px)", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: 20 }}>
            Start monitoring your solar fleet{" "}
            <span style={{ background: "linear-gradient(135deg,#f59e0b,#fcd34d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>with AI.</span>
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#94a3b8", fontSize: 17, lineHeight: 1.8, marginBottom: 48 }}>
            Sign in to access the full SuryaKiran dashboard — risk predictions, AI explanations, alert management, and the GenAI copilot for your fleet.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="cta-primary" style={{ fontSize: 17 }} onClick={() => navigate('/login')}>Sign In to Dashboard →</button>
          </div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#334155", marginTop: 28 }}>
            No credit card required · Setup in minutes · Built for solar ops teams
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#020b14", padding: "36px 5%", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, borderTop: "1px solid #0f1f30" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#f59e0b,#d97706)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>☀️</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>Surya<span style={{ color: "#f59e0b" }}>Kiran</span></span>
        </div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#1e3a5f" }}>
          © 2026 SuryaKiran · HACKaMINeD · Built by Aubergine Solutions
        </span>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy", "Docs", "GitHub"].map(l => (
            <a key={l} className="nav-link" style={{ fontSize: 13, color: "#334155" }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
