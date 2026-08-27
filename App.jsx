import React, { useState, useMemo } from "react";

/*
  NextGen Notes — digital handwritten notes storefront
  Design language: an actual notebook. Ruled lines, red margin rule,
  torn-edge pages, a teacher's red-ink "verified" stamp as the signature
  element. Palette: warm paper cream, notebook-rule blue, ink navy,
  stamp red, chalk gold.

  STRUCTURE
  ---------
  School notes are organised as real folders:
    Class  →  Subject  →  Chapter
  Every chapter is a "folder". If you've added a note for that chapter,
  it shows the note card. If not, it shows an "Available soon" empty page —
  nothing fake, nothing demo, just real folders waiting to be filled.

  HOW TO ADD A NOTE
  ------------------
  Scroll down to the PRODUCTS array near the bottom of the data section.
  Add one object per note, e.g.:

  {
    id: "c6-maths-knowing-numbers",
    class: "Class 6",
    subject: "Maths",
    chapter: "Knowing Our Numbers",
    title: "Knowing Our Numbers — Complete Notes",
    desc: "Digitally typed notes with solved examples.",
    pages: 8,
    price: 29,
  }

  The "class", "subject" and "chapter" values MUST exactly match an entry
  in the CATALOG below (spelling included) — that's how the note finds
  its folder. Everything else (title, desc, pages, price) is up to you.

  HOW TO ADD A NEW CLASS / SUBJECT / CHAPTER
  --------------------------------------------
  Edit the CATALOG object below. Add a new class key, or a new subject
  inside a class, or a new chapter inside a subject's array. The folder
  UI builds itself from this automatically — you never touch the UI code.
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

/* ======================================================================
   CATALOG — the folder tree. Old-NCERT-based chapter names.
   Double-check these against the current syllabus before publishing —
   NCERT revises chapter names/numbers from time to time, and this list
   was written from memory, not copied from an official source.
   Add more classes/subjects/chapters here any time — the UI adapts
   automatically.
   ====================================================================== */
