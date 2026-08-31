import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import { COLORS, FONTS } from "./siteConfig";

/*
  Admin Panel — seven tabs:
    1. Notes              — add/edit/delete PDF notes
    2. Objective Qs        — add/edit/delete in-page MCQ sets (Objective
                             Questions), typed as plain text and parsed
                             into structured questions
    3. Menu                — add/rename/delete/reorder School/Entrance ->
                             Class/Exam -> Subject -> Chapter, for EITHER
                             the Notes catalog or the Objective Questions
                             catalog (switch at the top), PLUS a
                             "Menu Order" section for the ☰ menu items.
    4. Add Coins           — credit coins to a student by email
    5. Messages             — DM inbox (text + images)
    6. Students             — everyone who has signed in, serial numbered
    7. Settings             — payment QR/UPI, contact info, and every
                             coin amount used across the site

  Menu data lives in Supabase table "site_catalog":
    - id='catalog'            -> Notes catalog: { "Hindi Medium": { "school": { "Class 6": { Subject: [Chapters] } }, "entrance": {...} }, "English Medium": {...} }
    - id='catalog_objective'  -> same shape, for Objective Questions
    - id='menu_order'         -> { "order": [...] }
    - id='settings'           -> { upi_id, qr_image_url, contact_email,
                                    contact_whatsapp, contact_instagram,
                                    unlock_cost, daily_bonus, streak_bonus,
                                    welcome_bonus, referral_bonus }
  See catalog_migration_v2.sql for the one-time table setup.

  Objective Questions live in their own table "objective_questions":
    id, category, key, medium, subject, chapter, title, description,
    questions (jsonb array of {question, options[], answer_index}),
    full_pdf_link, created_at.

  Reordering Medium/Class-Exam/Subject just rewrites the JSON object's
  key order (JS objects preserve insertion order for string keys, and so
  does JSON), which the student site picks up automatically via
  Object.keys() — no extra "order" field needed for those levels.

  Only reachable from App.jsx if the signed-in user's email matches
  ADMIN_EMAIL in siteConfig.js.

  Add Coins tab calls admin_add_coins(target_email, amount) — security
  definer, admin only. Messages tab calls admin_list_threads() /
  admin_get_thread(student_id) / admin_send_message(student_id, content,
  image_url) — all security definer, admin only. Images are uploaded to
  the public "app-uploads" Storage bucket. Students tab calls
  admin_list_students() — security definer, admin only.

  All coin amounts (unlock cost, daily/streak/welcome/referral bonuses)
  are stored in the settings row and read server-side by the
  register_profile and claim_daily_login_bonus Postgres functions — no
  code change needed to retune them, just Settings -> Coins -> Save.
*/

// Keep this in sync with MENU_ITEM_KEYS in App.jsx
const MENU_ITEM_KEYS = ["messages", "login-history", "refer", "buy-coins", "notes", "objective", "contact"];
const MENU_ITEM_LABELS = {
  messages: "💬 Message Admin",
  "login-history": "📅 Login History",
  refer: "🎁 Refer & Earn",
  "buy-coins": "🪙 Buy Coins",
  notes: "📚 Notes (Hindi/English Medium)",
  objective: "❓ Objective Questions (Hindi/English Medium)",
  contact: "📞 Contact",
};

function field(label, children) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 11px",
  fontSize: 14,
  borderRadius: 6,
  border: `1.5px solid ${COLORS.inkSoft}55`,
  fontFamily: "'Work Sans', sans-serif",
  background: COLORS.paper,
};

const emptyForm = { medium: "", category: "school", key: "", subject: "", chapter: "", title: "", description: "", pages: "", driveLink: "", fullPdfLink: "", whatsappLink: "" };

const btnStyle = {
  background: COLORS.paper,
  border: `1px solid ${COLORS.paperDark}`,
  borderRadius: 6,
  padding: "9px 12px",
  fontSize: 13.5,
  cursor: "pointer",
  fontFamily: "'Work Sans', sans-serif",
  color: COLORS.ink,
  textAlign: "left",
};
const btnActiveStyle = { ...btnStyle, background: COLORS.margin, color: COLORS.paper, borderColor: COLORS.margin, fontWeight: 600 };
const smallLink = { background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: 0 };
const arrowBtn = { ...smallLink, color: COLORS.ink, fontSize: 15, padding: "2px 4px" };

/* ---------- Tab 1: Notes ---------- */

