import React, { useState, useMemo } from "react";

/*
  NextGen Notes — digital handwritten notes storefront
  Design language: an actual notebook. Ruled lines, red margin rule,
  torn-edge pages, a teacher's red-ink "verified" stamp as the signature
  element (Andy is a teacher — the stamp is literally his mark of approval).
  Palette: warm paper cream, notebook-rule blue, ink navy, stamp red, chalk gold.

  NEW: School notes are organised the way a real school subject file is —
  Class → Subject → Chapter. Only chapters that actually have a note added
  to PRODUCTS below will show up as buyable; every other chapter renders as
  an empty "folder" labelled Available soon, so students can always see the
  full syllabus map while you fill it in over time.
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
  folder: "#E7D9AE",
  folderLine: "#B99B57",
};

// ─────────────────────────────────────────────────────────────────────────
// PRODUCTS — every actual note pack you sell lives here. Add a new one any
// time, then reference its id from the CHAPTER_MAP or SCHOOL_CATALOG below
// (or from COMPETITIVE_CATALOG) so it slots into the right folder.
// ─────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────
// SCHOOL_CATALOG — the folder tree. Every class → every subject → every
// chapter (old-NCERT chapter names). "note" holds a PRODUCTS id if that
// chapter has been written up yet; leave it null and the UI shows the
// chapter as an empty "Available soon" folder automatically.
// ─────────────────────────────────────────────────────────────────────────
const chap = (title, note = null) => ({ title, note });

const SCHOOL_CATALOG = [
  {
    id: "class3-4",
    label: "Class 3–4",
    subjects: [
      {
        id: "gk",
        label: "General Knowledge",
        // flat subject — no chapter split, notes sit directly in the subject
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
          chap("Knowing Our Numbers"),
          chap("Whole Numbers"),
          chap("Playing with Numbers"),
          chap("Basic Geometrical Ideas"),
          chap("Understanding Elementary Shapes"),
          chap("Integers"),
          chap("Fractions", "sch-math-1"),
          chap("Decimals"),
          chap("Data Handling"),
          chap("Mensuration"),
          chap("Algebra"),
          chap("Ratio and Proportion"),
          chap("Symmetry"),
          chap("Practical Geometry"),
        ],
      },
      {
        id: "science",
        label: "Science",
        pinnedNote: "sch-sci-quick",
        chapters: [
          chap("Food: Where Does It Come From?"),
          chap("Components of Food"),
          chap("Fibre to Fabric"),
          chap("Sorting Materials into Groups"),
          chap("Separation of Substances"),
          chap("Changes Around Us"),
          chap("Getting to Know Plants"),
          chap("Body Movements"),
          chap("The Living Organisms and Their Surroundings"),
          chap("Motion and Measurement of Distances"),
          chap("Light, Shadows and Reflections"),
          chap("Electricity and Circuits"),
          chap("Fun with Magnets"),
          chap("Water"),
          chap("Air Around Us"),
          chap("Garbage In, Garbage Out"),
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
          chap("Integers"),
          chap("Fractions and Decimals"),
          chap("Data Handling"),
          chap("Simple Equations"),
          chap("Lines and Angles"),
          chap("The Triangle and its Properties"),
          chap("Congruence of Triangles"),
          chap("Comparing Quantities"),
          chap("Rational Numbers"),
          chap("Practical Geometry"),
          chap("Perimeter and Area"),
          chap("Algebraic Expressions"),
          chap("Exponents and Powers"),
          chap("Symmetry"),
          chap("Visualising Solid Shapes"),
        ],
      },
      {
        id: "science",
        label: "Science",
        pinnedNote: "sch-sci-quick",
        chapters: [
          chap("Nutrition in Plants"),
          chap("Nutrition in Animals"),
          chap("Fibre to Fabric"),
          chap("Heat"),
          chap("Acids, Bases and Salts"),
          chap("Physical and Chemical Changes"),
          chap("Weather, Climate and Adaptations of Animals to Climate"),
          chap("Winds, Storms and Cyclones"),
          chap("Soil"),
          chap("Respiration in Organisms"),
          chap("Transportation in Animals and Plants"),
          chap("Reproduction in Plants"),
          chap("Motion and Time"),
          chap("Electric Current and its Effects"),
          chap("Light"),
          chap("Water: A Precious Resource"),
          chap("Forests: Our Lifeline"),
          chap("Wastewater Story"),
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
          chap("Rational Numbers"),
          chap("Linear Equations in One Variable", "sch-math-2"),
          chap("Understanding Quadrilaterals"),
          chap("Practical Geometry"),
          chap("Data Handling"),
          chap("Squares and Square Roots"),
          chap("Cubes and Cube Roots"),
          chap("Comparing Quantities"),
          chap("Algebraic Expressions and Identities"),
          chap("Visualising Solid Shapes"),
          chap("Mensuration"),
          chap("Exponents and Powers"),
          chap("Direct and Inverse Proportions"),
          chap("Factorisation"),
          chap("Introduction to Graphs"),
          chap("Playing with Numbers"),
        ],
      },
      {
        id: "science",
        label: "Science",
        pinnedNote: "sch-sci-quick",
        chapters: [
          chap("Crop Production and Management"),
          chap("Microorganisms: Friend and Foe"),
          chap("Synthetic Fibres and Plastics"),
          chap("Materials: Metals and Non-Metals"),
          chap("Coal and Petroleum"),
          chap("Combustion and Flame"),
          chap("Conservation of Plants and Animals"),
          chap("Cell — Structure and Functions"),
          chap("Reproduction in Animals"),
          chap("Reaching the Age of Adolescence"),
          chap("Force and Pressure"),
          chap("Friction"),
          chap("Sound"),
          chap("Chemical Effects of Electric Current"),
          chap("Some Natural Phenomena"),
          chap("Light"),
          chap("Stars and the Solar System"),
          chap("Pollution of Air and Water"),
        ],
      },
    ],
  },
];

// Competitive stays a flat, subject-grouped list (not chapter-based —
// these exams don't follow one fixed textbook).
const COMPETITIVE_PRODUCTS = PRODUCTS.filter((p) => p.section === "Competitive");

// ─────────────────────────────────────────────────────────────────────────
// Small shared UI atoms
// ─────────────────────────────────────────────────────────────────────────

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

// Breadcrumb trail for the School folder tree
function Crumbs({ items, onJump }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
        marginBottom: 18,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12.5,
      }}
    >
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: COLORS.inkSoft }}>/</span>}
          {i === items.length - 1 ? (
            <span style={{ color: COLORS.margin, fontWeight: 700 }}>{it.label}</span>
          ) : (
            <button
              onClick={() => onJump(i)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: COLORS.ink,
                textDecoration: "underline",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12.5,
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

// A folder tile — used for Class and Subject levels, and for empty chapters
function FolderTile({ label, meta, onClick, dashed = false, accent = false }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        textAlign: "left",
        background: dashed ? "transparent" : COLORS.folder,
        border: dashed ? `1.5px dashed ${COLORS.inkSoft}77` : `1.5px solid ${COLORS.folderLine}`,
        borderRadius: 8,
        padding: "16px 16px 14px",
        cursor: onClick ? "pointer" : "default",
        fontFamily: "'Work Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minHeight: 92,
        position: "relative",
        opacity: dashed ? 0.75 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }} aria-hidden="true">
          {dashed ? "📁" : "🗂️"}
        </span>
        <span
          style={{
            fontFamily: "'Kalam', cursive",
            fontWeight: 700,
            fontSize: 16.5,
            color: dashed ? COLORS.inkSoft : COLORS.ink,
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: 12,
          color: dashed ? COLORS.inkSoft : COLORS.inkSoft,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {meta}
      </span>
      {accent && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: COLORS.margin,
          }}
          aria-hidden="true"
        />
      )}
    </button>
  );
}

// A compact note card — used for chapters / items that DO have a product
function NoteCard({ product, inCart, onAdd, onRemove, onPreview, pinned = false }) {
  return (
    <div
      style={{
        background: COLORS.paper,
        border: `1.5px solid ${pinned ? COLORS.gold : COLORS.paperDark}`,
        borderRadius: 8,
        padding: "14px 14px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "relative",
      }}
    >
      {pinned && (
        <span
          style={{
            position: "absolute",
            top: -9,
            left: 12,
            background: COLORS.gold,
            color: COLORS.paper,
            fontSize: 10.5,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 999,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.04em",
          }}
        >
          FULL SYLLABUS
        </span>
      )}
      <p
        style={{
          fontFamily: "'Kalam', cursive",
          fontWeight: 700,
          fontSize: 16.5,
          margin: 0,
          color: COLORS.ink,
          lineHeight: 1.25,
        }}
      >
        {product.title}
      </p>
      <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: 0 }}>
        {product.pages} pages · PDF
      </p>
      {product.preview && (
        <button
          onClick={() => onPreview(product.id)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: COLORS.margin,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "underline",
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          Preview sample pages →
        </button>
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
            borderRadius: 6,
            padding: "7px 13px",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {inCart ? "Added ✓" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main app
// ─────────────────────────────────────────────────────────────────────────

export default function NextGenNotes() {
  const [tab, setTab] = useState("School"); // School | Competitive
  const [cart, setCart] = useState([]);
  const [view, setView] = useState("store"); // store | checkout | delivered
  const [previewId, setPreviewId] = useState(null);
  const [contactMethod, setContactMethod] = useState("whatsapp");
  const [contactValue, setContactValue] = useState("");

  // School folder navigation: null → class list; classId set → subject list;
  // classId + subjectId set → chapter list
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
      return { total: subject.fla