const CATALOG = {
  "Class 6": {
    Maths: [
      "Knowing Our Numbers", "Whole Numbers", "Playing with Numbers",
      "Basic Geometrical Ideas", "Understanding Elementary Shapes", "Integers",
      "Fractions", "Decimals", "Data Handling", "Mensuration", "Algebra",
      "Ratio and Proportion", "Symmetry", "Practical Geometry",
    ],
    Science: [
      "Food: Where Does It Come From?", "Components of Food", "Fibre to Fabric",
      "Sorting Materials into Groups", "Separation of Substances", "Changes Around Us",
      "Getting to Know Plants", "Body Movements", "The Living Organisms and Their Surroundings",
      "Motion and Measurement of Distances", "Light, Shadows and Reflections",
      "Electricity and Circuits", "Fun with Magnets", "Water", "Air Around Us",
      "Garbage In, Garbage Out",
    ],
    History: [
      "What, Where, How and When?", "From Hunting–Gathering to Growing Food",
      "In the Earliest Cities", "What Books and Burials Tell Us",
      "Kingdoms, Kings and an Early Republic", "New Questions and Ideas",
      "From a Kingdom to an Empire", "Villages, Towns and Trade",
      "New Empires and Kingdoms", "Buildings, Paintings and Books",
    ],
    Geography: [
      "The Earth in the Solar System", "Globe: Latitudes and Longitudes",
      "Motions of the Earth", "Maps", "Major Domains of the Earth",
      "Major Landforms of the Earth", "Our Country – India",
      "India: Climate, Vegetation and Wildlife",
    ],
    Civics: [
      "Understanding Diversity", "Diversity and Discrimination", "What is Government?",
      "Key Elements of a Democratic Government", "Panchayati Raj", "Rural Administration",
      "Urban Administration", "Rural Livelihoods", "Urban Livelihoods",
    ],
  },
  "Class 7": {
    Maths: [
      "Integers", "Fractions and Decimals", "Data Handling", "Simple Equations",
      "Lines and Angles", "The Triangle and its Properties", "Congruence of Triangles",
      "Comparing Quantities", "Rational Numbers", "Practical Geometry",
      "Perimeter and Area", "Algebraic Expressions", "Exponents and Powers",
      "Symmetry", "Visualising Solid Shapes",
    ],
    Science: [
      "Nutrition in Plants", "Nutrition in Animals", "Fibre to Fabric", "Heat",
      "Acids, Bases and Salts", "Physical and Chemical Changes",
      "Weather, Climate and Adaptations of Animals to Climate",
      "Winds, Storms and Cyclones", "Soil", "Respiration in Organisms",
      "Transportation in Animals and Plants", "Reproduction in Plants",
      "Motion and Time", "Electric Current and its Effects", "Light",
      "Water: A Precious Resource", "Forests: Our Lifeline", "Wastewater Story",
    ],
    History: [
      "Tracing Changes Through A Thousand Years", "New Kings and Kingdoms",
      "The Delhi Sultans", "The Mughal Empire", "Rulers and Buildings",
      "Towns, Traders and Craftspersons", "Tribes, Nomads and Settled Communities",
      "Devotional Paths to the Divine", "The Making of Regional Cultures",
      "Eighteenth-Century Political Formations",
    ],
    Geography: [
      "Environment", "Inside Our Earth", "Our Changing Earth", "Air", "Water",
      "Natural Vegetation and Wildlife",
      "Human Environment – Settlement, Transport and Communication",
      "Human Environment Interactions – The Tropical and Subtropical Region",
      "Life in the Deserts",
    ],
    Civics: [
      "On Equality", "Role of the Government in Health", "How the State Government Works",
      "Growing up as Boys and Girls", "Women Change the World", "Understanding Media",
      "Understanding Advertising", "Markets Around Us", "A Shirt in the Market",
    ],
  },
  "Class 8": {
    Maths: [
      "Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals",
      "Practical Geometry", "Data Handling", "Squares and Square Roots",
      "Cubes and Cube Roots", "Comparing Quantities", "Algebraic Expressions and Identities",
      "Visualising Solid Shapes", "Mensuration", "Exponents and Powers",
      "Direct and Inverse Proportions", "Factorisation", "Introduction to Graphs",
      "Playing with Numbers",
    ],
    Science: [
      "Crop Production and Management", "Microorganisms: Friend and Foe",
      "Synthetic Fibres and Plastics", "Materials: Metals and Non-Metals",
      "Coal and Petroleum", "Combustion and Flame", "Conservation of Plants and Animals",
      "Cell — Structure and Functions", "Reproduction in Animals",
      "Reaching the Age of Adolescence", "Force and Pressure", "Friction", "Sound",
      "Chemical Effects of Electric Current", "Some Natural Phenomena", "Light",
      "Stars and the Solar System", "Pollution of Air and Water",
    ],
    History: [
      "How, When and Where", "From Trade to Territory", "Ruling the Countryside",
      "Tribals, Dikus and the Vision of a Golden Age", "When People Rebel: 1857 and After",
      "Weavers, Iron Smelters and Factory Owners",
      "Civilising the \u201cNative\u201d, Educating the Nation", "Women, Caste and Reform",
      "The Making of the National Movement: 1870s–1947", "India After Independence",
    ],
    Geography: [
      "Resources", "Land, Soil, Water, Natural Vegetation and Wildlife Resources",
      "Mineral and Power Resources", "Agriculture", "Industries", "Human Resources",
    ],
    Civics: [
      "The Indian Constitution", "Understanding Secularism", "Why Do We Need a Parliament?",
      "Understanding Laws", "Judiciary", "Understanding Our Criminal Justice System",
      "Understanding Marginalisation", "Confronting Marginalisation", "Public Facilities",
      "Law and Social Justice",
    ],
  },
};

const COMPETITIVE_SECTIONS = [
  "SSC CGL Maths", "SSC / Railway", "Jharkhand Exams", "Reasoning",
];

/* ======================================================================
   PRODUCTS — start empty on purpose. Every note you add here slots
   itself into the right Class → Subject → Chapter folder automatically,
   or into the right Competitive section.
   ====================================================================== */
const PRODUCTS = [
  // School note example (delete the // once you use it for real):
  // {
  //   id: "c6-maths-knowing-numbers",
  //   class: "Class 6",
  //   subject: "Maths",
  //   chapter: "Knowing Our Numbers",
  //   title: "Knowing Our Numbers — Complete Notes",
  //   desc: "Digitally typed notes with solved examples.",
  //   pages: 8,
  //   price: 29,
  // },

  // Competitive note example:
  // {
  //   id: "comp-ssc-numsys-1",
  //   competitiveSection: "SSC CGL Maths",
  //   title: "Number System — Complete Notes",
  //   desc: "Digitally typed notes covering the Number System topic.",
  //   pages: 5,
  //   price: 29,
  // },
];

