import React, { useState, useMemo } from "react";

/*
  NextGen Notes — digital handwritten notes storefront
  Design language: an actual notebook. Ruled lines, red margin rule,
  torn-edge pages, a teacher's red-ink "verified" stamp as the signature
  element (Andy is a teacher — the stamp is literally his mark of approval).
  Palette: warm paper cream, notebook-rule blue, ink navy, stamp red, chalk gold.
*/

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Work+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
`;

const COLORS = {
  paper: "#FBF6EA",
  paperDark: "#F1E9D6",
  rule: "#9FB4CE",
  margin: "#C1502E",
  ink: "#26324A",
  inkSoft: "#5B6478",
  gold: "#C79A2E",
  stampRed: "#B23A2E",
};

const PRODUCTS = [
  {
    id: "sch-gk-1",
    section: "School",
    subject: "General Knowledge",
    title: "500 GK Questions — Class 3–4",
    desc: "Animals & Plants, Science & Space, India & World, Sports, History & Culture.",
    pages: 48,
    price: 49,
    grade: "Class 3–4",
  },
  {
    id: "sch-math-1",
    section: "School",
    subject: "Mathematics",
    title: "Fractions Practice Set",
    desc: "Step-by-step worked fraction problems, built for daily tuition practice.",
    pages: 22,
    price: 39,
    grade: "Class 5–6",
  },
  {
    id: "sch-math-2",
    section: "School",
    subject: "Mathematics",
    title: "Class 8 Algebra Foundations",
    desc: "Digitally typed worked examples from linear equations to basic factorisation.",
    pages: 30,
    price: 59,
    grade: "Class 8",
  },
  {
    id: "sch-sci-1",
    section: "School",
    subject: "Science",
    title: "Class 6–8 Science Quick Notes",
    desc: "Diagram-heavy revision notes — physics, chemistry, biology basics.",
    pages: 40,
    price: 55,
    grade: "Class 6–8",
  },
  {
    id: "comp-ssc-numsys-1",
    section: "Competitive",
    subject: "SSC CGL Maths",
    title: "Number System — Complete Notes",
    desc: "Digitally typed notes covering the Number System topic for SSC CGL maths.",
    pages: 5,
    price: 29,
    grade: "SSC CGL",
    preview: [
      "1. NUMBER SYSTEM — BASICS",
      "",
      "Natural Numbers (N): 1, 2, 3, 4, 5, ...",
      "Whole Numbers (W): 0, 1, 2, 3, 4, ...",
      "Integers (Z): ..., -2, -1, 0, 1, 2, ...",
      "",
      "Rational Numbers: can be written as p/q, q ≠ 0",
      "Irrational Numbers: cannot be written as p/q",
      "  e.g. √2, √3, π",
      "",
      "2. DIVISIBILITY RULES",
      "",
      "Div. by 2  → last digit even",
      "Div. by 3  → sum of digits divisible by 3",
      "Div. by 9  → sum of digits divisible by 9",
      "Div. by 11 → (sum odd place - sum even place) = 0 or multiple of 11",
    ],
  },
  {
    id: "comp-ssc-1",
    section: "Competitive",
    subject: "SSC / Railway",
    title: "General Awareness Capsule",
    desc: "Digitally typed current-affairs + static GK capsule for SSC & Railway exams.",
    pages: 64,
    price: 89,
    grade: "Competitive",
  },
  {
    id: "comp-jssc-1",
    section: "Competitive",
    subject: "Jharkhand Exams",
    title: "Jharkhand GK Digital Notes",
    desc: "History, geography, culture and current schemes of Jharkhand state.",
    pages: 52,
    price: 79,
    grade: "Competitive",
  },
  {
    id: "comp-reason-1",
    section: "Competitive",
    subject: "Reasoning",
    title: "Reasoning Shortcuts Notebook",
    desc: "Digitally typed tricks and shortcuts for logical & analytical reasoning.",
    pages: 36,
    price: 69,
    grade: "Competitive",
  },
  {
    id: "sch-gk-2",
    section: "School",
    subject: "General Knowledge",
    title: "Sports & Games GK Booster",
    desc: "A focused set pulled from the 500-question GK bank, sports edition.",
    pages: 16,
    price: 25,
    grade: "Class 3–4",
  },
];

function Stamp({ size = 84 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `3px solid ${COLORS.stampRed}`,
        color: COLORS.stampRed,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "rotate(-11deg)",
        fontFamily: "'Kalam', cursive",
        fontWeight: 700,
        fontSize: size * 0.16,
        textAlign: "center",
        lineHeight: 1.05,
        opacity: 0.85,
        letterSpacing: "0.02em",
        flexShrink: 0,
        userSelect: "none",
      }}
      aria-hidden="true"
    >
      Andy<br />Verified
    </div>
  );
}

function RuledCard({ children, style = {}, className = "" }) {
  return (
    <div
      className={className}
      style={{
        background: COLORS.paper,
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent,
          transparent 27px,
          ${COLORS.rule}55 28px
        )`,
        borderRadius: 4,
        boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 8px 20px -12px rgba(38,50,74,0.35)",
        border: `1px solid ${COLORS.paperDark}`,
        position: "relative",
        paddingLeft: 22,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 10,
          top: 0,
          bottom: 0,
          width: 1.5,
          background: `${COLORS.margin}88`,
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

