import React, { useMemo, useState } from "react";

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
  folder: "#E7D9AE",
  folderLine: "#B99B57",
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
    id: "sch-gk-2",
    section: "School",
    subject: "General Knowledge",
    title: "Sports & Games GK Booster",
    desc: "A focused set pulled from the 500-question GK bank, sports edition.",
    pages: 16,
    price: 25,
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
    grade: "Class 6",
  },
  {
    id: "sch-math-2",
    section: "School",
    subject: "Mathematics",
    title: "Linear Equations — Foundations",
    desc: "Digitally typed worked examples, from simple linear equations to word problems.",
    pages: 30,
    price: 59,
    grade: "Class 8",
  },
  {
    id: "sch-sci-quick",
    section: "School",
    subject: "Science",
    title: "Science Quick Revision Notes",
    desc: "Diagram-heavy revision notes spanning physics, chemistry & biology basics — handy across the whole year, not tied to one chapter.",
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
    subject: "General Awareness",
    title: "General Awareness Capsule",
    desc: "Digitally typed current-affairs + static GK capsule for SSC & Railway exams.",
    pages: 64,
    price: 89,
    grade: "Competitive",
  },
  {
    id: "comp-jssc-1",
    section: "Competitive",
    subject: "Jharkhand GK",
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
];

const productById = (id) => PRODUCTS.find((p) => p.id === id) || null;
const chap = (title, note = null) => ({ title, note });

const SCHOOL_CATALOG = [
  {
    id: "class3-4",
    label: "Class 3–4",
    subjects: [
      {
        id: "gk",
        label: "General Knowledge",
        flatNotes: ["sch-gk-1", "sch-gk-2"],
      },
    ],
  },
  {
    id: "class6",
    label: "Class 6",
    subjects: [
      {
        id: "maths",
        label: "Mathematics",
        chapters: [
          chap("Knowing Our Numbers"), chap("Whole Numbers"), chap("Playing with Numbers"),
          chap("Basic Geometrical Ideas"), chap("Understanding Elementary Shapes"), chap("Integers"),
          chap("Fractions", "sch-math-1"), chap("Decimals"), chap("Data Handling"),
          chap("Mensuration"), chap("Algebra"), chap("Ratio and Proportion"),
          chap("Symmetry"), chap("Practical Geometry"),
        ],
      },
      {
        id: "science",
        label: "Science",
        pinnedNote: "sch-sci-quick",
        chapters: [
          chap("Food: Where Does It Come From?"), chap("Components of Food"), chap("Fibre to Fabric"),
          chap("Sorting Materials into Groups"), chap("Separation of Substances"), chap("Changes Around Us"),
          chap("Getting to Know Plants"), chap("Body Movements"),
          chap("The Living Organisms and Their Surroundings"), chap("Motion and Measurement of Distances"),
          chap("Light, Shadows and Reflections"), chap("Electricity and Circuits"), chap("Fun with Magnets"),
          chap("Water"), chap("Air Around Us"), chap("Garbage In, Garbage Out"),
        ],
      },
    ],
  },
  {
    id: "class7",
    label: "Class 7",
    subjects: [
      {
        id: "maths",
        label: "Mathematics",
        chapters: [
          chap("Integers"), chap("Fractions and Decimals"), chap("Data Handling"), chap("Simple Equations"),
          chap("Lines and Angles"), chap("The Triangle and its Properties"), chap("Congruence of Triangles"),
          chap("Comparing Quantities"), chap("Rational Numbers"), chap("Practical Geometry"),
          chap("Perimeter and Area"), chap("Algebraic Expressions"), chap("Exponents and Powers"),
          chap("Symmetry"), chap("Visualising Solid Shapes"),
        ],
      },
      {
        id: "science",
        label: "Science",
        pinnedNote: "sch-sci-quick",
        chapters: [
          chap("Nutrition in Plants"), chap("Nutrition in Animals"), chap("Fibre to Fabric"), chap("Heat"),
          chap("Acids, Bases and Salts"), chap("Physical and Chemical Changes"),
          chap("Weather, Climate and Adaptations of Animals to Climate"),
          chap("Winds, Storms and Cyclones"), chap("Soil"), chap("Respiration in Organisms"),
          chap("Transportation in Animals and Plants"), chap("Reproduction in Plants"), chap("Motion and Time"),
          chap("Electric Current and its Effects"), chap("Light"), chap("Water: A Precious Resource"),
          chap("Forests: Our Lifeline"), chap("Wastewater Story"),
        ],
      },
    ],
  },
  {
    id: "class8",
    label: "Class 8",
    subjects: [
      {
        id: "maths",
        label: "Mathematics",
        chapters: [
          chap("Rational Numbers"), chap("Linear Equations in One Variable", "sch-math-2"),
          chap("Understanding Quadrilaterals"), chap("Practical Geometry"), chap("Data Handling"),
          chap("Squares and Square Roots"), chap("Cubes and Cube Roots"), chap("Comparing Quantities"),
          chap("Algebraic Expressions and Identities"), chap("Visualising Solid Shapes"), chap("Mensuration"),
          chap("Exponents and Powers"), chap("Direct and Inverse Proportions"), chap("Factorisation"),
          chap("Introduction to Graphs"), chap("Playing with Numbers"),
        ],
      },
      {
        id: "science",
        label: "Science",
        pinnedNote: "sch-sci-quick",
        chapters: [
          chap("Crop Production and Management"), chap("Microorganisms: Friend and Foe"),
          chap("Synthetic Fibres and Plastics"), chap("Materials: Metals and Non-Metals"),
          chap("Coal and Petroleum"), chap("Combustion and Flame"), chap("Conservation of Plants and Animals"),
          chap("Cell — Structure and Functions"), chap("Reproduction in Animals"),
          chap("Reaching the Age of Adolescence"), chap("Force and Pressure"), chap("Friction"),
          chap("Sound"), chap("Chemical Effects of Electric Current"), chap("Some Natural Phenomena"),
          chap("Light"), chap("Stars and the Solar System"), chap("Pollution of Air and Water"),
        ],
      },
    ],
  },
];