function findChapterProduct(cls, subject, chapter) {
  return PRODUCTS.find(
    (p) => p.class === cls && p.subject === subject && p.chapter === chapter
  );
}

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
      Andy
      <br />
      Verified
    </div>
  );
}

function RuledCard({ children, style = {}, className = "", onClick }) {
  return (
    <div
      className={className}
      onClick={onClick}
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
        cursor: onClick ? "pointer" : "default",
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

function TornEdge() {
  return (
    <svg
      viewBox="0 0 400 16"
      preserveAspectRatio="none"
      style={{ width: "100%", height: 14, display: "block" }}
    >
      <path
        d="M0,0 L0,10 L14,4 L28,12 L42,3 L56,11 L70,2 L84,10 L98,4 L112,12 L126,3 L140,11 L154,2 L168,10 L182,4 L196,12 L210,3 L224,11 L238,2 L252,10 L266,4 L280,12 L294,3 L308,11 L322,2 L336,10 L350,4 L364,12 L378,3 L392,11 L400,6 L400,0 Z"
        fill={COLORS.paper}
      />
    </svg>
  );
}

/* Breadcrumb trail so students always know where they are */
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
          <button
            onClick={() => onJump(i)}
            disabled={i === items.length - 1}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: i === items.length - 1 ? "default" : "pointer",
              color: i === items.length - 1 ? COLORS.ink : COLORS.margin,
              fontWeight: i === items.length - 1 ? 700 : 500,
              textDecoration: i === items.length - 1 ? "none" : "underline",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12.5,
            }}
          >
            {it}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

/* A generic folder tile — used for both Class and Subject levels */
function FolderTile({ label, sublabel, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: COLORS.paper,
        border: `1.5px solid ${COLORS.paperDark}`,
        borderLeft: `4px solid ${COLORS.margin}`,
        borderRadius: 6,
        padding: "16px 16px",
        textAlign: "left",
        cursor: "pointer",
        boxShadow: "0 6px 16px -10px rgba(38,50,74,0.35)",
        fontFamily: "'Work Sans', sans-serif",
      }}
    >
      <div
        style={{
          fontFamily: "'Kalam', cursive",
          fontSize: 19,
          fontWeight: 700,
          color: COLORS.ink,
          marginBottom: sublabel ? 4 : 0,
        }}
      >
        📁 {label}
      </div>
      {sublabel && (
        <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{sublabel}</div>
      )}
    </button>
  );
}

/* A chapter folder — shows the note if one exists, else "Available soon" */
function ChapterFolder({ chapter, product, inCart, onAdd, onRemove }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <RuledCard style={{ padding: "16px 14px 14px" }}>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10.5,
            color: COLORS.margin,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          Chapter
        </p>
        <h4
          style={{
            fontFamily: "'Kalam', cursive",
            fontSize: 17,
            fontWeight: 700,
            margin: "0 0 10px",
            color: COLORS.ink,
            lineHeight: 1.25,
          }}
        >
          {chapter}
        </h4>

        {product ? (
          <>
            <p style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5, minHeight: 40 }}>
              {product.desc}
            </p>
            <p style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 10 }}>
              {product.pages} pages · PDF
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 16,
                  fontWeight: 600,
                  color: COLORS.ink,
                }}
              >
                ₹{product.price}
              </span>
              <button
                onClick={() => (inCart ? onRemove(product.id) : onAdd(product.id))}
                style={{
                  background: inCart ? COLORS.paperDark : COLORS.ink,
                  color: inCart ? COLORS.ink : COLORS.paper,
                  border: inCart ? `1px solid ${COLORS.inkSoft}55` : "none",
                  borderRadius: 6,
                  padding: "7px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {inCart ? "Added ✓" : "Add to cart"}
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              border: `1.5px dashed ${COLORS.inkSoft}66`,
              borderRadius: 6,
              padding: "18px 10px",
              textAlign: "center",
              minHeight: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'Kalam', cursive",
                fontSize: 14.5,
                color: COLORS.inkSoft,
                margin: 0,
              }}
            >
              Available soon
            </p>
          </div>
        )}
      </RuledCard>
      <TornEdge />
    </div>
  );
}

