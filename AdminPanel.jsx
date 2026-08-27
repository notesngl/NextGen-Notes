import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { COLORS, FONTS, SCHOOL_CATALOG, ENTRANCE_CATALOG } from "./siteConfig";

/*
  Admin Panel - upload a PDF and it appears on the site instantly, no
  code editing needed. Only reachable from App.jsx if the signed-in
  user's email matches ADMIN_EMAIL in siteConfig.js.

  Needs, in your Supabase project:
    - a public Storage bucket named "notes-pdfs"
    - a table named "notes" with columns:
      id, category, key, medium, subject, chapter, title, description,
      pages, file_url, created_at
  See the setup instructions given alongside this file for the exact
  SQL to run.
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

export default function AdminPanel({ onBack }) {
  const [category, setCategory] = useState("school");
  const [key, setKey] = useState("");
  const [medium, setMedium] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pages, setPages] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [existingNotes, setExistingNotes] = useState([]);

  const catalog = category === "school" ? SCHOOL_CATALOG : ENTRANCE_CATALOG;
  const keyOptions = Object.keys(catalog);
  const mediumOptions = key ? Object.keys(catalog[key]) : [];
  const subjectOptions = key && medium ? Object.keys(catalog[key][medium]) : [];
  const chapterOptions = key && medium && subject ? catalog[key][medium][subject] : [];

  useEffect(() => {
    setKey(""); setMedium(""); setSubject(""); setChapter("");
  }, [category]);
  useEffect(() => { setMedium(""); setSubject(""); setChapter(""); }, [key]);
  useEffect(() => { setSubject(""); setChapter(""); }, [medium]);
  useEffect(() => { setChapter(""); }, [subject]);
  useEffect(() => {
    if (chapter) setTitle(`${chapter} — Complete Notes`);
  }, [chapter]);

  async function loadExisting() {
    const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
    if (!error && data) setExistingNotes(data);
  }
  useEffect(() => { loadExisting(); }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setMessage("");
    if (!key || !medium || !subject || !chapter || !title.trim() || !file) {
      setMessage("Sab fields aur PDF file zaroori hain.");
      return;
    }
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${category}/${key}/${subject}/${Date.now()}-${safeName}`;
      const { error: uploadErr } = await supabase.storage.from("notes-pdfs").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("notes-pdfs").getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      const { error: insertErr } = await supabase.from("notes").insert({
        category, key, medium, subject, chapter,
        title: title.trim(),
        description: description.trim(),
        pages: pages ? parseInt(pages, 10) : null,
        file_url: fileUrl,
      });
      if (insertErr) throw insertErr;

      setMessage("Upload ho gaya ✓");
      setTitle(""); setDescription(""); setPages(""); setFile(null); setChapter("");
      loadExisting();
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setUploading(false);
  }

  async function handleDelete(note) {
    if (!window.confirm(`Delete "${note.title}"?`)) return;
    await supabase.from("notes").delete().eq("id", note.id);
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
        <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 22, marginBottom: 18 }}>Upload a new PDF</h2>

        <form onSubmit={handleUpload} style={{ background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 8, padding: "18px 16px" }}>
          {field("Category", (
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              <option value="school">School</option>
              <option value="entrance">Entrance Exam</option>
            </select>
          ))}
          {field(category === "school" ? "Class" : "Exam", (
            <select value={key} onChange={(e) => setKey(e.target.value)} style={inputStyle}>
              <option value="">Select</option>
              {keyOptions.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          ))}
          {field("Medium", (
            <select value={medium} onChange={(e) => setMedium(e.target.value)} style={inputStyle} disabled={!key}>
              <option value="">Select</option>
              {mediumOptions.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          ))}
          {field("Subject", (
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle} disabled={!medium}>
              <option value="">Select</option>
              {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ))}
          {field("Chapter", (
            <select value={chapter} onChange={(e) => setChapter(e.target.value)} style={inputStyle} disabled={!subject}>
              <option value="">Select</option>
              {chapterOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ))}
          {field("Title", (
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Note title" />
          ))}
          {field("Description", (
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="Short description" />
          ))}
          {field("Pages", (
            <input type="number" value={pages} onChange={(e) => setPages(e.target.value)} style={inputStyle} placeholder="e.g. 8" />
          ))}
          {field("PDF file", (
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} style={inputStyle} />
          ))}

          <button
            type="submit"
            disabled={uploading}
            style={{ width: "100%", background: COLORS.margin, color: COLORS.paper, border: "none", borderRadius: 6, padding: "12px 16px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Kalam', cursive", marginTop: 6 }}
          >
            {uploading ? "Uploading..." : "Upload note"}
          </button>
          {message && <p style={{ fontSize: 13, color: message.startsWith("Error") ? COLORS.stampRed : COLORS.ink, marginTop: 10 }}>{message}</p>}
        </form>

        <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 19, margin: "32px 0 12px" }}>Uploaded notes ({existingNotes.length})</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {existingNotes.map((n) => (
            <div key={n.id} style={{ background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 6, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>{n.title}</p>
                <p style={{ margin: 0, fontSize: 11.5, color: COLORS.inkSoft }}>{n.key} · {n.subject} · {n.chapter}</p>
              </div>
              <button onClick={() => handleDelete(n)} style={{ background: "none", border: "none", color: COLORS.stampRed, fontSize: 12.5, cursor: "pointer", flexShrink: 0 }}>
                Delete
              </button>
            </div>
          ))}
          {existingNotes.length === 0 && <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Koi note upload nahi hua ab tak.</p>}
        </div>
      </section>
    </div>
  );
}