function NotesTab() {
  const [catalog, setCatalog] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [existingNotes, setExistingNotes] = useState([]);

  const { medium, category, key, subject, chapter, title, description, pages, driveLink, fullPdfLink, whatsappLink } = form;
  function set(fieldName, value) {
    setForm((f) => ({ ...f, [fieldName]: value }));
  }

  const mediumOptions = Object.keys(catalog);
  const keyOptions = medium ? Object.keys(catalog[medium]?.[category] || {}) : [];
  const subjectOptions = medium && key ? Object.keys(catalog[medium]?.[category]?.[key] || {}) : [];
  const chapterOptions = medium && key && subject ? (catalog[medium]?.[category]?.[key]?.[subject] || []) : [];

  async function loadCatalog() {
    const { data, error } = await supabase.from("site_catalog").select("data").eq("id", "catalog").single();
    setCatalog(!error && data ? data.data || {} : {});
  }

  async function loadExisting() {
    const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
    if (!error && data) setExistingNotes(data);
  }
  useEffect(() => { loadExisting(); loadCatalog(); }, []);

  function startEdit(note) {
    setEditingId(note.id);
    setForm({
      medium: note.medium,
      category: note.category,
      key: note.key,
      subject: note.subject,
      chapter: note.chapter,
      title: note.title,
      description: note.description || "",
      pages: note.pages != null ? String(note.pages) : "",
      driveLink: note.file_url || "",
      fullPdfLink: note.full_pdf_link || "",
      whatsappLink: note.whatsapp_link || "",
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    if (!medium || !key || !subject || !chapter || !title.trim() || !driveLink.trim()) {
      setMessage("Sab fields aur Google Drive link zaroori hain.");
      return;
    }
    setSaving(true);
    const payload = {
      category, key, medium, subject, chapter,
      title: title.trim(),
      description: description.trim(),
      pages: pages ? parseInt(pages, 10) : null,
      file_url: driveLink.trim(),
      full_pdf_link: fullPdfLink.trim() || null,
      whatsapp_link: whatsappLink.trim() || null,
    };
    try {
      if (editingId) {
        const { error } = await supabase.from("notes").update(payload).eq("id", editingId);
        if (error) throw error;
        setMessage("Note update ho gaya ✓");
      } else {
        const { error } = await supabase.from("notes").insert(payload);
        if (error) throw error;
        setMessage("Note add ho gaya ✓");
      }
      setEditingId(null);
      setForm(emptyForm);
      loadExisting();
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setSaving(false);
  }

  async function handleDelete(note) {
    if (!window.confirm(`Delete "${note.title}"?`)) return;
    await supabase.from("notes").delete().eq("id", note.id);
    if (editingId === note.id) cancelEdit();
    loadExisting();
  }

  return (
    <section style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 60px" }}>
      <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 22, marginBottom: 18 }}>
        {editingId ? "Edit note" : "Add a new note"}
      </h2>

      <form onSubmit={handleSubmit} style={{ background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 8, padding: "18px 16px" }}>
        {field("Medium", (
          <select value={medium} onChange={(e) => set("medium", e.target.value)} style={inputStyle}>
            <option value="">Select</option>
            {mediumOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        ))}
        {field("Category", (
          <select value={category} onChange={(e) => set("category", e.target.value)} style={inputStyle} disabled={!medium}>
            <option value="school">School</option>
            <option value="entrance">Entrance Exam</option>
          </select>
        ))}
        {field(category === "school" ? "Class" : "Exam", (
          <select value={key} onChange={(e) => set("key", e.target.value)} style={inputStyle} disabled={!medium}>
            <option value="">Select</option>
            {keyOptions.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        ))}
        {field("Subject", (
          <select value={subject} onChange={(e) => set("subject", e.target.value)} style={inputStyle} disabled={!key}>
            <option value="">Select</option>
            {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ))}
        {field("Chapter", (
          <select value={chapter} onChange={(e) => set("chapter", e.target.value)} style={inputStyle} disabled={!subject}>
            <option value="">Select</option>
            {chapterOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        ))}
        {(key && subject && chapterOptions.length === 0) && (
          <p style={{ fontSize: 12, color: COLORS.stampRed, marginTop: -8, marginBottom: 14 }}>
            Is subject mein abhi koi chapter nahi hai — pehle "Menu" tab se chapter add karein.
          </p>
        )}
        {field("Title", (
          <input value={title} onChange={(e) => set("title", e.target.value)} style={inputStyle} placeholder="Note title" />
        ))}
        {field("Description", (
          <textarea value={description} onChange={(e) => set("description", e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="Short description" />
        ))}
        {field("Pages", (
          <input type="number" value={pages} onChange={(e) => set("pages", e.target.value)} style={inputStyle} placeholder="e.g. 8" />
        ))}
        {field("Google Drive link (preview shown on site)", (
          <input value={driveLink} onChange={(e) => set("driveLink", e.target.value)} style={inputStyle} placeholder="https://drive.google.com/file/d/..." />
        ))}
        <p style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: -8, marginBottom: 14 }}>
          Drive file ko "Anyone with the link can view" set karke uska link yahan paste karein.
        </p>

        {field("Full PDF Google Drive link (coins se unlock hoga, free)", (
          <input value={fullPdfLink} onChange={(e) => set("fullPdfLink", e.target.value)} style={inputStyle} placeholder="https://drive.google.com/file/d/..." />
        ))}
        <p style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: -8, marginBottom: 14 }}>
          Ye link bhi "Anyone with the link can view" hona chahiye. User ke paas coins hone par ye link naye tab me khulega — bina WhatsApp/payment ke.
        </p>

        {field("WhatsApp Business product link (optional)", (
          <input value={whatsappLink} onChange={(e) => set("whatsappLink", e.target.value)} style={inputStyle} placeholder="https://wa.me/... ya catalog item link" />
        ))}
        <p style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: -8, marginBottom: 14 }}>
          Agar ye bhara hai, note ke neeche "Buy full notes on WhatsApp" button dikhega jo seedha is link par le jayega. Khali chhoda to button nahi dikhega.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={saving}
            style={{ flex: 1, background: COLORS.margin, color: COLORS.paper, border: "none", borderRadius: 6, padding: "12px 16px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Kalam', cursive" }}
          >
            {saving ? "Saving..." : editingId ? "Update note" : "Add note"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              style={{ background: "none", border: `1.5px solid ${COLORS.inkSoft}55`, color: COLORS.ink, borderRadius: 6, padding: "12px 16px", fontSize: 14, cursor: "pointer" }}
            >
              Cancel
            </button>
          )}
        </div>
        {message && <p style={{ fontSize: 13, color: message.startsWith("Error") ? COLORS.stampRed : COLORS.ink, marginTop: 10 }}>{message}</p>}
      </form>

      <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 19, margin: "32px 0 12px" }}>Uploaded notes ({existingNotes.length})</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {existingNotes.map((n) => (
          <div key={n.id} style={{ background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 6, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>{n.title}</p>
              <p style={{ margin: 0, fontSize: 11.5, color: COLORS.inkSoft }}>{n.medium} · {n.key} · {n.subject} · {n.chapter}</p>
            </div>
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              <button onClick={() => startEdit(n)} style={{ background: "none", border: "none", color: COLORS.ink, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>
                Edit
              </button>
              <button onClick={() => handleDelete(n)} style={{ background: "none", border: "none", color: COLORS.stampRed, fontSize: 12.5, cursor: "pointer" }}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {existingNotes.length === 0 && <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Koi note upload nahi hua ab tak.</p>}
      </div>
    </section>
  );
}

/* ---------- Tab 2: Objective Questions ---------- */

function parseQuestionsInput(text) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const qLine = lines.find((l) => /^q[:.]/i.test(l)) || lines[0] || "";
      const question = qLine.replace(/^q[:.]\s*/i, "");
      const options = lines.filter((l) => /^[a-dA-D][).]/.test(l)).map((l) => l.replace(/^[a-dA-D][).]\s*/, ""));
      const ansLine = lines.find((l) => /^answer[:.]/i.test(l));
      const answerLetter = ansLine ? ansLine.replace(/^answer[:.]\s*/i, "").trim().toUpperCase() : "";
      const answer_index = "ABCD".indexOf(answerLetter);
      return { question, options, answer_index };
    })
    .filter((q) => q.question && q.options.length > 0);
}

