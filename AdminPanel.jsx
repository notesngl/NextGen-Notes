import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { COLORS, FONTS } from "./siteConfig";

/*
  Admin Panel — two tabs:
    1. Notes    — add/edit/delete notes (unchanged behaviour)
    2. Menu     — add/rename/delete Class/Exam, Medium, Subject, Chapter.
                  This replaces the old hardcoded SCHOOL_CATALOG /
                  ENTRANCE_CATALOG in siteConfig.js. Data lives in the
                  Supabase table "site_catalog" (see catalog_migration.sql).

  Only reachable from App.jsx if the signed-in user's email matches
  ADMIN_EMAIL in siteConfig.js.

  "notes" table needs these columns:
    id, category, key, medium, subject, chapter, title, description,
    pages, file_url, whatsapp_link, created_at

  "site_catalog" table needs:
    id (text, 'school' or 'entrance'), data (jsonb)
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

const emptyForm = { category: "school", key: "", medium: "", subject: "", chapter: "", title: "", description: "", pages: "", driveLink: "", whatsappLink: "" };

/* ---------- Tab 1: Notes (unchanged from before) ---------- */

function NotesTab() {
  const [catalog, setCatalog] = useState({ school: {}, entrance: {} });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [existingNotes, setExistingNotes] = useState([]);

  const { category, key, medium, subject, chapter, title, description, pages, driveLink, whatsappLink } = form;
  function set(fieldName, value) {
    setForm((f) => ({ ...f, [fieldName]: value }));
  }

  const catalogRoot = category === "school" ? catalog.school : catalog.entrance;
  const keyOptions = Object.keys(catalogRoot || {});
  const mediumOptions = key && catalogRoot[key] ? Object.keys(catalogRoot[key]) : [];
  const subjectOptions = key && medium && catalogRoot[key]?.[medium] ? Object.keys(catalogRoot[key][medium]) : [];
  const chapterOptions = key && medium && subject && catalogRoot[key]?.[medium]?.[subject] ? catalogRoot[key][medium][subject] : [];

  async function loadCatalog() {
    const { data, error } = await supabase.from("site_catalog").select("*");
    if (!error && data) {
      const next = { school: {}, entrance: {} };
      data.forEach((row) => { next[row.id] = row.data || {}; });
      setCatalog(next);
    }
  }

  async function loadExisting() {
    const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
    if (!error && data) setExistingNotes(data);
  }
  useEffect(() => { loadExisting(); loadCatalog(); }, []);

  function startEdit(note) {
    setEditingId(note.id);
    setForm({
      category: note.category,
      key: note.key,
      medium: note.medium,
      subject: note.subject,
      chapter: note.chapter,
      title: note.title,
      description: note.description || "",
      pages: note.pages != null ? String(note.pages) : "",
      driveLink: note.file_url || "",
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
    if (!key || !medium || !subject || !chapter || !title.trim() || !driveLink.trim()) {
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
        {field("Category", (
          <select value={category} onChange={(e) => set("category", e.target.value)} style={inputStyle}>
            <option value="school">School</option>
            <option value="entrance">Entrance Exam</option>
          </select>
        ))}
        {field(category === "school" ? "Class" : "Exam", (
          <select value={key} onChange={(e) => set("key", e.target.value)} style={inputStyle}>
            <option value="">Select</option>
            {keyOptions.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        ))}
        {field("Medium", (
          <select value={medium} onChange={(e) => set("medium", e.target.value)} style={inputStyle} disabled={!key}>
            <option value="">Select</option>
            {mediumOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        ))}
        {field("Subject", (
          <select value={subject} onChange={(e) => set("subject", e.target.value)} style={inputStyle} disabled={!medium}>
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
        {(key && medium && subject && chapterOptions.length === 0) && (
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
              <p style={{ margin: 0, fontSize: 11.5, color: COLORS.inkSoft }}>{n.key} · {n.medium} · {n.subject} · {n.chapter}</p>
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

/* ---------- Tab 2: Manage Menu (Class/Exam -> Medium -> Subject -> Chapter) ---------- */

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

function ManageMenuTab() {
  const [category, setCategory] = useState("school");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedMedium, setSelectedMedium] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [newKey, setNewKey] = useState("");
  const [newMedium, setNewMedium] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newChapter, setNewChapter] = useState("");

  async function load(cat) {
    setLoading(true);
    setSelectedKey(null); setSelectedMedium(null); setSelectedSubject(null);
    const { data: row, error } = await supabase.from("site_catalog").select("data").eq("id", cat).single();
    setData(!error && row ? row.data || {} : {});
    setLoading(false);
  }

  useEffect(() => { load(category); }, [category]);

  function clone() { return JSON.parse(JSON.stringify(data)); }

  async function save(updated) {
    setSaving(true);
    setMsg("");
    const { error } = await supabase.from("site_catalog").update({ data: updated }).eq("id", category);
    if (error) setMsg("Error: " + error.message);
    else { setData(updated); setMsg("Saved ✓"); }
    setSaving(false);
  }

  function addKey() {
    if (!newKey.trim()) return;
    const d = clone();
    if (d[newKey.trim()]) { setMsg("Ye pehle se hai."); return; }
    d[newKey.trim()] = { "Hindi Medium": {}, "English Medium": {} };
    save(d);
    setNewKey("");
  }
  function deleteKey(k) {
    if (!window.confirm(`"${k}" aur uske andar sab kuch delete karein?`)) return;
    const d = clone();
    delete d[k];
    save(d);
    if (selectedKey === k) { setSelectedKey(null); setSelectedMedium(null); setSelectedSubject(null); }
  }
  function renameKey(oldK) {
    const nk = window.prompt("Naya naam:", oldK);
    if (!nk || !nk.trim() || nk === oldK) return;
    const d = clone();
    d[nk.trim()] = d[oldK];
    delete d[oldK];
    save(d);
    if (selectedKey === oldK) setSelectedKey(nk.trim());
  }

  function addMedium() {
    if (!newMedium.trim() || !selectedKey) return;
    const d = clone();
    if (d[selectedKey][newMedium.trim()]) { setMsg("Ye pehle se hai."); return; }
    d[selectedKey][newMedium.trim()] = {};
    save(d);
    setNewMedium("");
  }
  function deleteMedium(m) {
    if (!window.confirm(`"${m}" delete karein?`)) return;
    const d = clone();
    delete d[selectedKey][m];
    save(d);
    if (selectedMedium === m) { setSelectedMedium(null); setSelectedSubject(null); }
  }

  function addSubject() {
    if (!newSubject.trim() || !selectedKey || !selectedMedium) return;
    const d = clone();
    if (d[selectedKey][selectedMedium][newSubject.trim()]) { setMsg("Ye pehle se hai."); return; }
    d[selectedKey][selectedMedium][newSubject.trim()] = [];
    save(d);
    setNewSubject("");
  }
  function deleteSubject(s) {
    if (!window.confirm(`"${s}" aur uske chapters delete karein?`)) return;
    const d = clone();
    delete d[selectedKey][selectedMedium][s];
    save(d);
    if (selectedSubject === s) setSelectedSubject(null);
  }
  function renameSubject(oldS) {
    const ns = window.prompt("Naya naam:", oldS);
    if (!ns || !ns.trim() || ns === oldS) return;
    const d = clone();
    d[selectedKey][selectedMedium][ns.trim()] = d[selectedKey][selectedMedium][oldS];
    delete d[selectedKey][selectedMedium][oldS];
    save(d);
    if (selectedSubject === oldS) setSelectedSubject(ns.trim());
  }

  function addChapter() {
    if (!newChapter.trim() || !selectedKey || !selectedMedium || !selectedSubject) return;
    const d = clone();
    d[selectedKey][selectedMedium][selectedSubject].push(newChapter.trim());
    save(d);
    setNewChapter("");
  }
  function deleteChapter(idx) {
    const d = clone();
    d[selectedKey][selectedMedium][selectedSubject].splice(idx, 1);
    save(d);
  }
  function renameChapter(idx, oldC) {
    const nc = window.prompt("Naya naam:", oldC);
    if (!nc || !nc.trim()) return;
    const d = clone();
    d[selectedKey][selectedMedium][selectedSubject][idx] = nc.trim();
    save(d);
  }
  function moveChapter(idx, dir) {
    const d = clone();
    const arr = d[selectedKey][selectedMedium][selectedSubject];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    save(d);
  }

  const chapters = selectedKey && selectedMedium && selectedSubject ? (data[selectedKey][selectedMedium][selectedSubject] || []) : [];

  return (
    <section style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px 60px" }}>
      <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 22, marginBottom: 6 }}>Manage Menu</h2>
      <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 18 }}>
        Yahan se website ke ☰ menu mein Class/Exam, Medium, Subject aur Chapter add/rename/delete kar sakte ho — code chhoone ki zaroorat nahi.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => setCategory("school")} style={category === "school" ? btnActiveStyle : btnStyle}>School</button>
        <button onClick={() => setCategory("entrance")} style={category === "entrance" ? btnActiveStyle : btnStyle}>Entrance Exam</button>
        {saving && <span style={{ fontSize: 12, color: COLORS.inkSoft, alignSelf: "center" }}>Saving...</span>}
      </div>

      {msg && <p style={{ fontSize: 13, color: msg.startsWith("Error") ? COLORS.stampRed : COLORS.ink, marginBottom: 14 }}>{msg}</p>}

      {loading || !data ? (
        <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Loading...</p>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>

          {/* Class / Exam column */}
          <div>
            <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 16, margin: "0 0 8px" }}>
              {category === "school" ? "Classes" : "Exams"}
            </h3>
            <div style={{ display: "grid", gap: 6 }}>
              {Object.keys(data).map((k) => (
                <div key={k} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    onClick={() => { setSelectedKey(k); setSelectedMedium(null); setSelectedSubject(null); }}
                    style={{ ...(selectedKey === k ? btnActiveStyle : btnStyle), flex: 1 }}
                  >
                    {k}
                  </button>
                  <button onClick={() => renameKey(k)} style={{ ...smallLink, color: COLORS.ink, textDecoration: "underline" }}>Rename</button>
                  <button onClick={() => deleteKey(k)} style={{ ...smallLink, color: COLORS.stampRed }}>Delete</button>
                </div>
              ))}
              {Object.keys(data).length === 0 && <p style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Abhi koi {category === "school" ? "class" : "exam"} nahi hai.</p>}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder={category === "school" ? "e.g. Class 6" : "e.g. JEE"} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addKey} style={{ ...btnStyle, background: COLORS.margin, color: COLORS.paper, borderColor: COLORS.margin }}>Add</button>
            </div>
          </div>

          {/* Medium column */}
          {selectedKey && (
            <div>
              <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 16, margin: "0 0 8px" }}>Medium — {selectedKey}</h3>
              <div style={{ display: "grid", gap: 6 }}>
                {Object.keys(data[selectedKey] || {}).map((m) => (
                  <div key={m} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={() => { setSelectedMedium(m); setSelectedSubject(null); }} style={{ ...(selectedMedium === m ? btnActiveStyle : btnStyle), flex: 1 }}>{m}</button>
                    <button onClick={() => deleteMedium(m)} style={{ ...smallLink, color: COLORS.stampRed }}>Delete</button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <input value={newMedium} onChange={(e) => setNewMedium(e.target.value)} placeholder="e.g. Hindi Medium" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addMedium} style={{ ...btnStyle, background: COLORS.margin, color: COLORS.paper, borderColor: COLORS.margin }}>Add</button>
              </div>
            </div>
          )}

          {/* Subject column */}
          {selectedKey && selectedMedium && (
            <div>
              <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 16, margin: "0 0 8px" }}>Subjects — {selectedKey} · {selectedMedium}</h3>
              <div style={{ display: "grid", gap: 6 }}>
                {Object.keys(data[selectedKey][selectedMedium] || {}).map((s) => (
                  <div key={s} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={() => setSelectedSubject(s)} style={{ ...(selectedSubject === s ? btnActiveStyle : btnStyle), flex: 1 }}>{s}</button>
                    <button onClick={() => renameSubject(s)} style={{ ...smallLink, color: COLORS.ink, textDecoration: "underline" }}>Rename</button>
                    <button onClick={() => deleteSubject(s)} style={{ ...smallLink, color: COLORS.stampRed }}>Delete</button>
                  </div>
                ))}
                {Object.keys(data[selectedKey][selectedMedium] || {}).length === 0 && <p style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Abhi koi subject nahi hai.</p>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="e.g. Maths" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addSubject} style={{ ...btnStyle, background: COLORS.margin, color: COLORS.paper, borderColor: COLORS.margin }}>Add</button>
              </div>
            </div>
          )}

          {/* Chapter column */}
          {selectedKey && selectedMedium && selectedSubject && (
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
      )}
    </section>
  );
}

/* ---------- Shell with tab switcher ---------- */

export default function AdminPanel({ onBack }) {
  const [tab, setTab] = useState("notes"); // "notes" | "menu"

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paperDark, fontFamily: "'Work Sans', sans-serif", color: COLORS.ink }}>
      <style>{FONTS}</style>
      <header style={{ background: COLORS.ink, color: COLORS.paper, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 20, color: COLORS.gold }}>Admin Panel</span>
        <button onClick={onBack} style={{ background: "transparent", border: `1.5px solid ${COLORS.paper}66`, color: COLORS.paper, borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
          ← Back to site
        </button>
      </header>

      <div style={{ display: "flex", gap: 8, maxWidth: 700, margin: "20px auto 0", padding: "0 20px" }}>
        <button onClick={() => setTab("notes")} style={tab === "notes" ? btnActiveStyle : btnStyle}>📝 Notes</button>
        <button onClick={() => setTab("menu")} style={tab === "menu" ? btnActiveStyle : btnStyle}>📂 Manage Menu</button>
      </div>

      {tab === "notes" ? <NotesTab /> : <ManageMenuTab />}
    </div>
  );
}