function TornEdge({ flip = false }) {
  return (
    <svg
      viewBox="0 0 400 16"
      preserveAspectRatio="none"
      style={{ width: "100%", height: 14, display: "block", transform: flip ? "rotate(180deg)" : "none" }}
    >
      <path
        d="M0,0 L0,10 L14,4 L28,12 L42,3 L56,11 L70,2 L84,10 L98,4 L112,12 L126,3 L140,11 L154,2 L168,10 L182,4 L196,12 L210,3 L224,11 L238,2 L252,10 L266,4 L280,12 L294,3 L308,11 L322,2 L336,10 L350,4 L364,12 L378,3 L392,11 L400,6 L400,0 Z"
        fill={COLORS.paper}
      />
    </svg>
  );
}

export default function NextGenNotes() {
  const [tab, setTab] = useState("School");
  const [cart, setCart] = useState([]);
  const [view, setView] = useState("store"); // store | checkout | delivered
  const [previewId, setPreviewId] = useState(null);
  const [contactMethod, setContactMethod] = useState("whatsapp");
  const [contactValue, setContactValue] = useState("");

  const filtered = useMemo(() => PRODUCTS.filter((p) => p.section === tab), [tab]);

  const total = cart.reduce((sum, id) => {
    const p = PRODUCTS.find((x) => x.id === id);
    return sum + (p ? p.price : 0);
  }, 0);

  function addToCart(id) {
    setCart((c) => (c.includes(id) ? c : [...c, id]));
  }
  function removeFromCart(id) {
    setCart((c) => c.filter((x) => x !== id));
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.paperDark,
        fontFamily: "'Work Sans', sans-serif",
        color: COLORS.ink,
      }}
    >
      <style>{FONTS}</style>

      {/* Header */}
      <header
        style={{
          background: COLORS.ink,
          color: COLORS.paper,
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            style={{
              fontFamily: "'Kalam', cursive",
              fontWeight: 700,
              fontSize: 26,
              color: COLORS.gold,
            }}
          >
            NextGen
          </span>
          <span style={{ fontSize: 15, letterSpacing: "0.14em", opacity: 0.8 }}>NOTES</span>
        </div>
        <button
          onClick={() => setView(view === "store" ? "checkout" : "store")}
          style={{
            background: "transparent",
            border: `1.5px solid ${COLORS.paper}66`,
            color: COLORS.paper,
            borderRadius: 6,
            padding: "8px 14px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Work Sans', sans-serif",
          }}
        >
          {view === "store" ? `Cart (${cart.length})` : "← Back to store"}
        </button>
      </header>

      {view === "store" && (
        <>
          {/* Hero */}
          <section
            style={{
              padding: "56px 24px 40px",
              maxWidth: 980,
              margin: "0 auto",
              display: "flex",
              gap: 40,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ flex: "1 1 380px" }}>
              <p
                style={{
                  color: COLORS.margin,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12.5,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                From a teacher's own notebook
              </p>
              <h1
                style={{
                  fontFamily: "'Kalam', cursive",
                  fontWeight: 700,
                  fontSize: "clamp(34px, 5vw, 52px)",
                  lineHeight: 1.15,
                  margin: "0 0 16px",
                  color: COLORS.ink,
                }}
              >
                Notes worth copying down twice.
              </h1>
              <p style={{ fontSize: 16.5, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 480 }}>
                Handwritten, exam-ready notes for school subjects and competitive exams —
                written the way a real tuition teacher explains it, not a textbook.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
                {["School", "Competitive"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      background: tab === t ? COLORS.margin : "transparent",
                      color: tab === t ? COLORS.paper : COLORS.ink,
                      border: `1.5px solid ${COLORS.margin}`,
                      borderRadius: 999,
                      padding: "9px 20px",
                      fontSize: 14.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Work Sans', sans-serif",
                    }}
                  >
                    {t} Notes
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 16 }}>
              <Stamp size={110} />
            </div>
          </section>

          {/* Product grid */}
          <section style={{ maxWidth: 980, margin: "0 auto", padding: "10px 24px 70px" }}>
            <h2
              style={{
                fontFamily: "'Kalam', cursive",
                fontSize: 24,
                color: COLORS.ink,
                marginBottom: 18,
              }}
            >
              {tab} Notes
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: 22,
              }}
            >
              {filtered.map((p) => {
                const inCart = cart.includes(p.id);
                return (
                  <div key={p.id} style={{ display: "flex", flexDirection: "column" }}>
                    <RuledCard style={{ padding: "18px 16px 16px" }}>
                      <p
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          color: COLORS.margin,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: 6,
                        }}
                      >
                        {p.subject} · {p.grade}
                      </p>
                      <h3
                        style={{
                          fontFamily: "'Kalam', cursive",
                          fontSize: 20,
                          fontWeight: 700,
                          margin: "0 0 8px",
                          color: COLORS.ink,
                          lineHeight: 1.25,
                        }}
                      >
                        {p.title}
                      </h3>
                      <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.5, minHeight: 54 }}>
                        {p.desc}
                      </p>
                      <p style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 4 }}>
                        {p.pages} pages · PDF
                      </p>
                      {p.preview && (
                        <button
                          onClick={() => setPreviewId(p.id)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            marginBottom: 10,
                            color: COLORS.margin,
                            fontSize: 12.5,
                            fontWeight: 600,
                            textDecoration: "underline",
                            cursor: "pointer",
                            display: "inline-block",
                          }}
                        >
                          Preview sample pages →
                        </button>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: 8,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 18,
                            fontWeight: 600,
                            color: COLORS.ink,
                          }}
                        >
                          ₹{p.price}
                        </span>
                        <button
                          onClick={() => (inCart ? removeFromCart(p.id) : addToCart(p.id))}
                          style={{
                            background: inCart ? COLORS.paperDark : COLORS.ink,
                            color: inCart ? COLORS.ink : COLORS.paper,
                            border: inCart ? `1px solid ${COLORS.inkSoft}55` : "none",
                            borderRadius: 6,
                            padding: "8px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {inCart ? "Added ✓" : "Add to cart"}
                        </button>
                      </div>
                    </RuledCard>
                    <TornEdge />
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {previewId && (() => {
        const p = PRODUCTS.find((x) => x.id === previewId);
        if (!p) return null;
        return (
          <div
            onClick={() => setPreviewId(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(38,50,74,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: COLORS.paper,
                borderRadius: 8,
                maxWidth: 460,
                width: "100%",
                maxHeight: "85vh",
                overflowY: "auto",
                boxShadow: "0 24px 60px -20px rgba(0,0,0,0.4)",
                position: "relative",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${COLORS.paperDark}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "sticky",
                  top: 0,
                  background: COLORS.paper,
                }}
              >
                <div>
                  <p style={{ fontFamily: "'Kalam', cursive", fontSize: 18, fontWeight: 700, margin: 0 }}>
                    {p.title}
                  </p>
                  <p style={{ fontSize: 11.5, color: COLORS.inkSoft, margin: "2px 0 0" }}>
                    Preview — page 1 of {p.pages}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewId(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 20,
                    color: COLORS.inkSoft,
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                  aria-label="Close preview"
                >
                  ×
                </button>
              </div>
              <RuledCard style={{ margin: 18, padding: "16px 14px" }}>
                {p.preview.map((line, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: "'Kalam', cursive",
                      fontSize: 15.5,
                      margin: "3px 0",
                      color: COLORS.ink,
                      minHeight: line === "" ? 8 : undefined,
                    }}
                  >
                    {line || "\u00A0"}
                  </p>
                ))}
              </RuledCard>
              <div
                style={{
                  padding: "0 20px 20px",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 12 }}>
                  This is a free sample — the full {p.pages}-page PDF unlocks after purchase.
                </p>
                <button
                  onClick={() => {
                    addToCart(p.id);
                    setPreviewId(null);
                  }}
                  style={{
                    background: COLORS.margin,
                    color: COLORS.paper,
                    border: "none",
                    borderRadius: 6,
                    padding: "10px 22px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'Kalam', cursive",
                  }}
                >
                  Add to cart — ₹{p.price}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {view === "checkout" && (
        <section style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>
          <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 28, marginBottom: 6 }}>
            Your order
          </h2>
          {cart.length === 0 ? (
            <p style={{ color: COLORS.inkSoft }}>Your cart is empty. Go back and pick a few notes.</p>
          ) : (
            <>
              <RuledCard style={{ padding: "18px 16px", marginBottom: 24 }}>
                {cart.map((id) => {
                  const p = PRODUCTS.find((x) => x.id === id);
                  return (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: `1px dashed ${COLORS.rule}88`,
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14.5 }}>{p.title}</p>
                        <p style={{ fontSize: 12.5, color: COLORS.inkSoft }}>{p.subject}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15 }}>
                          ₹{p.price}
                        </span>
                        <button
                          onClick={() => removeFromCart(id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: COLORS.margin,
                            fontSize: 12.5,
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: 14,
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  <span>Total</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>₹{total}</span>
                </div>
              </RuledCard>

              <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 20, marginBottom: 8 }}>
                Where should we send your notes?
              </h3>
              <p style={{ fontSize: 13.5, color: COLORS.inkSoft, marginBottom: 14 }}>
                After payment, your PDFs are delivered by hand — via WhatsApp or Telegram.
              </p>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                {["whatsapp", "telegram"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setContactMethod(m)}
                    style={{
                      flex: 1,
                      background: contactMethod === m ? COLORS.ink : "transparent",
                      color: contactMethod === m ? COLORS.paper : COLORS.ink,
                      border: `1.5px solid ${COLORS.ink}`,
                      borderRadius: 6,
                      padding: "10px 0",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={contactMethod === "whatsapp" ? "Your WhatsApp number" : "Your Telegram username"}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: 6,
                  border: `1.5px solid ${COLORS.rule}`,
                  fontSize: 14.5,
                  marginBottom: 20,
                  fontFamily: "'Work Sans', sans-serif",
                  boxSizing: "border-box",
                }}
              />

              <button
                disabled={!contactValue.trim()}
                onClick={() => setView("delivered")}
                style={{
                  width: "100%",
                  background: contactValue.trim() ? COLORS.margin : `${COLORS.margin}66`,
                  color: COLORS.paper,
                  border: "none",
                  borderRadius: 8,
                  padding: "14px 0",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: contactValue.trim() ? "pointer" : "not-allowed",
                  fontFamily: "'Kalam', cursive",
                }}
              >
                Pay ₹{total} & confirm order
              </button>
              <p style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 10, textAlign: "center" }}>
                Demo checkout — real payment (UPI/Razorpay) connects here once the site is live.
              </p>
            </>
          )}
        </section>
      )}

      {view === "delivered" && (
        <section
          style={{
            maxWidth: 520,
            margin: "0 auto",
            padding: "70px 24px",
            textAlign: "center",
          }}
        >
          <Stamp size={100} />
          <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 26, margin: "20px 0 8px" }}>
            Order confirmed!
          </h2>
          <p style={{ color: COLORS.inkSoft, fontSize: 14.5, lineHeight: 1.6 }}>
            We'll send your notes to your {contactMethod === "whatsapp" ? "WhatsApp" : "Telegram"}{" "}
            ({contactValue}) shortly after payment is verified.
          </p>
          <button
            onClick={() => {
              setCart([]);
              setContactValue("");
              setView("store");
            }}
            style={{
              marginTop: 24,
              background: COLORS.ink,
              color: COLORS.paper,
              border: "none",
              borderRadius: 8,
              padding: "12px 22px",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back to store
          </button>
        </section>
      )}

      <footer
        style={{
          background: COLORS.ink,
          color: `${COLORS.paper}bb`,
          padding: "22px 24px",
          textAlign: "center",
          fontSize: 12.5,
        }}
      >
        NextGen Notes — digitally made by a real teacher, in Sahibganj, Jharkhand.
      </footer>
    </div>
  );
}