const OBJECTIVE_FORMAT_HELP = `Har question is format mein likhein, do questions ke beech ek khaali line chhodein:

Q: Bharat ki rajdhani kya hai?
A) Mumbai
B) Delhi
C) Chennai
D) Kolkata
Answer: B`;

function ObjectiveTab() {
  const [catalog, setCatalog] = useState({});
  const [form, setForm] = useState({ medium: "", category: "school", key: "", subject: "", chapter: "", title: "", description: "", questionsText: "", fullPdfLink: "" });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [existing, setExisting] = useState([]);

  const { medium, category, key, subject, chapter, title, description, questionsText, fullPdfLink } = form;
  function set(fieldName, value) {
    setForm((f) => ({ ...f, [fieldName]: value }));
  }

  const mediumOptions = Object.keys(catalog);
  const keyOptions = medium ? Object.keys(catalog[medium]?.[category] || {}) : [];
  const subjectOptions = medium && key ? Object.keys(catalog[medium]?.[category]?.[key] || {}) : [];
  const chapterOptions = medium && key && subject ? (catalog[medium]?.[category]?.[key]?.[subject] || []) : [];

  async function loadCatalog() {
    const { data, error } = await supabase.from("site_catalog").select("data").eq("id", "catalog_objective").single();
    setCatalog(!error && data ? data.data || {} : {});
  }

  async function loadExisting() {
    const { data, error } = await supabase.from("objective_questions").select("*").order("created_at", { ascending: false });
    if (!error && data) setExisting(data);
  }
  useEffect(() => { loadExisting(); loadCatalog(); }, []);

  function startEdit(item) {
    setEditingId(item.id);
    const qText = (item.questions || [])
      .map((q) => `Q: ${q.question}\n${(q.options || []).map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("\n")}\nAnswer: ${String.fromCharCode(65 + (q.answer_index ?? 0))}`)
      .join("\n\n");
    setForm({
      medium: item.medium,
      category: item.category,
      key: item.key,
      subject: item.subject,
      chapter: item.chapter,
      title: item.title,
      description: item.description || "",
      questionsText: qText,
      fullPdfLink: item.full_pdf_link || "",
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ medium: "", category: "school", key: "", subject: "", chapter: "", title: "", description: "", questionsText: "", fullPdfLink: "" });
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    if (!medium || !key || !subject || !chapter || !title.trim()) {
      setMessage("Sab fields zaroori hain.");
      return;
    }
    const questions = parseQuestionsInput(questionsText);
    if (questions.length === 0) {
      setMessage("Kam se kam ek valid question chahiye — neeche diya format follow karein.");
      return;
    }
    setSaving(true);
    const payload = {
      category, key, medium, subject, chapter,
      title: title.trim(),
      description: description.trim(),
      questions,
      full_pdf_link: fullPdfLink.trim() || null,
    };
    try {
      if (editingId) {
        const { error } = await supabase.from("objective_questions").update(payload).eq("id", editingId);
        if (error) throw error;
        setMessage("Update ho gaya ✓");
      } else {
        const { error } = await supabase.from("objective_questions").insert(payload);
        if (error) throw error;
        setMessage(`${questions.length} questions add ho gaye ✓`);
      }
      setEditingId(null);
      setForm({ medium: "", category: "school", key: "", subject: "", chapter: "", title: "", description: "", questionsText: "", fullPdfLink: "" });
      loadExisting();
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setSaving(false);
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    await supabase.from("objective_questions").delete().eq("id", item.id);
    if (editingId === item.id) cancelEdit();
    loadExisting();
  }

  return (
    <section style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 60px" }}>
      <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 22, marginBottom: 6 }}>
        {editingId ? "Edit Objective Questions" : "Add Objective Questions"}
      </h2>
      <p style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 16 }}>
        Class/Exam/Subject/Chapter "Manage Menu" tab mein "❓ Objective Questions" switch karke add karein.
      </p>

      <form onSubmit={handleSubmit} style={{ background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 8, padding: "18px 16px" }}>
        {field("Medium", (
          <select value={medium} onChange={(e) => set("medium", e.target.value)} style={inputStyle}>
            <option value="">Select</option>
            {mediumOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        ))}
        {field("Category", (
          <select value={category} onChange={(e) => set("category", e.target.value)} style={inputStyle} disabled={!medium}>
            <option value="school">School</option>
            <option value="entrance">Entrance Exam</option>
          </select>
        ))}
        {field(category === "school" ? "Class" : "Exam", (
          <select value={key} onChange={(e) => set("key", e.target.value)} style={inputStyle} disabled={!medium}>
            <option value="">Select</option>
            {keyOptions.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        ))}
        {field("Subject", (
          <select value={subject} onChange={(e) => set("subject", e.target.value)} style={inputStyle} disabled={!key}>
            <option value="">Select</option>
            {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ))}
        {field("Chapter", (
          <select value={chapter} onChange={(e) => set("chapter", e.target.value)} style={inputStyle} disabled={!subject}>
            <option value="">Select</option>
            {chapterOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        ))}
        {field("Title", (
          <input value={title} onChange={(e) => set("title", e.target.value)} style={inputStyle} placeholder="e.g. Chapter 3 — MCQs" />
        ))}
        {field("Description (optional)", (
          <textarea value={description} onChange={(e) => set("description", e.target.value)} style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} />
        ))}
        {field("Questions", (
          <textarea value={questionsText} onChange={(e) => set("questionsText", e.target.value)} style={{ ...inputStyle, minHeight: 180, resize: "vertical", fontFamily: "monospace", fontSize: 13 }} placeholder={OBJECTIVE_FORMAT_HELP} />
        ))}
        <p style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: -8, marginBottom: 14, whiteSpace: "pre-line" }}>{OBJECTIVE_FORMAT_HELP}</p>

        {field("Full PDF Google Drive link (coins se unlock hoga, optional)", (
          <input value={fullPdfLink} onChange={(e) => set("fullPdfLink", e.target.value)} style={inputStyle} placeholder="https://drive.google.com/file/d/..." />
        ))}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={saving}
            style={{ flex: 1, background: COLORS.margin, color: COLORS.paper, border: "none", borderRadius: 6, padding: "12px 16px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Kalam', cursive" }}
          >
            {saving ? "Saving..." : editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} style={{ background: "none", border: `1.5px solid ${COLORS.inkSoft}55`, color: COLORS.ink, borderRadius: 6, padding: "12px 16px", fontSize: 14, cursor: "pointer" }}>
              Cancel
            </button>
          )}
        </div>
        {message && <p style={{ fontSize: 13, color: message.startsWith("Error") ? COLORS.stampRed : COLORS.ink, marginTop: 10 }}>{message}</p>}
      </form>

      <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 19, margin: "32px 0 12px" }}>Uploaded ({existing.length})</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {existing.map((n) => (
          <div key={n.id} style={{ background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 6, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>{n.title} <span style={{ color: COLORS.inkSoft, fontWeight: 400 }}>({(n.questions || []).length} Qs)</span></p>
              <p style={{ margin: 0, fontSize: 11.5, color: COLORS.inkSoft }}>{n.medium} · {n.key} · {n.subject} · {n.chapter}</p>
            </div>
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              <button onClick={() => startEdit(n)} style={{ background: "none", border: "none", color: COLORS.ink, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>Edit</button>
              <button onClick={() => handleDelete(n)} style={{ background: "none", border: "none", color: COLORS.stampRed, fontSize: 12.5, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        ))}
        {existing.length === 0 && <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Abhi tak kuch add nahi hua.</p>}
      </div>
    </section>
  );
}

/* ---------- Tab 3: Manage Menu (catalog + menu order) ---------- */

function MenuOrderEditor() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("site_catalog").select("data").eq("id", "menu_order").single();
    const stored = !error && data?.data?.order ? data.data.order : [];
    const cleaned = stored.filter((k) => MENU_ITEM_KEYS.includes(k));
    const missing = MENU_ITEM_KEYS.filter((k) => !cleaned.includes(k));
    setOrder([...cleaned, ...missing]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(newOrder) {
    setSaving(true);
    setMsg("");
    const { error } = await supabase
      .from("site_catalog")
      .update({ data: { order: newOrder } })
      .eq("id", "menu_order");
    if (error) setMsg("Error: " + error.message);
    else { setOrder(newOrder); setMsg("Order save ho gaya ✓"); }
    setSaving(false);
  }

  function move(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[idx], next[j]] = [next[j], next[idx]];
    save(next);
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 18, margin: "0 0 6px" }}>Menu Order</h3>
      <p style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 12 }}>
        Yahan se ☰ menu mein in items ka order set karein (upar wala item menu mein sabse upar dikhega). "Home" hamesha sabse upar aur "Admin Panel" hamesha sabse neeche rahega.
      </p>
      {loading || !order ? (
        <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Loading...</p>
      ) : (
        <div style={{ display: "grid", gap: 6 }}>
          {order.map((key, idx) => (
            <div key={key} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ ...btnStyle, flex: 1, cursor: "default" }}>{MENU_ITEM_LABELS[key]}</span>
              <button onClick={() => move(idx, -1)} disabled={idx === 0 || saving} style={arrowBtn}>↑</button>
              <button onClick={() => move(idx, 1)} disabled={idx === order.length - 1 || saving} style={arrowBtn}>↓</button>
            </div>
          ))}
        </div>
      )}
      {msg && <p style={{ fontSize: 12.5, color: msg.startsWith("Error") ? COLORS.stampRed : COLORS.ink, marginTop: 10 }}>{msg}</p>}
    </div>
  );
}

