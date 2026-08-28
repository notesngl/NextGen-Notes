/*
  Shared config, used by both App.jsx and AdminPanel.jsx.

  EDIT ME:
  - TUITION_NAME / ABOUT_WEBSITE / ABOUT_TUITION -> shown on the home screen
  - ADMIN_EMAIL -> the Google account allowed to open the Admin Panel and
    upload PDFs. Change this to YOUR Gmail address, exactly as it appears
    when you sign in with Google.

  NOTE: The Class/Exam -> Medium -> Subject -> Chapter catalog used to be
  hardcoded in this file. It now lives in Supabase (table "site_catalog")
  and is fully editable from the Admin Panel's "Manage Menu" tab — no code
  changes or redeploys needed anymore. See catalog_migration.sql for the
  one-time table setup.
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

export const TUITION_NAME = "NextGen Notes (From NGL By Andy)";
export const ABOUT_WEBSITE =
  "NextGen Notes is a free digital notebook for school students and " +
  "entrance-exam aspirants. Sign in, open the \u2630 menu, pick your class or " +
  "exam, and the notes open right there on the page.";
export const ABOUT_TUITION =
  "These notes come straight from the tuition's own classroom notebook \u2014 " +
  "the same explanations used in daily class, typed up chapter by chapter " +
  "so every student has the same clear notes to revise from.";

export const ADMIN_EMAIL = "nextgenlearningrjl@gmail.com";
