import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";

/*
  NextGen Notes — digital handwritten notes storefront
  Design language: an actual notebook. Ruled lines, red margin rule,
  torn-edge pages, a teacher's red-ink "verified" stamp as the signature
  element. Palette: warm paper cream, notebook-rule blue, ink navy,
  stamp red, chalk gold.

  WHAT THIS VERSION DOES
  -----------------------
  - Login required (Google) before anything is visible.
  - No prices, no cart, no checkout — everything is free once signed in.
  - Navigation lives in a slide-out menu (the ☰ button in the header):
      School Notes → Class (6–12) → Subject → Chapter
      Competitive Notes → Section
    The main screen stays clean — it only shows the tuition name and
    some info about the site/tuition until you pick something from the menu.
  - Every chapter is a "folder". If a note is added for it, it shows the
    note with a "View / Download PDF" button. If not, it shows
    "Available soon".

  HOW TO ADD A NOTE (a PDF)
  ---------------------------
  1) Upload your PDF somewhere with a public link — e.g. Supabase Storage,
     or a Google Drive file set to "Anyone with the link can view", then
     use its shareable link.
  2) Scroll down to the PRODUCTS array below. Add one object per note:

  {
    id: "c6-maths-knowing-numbers",
    class: "Class 6",
    subject: "Maths",
    chapter: "Knowing Our Numbers",
    title: "Knowing Our Numbers — Complete Notes",
    desc: "Digitally typed notes with solved examples.",
    pages: 8,
    fileUrl: "https://your-pdf-link-here",
  }

  The "class", "subject" and "chapter" values MUST exactly match an entry
  in the CATALOG below (spelling included) — that's how the note finds
  its folder.

  For a Competitive note, use "competitiveSection" instead of class/subject/chapter:
  {
    id: "comp-ssc-numsys-1",
    competitiveSection: "SSC CGL Maths",
    title: "Number System — Complete Notes",
    desc: "Digitally typed notes covering the Number System topic.",
    pages: 5,
    fileUrl: "https://your-pdf-link-here",
  }

  HOW TO ADD A NEW CLASS / SUBJECT / CHAPTER
  --------------------------------------------
  Edit the CATALOG object below — add a class key, a subject inside a
  class, or a chapter inside a subject's array. The menu builds itself
  from this automatically.

  EDIT THESE TO MATCH YOUR TUITION
  -----------------------------------
  TUITION_NAME, ABOUT_WEBSITE and ABOUT_TUITION near the top of the data
  section below are just placeholder text — change them to your own.
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
   EDIT ME — tuition name & about text shown on the home screen.
   ====================================================================== */
const TUITION_NAME = "NextGen Learning by Sohel Sir";
const ABOUT_WEBSITE =
  "NextGen Notes is a free digital notebook for students of Class 6 to 12. " +
  "Sign in, open the ☰ menu, pick your class, subject and chapter — the notes " +
  "open right there. No payment, no waiting, no fake previews.";
const ABOUT_TUITION =
  "These notes come straight from the tuition's own classroom notebook — the " +
  "same explanations used in daily class, typed up chapter by chapter so every " +
  "student has the same clear notes to revise from, in class or at home.";