function ManageMenuTab() {
  const [catalogTarget, setCatalogTarget] = useState("catalog"); // "catalog" (Notes) | "catalog_objective" (Objective Questions)
  const [medium, setMedium] = useState("Hindi Medium");
  const [category, setCategory] = useState("school");
  const [data, setData] = useState(null); // full catalog blob
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [newKey, setNewKey] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newChapter, setNewChapter] = useState("");

  async function load() {
    setLoading(true);
    const { data: row, error } = await supabase.from("site_catalog").select("data").eq("id", catalogTarget).single();
    setData(!error && row ? row.data || {} : {});
    setLoading(false);
  }
  useEffect(() => { load(); setSelectedKey(null); setSelectedSubject(null); }, [catalogTarget]);

  useEffect(() => { setSelectedKey(null); setSelectedSubject(null); }, [medium, category]);

  function clone() { return JSON.parse(JSON.stringify(data)); }

  // Rebuild an object with its keys in a new order (used for reordering
  // Mediums / Classes-Exams / Subjects, since Object.keys() order is
  // what the student site renders in).
  function reorderKeys(obj, idx, dir) {
    const keys = Object.keys(obj);
    const j = idx + dir;
    if (j < 0 || j >= keys.length) return null;
    [keys[idx], keys[j]] = [keys[j], keys[idx]];
    const rebuilt = {};
    keys.forEach((k) => { rebuilt[k] = obj[k]; });
    return rebuilt;
  }

  async function save(updated) {
    setSaving(true);
    setMsg("");
    const { error } = await supabase.from("site_catalog").update({ data: updated }).eq("id", catalogTarget);
    if (error) setMsg("Error: " + error.message);
    else { setData(updated); setMsg("Saved ✓"); }
    setSaving(false);
  }

  const branch = data?.[medium]?.[category] || {};

  function moveMedium(idx, dir) {
    const reordered = reorderKeys(data, idx, dir);
    if (reordered) save(reordered);
  }

  function addKey() {
    if (!newKey.trim()) return;
    const d = clone();
    if (d[medium][category][newKey.trim()]) { setMsg("Ye pehle se hai."); return; }
    d[medium][category][newKey.trim()] = {};
    save(d);
    setNewKey("");
  }
  function deleteKey(k) {
    if (!window.confirm(`"${k}" aur uske andar sab kuch delete karein?`)) return;
    const d = clone();
    delete d[medium][category][k];
    save(d);
    if (selectedKey === k) { setSelectedKey(null); setSelectedSubject(null); }
  }
  function renameKey(oldK) {
    const nk = window.prompt("Naya naam:", oldK);
    if (!nk || !nk.trim() || nk === oldK) return;
    const d = clone();
    d[medium][category][nk.trim()] = d[medium][category][oldK];
    delete d[medium][category][oldK];
    save(d);
    if (selectedKey === oldK) setSelectedKey(nk.trim());
  }
  function moveKey(idx, dir) {
    const d = clone();
    const reordered = reorderKeys(d[medium][category], idx, dir);
    if (!reordered) return;
    d[medium][category] = reordered;
    save(d);
  }

  function addSubject() {
    if (!newSubject.trim() || !selectedKey) return;
    const d = clone();
    if (d[medium][category][selectedKey][newSubject.trim()]) { setMsg("Ye pehle se hai."); return; }
    d[medium][category][selectedKey][newSubject.trim()] = [];
    save(d);
    setNewSubject("");
  }
  function deleteSubject(s) {
    if (!window.confirm(`"${s}" aur uske chapters delete karein?`)) return;
    const d = clone();
    delete d[medium][category][selectedKey][s];
    save(d);
    if (selectedSubject === s) setSelectedSubject(null);
  }
  function renameSubject(oldS) {
    const ns = window.prompt("Naya naam:", oldS);
    if (!ns || !ns.trim() || ns === oldS) return;
    const d = clone();
    d[medium][category][selectedKey][ns.trim()] = d[medium][category][selectedKey][oldS];
    delete d[medium][category][selectedKey][oldS];
    save(d);
    if (selectedSubject === oldS) setSelectedSubject(ns.trim());
  }
  function moveSubject(idx, dir) {
    const d = clone();
    const reordered = reorderKeys(d[medium][category][selectedKey], idx, dir);
    if (!reordered) return;
    d[medium][category][selectedKey] = reordered;
    save(d);
  }

  function addChapter() {
    if (!newChapter.trim() || !selectedKey || !selectedSubject) return;
    const d = clone();
    d[medium][category][selectedKey][selectedSubject].push(newChapter.trim());
    save(d);
    setNewChapter("");
  }
  function deleteChapter(idx) {
    const d = clone();
    d[medium][category][selectedKey][selectedSubject].splice(idx, 1);
    save(d);
  }
  function renameChapter(idx, oldC) {
    const nc = window.prompt("Naya naam:", oldC);
    if (!nc || !nc.trim()) return;
    const d = clone();
    d[medium][category][selectedKey][selectedSubject][idx] = nc.trim();
    save(d);
  }
  function moveChapter(idx, dir) {
    const d = clone();
    const arr = d[medium][category][selectedKey][selectedSubject];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    save(d);
  }

  const mediumKeys = data ? Object.keys(data) : [];
  const branchKeys = Object.keys(branch);
  const subjectKeys = selectedKey ? Object.keys(branch[selectedKey] || {}) : [];
  const chapters = selectedKey && selectedSubject ? (branch[selectedKey]?.[selectedSubject] || []) : [];

  return (
    <section style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px 60px" }}>
      <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 22, marginBottom: 6 }}>Manage Menu</h2>
      <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 18 }}>
        Yahan se website ke ☰ menu mein Class/Exam, Subject aur Chapter add/rename/delete/reorder kar sakte ho — code chhoone ki zaroorat nahi.
      </p>

      <MenuOrderEditor />

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button onClick={() => setCatalogTarget("catalog")} style={catalogTarget === "catalog" ? btnActiveStyle : btnStyle}>📚 Notes</button>
        <button onClick={() => setCatalogTarget("catalog_objective")} style={catalogTarget === "catalog_objective" ? btnActiveStyle : btnStyle}>❓ Objective Questions</button>
      </div>

      {loading || !data ? (
        <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Loading...</p>
      ) : (
        <>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 6 }}>Medium (order + select)</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {mediumKeys.map((m, idx) => (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <button onClick={() => setMedium(m)} style={medium === m ? btnActiveStyle : btnStyle}>{m}</button>
                <button onClick={() => moveMedium(idx, -1)} disabled={idx === 0} style={arrowBtn}>↑</button>
                <button onClick={() => moveMedium(idx, 1)} disabled={idx === mediumKeys.length - 1} style={arrowBtn}>↓</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button onClick={() => setCategory("school")} style={category === "school" ? btnActiveStyle : btnStyle}>School</button>
            <button onClick={() => setCategory("entrance")} style={category === "entrance" ? btnActiveStyle : btnStyle}>Entrance Exam</button>
            {saving && <span style={{ fontSize: 12, color: COLORS.inkSoft, alignSelf: "center" }}>Saving...</span>}
          </div>

          {msg && <p style={{ fontSize: 13, color: msg.startsWith("Error") ? COLORS.stampRed : COLORS.ink, marginBottom: 14 }}>{msg}</p>}

          <div style={{ display: "grid", gap: 20 }}>

            {/* Class / Exam column */}
            <div>
              <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 16, margin: "0 0 8px" }}>
                {medium} · {category === "school" ? "School — Classes" : "Entrance Exams"}
              </h3>
              <div style={{ display: "grid", gap: 6 }}>
                {branchKeys.map((k, idx) => (
                  <div key={k} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      onClick={() => { setSelectedKey(k); setSelectedSubject(null); }}
                      style={{ ...(selectedKey === k ? btnActiveStyle : btnStyle), flex: 1 }}
                    >
                      {k}
                    </button>
                    <button onClick={() => moveKey(idx, -1)} disabled={idx === 0} style={arrowBtn}>↑</button>
                    <button onClick={() => moveKey(idx, 1)} disabled={idx === branchKeys.length - 1} style={arrowBtn}>↓</button>
                    <button onClick={() => renameKey(k)} style={{ ...smallLink, color: COLORS.ink, textDecoration: "underline" }}>Rename</button>
                    <button onClick={() => deleteKey(k)} style={{ ...smallLink, color: COLORS.stampRed }}>Delete</button>
                  </div>
                ))}
                {branchKeys.length === 0 && <p style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Abhi koi {category === "school" ? "class" : "exam"} nahi hai.</p>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder={category === "school" ? "e.g. Class 6" : "e.g. JEE"} style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addKey} style={{ ...btnStyle, background: COLORS.margin, color: COLORS.paper, borderColor: COLORS.margin }}>Add</button>
              </div>
            </div>

            {/* Subject column */}
            {selectedKey && (
              <div>
                <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 16, margin: "0 0 8px" }}>Subjects — {selectedKey}</h3>
                <div style={{ display: "grid", gap: 6 }}>
                  {subjectKeys.map((s, idx) => (
                    <div key={s} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button onClick={() => setSelectedSubject(s)} style={{ ...(selectedSubject === s ? btnActiveStyle : btnStyle), flex: 1 }}>{s}</button>
                      <button onClick={() => moveSubject(idx, -1)} disabled={idx === 0} style={arrowBtn}>↑</button>
                      <button onClick={() => moveSubject(idx, 1)} disabled={idx === subjectKeys.length - 1} style={arrowBtn}>↓</button>
                      <button onClick={() => renameSubject(s)} style={{ ...smallLink, color: COLORS.ink, textDecoration: "underline" }}>Rename</button>
                      <button onClick={() => deleteSubject(s)} style={{ ...smallLink, color: COLORS.stampRed }}>Delete</button>
                    </div>
                  ))}
                  {subjectKeys.length === 0 && <p style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Abhi koi subject nahi hai.</p>}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="e.g. Maths" style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={addSubject} style={{ ...btnStyle, background: COLORS.margin, color: COLORS.paper, borderColor: COLORS.margin }}>Add</button>
                </div>
              </div>
            )}

            {/* Chapter column */}
            {selectedKey && selectedSubject && (
              <div>
                <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 16, margin: "0 0 8px" }}>Chapters — {selectedSubject}</h3>
                <div style={{ display: "grid", gap: 6 }}>
                  {chapters.map((c, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ ...btnStyle, flex: 1, cursor: "default" }}>{c}</span>
                      <button onClick={() => moveChapter(idx, -1)} disabled={idx === 0} style={arrowBtn}>↑</button>
                      <button onClick={() => moveChapter(idx, 1)} disabled={idx === chapters.length - 1} style={arrowBtn}>↓</button>
                      <button onClick={() => renameChapter(idx, c)} style={{ ...smallLink, color: COLORS.ink, textDecoration: "underline" }}>Rename</button>
                      <button onClick={() => deleteChapter(idx)} style={{ ...smallLink, color: COLORS.stampRed }}>Delete</button>
                    </div>
                  ))}
                  {chapters.length === 0 && <p style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Abhi koi chapter nahi hai.</p>}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <input value={newChapter} onChange={(e) => setNewChapter(e.target.value)} placeholder="Chapter ka naam" style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={addChapter} style={{ ...btnStyle, background: COLORS.margin, color: COLORS.paper, borderColor: COLORS.margin }}>Add</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/* ---------- Tab 4: Add Coins ---------- */