export default function NextGenNotes() {
  const [tab, setTab] = useState("School");
  const [cart, setCart] = useState([]);
  const [view, setView] = useState("store"); // store | checkout
  const [contactMethod, setContactMethod] = useState("whatsapp");
  const [contactValue, setContactValue] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  // School navigation state
  const [selClass, setSelClass] = useState(null);
  const [selSubject, setSelSubject] = useState(null);

  const classNames = Object.keys(CATALOG);
  const subjectNames = selClass ? Object.keys(CATALOG[selClass]) : [];
  const chapterNames = selClass && selSubject ? CATALOG[selClass][selSubject] : [];

  const competitiveProducts = useMemo(
    () => PRODUCTS.filter((p) => p.competitiveSection),
    []
  );

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
  function goStore() {
    setView("store");
    setOrderPlaced(false);
  }
  function resetSchoolNav() {
    setSelClass(null);
    setSelSubject(null);
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
        <div
          style={{ display: "flex", alignItems: "baseline", gap: 10, cursor: "pointer" }}
          onClick={() => {
            goStore();
            resetSchoolNav();
          }}
        >
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
                    onClick={() => {
                      setTab(t);
                      resetSchoolNav();
                    }}
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

          {/* SCHOOL: Class -> Subject -> Chapter folders */}
          {tab === "School" && (
            <section style={{ maxWidth: 980, margin: "0 auto", padding: "10px 24px 70px" }}>
              {!selClass && (
                <>
                  <Crumbs items={["School Notes"]} onJump={() => {}} />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {classNames.map((c) => (
                      <FolderTile
                        key={c}
                        label={c}
                        sublabel={`${Object.keys(CATALOG[c]).length} subjects`}
                        onClick={() => setSelClass(c)}
                      />
                    ))}
                  </div>
                </>
              )}

              {selClass && !selSubject && (
                <>
                  <Crumbs
                    items={["School Notes", selClass]}
                    onJump={(i) => {
                      if (i === 0) resetSchoolNav();
                    }}
                  />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {subjectNames.map((s) => (
                      <FolderTile
                        key={s}
                        label={s}
                        sublabel={`${CATALOG[selClass][s].length} chapters`}
                        onClick={() => setSelSubject(s)}
                      />
                    ))}
                  </div>
                </>
              )}

              {selClass && selSubject && (
                <>
                  <Crumbs
                    items={["School Notes", selClass, selSubject]}
                    onJump={(i) => {
                      if (i === 0) resetSchoolNav();
                      if (i === 1) setSelSubject(null);
                    }}
                  />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                      gap: 20,
                    }}
                  >
                    {chapterNames.map((ch) => {
                      const product = findChapterProduct(selClass, selSubject, ch);
                      return (
                        <ChapterFolder
                          key={ch}
                          chapter={ch}
                          product={product}
                          inCart={product ? cart.includes(product.id) : false}
                          onAdd={addToCart}
                          onRemove={removeFromCart}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}

          {/* COMPETITIVE: flat sections, same "Available soon" behaviour */}
          {tab === "Competitive" && (
            <section style={{ maxWidth: 980, margin: "0 auto", padding: "10px 24px 70px" }}>
              <Crumbs items={["Competitive Notes"]} onJump={() => {}} />
              {COMPETITIVE_SECTIONS.map((sec) => {
                const items = competitiveProducts.filter((p) => p.competitiveSection === sec);
                return (
                  <div key={sec} style={{ marginBottom: 34 }}>
                    <h3
                      style={{
                        fontFamily: "'Kalam', cursive",
                        fontSize: 20,
                        color: COLORS.ink,
                        marginBottom: 14,
                      }}
                    >
                      {sec}
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                        gap: 20,
                      }}
                    >
                      {items.length > 0 ? (
                        items.map((p) => (
                          <div key={p.id} style={{ display: "flex", flexDirection: "column" }}>
                            <RuledCard style={{ padding: "18px 16px 16px" }}>
                              <h4
                                style={{
                                  fontFamily: "'Kalam', cursive",
                                  fontSize: 18,
                                  fontWeight: 700,
                                  margin: "0 0 8px",
                                  color: COLORS.ink,
                                }}
                              >
                                {p.title}
                              </h4>
                              <p style={{ fontSize: 13, color: COLORS.inkSoft, minHeight: 40 }}>
                                {p.desc}
                              </p>
                              <p style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 10 }}>
                                {p.pages} pages · PDF
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 16,
                                    fontWeight: 600,
                                  }}
                                >
                                  ₹{p.price}
                                </span>
                                <button
                                  onClick={() =>
                                    cart.includes(p.id) ? removeFromCart(p.id) : addToCart(p.id)
                                  }
                                  style={{
                                    background: cart.includes(p.id) ? COLORS.paperDark : COLORS.ink,
                                    color: cart.includes(p.id) ? COLORS.ink : COLORS.paper,
                                    border: cart.includes(p.id)
                                      ? `1px solid ${COLORS.inkSoft}55`
                                      : "none",
                                    borderRadius: 6,
                                    padding: "7px 12px",
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  {cart.includes(p.id) ? "Added ✓" : "Add to cart"}
                                </button>
                              </div>
                            </RuledCard>
                            <TornEdge />
                          </div>
                        ))
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <RuledCard style={{ padding: "18px 16px" }}>
                            <div
                              style={{
                                border: `1.5px dashed ${COLORS.inkSoft}66`,
                                borderRadius: 6,
                                padding: "18px 10px",
                                textAlign: "center",
                              }}
                            >
                              <p
                                style={{
                                  fontFamily: "'Kalam', cursive",
                                  fontSize: 14.5,
                                  color: COLORS.inkSoft,
                                  margin: 0,
                                }}
                              >
                                Available soon
                              </p>
                            </div>
                          </RuledCard>
                          <TornEdge />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}

      {/* CHECKOUT */}
      {view === "checkout" && (
        <section style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>
          <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 28, marginBottom: 6 }}>
            Your order
          </h2>

          {orderPlaced ? (
            <RuledCard style={{ padding: "22px 18px" }}>
              <p style={{ fontFamily: "'Kalam', cursive", fontSize: 18, marginBottom: 6 }}>
                Order noted ✓
              </p>
              <p style={{ fontSize: 14, color: COLORS.inkSoft }}>
                We'll reach out on your {contactMethod === "whatsapp" ? "WhatsApp" : "email"} (
                {contactValue}) with payment details and your notes.
              </p>
            </RuledCard>
          ) : cart.length === 0 ? (
            <p style={{ color: COLORS.inkSoft }}>Your cart is empty. Go back and pick a few notes.</p>
          ) : (
            <>
              <RuledCard style={{ padding: "18px 16px", marginBottom: 24 }}>
                {cart.map((id) => {
                  const p = PRODUCTS.find((x) => x.id === id);
                  if (!p) return null;
                  return (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: `1px solid ${COLORS.paperDark}`,
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontFamily: "'Kalam', cursive", fontSize: 15.5 }}>
                          {p.title}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: COLORS.inkSoft }}>
                          {p.class ? `${p.class} · ${p.subject}` : p.competitiveSection}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 14.5,
                            fontWeight: 600,
                          }}
                        >
                          ₹{p.price}
                        </span>
                        <button
                          onClick={() => removeFromCart(id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: COLORS.margin,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          Remove
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
                  }}
                >
                  <span>Total</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>₹{total}</span>
                </div>
              </RuledCard>

              <div style={{ marginBottom: 16, display: "flex", gap: 10 }}>
                {["whatsapp", "email"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setContactMethod(m)}
                    style={{
                      background: contactMethod === m ? COLORS.ink : "transparent",
                      color: contactMethod === m ? COLORS.paper : COLORS.ink,
                      border: `1.5px solid ${COLORS.ink}`,
                      borderRadius: 999,
                      padding: "7px 16px",
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {m === "whatsapp" ? "WhatsApp" : "Email"}
                  </button>
                ))}
              </div>
              <input
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={contactMethod === "whatsapp" ? "Your WhatsApp number" : "Your email"}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  fontSize: 14.5,
                  borderRadius: 6,
                  border: `1.5px solid ${COLORS.inkSoft}55`,
                  marginBottom: 18,
                  fontFamily: "'Work Sans', sans-serif",
                }}
              />
              <button
                disabled={!contactValue.trim()}
                onClick={() => setOrderPlaced(true)}
                style={{
                  background: contactValue.trim() ? COLORS.margin : `${COLORS.margin}66`,
                  color: COLORS.paper,
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 22px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: contactValue.trim() ? "pointer" : "not-allowed",
                  fontFamily: "'Kalam', cursive",
                }}
              >
                Place order — ₹{total}
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