/* ======================================================================
   CATALOG — the folder tree. Old-NCERT-based chapter names.
   Double-check these against the current syllabus before publishing —
   NCERT revises chapter names/numbers from time to time, and this list
   was written from memory, not copied from an official source. Class 11
   and 12 only include Physics, Chemistry, Maths and Biology for now —
   ask to add Commerce/Arts subjects (Accountancy, Business Studies,
   Economics, History, Political Science, etc.) any time.
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
      "What, Where, How and When?", "From Hunting-Gathering to Growing Food",
      "In the Earliest Cities", "What Books and Burials Tell Us",
      "Kingdoms, Kings and an Early Republic", "New Questions and Ideas",
      "From a Kingdom to an Empire", "Villages, Towns and Trade",
      "New Empires and Kingdoms", "Buildings, Paintings and Books",
    ],
    Geography: [
      "The Earth in the Solar System", "Globe: Latitudes and Longitudes",
      "Motions of the Earth", "Maps", "Major Domains of the Earth",
      "Major Landforms of the Earth", "Our Country - India",
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
      "Human Environment - Settlement, Transport and Communication",
      "Human Environment Interactions - The Tropical and Subtropical Region",
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
      "Cell - Structure and Functions", "Reproduction in Animals",
      "Reaching the Age of Adolescence", "Force and Pressure", "Friction", "Sound",
      "Chemical Effects of Electric Current", "Some Natural Phenomena", "Light",
      "Stars and the Solar System", "Pollution of Air and Water",
    ],
    History: [
      "How, When and Where", "From Trade to Territory", "Ruling the Countryside",
      "Tribals, Dikus and the Vision of a Golden Age", "When People Rebel: 1857 and After",
      "Weavers, Iron Smelters and Factory Owners",
      "Civilising the Native, Educating the Nation", "Women, Caste and Reform",
      "The Making of the National Movement: 1870s-1947", "India After Independence",
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
  "Class 9": {
    Maths: [
      "Number Systems", "Polynomials", "Coordinate Geometry",
      "Linear Equations in Two Variables", "Introduction to Euclid's Geometry",
      "Lines and Angles", "Triangles", "Quadrilaterals",
      "Areas of Parallelograms and Triangles", "Circles", "Constructions",
      "Heron's Formula", "Surface Areas and Volumes", "Statistics", "Probability",
    ],
    Science: [
      "Matter in Our Surroundings", "Is Matter Around Us Pure?", "Atoms and Molecules",
      "Structure of the Atom", "The Fundamental Unit of Life", "Tissues",
      "Diversity in Living Organisms", "Motion", "Force and Laws of Motion",
      "Gravitation", "Work and Energy", "Sound", "Why Do We Fall Ill?",
      "Natural Resources", "Improvement in Food Resources",
    ],
    History: [
      "The French Revolution", "Socialism in Europe and the Russian Revolution",
      "Nazism and the Rise of Hitler", "Forest Society and Colonialism",
      "Pastoralists in the Modern World", "Peasants and Farmers",
      "History and Sport: The Story of Cricket", "Clothing: A Social History",
    ],
    Geography: [
      "India - Size and Location", "Physical Features of India", "Drainage",
      "Climate", "Natural Vegetation and Wildlife", "Population",
    ],
    Civics: [
      "What is Democracy? Why Democracy?", "Constitutional Design",
      "Electoral Politics", "Working of Institutions", "Democratic Rights",
    ],
    Economics: [
      "The Story of Village Palampur", "People as Resource", "Poverty as a Challenge",
      "Food Security in India",
    ],
  },
  "Class 10": {
    Maths: [
      "Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables",
      "Quadratic Equations", "Arithmetic Progressions", "Triangles",
      "Coordinate Geometry", "Introduction to Trigonometry",
      "Some Applications of Trigonometry", "Circles", "Constructions",
      "Areas Related to Circles", "Surface Areas and Volumes", "Statistics", "Probability",
    ],
    Science: [
      "Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals",
      "Carbon and its Compounds", "Periodic Classification of Elements",
      "Life Processes", "Control and Coordination", "How do Organisms Reproduce?",
      "Heredity and Evolution", "Light - Reflection and Refraction",
      "The Human Eye and the Colourful World", "Electricity",
      "Magnetic Effects of Electric Current", "Sources of Energy", "Our Environment",
      "Management of Natural Resources",
    ],
    History: [
      "The Rise of Nationalism in Europe", "Nationalism in India",
      "The Making of a Global World", "The Age of Industrialisation",
      "Print Culture and the Modern World",
    ],
    Geography: [
      "Resources and Development", "Forest and Wildlife Resources", "Water Resources",
      "Agriculture", "Minerals and Energy Resources", "Manufacturing Industries",
      "Lifelines of National Economy",
    ],
    Civics: [
      "Power Sharing", "Federalism", "Democracy and Diversity",
      "Gender, Religion and Caste", "Popular Struggles and Movements",
      "Political Parties", "Outcomes of Democracy", "Challenges to Democracy",
    ],
    Economics: [
      "Development", "Sectors of the Indian Economy", "Money and Credit",
      "Globalisation and the Indian Economy", "Consumer Rights",
    ],
  },
  "Class 11": {
    Physics: [
      "Physical World", "Units and Measurements", "Motion in a Straight Line",
      "Motion in a Plane", "Laws of Motion", "Work, Energy and Power",
      "System of Particles and Rotational Motion", "Gravitation",
      "Mechanical Properties of Solids", "Mechanical Properties of Fluids",
      "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory",
      "Oscillations", "Waves",
    ],
    Chemistry: [
      "Some Basic Concepts of Chemistry", "Structure of Atom",
      "Classification of Elements and Periodicity in Properties",
      "Chemical Bonding and Molecular Structure", "States of Matter",
      "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen",
      "The s-Block Elements", "The p-Block Elements",
      "Organic Chemistry - Some Basic Principles and Techniques", "Hydrocarbons",
      "Environmental Chemistry",
    ],
    Maths: [
      "Sets", "Relations and Functions", "Trigonometric Functions",
      "Principle of Mathematical Induction", "Complex Numbers and Quadratic Equations",
      "Linear Inequalities", "Permutations and Combinations", "Binomial Theorem",
      "Sequences and Series", "Straight Lines", "Conic Sections",
      "Introduction to Three Dimensional Geometry", "Limits and Derivatives",
      "Mathematical Reasoning", "Statistics", "Probability",
    ],
    Biology: [
      "The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom",
      "Morphology of Flowering Plants", "Anatomy of Flowering Plants",
      "Structural Organisation in Animals", "Cell - The Unit of Life", "Biomolecules",
      "Cell Cycle and Cell Division", "Transport in Plants", "Mineral Nutrition",
      "Photosynthesis in Higher Plants", "Respiration in Plants",
      "Plant Growth and Development", "Digestion and Absorption",
      "Breathing and Exchange of Gases", "Body Fluids and Circulation",
      "Excretory Products and their Elimination", "Locomotion and Movement",
      "Neural Control and Coordination", "Chemical Coordination and Integration",
    ],
  },
  "Class 12": {
    Physics: [
      "Electric Charges and Fields", "Electrostatic Potential and Capacitance",
      "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter",
      "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves",
      "Ray Optics and Optical Instruments", "Wave Optics",
      "Dual Nature of Radiation and Matter", "Atoms", "Nuclei",
      "Semiconductor Electronics: Materials, Devices and Simple Circuits",
      "Communication Systems",
    ],
    Chemistry: [
      "The Solid State", "Solutions", "Electrochemistry", "Chemical Kinetics",
      "Surface Chemistry", "General Principles and Processes of Isolation of Elements",
      "The p-Block Elements", "The d and f Block Elements", "Coordination Compounds",
      "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers",
      "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules",
      "Polymers", "Chemistry in Everyday Life",
    ],
    Maths: [
      "Relations and Functions", "Inverse Trigonometric Functions", "Matrices",
      "Determinants", "Continuity and Differentiability", "Application of Derivatives",
      "Integrals", "Application of Integrals", "Differential Equations",
      "Vector Algebra", "Three Dimensional Geometry", "Linear Programming", "Probability",
    ],
    Biology: [
      "Reproduction in Organisms", "Sexual Reproduction in Flowering Plants",
      "Human Reproduction", "Reproductive Health",
      "Principles of Inheritance and Variation", "Molecular Basis of Inheritance",
      "Evolution", "Human Health and Disease",
      "Strategies for Enhancement in Food Production", "Microbes in Human Welfare",
      "Biotechnology: Principles and Processes", "Biotechnology and its Applications",
      "Organisms and Populations", "Ecosystem", "Biodiversity and Conservation",
      "Environmental Issues",
    ],
  },
};

const COMPETITIVE_SECTIONS = [
  "SSC CGL Maths", "SSC / Railway", "Jharkhand Exams", "Reasoning",
];

/* ======================================================================
   PRODUCTS — start empty on purpose. Every note you add here slots
   itself into the right Class -> Subject -> Chapter folder automatically,
   or into the right Competitive section. No price field anymore —
   everything is free once a student is signed in.
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
  //   fileUrl: "https://your-pdf-link-here",
  // },

  // Competitive note example:
  // {
  //   id: "comp-ssc-numsys-1",
  //   competitiveSection: "SSC CGL Maths",
  //   title: "Number System — Complete Notes",
  //   desc: "Digitally typed notes covering the Number System topic.",
  //   pages: 5,
  //   fileUrl: "https://your-pdf-link-here",
  // },
];

function findChapterProducts(cls, subject, chapter) {
  return PRODUCTS.filter(
    (p) => p.class === cls && p.subject === subject && p.chapter === chapter
  );
}
function findCompetitiveProducts(section) {
  return PRODUCTS.filter((p) => p.competitiveSection === section);
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
      Notes
      <br />
      Verified
    </div>
  );
}

function RuledCard({ children, style = {} }) {
  return (
    <div
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

/* ======================================================================
   NAV DRAWER — the ☰ slide-out menu. School Notes (Class -> Subject ->
   Chapter accordion) and Competitive Notes (flat list). Picking a leaf
   item closes the drawer and hands the selection back to the app.
   ====================================================================== */