function AddCoinsTab() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lastResult, setLastResult] = useState(null); // { email, coins }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    const trimmedEmail = email.trim();
    const amt = parseInt(amount, 10);
    if (!trimmedEmail || !amt) {
      setMessage("Email aur coins (number me) dono zaroori hain.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("admin_add_coins", { target_email: trimmedEmail, amount: amt });
      if (error) throw error;
      setLastResult({ email: trimmedEmail, coins: data.coins });
      setMessage(`✓ ${amt} coins add ho gaye. Ab ${trimmedEmail} ke paas total ${data.coins} coins hain.`);
      setEmail("");
      setAmount("");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setSaving(false);
  }

  return (
    <section style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px 60px" }}>
      <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 22, marginBottom: 6 }}>Add Coins</h2>
      <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 18 }}>
        Student ke Google account email daalein aur kitne coins add karne hain — turant unke account mein credit ho jayenge.
        Student ne pehle site pe kam se kam ek baar Google se sign-in kiya hua hona chahiye. Payment screenshots "Messages" tab me aati hain.
      </p>

      <form onSubmit={handleSubmit} style={{ background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 8, padding: "18px 16px" }}>
        {field("Student ka email", (
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="student@gmail.com" />
        ))}
        {field("Kitne coins add karne hain", (
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} placeholder="e.g. 50" />
        ))}
        <button
          type="submit"
          disabled={saving}
          style={{ width: "100%", background: COLORS.margin, color: COLORS.paper, border: "none", borderRadius: 6, padding: "12px 16px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Kalam', cursive" }}
        >
          {saving ? "Adding..." : "🪙 Add Coins"}
        </button>
        {message && (
          <p style={{ fontSize: 13, color: message.startsWith("Error") ? COLORS.stampRed : COLORS.ink, marginTop: 12 }}>{message}</p>
        )}
      </form>

      {lastResult && (
        <div style={{ marginTop: 18, background: COLORS.paper, border: `1.5px solid ${COLORS.gold}88`, borderRadius: 8, padding: "14px 16px" }}>
          <p style={{ margin: 0, fontSize: 13.5 }}>
            Last update: <b>{lastResult.email}</b> — ab total <b>{lastResult.coins} coins</b>
          </p>
        </div>
      )}
    </section>
  );
}

