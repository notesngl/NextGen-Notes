import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import { COLORS, FONTS } from "./siteConfig";

/*
  Admin Panel — four tabs:
    1. Notes      — add/edit/delete notes
    2. Menu       — add/rename/delete School/Entrance -> Class/Exam ->
                    Subject -> Chapter, under each Medium.
    3. Add Coins  — credit coins to any student by their Google account
                    email (used for manual WhatsApp "Buy Coins" payments).
    4. Messages   — Instagram-style DM inbox: every student who has
                    messaged shows up with their username, tap opens the
                    full chat, reply box sends a message back.

  Menu data lives in Supabase table "site_catalog", single row with
  id='catalog', shape:
    {
      "Hindi Medium":   { "school": { "Class 6": { Subject: [Chapters] } }, "entrance": {...} },
      "English Medium": { "school": {...}, "entrance": {...} }
    }
  See catalog_migration_v2.sql for the one-time table setup.

  Only reachable from App.jsx if the signed-in user's email matches
  ADMIN_EMAIL in siteConfig.js.

  "notes" table needs these columns:
    id, category, key, medium, subject, chapter, title, description,
    pages, file_url, full_pdf_link, whatsapp_link, created_at

  full_pdf_link = optional Google Drive link to the COMPLETE note,
  unlocked for free on the site by spending coins (see App.jsx /
  COIN_COST). Separate from file_url, which is the free preview link.

  Add Coins tab calls the admin_add_coins(target_email, amount) Postgres
  function (security definer, checks the caller is ADMIN_EMAIL) — the
  student must have signed in at least once with that email already.

  Messages tab calls admin_list_threads() / admin_get_thread(student_id)
  / admin_send_message(student_id, content) — all security definer,
  all check the caller is ADMIN_EMAIL.
*/

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

/* ---------- Tab 2: Manage Menu ---------- */

function ManageMenuTab() {
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
    const { data: row, error } = await supabase.from("site_catalog").select("data").eq("id", "catalog").single();
    setData(!error && row ? row.data || {} : {});
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => { setSelectedKey(null); setSelectedSubject(null); }, [medium, category]);

  function clone() { return JSON.parse(JSON.stringify(data)); }

  async function save(updated) {
    setSaving(true);
    setMsg("");
    const { error } = await supabase.from("site_catalog").update({ data: updated }).eq("id", "catalog");
    if (error) setMsg("Error: " + error.message);
    else { setData(updated); setMsg("Saved ✓"); }
    setSaving(false);
  }

  const branch = data?.[medium]?.[category] || {};

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

  const chapters = selectedKey && selectedSubject ? (branch[selectedKey]?.[selectedSubject] || []) : [];

  return (
    <section style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px 60px" }}>
      <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 22, marginBottom: 6 }}>Manage Menu</h2>
      <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 18 }}>
        Yahan se website ke ☰ menu mein Class/Exam, Subject aur Chapter add/rename/delete kar sakte ho — code chhoone ki zaroorat nahi.
      </p>

      {loading || !data ? (
        <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Loading...</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {Object.keys(data).map((m) => (
              <button key={m} onClick={() => setMedium(m)} style={medium === m ? btnActiveStyle : btnStyle}>{m}</button>
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
                {Object.keys(branch).map((k) => (
                  <div key={k} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      onClick={() => { setSelectedKey(k); setSelectedSubject(null); }}
                      style={{ ...(selectedKey === k ? btnActiveStyle : btnStyle), flex: 1 }}
                    >
                      {k}
                    </button>
                    <button onClick={() => renameKey(k)} style={{ ...smallLink, color: COLORS.ink, textDecoration: "underline" }}>Rename</button>
                    <button onClick={() => deleteKey(k)} style={{ ...smallLink, color: COLORS.stampRed }}>Delete</button>
                  </div>
                ))}
                {Object.keys(branch).length === 0 && <p style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Abhi koi {category === "school" ? "class" : "exam"} nahi hai.</p>}
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
                  {Object.keys(branch[selectedKey] || {}).map((s) => (
                    <div key={s} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button onClick={() => setSelectedSubject(s)} style={{ ...(selectedSubject === s ? btnActiveStyle : btnStyle), flex: 1 }}>{s}</button>
                      <button onClick={() => renameSubject(s)} style={{ ...smallLink, color: COLORS.ink, textDecoration: "underline" }}>Rename</button>
                      <button onClick={() => deleteSubject(s)} style={{ ...smallLink, color: COLORS.stampRed }}>Delete</button>
                    </div>
                  ))}
                  {Object.keys(branch[selectedKey] || {}).length === 0 && <p style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Abhi koi subject nahi hai.</p>}
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
                      <button onClick={() => moveChapter(idx, -1)} disabled={idx === 0} style={{ ...smallLink, color: COLORS.ink }}>↑</button>
                      <button onClick={() => moveChapter(idx, 1)} disabled={idx === chapters.length - 1} style={{ ...smallLink, color: COLORS.ink }}>↓</button>
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

/* ---------- Tab 3: Add Coins ---------- */

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
        Student ne pehle site pe kam se kam ek baar Google se sign-in kiya hua hona chahiye.
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

/* ---------- Tab 4: Messages (Instagram-style inbox) ---------- */

function MessagesTab() {
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selected, setSelected] = useState(null); // { student_id, username, full_name }
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

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
        Students ke messages yahan aate hain. Kisi bhi thread par tap karke poori chat dekhein aur reply karein.
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
                  {t.last_message}
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

/* ---------- Shell with tab switcher ---------- */

export default function AdminPanel({ onBack }) {
  const [tab, setTab] = useState("notes"); // "notes" | "menu" | "coins" | "messages"

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
        <button onClick={() => setTab("menu")} style={tab === "menu" ? btnActiveStyle : btnStyle}>📂 Manage Menu</button>
        <button onClick={() => setTab("coins")} style={tab === "coins" ? btnActiveStyle : btnStyle}>🪙 Add Coins</button>
        <button onClick={() => setTab("messages")} style={tab === "messages" ? btnActiveStyle : btnStyle}>📩 Messages</button>
      </div>

      {tab === "notes" && <NotesTab />}
      {tab === "menu" && <ManageMenuTab />}
      {tab === "coins" && <AddCoinsTab />}
      {tab === "messages" && <MessagesTab />}
    </div>
  );
}