function NavDrawer({ open, onClose, onHome, onPickChapter, onPickCompetitive }) {
  const [openClass, setOpenClass] = useState(null);
  const [openSubject, setOpenSubject] = useState(null);
  const [competitiveOpen, setCompetitiveOpen] = useState(false);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(38,50,74,0.55)" }}
      />
      <div
        style={{
          position: "relative",
          width: "min(340px, 86vw)",
          height: "100%",
          background: COLORS.paperDark,
          overflowY: "auto",
          boxShadow: "-12px 0 32px -16px rgba(0,0,0,0.4)",
          fontFamily: "'Work Sans', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 18px 14px",
            borderBottom: `1px solid ${COLORS.paperDark}`,
            background: COLORS.ink,
          }}
        >
          <span
            style={{
              fontFamily: "'Kalam', cursive",
              fontSize: 19,
              fontWeight: 700,
              color: COLORS.gold,
            }}
          >
            Menu
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: "none",
              border: "none",
              color: COLORS.paper,
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "10px 6px 30px" }}>
          <button
            onClick={() => {
              onHome();
              onClose();
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              background: "none",
              border: "none",
              padding: "12px 14px",
              fontFamily: "'Kalam', cursive",
              fontSize: 16.5,
              fontWeight: 700,
              color: COLORS.ink,
              cursor: "pointer",
            }}
          >
            🏠 Home
          </button>

          <p
            style={{
              margin: "12px 14px 6px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: COLORS.margin,
            }}
          >
            School Notes
          </p>

          {Object.keys(CATALOG).map((cls) => (
            <div key={cls}>
              <button
                onClick={() => {
                  setOpenClass(openClass === cls ? null : cls);
                  setOpenSubject(null);
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: "10px 14px",
                  fontFamily: "'Work Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  color: COLORS.ink,
                  cursor: "pointer",
                }}
              >
                <span>{cls}</span>
                <span style={{ color: COLORS.inkSoft, fontSize: 12 }}>
                  {openClass === cls ? "▾" : "▸"}
                </span>
              </button>

              {openClass === cls &&
                Object.keys(CATALOG[cls]).map((subject) => (
                  <div key={subject}>
                    <button
                      onClick={() =>
                        setOpenSubject(openSubject === subject ? null : subject)
                      }
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        background: "none",
                        border: "none",
                        padding: "8px 14px 8px 28px",
                        fontFamily: "'Work Sans', sans-serif",
                        fontSize: 14,
                        color: COLORS.inkSoft,
                        cursor: "pointer",
                      }}
                    >
                      <span>{subject}</span>
                      <span style={{ fontSize: 11 }}>
                        {openSubject === subject ? "▾" : "▸"}
                      </span>
                    </button>

                    {openSubject === subject &&
                      CATALOG[cls][subject].map((chapter) => (
                        <button
                          key={chapter}
                          onClick={() => {
                            onPickChapter(cls, subject, chapter);
                            onClose();
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            padding: "7px 14px 7px 42px",
                            fontFamily: "'Work Sans', sans-serif",
                            fontSize: 13,
                            color: COLORS.ink,
                            cursor: "pointer",
                          }}
                        >
                          {chapter}
                        </button>
                      ))}
                  </div>
                ))}
            </div>
          ))}

          <p
            style={{
              margin: "18px 14px 6px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: COLORS.margin,
            }}
          >
            Competitive Notes
          </p>
          <button
            onClick={() => setCompetitiveOpen((v) => !v)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              background: "none",
              border: "none",
              padding: "10px 14px",
              fontFamily: "'Work Sans', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: COLORS.ink,
              cursor: "pointer",
            }}
          >
            <span>Browse sections</span>
            <span style={{ color: COLORS.inkSoft, fontSize: 12 }}>
              {competitiveOpen ? "▾" : "▸"}
            </span>
          </button>
          {competitiveOpen &&
            COMPETITIVE_SECTIONS.map((sec) => (
              <button
                key={sec}
                onClick={() => {
                  onPickCompetitive(sec);
                  onClose();
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  padding: "8px 14px 8px 28px",
                  fontFamily: "'Work Sans', sans-serif",
                  fontSize: 14,
                  color: COLORS.ink,
                  cursor: "pointer",
                }}
              >
                {sec}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

/* A note card — free view/download, or "Available soon" if empty */
function NoteCard({ note }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
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
          {note.title}
        </h4>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5, minHeight: 40 }}>
          {note.desc}
        </p>
        <p style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 12 }}>
          {note.pages} pages · PDF · Free
        </p>
        {note.fileUrl ? (
          <a
            href={note.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: COLORS.ink,
              color: COLORS.paper,
              borderRadius: 6,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View / Download PDF
          </a>
        ) : (
          <p style={{ fontSize: 12.5, color: COLORS.margin, fontStyle: "italic" }}>
            PDF link add hona baaki hai.
          </p>
        )}
      </RuledCard>
      <TornEdge />
    </div>
  );
}

