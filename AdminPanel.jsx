import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { COLORS, FONTS, SCHOOL_CATALOG, ENTRANCE_CATALOG } from "./siteConfig";

/*
  Admin Panel - add/edit/delete notes, no code editing needed. Only
  reachable from App.jsx if the signed-in user's email matches
  ADMIN_EMAIL in siteConfig.js.

  Needs, in your Supabase "notes" table, these columns:
    id, category, key, medium, subject, chapter, title, description,
    pages, file_url, whatsapp_link, created_at

  If you created the table before whatsapp_link existed, run this once
  in the Supabase SQL Editor:
    alter table notes add column whatsapp_link text;
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

export default function AdminPanel({ onBack }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [existingNotes, setExistingNotes] = useState([]);

  const { category, key, medium, subject, chapter, title, description, pages, driveLink, whatsappLink } = form;
  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const catalog = category === "school" ? SCHOOL_CATALOG : ENTRANCE_CATALOG;
  const keyOptions = Object.keys(catalog);
  const mediumOptions = key ? Object.keys(catalog[key]) : [];
  const subjectOptions = key && medium ? Object.keys(catalog[key][medium]) : [];
  const chapterOptions = key && medium && subject ? catalog[key][medium][subject] : [];

  async function loadExisting() {
    const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
    if (!error && data) setExistingNotes(data);
  }
  useEffect(() => { loadExisting(); }, []);

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
    <div style={{ minHeight: "100vh", background: COLORS.paperDark, fontFamily: "'Work Sans', sans-serif", color: COLORS.ink }}>
      <style>{FONTS}</style>
      <header style={{ background: COLORS.ink, color: COLORS.paper, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 20, color: COLORS.gold }}>Admin Panel</span>
        <button onClick={onBack} style={{ background: "transparent", border: `1.5px solid ${COLORS.paper}66`, color: COLORS.paper, borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
          ← Back to site
        </button>
      </header>

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
    </div>
  );
}