const COMPETITIVE_PRODUCTS = PRODUCTS.filter((p) => p.section === "Competitive");

function Stamp({ size = 84 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        border: `3px solid ${COLORS.stampRed}`, color: COLORS.stampRed,
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: "rotate(-11deg)", fontFamily: "'Kalam', cursive",
        fontWeight: 700, fontSize: size * 0.16, textAlign: "center",
        lineHeight: 1.05, opacity: 0.85, letterSpacing: "0.02em",
        flexShrink: 0, userSelect: "none",
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
        backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 27px, ${COLORS.rule}55 28px)`,
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
          position: "absolute", left: 10, top: 0, bottom: 0, width: 1.5,
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
    <svg viewBox="0 0 400 16" preserveAspectRatio="none"
      style={{ width: "100%", height: 14, display: "block", transform: flip ? "rotate(180deg)" : "none" }}>
      <path
        d="M0,0 L0,10 L14,4 L28,12 L42,3 L56,11 L70,2 L84,10 L98,4 L112,12 L126,3 L140,11 L154,2 L168,10 L182,4 L196,12 L210,3 L224,11 L238,2 L252,10 L266,4 L280,12 L294,3 L308,11 L322,2 L336,10 L350,4 L364,12 L378,3 L392,11 L400,6 L400,0 Z"
        fill={COLORS.paper}
      />
    </svg>
  );
}

function Crumbs({ items, onJump }) {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 18,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5,
    }}>
      {items.map((it, i) => (
        <React.Fragment key={`${it.label}-${i}`}>
          {i > 0 && <span style={{ color: COLORS.inkSoft }}>/</span>}
          {i === items.length - 1 ? (
            <span style={{ color: COLORS.margin, fontWeight: 700 }}>{it.label}</span>
          ) : (
            <button
              onClick={() => onJump(i)}
              style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                color: COLORS.ink, textDecoration: "underline",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5,
              }}
            >
              {it.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function FolderTile({ label, meta, onClick, dashed = false, accent = false }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        textAlign: "left",
        background: dashed ? "transparent" : COLORS.folder,
        border: dashed ? `1.5px dashed ${COLORS.inkSoft}77` : `1.5px solid ${COLORS.folderLine}`,
        borderRadius: 8, padding: "16px 16px 14px",
        cursor: onClick ? "pointer" : "default",
        fontFamily: "'Work Sans', sans-serif", display: "flex",
        flexDirection: "column", gap: 6, minHeight: 92, position: "relative",
        opacity: dashed ? 0.75 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }} aria-hidden="true">{dashed ? "📁" : "🗂️"}</span>
        <span style={{
          fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 16.5,
          color: dashed ? COLORS.inkSoft : COLORS.ink,
        }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, color: COLORS.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
        {meta}
      </span>
      {accent && (
        <span style={{
          position: "absolute", top: 10, right: 10, width: 8, height: 8,
          borderRadius: "50%", background: COLORS.margin,
        }} aria-hidden="true" />
      )}
    </button>
  );
}

function NoteCard({ product, inCart, onAdd, onRemove, onPreview, pinned = false }) {
  return (
    <div style={{
      background: COLORS.paper,
      border: `1.5px solid ${pinned ? COLORS.gold : COLORS.paperDark}`,
      borderRadius: 8, padding: "14px 14px 12px",
      display: "flex", flexDirection: "column", gap: 6, position: "relative",
    }}>
      {pinned && (
        <span style={{
          position: "absolute", top: -9, left: 12, background: COLORS.gold,
          color: COLORS.paper, fontSize: 10.5, fontWeight: 700,
          padding: "2px 8px", borderRadius: 999,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em",
        }}>FULL SYLLABUS</span>
      )}
      <p style={{
        fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 16.5,
        margin: 0, color: COLORS.ink, lineHeight: 1.25,
      }}>{product.title}</p>
      <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: 0 }}>{product.pages} pages · PDF</p>
      <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: "2px 0 4px", lineHeight: 1.45 }}>
        {product.desc}
      </p>
      {product.preview && (
        <button
          onClick={() => onPreview(product.id)}
          style={{
            background: "none", border: "none", padding: 0, color: COLORS.margin,
            fontSize: 12, fontWeight: 600, textDecoration: "underline",
            cursor: "pointer", alignSelf: "flex-start",
          }}
        >Preview sample pages →</button>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16.5, fontWeight: 600 }}>
          ₹{product.price}
        </span>
        <button
          onClick={() => (inCart ? onRemove(product.id) : onAdd(product.id))}
          style={{
            background: inCart ? COLORS.paperDark : COLORS.ink,
            color: inCart ? COLORS.ink : COLORS.paper,
            border: inCart ? `1px solid ${COLORS.inkSoft}55` : "none",
            borderRadius: 6, padding: "7px 13px", fontSize: 12.5,
            fontWeight: 600, cursor: "pointer",
          }}
        >{inCart ? "Added ✓" : "Add to cart"}</button>
      </div>
    </div>
  );
}

export default function NextGenNotes() {
  const [tab, setTab] = useState("School");
  const [cart, setCart] = useState([]);
  const [view, setView] = useState("store");
  const [previewId, setPreviewId] = useState(null);
  const [contactMethod, setContactMethod] = useState("whatsapp");
  const [contactValue, setContactValue] = useState("");
  const [classId, setClassId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);

  const total = cart.reduce((sum, id) => {
    const p = productById(id);
    return sum + (p ? p.price : 0);
  }, 0);

  function addToCart(id) {
    setCart((c) => (c.includes(id) ? c : [...c, id]));
  }

  function removeFromCart(id) {
    setCart((c) => c.filter((x) => x !== id));
  }

  function goSchoolRoot() {
    setClassId(null);
    setSubjectId(null);
  }

  function selectTab(t) {
    setTab(t);
    goSchoolRoot();
  }

  const currentClass = useMemo(
    () => SCHOOL_CATALOG.find((c) => c.id === classId) || null,
    [classId]
  );

  const currentSubject = useMemo(
    () => (currentClass ? currentClass.subjects.find((s) => s.id === subjectId) : null),
    [currentClass, subjectId]
  );

  function subjectStats(subject) {
    if (subject.flatNotes) {
      const available = subject.flatNotes.map(productById).filter(Boolean).length;
      return { total: subject.flatNotes.length, available };
    }
    const chapters = subject.chapters || [];
    return {
      total: chapters.length,
      available: chapters.filter((chapter) => Boolean(chapter.note)).length,
    };
  }

  function handleCheckout() {
    if (cart.length) setView("checkout");
  }

  function submitOrder(e) {
    e.preventDefault();
    setView("delivered");
  }

  function jumpTo(index) {
    if (index === 0) {
      goSchoolRoot();
    } else if (index === 1) {
      setSubjectId(null);
    }
  }

  const inCart = (id) => cart.includes(id);
  const previewProduct = productById(previewId);

  const pageStyle = {
    minHeight: "100vh",
    background: "#E9E0CC",
    color: COLORS.ink,
    fontFamily: "'Work Sans', sans-serif",
    padding: "22px 14px 50px",
  };

  const shellStyle = {
    maxWidth: 1120,
    margin: "0 auto",
    background: COLORS.paper,
    boxShadow: "0 16px 50px rgba(38,50,74,0.16)",
    border: `1px solid ${COLORS.paperDark}`,
    overflow: "hidden",
  };

  return (
    <div style={pageStyle}>
      <style>{FONTS}{`
        * { box-sizing: border-box; }
        button { -webkit-tap-highlight-color: transparent; }
        button:focus-visible, input:focus-visible { outline: 2px solid ${COLORS.margin}; outline-offset: 2px; }
        .ng-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
        @media (max-width: 760px) { .ng-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width: 520px) { .ng-grid { grid-template-columns:1fr; } }
        .ng-header { display:flex; align-items:center; justify-content:space-between; gap:18px; }
        @media (max-width: 650px) { .ng-header { align-items:flex-start; flex-direction:column; } }
        .ng-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
      `}</style>

      <div style={shellStyle}>
        <TornEdge />
        <header style={{ padding: "18px 22px 16px" }}>
          <div className="ng-header">
            <div>
              <div style={{
                fontFamily: "'Kalam', cursive", fontSize: 30, fontWeight: 700,
                lineHeight: 1, color: COLORS.ink,
              }}>NextGen Notes</div>
              <div style={{
                marginTop: 7, fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11.5, color: COLORS.inkSoft,
              }}>DIGITAL NOTEBOOK · LEARN SMARTER</div>
            </div>
            <div className="ng-actions">
              <button
                onClick={() => setView("store")}
                style={{
                  background: COLORS.paper, border: `1px solid ${COLORS.inkSoft}55`,
                  borderRadius: 7, padding: "8px 12px", cursor: "pointer",
                  fontWeight: 600, color: COLORS.ink,
                }}
              >Store</button>
              <button
                onClick={handleCheckout}
                style={{
                  background: cart.length ? COLORS.ink : COLORS.paperDark,
                  color: cart.length ? COLORS.paper : COLORS.inkSoft,
                  border: "none", borderRadius: 7, padding: "8px 12px",
                  cursor: cart.length ? "pointer" : "default", fontWeight: 700,
                }}
              >🛒 Cart {cart.length ? `(${cart.length})` : ""}</button>
              <Stamp size={62} />
            </div>
          </div>
        </header>

        {view === "store" && (
          <>
            <div style={{
              margin: "0 22px", borderTop: `1px solid ${COLORS.rule}88`,
              borderBottom: `1px solid ${COLORS.rule}88`,
              display: "flex", gap: 4,
            }}>
              {["School", "Competitive"].map((name) => (
                <button
                  key={name}
                  onClick={() => selectTab(name)}
                  style={{
                    flex: 1, maxWidth: 180, padding: "11px 10px",
                    border: "none", borderBottom: `3px solid ${tab === name ? COLORS.margin : "transparent"}`,
                    background: "transparent", color: tab === name ? COLORS.margin : COLORS.inkSoft,
                    fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 17, cursor: "pointer",
                  }}
                >{name}</button>
              ))}
            </div>

            <main style={{ padding: "24px 22px 34px" }}>
              {tab === "School" ? (
                <>
                  <RuledCard style={{ padding: "20px 20px 20px 28px", marginBottom: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center" }}>
                      <div>
                        <div style={{
                          fontFamily: "'Kalam', cursive", fontSize: 25, fontWeight: 700,
                          marginBottom: 4,
                        }}>School Notes</div>
                        <div style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.55 }}>
                          Browse by Class → Subject → Chapter. Unwritten chapters stay visible as “Available soon”.
                        </div>
                      </div>
                      <span style={{ fontSize: 28 }} aria-hidden="true">📚</span>
                    </div>
                  </RuledCard>

                  {classId === null && (
                    <>
                      <Crumbs items={[{ label: "School" }]} onJump={jumpTo} />
                      <div className="ng-grid">
                        {SCHOOL_CATALOG.map((c) => {
                          const count = c.subjects.reduce((n, s) => n + subjectStats(s).available, 0);
                          return (
                            <FolderTile
                              key={c.id}
                              label={c.label}
                              meta={`${c.subjects.length} subject${c.subjects.length === 1 ? "" : "s"} · ${count} note${count === 1 ? "" : "s"} ready`}
                              onClick={() => { setClassId(c.id); setSubjectId(null); }}
                              accent={count > 0}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}

                  {classId !== null && subjectId === null && currentClass && (
                    <>
                      <Crumbs
                        items={[{ label: "School" }, { label: currentClass.label }]}
                        onJump={jumpTo}
                      />
                      <div className="ng-grid">
                        {currentClass.subjects.map((s) => {
                          const stats = subjectStats(s);
                          return (
                            <FolderTile
                              key={s.id}
                              label={s.label}
                              meta={`${stats.available}/${stats.total} notes available`}
                              onClick={() => setSubjectId(s.id)}
                              accent={stats.available > 0}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}

                  {classId !== null && subjectId !== null && currentClass && currentSubject && (
                    <>
                      <Crumbs
                        items={[
                          { label: "School" },
                          { label: currentClass.label },
                          { label: currentSubject.label },
                        ]}
                        onJump={jumpTo}
                      />

                      {currentSubject.flatNotes ? (
                        <div className="ng-grid">
                          {currentSubject.flatNotes.map((id) => {
                            const product = productById(id);
                            return product ? (
                              <NoteCard key={id} product={product} inCart={inCart(id)}
                                onAdd={addToCart} onRemove={removeFromCart} onPreview={setPreviewId} />
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <>
                          {currentSubject.pinnedNote && productById(currentSubject.pinnedNote) && (
                            <div style={{ marginBottom: 22 }}>
                              <NoteCard
                                product={productById(currentSubject.pinnedNote)}
                                pinned
                                inCart={inCart(currentSubject.pinnedNote)}
                                onAdd={addToCart}
                                onRemove={removeFromCart}
                                onPreview={setPreviewId}
                              />
                            </div>
                          )}
                          <div className="ng-grid">
                            {currentSubject.chapters.map((chapter) => {
                              const product = productById(chapter.note);
                              return product ? (
                                <NoteCard key={chapter.title} product={product}
                                  inCart={inCart(product.id)} onAdd={addToCart}
                                  onRemove={removeFromCart} onPreview={setPreviewId} />
                              ) : (
                                <FolderTile
                                  key={chapter.title}
                                  label={chapter.title}
                                  meta="Available soon"
                                  dashed
                                />
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <RuledCard style={{ padding: "20px 20px 20px 28px", marginBottom: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center" }}>
                      <div>
                        <div style={{
                          fontFamily: "'Kalam', cursive", fontSize: 25, fontWeight: 700,
                          marginBottom: 4,
                        }}>Competitive Exams</div>
                        <div style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.55 }}>
                          Exam-focused digital notes for SSC, Railway and state-level preparation.
                        </div>
                      </div>
                      <span style={{ fontSize: 28 }} aria-hidden="true">✍️</span>
                    </div>
                  </RuledCard>
                  <div className="ng-grid">
                    {COMPETITIVE_PRODUCTS.map((product) => (
                      <NoteCard key={product.id} product={product} inCart={inCart(product.id)}
                        onAdd={addToCart} onRemove={removeFromCart} onPreview={setPreviewId} />
                    ))}
                  </div>
                </>
              )}
            </main>
          </>
        )}

        {view === "checkout" && (
          <main style={{ padding: "28px 22px 38px" }}>
            <Crumbs items={[{ label: "Store" }, { label: "Checkout" }]} onJump={() => setView("store")} />
            <RuledCard style={{ padding: "22px 22px 22px 30px" }}>
              <h2 style={{ fontFamily: "'Kalam', cursive", margin: "0 0 18px", fontSize: 27 }}>
                Your order
              </h2>
              <div style={{ display: "grid", gap: 10 }}>
                {cart.map((id) => {
                  const p = productById(id);
                  return p ? (
                    <div key={id} style={{
                      display: "flex", justifyContent: "space-between", gap: 12,
                      padding: "10px 0", borderBottom: `1px dashed ${COLORS.rule}`,
                    }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{p.pages} pages · {p.grade}</div>
                      </div>
                      <strong>₹{p.price}</strong>
                    </div>
                  ) : null;
                })}
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", marginTop: 18,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 18,
              }}>
                <span>Total</span><strong>₹{total}</strong>
              </div>

              <form onSubmit={submitOrder} style={{ marginTop: 24, display: "grid", gap: 12, maxWidth: 560 }}>
                <label style={{ fontWeight: 700 }}>Delivery contact</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["whatsapp", "email"].map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setContactMethod(method)}
                      style={{
                        border: `1px solid ${contactMethod === method ? COLORS.margin : COLORS.inkSoft}55`,
                        background: contactMethod === method ? `${COLORS.margin}12` : COLORS.paper,
                        color: contactMethod === method ? COLORS.margin : COLORS.ink,
                        borderRadius: 6, padding: "8px 12px", cursor: "pointer",
                        fontWeight: 700, textTransform: "capitalize",
                      }}
                    >{method}</button>
                  ))}
                </div>
                <input
                  required
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={contactMethod === "whatsapp" ? "WhatsApp number" : "Email address"}
                  style={{
                    padding: "11px 12px", borderRadius: 7,
                    border: `1px solid ${COLORS.inkSoft}55`,
                    background: "#fffdf8", fontSize: 14,
                  }}
                />
                <button type="submit" style={{
                  border: "none", background: COLORS.ink, color: COLORS.paper,
                  borderRadius: 7, padding: "11px 15px", cursor: "pointer",
                  fontWeight: 700, width: "fit-content",
                }}>Place order</button>
              </form>
            </RuledCard>
          </main>
        )}

        {view === "delivered" && (
          <main style={{ padding: "40px 22px 55px" }}>
            <RuledCard style={{ padding: "30px 24px 30px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
              <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 30, margin: "0 0 8px" }}>
                Order received!
              </h2>
              <p style={{ color: COLORS.inkSoft, maxWidth: 520, margin: "0 auto 20px", lineHeight: 1.6 }}>
                Your selected digital notes are ready for delivery to the contact you provided.
              </p>
              <button
                onClick={() => { setView("store"); setCart([]); setContactValue(""); }}
                style={{
                  border: "none", background: COLORS.ink, color: COLORS.paper,
                  borderRadius: 7, padding: "10px 16px", cursor: "pointer", fontWeight: 700,
                }}
              >Back to store</button>
            </RuledCard>
          </main>
        )}

        <TornEdge flip />
      </div>

      {previewProduct && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewId(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(20,28,42,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 18, zIndex: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(680px, 100%)", maxHeight: "85vh", overflow: "auto",
              background: COLORS.paper, borderRadius: 10, padding: "24px 24px 26px",
              boxShadow: "0 24px 70px rgba(0,0,0,0.3)",
              backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 27px, ${COLORS.rule}44 28px)`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 24, margin: 0 }}>
                {previewProduct.title}
              </h3>
              <button onClick={() => setPreviewId(null)} style={{
                border: "none", background: COLORS.paperDark, borderRadius: 6,
                padding: "7px 10px", cursor: "pointer", fontWeight: 700,
              }}>Close</button>
            </div>
            <pre style={{
              whiteSpace: "pre-wrap", fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13, lineHeight: 1.65, marginTop: 22, color: COLORS.ink,
            }}>
              {(previewProduct.preview || ["Sample preview is not available for this product."]).join("\n")}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