function AvailableSoon() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <RuledCard style={{ padding: "18px 16px" }}>
        <div
          style={{
            border: `1.5px dashed ${COLORS.inkSoft}66`,
            borderRadius: 6,
            padding: "22px 10px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'Kalam', cursive",
              fontSize: 15,
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
  );
}

/* ======================================================================
   LOGIN — Google OAuth via Supabase Auth. Nothing loads behind this
   until supabase confirms a session.
   ====================================================================== */
function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loginWithGoogle() {
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (err) setError(err.message);
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.paperDark,
        fontFamily: "'Work Sans', sans-serif",
        color: COLORS.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <style>{FONTS}</style>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <Stamp size={90} />
        </div>
        <h1
          style={{
            fontFamily: "'Kalam', cursive",
            fontSize: 28,
            textAlign: "center",
            margin: "0 0 6px",
          }}
        >
          {TUITION_NAME}
        </h1>
        <p
          style={{
            textAlign: "center",
            color: COLORS.inkSoft,
            fontSize: 14,
            marginBottom: 26,
          }}
        >
          Sign in to open your notebook.
        </p>

        <RuledCard style={{ padding: "22px 18px" }}>
          <button
            onClick={loginWithGoogle}
            disabled={loading}
            style={{
              width: "100%",
              background: COLORS.paper,
              border: `1.5px solid ${COLORS.ink}`,
              borderRadius: 6,
              padding: "12px 16px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Work Sans', sans-serif",
            }}
          >
            {loading ? "Redirecting..." : "Continue with Google"}
          </button>

          {error && (
            <p style={{ color: COLORS.stampRed, fontSize: 12.5, marginTop: 12 }}>{error}</p>
          )}
        </RuledCard>
      </div>
    </div>
  );
}