/* ---------- Tab 5: Messages (Instagram-style inbox, with images) ---------- */

function MessagesTab() {
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selected, setSelected] = useState(null); // { student_id, username, full_name }
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  async function loadThreads() {
    setLoadingThreads(true);
    const { data, error } = await supabase.rpc("admin_list_threads");
    if (!error && data) setThreads(data);
    setLoadingThreads(false);
  }
  useEffect(() => { loadThreads(); }, []);

  async function openThread(t) {
    setSelected(t);
    setLoadingThread(true);
    const { data, error } = await supabase.rpc("admin_get_thread", { p_student_id: t.student_id });
    if (!error && data) setMessages(data);
    setLoadingThread(false);
    loadThreads();
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleReply(e) {
    e.preventDefault();
    const content = reply.trim();
    if (!content || !selected) return;
    setSending(true);
    const { data, error } = await supabase.rpc("admin_send_message", { p_student_id: selected.student_id, p_content: content });
    setSending(false);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    setMessages((prev) => [...prev, data]);
    setReply("");
    loadThreads();
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploadingImage(true);
    const path = `chat/${selected.student_id}/admin-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("app-uploads").upload(path, file);
    if (upErr) {
      setUploadingImage(false);
      alert("Image upload nahi hua: " + upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("app-uploads").getPublicUrl(path);
    const { data, error } = await supabase.rpc("admin_send_message", { p_student_id: selected.student_id, p_content: "", p_image_url: pub.publicUrl });
    setUploadingImage(false);
    if (error) {
      alert("Send nahi hua: " + error.message);
      return;
    }
    setMessages((prev) => [...prev, data]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function displayName(t) {
    return t.username ? `@${t.username}` : (t.full_name || "Unknown student");
  }

  if (selected) {
    return (
      <section style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 40px", display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <button onClick={() => setSelected(null)} style={{ background: "none", border: `1.5px solid ${COLORS.inkSoft}55`, borderRadius: 6, padding: "7px 12px", fontSize: 13, cursor: "pointer", color: COLORS.ink }}>
            ← Inbox
          </button>
          <div>
            <p style={{ margin: 0, fontFamily: "'Kalam', cursive", fontSize: 17, fontWeight: 700 }}>{displayName(selected)}</p>
            {selected.username && selected.full_name && (
              <p style={{ margin: 0, fontSize: 11.5, color: COLORS.inkSoft }}>{selected.full_name}</p>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "4px 2px", background: COLORS.paperDark, borderRadius: 8, border: `1px solid ${COLORS.paperDark}` }}>
          {loadingThread ? (
            <p style={{ fontSize: 13, color: COLORS.inkSoft, textAlign: "center", marginTop: 20 }}>Loading...</p>
          ) : (
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map((m) => {
                const isAdmin = m.sender_role === "admin";
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        maxWidth: "75%",
                        background: isAdmin ? COLORS.margin : COLORS.paper,
                        color: isAdmin ? COLORS.paper : COLORS.ink,
                        border: isAdmin ? "none" : `1px solid ${COLORS.paperDark}`,
                        borderRadius: 12,
                        borderBottomRightRadius: isAdmin ? 3 : 12,
                        borderBottomLeftRadius: isAdmin ? 12 : 3,
                        padding: "9px 13px",
                        fontSize: 14,
                      }}
                    >
                      {m.image_url && (
                        <a href={m.image_url} target="_blank" rel="noopener noreferrer">
                          <img src={m.image_url} alt="attachment" style={{ maxWidth: 220, borderRadius: 8, display: "block", marginBottom: m.content ? 6 : 2 }} />
                        </a>
                      )}
                      {m.content}
                      <div style={{ fontSize: 10, opacity: 0.65, marginTop: 4, textAlign: "right" }}>
                        {new Date(m.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleReply} style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: "none" }} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            style={{ ...btnStyle, flexShrink: 0, padding: "0 12px" }}
            title="Image bhejein"
          >
            {uploadingImage ? "…" : "📎"}
          </button>
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply likhein..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            style={{ background: COLORS.margin, color: COLORS.paper, border: "none", borderRadius: 6, padding: "0 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            Send
          </button>
        </form>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 60px" }}>
      <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 22, marginBottom: 6 }}>Messages</h2>
      <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 18 }}>
        Students ke messages aur payment screenshots yahan aate hain. Kisi bhi thread par tap karke poori chat dekhein aur reply karein.
      </p>

      {loadingThreads ? (
        <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Loading...</p>
      ) : threads.length === 0 ? (
        <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Abhi tak kisi ne message nahi kiya.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {threads.map((t) => (
            <button
              key={t.student_id}
              onClick={() => openThread(t)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                background: COLORS.paper,
                border: `1px solid ${COLORS.paperDark}`,
                borderRadius: 8,
                padding: "12px 14px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "'Work Sans', sans-serif",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: COLORS.ink }}>{displayName(t)}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: COLORS.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.last_message || "📷 Image"}
                </p>
              </div>
              {t.unread_count > 0 && (
                <span style={{ background: COLORS.stampRed, color: "#fff", borderRadius: 999, minWidth: 20, height: 20, fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", flexShrink: 0 }}>
                  {t.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- Tab 6: Students ---------- */

function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase.rpc("admin_list_students");
      if (!error && data) setStudents(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 60px" }}>
      <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 22, marginBottom: 6 }}>Students</h2>
      <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 4 }}>
        Google se sign-in kiye hue sabhi students ki list, join karne ke order mein.
      </p>
      <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.margin, marginBottom: 16 }}>
        Total Students: {loading ? "..." : students.length}
      </p>

      {loading ? (
        <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Loading...</p>
      ) : students.length === 0 ? (
        <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Abhi tak koi sign-in nahi hua.</p>
      ) : (
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr", background: COLORS.paperDark, padding: "9px 12px", fontSize: 12, fontWeight: 700, color: COLORS.inkSoft }}>
            <span>Sr.</span>
            <span>Name</span>
            <span>Username</span>
          </div>
          {students.map((s, idx) => (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr 1fr",
                padding: "10px 12px",
                fontSize: 13.5,
                borderTop: `1px solid ${COLORS.paperDark}`,
                color: COLORS.ink,
              }}
            >
              <span style={{ color: COLORS.inkSoft }}>{idx + 1}</span>
              <span>{s.full_name || "—"}</span>
              <span>{s.username ? `@${s.username}` : "—"}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- Tab 7: Settings (payment QR/UPI + contact + coin amounts) ---------- */

function SettingsTab() {
  const [form, setForm] = useState({
    upi_id: "", qr_image_url: "", contact_email: "", contact_whatsapp: "", contact_instagram: "",
    unlock_cost: 10, daily_bonus: 1, streak_bonus: 9, welcome_bonus: 5, referral_bonus: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [msg, setMsg] = useState("");
  const qrInputRef = useRef(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("site_catalog").select("data").eq("id", "settings").single();
    if (!error && data?.data) setForm((f) => ({ ...f, ...data.data }));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleQrUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    const path = `settings/qr-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("app-uploads").upload(path, file, { upsert: true });
    if (upErr) {
      setUploadingQr(false);
      setMsg("Error: " + upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("app-uploads").getPublicUrl(path);
    set("qr_image_url", pub.publicUrl);
    setUploadingQr(false);
  }

  async function handleSave() {
    setSaving(true);
    setMsg("");
    const payload = {
      ...form,
      unlock_cost: parseInt(form.unlock_cost, 10) || 0,
      daily_bonus: parseInt(form.daily_bonus, 10) || 0,
      streak_bonus: parseInt(form.streak_bonus, 10) || 0,
      welcome_bonus: parseInt(form.welcome_bonus, 10) || 0,
      referral_bonus: parseInt(form.referral_bonus, 10) || 0,
    };
    const { error } = await supabase.from("site_catalog").update({ data: payload }).eq("id", "settings");
    setSaving(false);
    if (error) setMsg("Error: " + error.message);
    else { setForm(payload); setMsg("Settings save ho gayi ✓"); }
  }

  if (loading) {
    return (
      <section style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px 60px" }}>
        <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Loading...</p>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px 60px" }}>
      <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 22, marginBottom: 6 }}>Settings</h2>
      <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 18 }}>
        Payment QR/UPI, contact details, aur website ke saare coin amounts — sab yahin se control hote hain, code chhoone ki zaroorat nahi.
      </p>

      <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 17, margin: "0 0 10px" }}>Payment</h3>
      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 8, padding: "16px", marginBottom: 24 }}>
        {field("Payment QR code image", (
          <div>
            {form.qr_image_url && (
              <img src={form.qr_image_url} alt="QR preview" style={{ width: 140, height: 140, objectFit: "contain", background: "#fff", borderRadius: 8, border: `1px solid ${COLORS.paperDark}`, marginBottom: 10, display: "block" }} />
            )}
            <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQrUpload} style={{ display: "none" }} />
            <button
              type="button"
              onClick={() => qrInputRef.current?.click()}
              disabled={uploadingQr}
              style={{ ...btnStyle, background: COLORS.margin, color: COLORS.paper, borderColor: COLORS.margin }}
            >
              {uploadingQr ? "Uploading..." : form.qr_image_url ? "QR badlein" : "QR upload karein"}
            </button>
          </div>
        ))}
        {field("UPI ID", (
          <input value={form.upi_id} onChange={(e) => set("upi_id", e.target.value)} style={inputStyle} placeholder="yourname@upi" />
        ))}
      </div>

      <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 17, margin: "0 0 10px" }}>Coins</h3>
      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 8, padding: "16px", marginBottom: 24 }}>
        {field("Full PDF unlock cost (coins)", (
          <input type="number" value={form.unlock_cost} onChange={(e) => set("unlock_cost", e.target.value)} style={inputStyle} />
        ))}
        {field("Daily login bonus (coins)", (
          <input type="number" value={form.daily_bonus} onChange={(e) => set("daily_bonus", e.target.value)} style={inputStyle} />
        ))}
        {field("7-day streak bonus (coins)", (
          <input type="number" value={form.streak_bonus} onChange={(e) => set("streak_bonus", e.target.value)} style={inputStyle} />
        ))}
        {field("Welcome bonus for referred user (coins)", (
          <input type="number" value={form.welcome_bonus} onChange={(e) => set("welcome_bonus", e.target.value)} style={inputStyle} />
        ))}
        {field("Referral bonus for referrer (coins)", (
          <input type="number" value={form.referral_bonus} onChange={(e) => set("referral_bonus", e.target.value)} style={inputStyle} />
        ))}
      </div>

      <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 17, margin: "0 0 10px" }}>Contact</h3>
      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 8, padding: "16px", marginBottom: 20 }}>
        {field("Email", (
          <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} style={inputStyle} placeholder="you@example.com" />
        ))}
        {field("WhatsApp (number ya link)", (
          <input value={form.contact_whatsapp} onChange={(e) => set("contact_whatsapp", e.target.value)} style={inputStyle} placeholder="916206549468 ya https://wa.me/..." />
        ))}
        {field("Instagram (handle ya link)", (
          <input value={form.contact_instagram} onChange={(e) => set("contact_instagram", e.target.value)} style={inputStyle} placeholder="@nextgennotes ya https://instagram.com/..." />
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ width: "100%", background: COLORS.margin, color: COLORS.paper, border: "none", borderRadius: 6, padding: "12px 16px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Kalam', cursive" }}
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
      {msg && <p style={{ fontSize: 13, color: msg.startsWith("Error") ? COLORS.stampRed : COLORS.ink, marginTop: 10 }}>{msg}</p>}
    </section>
  );
}

