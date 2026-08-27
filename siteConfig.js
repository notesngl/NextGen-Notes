/*
  Shared config + catalog, used by both App.jsx and AdminPanel.jsx.

  EDIT ME:
  - TUITION_NAME / ABOUT_WEBSITE / ABOUT_TUITION -> shown on the home screen
  - ADMIN_EMAIL -> the Google account allowed to open the Admin Panel and
    upload PDFs. Change this to YOUR Gmail address, exactly as it appears
    when you sign in with Google.
*/

export const COLORS = {
  paper: "#FBF6EA",
  paperDark: "#F1E9D6",
  rule: "#9FB4CE",
  margin: "#C1502E",
  ink: "#26324A",
  inkSoft: "#5B6478",
  gold: "#C79A2E",
  stampRed: "#B23A2E",
};

export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Work+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
`;

export const TUITION_NAME = "NextGen Tuition Classes";
export const ABOUT_WEBSITE =
  "NextGen Notes is a free digital notebook for school students and " +
  "entrance-exam aspirants. Sign in, open the \u2630 menu, pick your class or " +
  "exam, and the notes open right there on the page.";
export const ABOUT_TUITION =
  "These notes come straight from the tuition's own classroom notebook \u2014 " +
  "the same explanations used in daily class, typed up chapter by chapter " +
  "so every student has the same clear notes to revise from.";

export const ADMIN_EMAIL = "your-email@gmail.com";

/* Old-NCERT-based chapter lists, written from memory — double-check
   against the current syllabus before publishing. */
const MATHS_6 = ["Knowing Our Numbers", "Whole Numbers", "Playing with Numbers", "Basic Geometrical Ideas", "Understanding Elementary Shapes", "Integers", "Fractions", "Decimals", "Data Handling", "Mensuration", "Algebra", "Ratio and Proportion", "Symmetry", "Practical Geometry"];
const SCIENCE_6 = ["Food: Where Does It Come From?", "Components of Food", "Fibre to Fabric", "Sorting Materials into Groups", "Separation of Substances", "Changes Around Us", "Getting to Know Plants", "Body Movements", "The Living Organisms and Their Surroundings", "Motion and Measurement of Distances", "Light, Shadows and Reflections", "Electricity and Circuits", "Fun with Magnets", "Water", "Air Around Us", "Garbage In, Garbage Out"];
const HISTORY_6 = ["What, Where, How and When?", "From Hunting-Gathering to Growing Food", "In the Earliest Cities", "What Books and Burials Tell Us", "Kingdoms, Kings and an Early Republic", "New Questions and Ideas", "From a Kingdom to an Empire", "Villages, Towns and Trade", "New Empires and Kingdoms", "Buildings, Paintings and Books"];
const GEOGRAPHY_6 = ["The Earth in the Solar System", "Globe: Latitudes and Longitudes", "Motions of the Earth", "Maps", "Major Domains of the Earth", "Major Landforms of the Earth", "Our Country - India", "India: Climate, Vegetation and Wildlife"];
const CIVICS_6 = ["Understanding Diversity", "Diversity and Discrimination", "What is Government?", "Key Elements of a Democratic Government", "Panchayati Raj", "Rural Administration", "Urban Administration", "Rural Livelihoods", "Urban Livelihoods"];

const MATHS_7 = ["Integers", "Fractions and Decimals", "Data Handling", "Simple Equations", "Lines and Angles", "The Triangle and its Properties", "Congruence of Triangles", "Comparing Quantities", "Rational Numbers", "Practical Geometry", "Perimeter and Area", "Algebraic Expressions", "Exponents and Powers", "Symmetry", "Visualising Solid Shapes"];
const SCIENCE_7 = ["Nutrition in Plants", "Nutrition in Animals", "Fibre to Fabric", "Heat", "Acids, Bases and Salts", "Physical and Chemical Changes", "Weather, Climate and Adaptations of Animals to Climate", "Winds, Storms and Cyclones", "Soil", "Respiration in Organisms", "Transportation in Animals and Plants", "Reproduction in Plants", "Motion and Time", "Electric Current and its Effects", "Light", "Water: A Precious Resource", "Forests: Our Lifeline", "Wastewater Story"];
const HISTORY_7 = ["Tracing Changes Through A Thousand Years", "New Kings and Kingdoms", "The Delhi Sultans", "The Mughal Empire", "Rulers and Buildings", "Towns, Traders and Craftspersons", "Tribes, Nomads and Settled Communities", "Devotional Paths to the Divine", "The Making of Regional Cultures", "Eighteenth-Century Political Formations"];
const GEOGRAPHY_7 = ["Environment", "Inside Our Earth", "Our Changing Earth", "Air", "Water", "Natural Vegetation and Wildlife", "Human Environment - Settlement, Transport and Communication", "Human Environment Interactions - The Tropical and Subtropical Region", "Life in the Deserts"];
const CIVICS_7 = ["On Equality", "Role of the Government in Health", "How the State Government Works", "Growing up as Boys and Girls", "Women Change the World", "Understanding Media", "Understanding Advertising", "Markets Around Us", "A Shirt in the Market"];

const MATHS_8 = ["Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals", "Practical Geometry", "Data Handling", "Squares and Square Roots", "Cubes and Cube Roots", "Comparing Quantities", "Algebraic Expressions and Identities", "Visualising Solid Shapes", "Mensuration", "Exponents and Powers", "Direct and Inverse Proportions", "Factorisation", "Introduction to Graphs", "Playing with Numbers"];
const SCIENCE_8 = ["Crop Production and Management", "Microorganisms: Friend and Foe", "Synthetic Fibres and Plastics", "Materials: Metals and Non-Metals", "Coal and Petroleum", "Combustion and Flame", "Conservation of Plants and Animals", "Cell - Structure and Functions", "Reproduction in Animals", "Reaching the Age of Adolescence", "Force and Pressure", "Friction", "Sound", "Chemical Effects of Electric Current", "Some Natural Phenomena", "Light", "Stars and the Solar System", "Pollution of Air and Water"];
const HISTORY_8 = ["How, When and Where", "From Trade to Territory", "Ruling the Countryside", "Tribals, Dikus and the Vision of a Golden Age", "When People Rebel: 1857 and After", "Weavers, Iron Smelters and Factory Owners", "Civilising the Native, Educating the Nation", "Women, Caste and Reform", "The Making of the National Movement: 1870s-1947", "India After Independence"];
const GEOGRAPHY_8 = ["Resources", "Land, Soil, Water, Natural Vegetation and Wildlife Resources", "Mineral and Power Resources", "Agriculture", "Industries", "Human Resources"];
const CIVICS_8 = ["The Indian Constitution", "Understanding Secularism", "Why Do We Need a Parliament?", "Understanding Laws", "Judiciary", "Understanding Our Criminal Justice System", "Understanding Marginalisation", "Confronting Marginalisation", "Public Facilities", "Law and Social Justice"];

const MATHS_9 = ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables", "Introduction to Euclid's Geometry", "Lines and Angles", "Triangles", "Quadrilaterals", "Areas of Parallelograms and Triangles", "Circles", "Constructions", "Heron's Formula", "Surface Areas and Volumes", "Statistics", "Probability"];
const SCIENCE_9 = ["Matter in Our Surroundings", "Is Matter Around Us Pure?", "Atoms and Molecules", "Structure of the Atom", "The Fundamental Unit of Life", "Tissues", "Diversity in Living Organisms", "Motion", "Force and Laws of Motion", "Gravitation", "Work and Energy", "Sound", "Why Do We Fall Ill?", "Natural Resources", "Improvement in Food Resources"];
const HISTORY_9 = ["The French Revolution", "Socialism in Europe and the Russian Revolution", "Nazism and the Rise of Hitler", "Forest Society and Colonialism", "Pastoralists in the Modern World", "Peasants and Farmers", "History and Sport: The Story of Cricket", "Clothing: A Social History"];
const GEOGRAPHY_9 = ["India - Size and Location", "Physical Features of India", "Drainage", "Climate", "Natural Vegetation and Wildlife", "Population"];
const CIVICS_9 = ["What is Democracy? Why Democracy?", "Constitutional Design", "Electoral Politics", "Working of Institutions", "Democratic Rights"];
const ECONOMICS_9 = ["The Story of Village Palampur", "People as Resource", "Poverty as a Challenge", "Food Security in India"];

const MATHS_10 = ["Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Introduction to Trigonometry", "Some Applications of Trigonometry", "Circles", "Constructions", "Areas Related to Circles", "Surface Areas and Volumes", "Statistics", "Probability"];
const SCIENCE_10 = ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and its Compounds", "Periodic Classification of Elements", "Life Processes", "Control and Coordination", "How do Organisms Reproduce?", "Heredity and Evolution", "Light - Reflection and Refraction", "The Human Eye and the Colourful World", "Electricity", "Magnetic Effects of Electric Current", "Sources of Energy", "Our Environment", "Management of Natural Resources"];
const HISTORY_10 = ["The Rise of Nationalism in Europe", "Nationalism in India", "The Making of a Global World", "The Age of Industrialisation", "Print Culture and the Modern World"];
const GEOGRAPHY_10 = ["Resources and Development", "Forest and Wildlife Resources", "Water Resources", "Agriculture", "Minerals and Energy Resources", "Manufacturing Industries", "Lifelines of National Economy"];
const CIVICS_10 = ["Power Sharing", "Federalism", "Democracy and Diversity", "Gender, Religion and Caste", "Popular Struggles and Movements", "Political Parties", "Outcomes of Democracy", "Challenges to Democracy"];
const ECONOMICS_10 = ["Development", "Sectors of the Indian Economy", "Money and Credit", "Globalisation and the Indian Economy", "Consumer Rights"];

const PHYSICS_11 = ["Physical World", "Units and Measurements", "Motion in a Straight Line", "Motion in a Plane", "Laws of Motion", "Work, Energy and Power", "System of Particles and Rotational Motion", "Gravitation", "Mechanical Properties of Solids", "Mechanical Properties of Fluids", "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves"];
const CHEMISTRY_11 = ["Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements and Periodicity in Properties", "Chemical Bonding and Molecular Structure", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen", "The s-Block Elements", "The p-Block Elements", "Organic Chemistry - Some Basic Principles and Techniques", "Hydrocarbons", "Environmental Chemistry"];
const MATHS_11 = ["Sets", "Relations and Functions", "Trigonometric Functions", "Principle of Mathematical Induction", "Complex Numbers and Quadratic Equations", "Linear Inequalities", "Permutations and Combinations", "Binomial Theorem", "Sequences and Series", "Straight Lines", "Conic Sections", "Introduction to Three Dimensional Geometry", "Limits and Derivatives", "Mathematical Reasoning", "Statistics", "Probability"];
const BIOLOGY_11 = ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Animals", "Cell - The Unit of Life", "Biomolecules", "Cell Cycle and Cell Division", "Transport in Plants", "Mineral Nutrition", "Photosynthesis in Higher Plants", "Respiration in Plants", "Plant Growth and Development", "Digestion and Absorption", "Breathing and Exchange of Gases", "Body Fluids and Circulation", "Excretory Products and their Elimination", "Locomotion and Movement", "Neural Control and Coordination", "Chemical Coordination and Integration"];

const PHYSICS_12 = ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics: Materials, Devices and Simple Circuits", "Communication Systems"];
const CHEMISTRY_12 = ["The Solid State", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "General Principles and Processes of Isolation of Elements", "The p-Block Elements", "The d and f Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"];
const MATHS_12 = ["Relations and Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity and Differentiability", "Application of Derivatives", "Integrals", "Application of Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Linear Programming", "Probability"];
const BIOLOGY_12 = ["Reproduction in Organisms", "Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution", "Human Health and Disease", "Strategies for Enhancement in Food Production", "Microbes in Human Welfare", "Biotechnology: Principles and Processes", "Biotechnology and its Applications", "Organisms and Populations", "Ecosystem", "Biodiversity and Conservation", "Environmental Issues"];

const SSC_REASONING = ["Analogy", "Classification", "Series", "Coding-Decoding", "Blood Relations", "Direction Sense", "Ranking and Order", "Syllogism", "Non-Verbal Reasoning", "Puzzle and Seating Arrangement"];
const SSC_QUANT = ["Number System", "Simplification", "Percentage", "Profit and Loss", "Ratio and Proportion", "Average", "Time and Work", "Time, Speed and Distance", "Mensuration", "Algebra", "Geometry", "Trigonometry", "Data Interpretation"];
const SSC_ENGLISH = ["Reading Comprehension", "Cloze Test", "Error Spotting", "Sentence Improvement", "Fill in the Blanks", "Synonyms and Antonyms", "One Word Substitution", "Idioms and Phrases", "Para Jumbles"];
const SSC_GA = ["Static GK", "History", "Geography", "Polity", "Economy", "Science", "Current Affairs", "Important Days and Schemes"];

export const SCHOOL_CATALOG = {
  "Class 6": { "Hindi Medium": { Maths: MATHS_6, Science: SCIENCE_6, History: HISTORY_6, Geography: GEOGRAPHY_6, Civics: CIVICS_6 } },
  "Class 7": { "Hindi Medium": { Maths: MATHS_7, Science: SCIENCE_7, History: HISTORY_7, Geography: GEOGRAPHY_7, Civics: CIVICS_7 } },
  "Class 8": { "Hindi Medium": { Maths: MATHS_8, Science: SCIENCE_8, History: HISTORY_8, Geography: GEOGRAPHY_8, Civics: CIVICS_8 } },
  "Class 9": { "Hindi Medium": { Maths: MATHS_9, Science: SCIENCE_9, History: HISTORY_9, Geography: GEOGRAPHY_9, Civics: CIVICS_9, Economics: ECONOMICS_9 } },
  "Class 10": { "Hindi Medium": { Maths: MATHS_10, Science: SCIENCE_10, History: HISTORY_10, Geography: GEOGRAPHY_10, Civics: CIVICS_10, Economics: ECONOMICS_10 } },
  "Class 11": { "Hindi Medium": { Physics: PHYSICS_11, Chemistry: CHEMISTRY_11, Maths: MATHS_11, Biology: BIOLOGY_11 } },
  "Class 12": { "Hindi Medium": { Physics: PHYSICS_12, Chemistry: CHEMISTRY_12, Maths: MATHS_12, Biology: BIOLOGY_12 } },
};

export const ENTRANCE_CATALOG = {
  UPSC: {
    "Hindi Medium": {
      "General Studies I": ["Indian Heritage and Culture", "History of India", "World History", "Indian Society", "Geography of India and World"],
      "General Studies II": ["Polity and Governance", "Constitution", "Social Justice", "International Relations"],
      "General Studies III": ["Economy", "Environment", "Science and Technology", "Security and Disaster Management"],
      "General Studies IV": ["Ethics, Integrity and Aptitude"],
      CSAT: ["Comprehension", "Reasoning", "Quantitative Aptitude", "Decision Making"],
    },
  },
  JEE: {
    "Hindi Medium": {
      Physics: PHYSICS_11.concat(PHYSICS_12),
      Chemistry: CHEMISTRY_11.concat(CHEMISTRY_12),
      Maths: MATHS_11.concat(MATHS_12),
    },
  },
  NEET: {
    "Hindi Medium": {
      Physics: PHYSICS_11.concat(PHYSICS_12),
      Chemistry: CHEMISTRY_11.concat(CHEMISTRY_12),
      Biology: BIOLOGY_11.concat(BIOLOGY_12),
    },
  },
  "SSC CGL": {
    "Hindi Medium": { Reasoning: SSC_REASONING, "Quantitative Aptitude": SSC_QUANT, "English Language": SSC_ENGLISH, "General Awareness": SSC_GA },
  },
  "SSC CHSL": {
    "Hindi Medium": { Reasoning: SSC_REASONING, "Quantitative Aptitude": SSC_QUANT, "English Language": SSC_ENGLISH, "General Awareness": SSC_GA },
  },
};