export default function NextGenNotes() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out
  const [drawerOpen, setDrawerOpen] = useState(false);
  // active = null (home) | { type: "chapter", cls, subject, chapter } | { type: "competitive", section }
  const [active, setActive] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: COLORS.paperDark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.inkSoft,
          fontFamily: "'Work Sans', sans-serif",
        }}
      >
        <style>{FONTS}</style>
        Loading...
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
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
          onClick={() => setActive(null)}
        >
          <span
            style={{
              fontFamily: "'Kalam', cursive",
              fontWeight: 700,
              fontSize: 24,
              color: COLORS.gold,
            }}
          >
            {TUITION_NAME}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: "none",
              border: "none",
              color: `${COLORS.paper}99`,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "'Work Sans', sans-serif",
            }}
          >
            Sign out
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            style={{
              background: "transparent",
              border: `1.5px solid ${COLORS.paper}66`,
              color: COLORS.paper,
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 18,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ☰
          </button>
        </div>
      </header>

      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onHome={() => setActive(null)}
        onPickChapter={(cls, subject, chapter) =>
          setActive({ type: "chapter", cls, subject, chapter })
        }
        onPickCompetitive={(section) => setActive({ type: "competitive", section })}
      />

      {active === null && (
        <section
          style={{
            padding: "56px 24px 70px",
            maxWidth: 780,
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <Stamp size={100} />
          </div>
          <h1
            style={{
              fontFamily: "'Kalam', cursive",
              fontWeight: 700,
              fontSize: "clamp(30px, 5vw, 44px)",
              lineHeight: 1.15,
              margin: "0 0 20px",
              textAlign: "center",
              color: COLORS.ink,
            }}
          >
            {TUITION_NAME}
          </h1>

          <RuledCard style={{ padding: "20px 18px", marginBottom: 20 }}>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: COLORS.margin,
                marginBottom: 8,
              }}
            >
              About this website
            </p>
            <p style={{ fontSize: 15, color: COLORS.inkSoft, lineHeight: 1.6, margin: 0 }}>
              {ABOUT_WEBSITE}
            </p>
          </RuledCard>

          <RuledCard style={{ padding: "20px 18px" }}>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: COLORS.margin,
                marginBottom: 8,
              }}
            >
              About the tuition
            </p>
            <p style={{ fontSize: 15, color: COLORS.inkSoft, lineHeight: 1.6, margin: 0 }}>
              {ABOUT_TUITION}
            </p>
          </RuledCard>

          <p
            style={{
              textAlign: "center",
              color: COLORS.inkSoft,
              fontSize: 13,
              marginTop: 26,
            }}
          >
            Tap ☰ above to browse notes by class and subject.
          </p>
        </section>
      )}

      {active?.type === "chapter" && (
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px 70px" }}>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: COLORS.margin,
              marginBottom: 6,
            }}
          >
            {active.cls} · {active.subject}
          </p>
          <h2
            style={{
              fontFamily: "'Kalam', cursive",
              fontSize: 24,
              margin: "0 0 20px",
              color: COLORS.ink,
            }}
          >
            {active.chapter}
          </h2>
          {(() => {
            const notes = findChapterProducts(active.cls, active.subject, active.chapter);
            return notes.length > 0 ? (
              <div style={{ display: "grid", gap: 20 }}>
                {notes.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            ) : (
              <AvailableSoon />
            );
          })()}
        </section>
      )}

      {active?.type === "competitive" && (
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px 70px" }}>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: COLORS.margin,
              marginBottom: 6,
            }}
          >
            Competitive Notes
          </p>
          <h2
            style={{
              fontFamily: "'Kalam', cursive",
              fontSize: 24,
              margin: "0 0 20px",
              color: COLORS.ink,
            }}
          >
            {active.section}
          </h2>
          {(() => {
            const notes = findCompetitiveProducts(active.section);
            return notes.length > 0 ? (
              <div style={{ display: "grid", gap: 20 }}>
                {notes.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            ) : (
              <AvailableSoon />
            );
          })()}
        </section>
      )}
    </div>
  );
}