/* ---------- Shell with tab switcher ---------- */

export default function AdminPanel({ onBack }) {
  const [tab, setTab] = useState("notes"); // "notes" | "objective" | "menu" | "coins" | "messages" | "students" | "settings"

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paperDark, fontFamily: "'Work Sans', sans-serif", color: COLORS.ink }}>
      <style>{FONTS}</style>
      <header style={{ background: COLORS.ink, color: COLORS.paper, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 20, color: COLORS.gold }}>Admin Panel</span>
        <button onClick={onBack} style={{ background: "transparent", border: `1.5px solid ${COLORS.paper}66`, color: COLORS.paper, borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
          ← Back to site
        </button>
      </header>

      <div style={{ display: "flex", gap: 8, maxWidth: 700, margin: "20px auto 0", padding: "0 20px", flexWrap: "wrap" }}>
        <button onClick={() => setTab("notes")} style={tab === "notes" ? btnActiveStyle : btnStyle}>📝 Notes</button>
        <button onClick={() => setTab("objective")} style={tab === "objective" ? btnActiveStyle : btnStyle}>❓ Objective Qs</button>
        <button onClick={() => setTab("menu")} style={tab === "menu" ? btnActiveStyle : btnStyle}>📂 Manage Menu</button>
        <button onClick={() => setTab("coins")} style={tab === "coins" ? btnActiveStyle : btnStyle}>🪙 Add Coins</button>
        <button onClick={() => setTab("messages")} style={tab === "messages" ? btnActiveStyle : btnStyle}>📩 Messages</button>
        <button onClick={() => setTab("students")} style={tab === "students" ? btnActiveStyle : btnStyle}>🎓 Students</button>
        <button onClick={() => setTab("settings")} style={tab === "settings" ? btnActiveStyle : btnStyle}>⚙️ Settings</button>
      </div>

      {tab === "notes" && <NotesTab />}
      {tab === "objective" && <ObjectiveTab />}
      {tab === "menu" && <ManageMenuTab />}
      {tab === "coins" && <AddCoinsTab />}
      {tab === "messages" && <MessagesTab />}
      {tab === "students" && <StudentsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}
