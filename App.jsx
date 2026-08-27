import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { COLORS, FONTS, TUITION_NAME, ABOUT_WEBSITE, ABOUT_TUITION, ADMIN_EMAIL, SCHOOL_CATALOG, ENTRANCE_CATALOG } from "./siteConfig";
import AdminPanel from "./AdminPanel";

/*
  NextGen Notes — digital handwritten notes storefront.
  Notes are NOT hardcoded here anymore — they live in a Supabase table
  called "notes". The Admin Panel (visible only to ADMIN_EMAIL, set in
  siteConfig.js) uploads PDFs and writes rows into that table; this file
  just reads them and slots them into the right Class/Exam -> Subject ->
  Chapter folder.

  See siteConfig.js for the class/subject/chapter catalog and the
  ADMIN_EMAIL setting, and AdminPanel.jsx for the upload form.
*/

function Stamp({ size = 84 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        border: `3px solid ${COLORS.stampRed}`, color: COLORS.stampRed,
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: "rotate(-11deg)", fontFamily: "'Kalam', cursive",
        fontWeight: 700, fontSize: size * 0.16, textAlign: "center",
        lineHeight: 1.05, opacity: 0.85, letterSpacing: "0.02em",
        flexShrink: 0, userSelect: "none",
      }}
      aria-hidden="true"
    >
      Notes<br />Verified
    </div>
  );
}

function RuledCard({ children, style = {} }) {
  return (
    <div
      style={{
        background: COLORS.paper,
        backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 27px, ${COLORS.rule}55 28px)`,
        borderRadius: 4,
        boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 8px 20px -12px rgba(38,50,74,0.35)",
        border: `1px solid ${COLORS.paperDark}`, position: "relative", paddingLeft: 22, ...style,
      }}
    >
      <div style={{ position: "absolute", left: 10, top: 0, bottom: 0, width: 1.5, background: `${COLORS.margin}88` }} aria-hidden="true" />
      {children}
    </div>
  );
}

function TornEdge() {
  return (
    <svg viewBox="0 0 400 16" preserveAspectRatio="none" style={{ width: "100%", height: 14, display: "block" }}>
      <path d="M0,0 L0,10 L14,4 L28,12 L42,3 L56,11 L70,2 L84,10 L98,4 L112,12 L126,3 L140,11 L154,2 L168,10 L182,4 L196,12 L210,3 L224,11 L238,2 L252,10 L266,4 L280,12 L294,3 L308,11 L322,2 L336,10 L350,4 L364,12 L378,3 L392,11 L400,6 L400,0 Z" fill={COLORS.paper} />
    </svg>
  );
}

function AvailableSoon() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <RuledCard style={{ padding: "18px 16px" }}>
        <div style={{ border: `1.5px dashed ${COLORS.inkSoft}66`, borderRadius: 6, padding: "22px 10px", textAlign: "center" }}>
          <p style={{ fontFamily: "'Kalam', cursive", fontSize: 15, color: COLORS.inkSoft, margin: 0 }}>Available soon</p>
        </div>
      </RuledCard>
      <TornEdge />
    </div>
  );
}

function toEmbedUrl(url) {
  const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return url;
}

/* PDF opens inline on the page */
function PdfViewer({ note }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <RuledCard style={{ padding: "16px 14px" }}>
        <h4 style={{ fontFamily: "'Kalam', cursive", fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: COLORS.ink }}>
          {note.title}
        </h4>
        <p style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 12 }}>{note.pages} pages · Free</p>
        <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 4", borderRadius: 6, overflow: "hidden", border: `1px solid ${COLORS.paperDark}` }}>
          <iframe src={toEmbedUrl(note.file_url)} title={note.title} style={{ width: "100%", height: "100%", border: "none" }} />
        </div>
      </RuledCard>
      <TornEdge />
    </div>
  );
}

/* Menu: School / Entrance Exam -> Class or Exam -> Hindi Medium */
function NavDrawer({ open, onClose, onHome, onPickMedium, isAdmin, onOpenAdmin }) {
  const [branch, setBranch] = useState(null);
  const [openItem, setOpenItem] = useState(null);

  if (!open) return null;
  const catalogFor = branch === "school" ? SCHOOL_CATALOG : ENTRANCE_CATALOG;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(38,50,74,0.55)" }} />
      <div style={{ position: "relative", width: "min(340px, 86vw)", height: "100%", background: COLORS.paperDark, overflowY: "auto", boxShadow: "-12px 0 32px -16px rgba(0,0,0,0.4)", fontFamily: "'Work Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 18px 14px", background: COLORS.ink }}>
          <span style={{ fontFamily: "'Kalam', cursive", fontSize: 19, fontWeight: 700, color: COLORS.gold }}>Menu</span>
          <button onClick={onClose} aria-label="Close menu" style={{ background: "none", border: "none", color: COLORS.paper, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: "10px 6px 30px" }}>
          <button onClick={() => { onHome(); onClose(); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 14px", fontFamily: "'Kalam', cursive", fontSize: 16.5, fontWeight: 700, color: COLORS.ink, cursor: "pointer" }}>
            🏠 Home
          </button>

          {["school", "entrance"].map((b) => (
            <div key={b}>
              <button
                onClick={() => { setBranch(branch === b ? null : b); setOpenItem(null); }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: "12px 14px", fontFamily: "'Kalam', cursive", fontSize: 16.5, fontWeight: 700, color: COLORS.ink, cursor: "pointer" }}
              >
                <span>{b === "school" ? "School" : "Entrance Exam"}</span>
                <span style={{ color: COLORS.inkSoft, fontSize: 13 }}>{branch === b ? "▾" : "▸"}</span>
              </button>
              {branch === b && Object.keys(catalogFor).map((item) => (
                <div key={item}>
                  <button
                    onClick={() => setOpenItem(openItem === item ? null : item)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: "9px 14px 9px 28px", fontFamily: "'Work Sans', sans-serif", fontSize: 14.5, fontWeight: 600, color: COLORS.ink, cursor: "pointer" }}
                  >
                    <span>{item}</span>
                    <span style={{ color: COLORS.inkSoft, fontSize: 12 }}>{openItem === item ? "▾" : "▸"}</span>
                  </button>
                  {openItem === item && Object.keys(catalogFor[item]).map((medium) => (
                    <button
                      key={medium}
                      onClick={() => { onPickMedium(b, item, medium); onClose(); }}
                      style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "8px 14px 8px 42px", fontFamily: "'Work Sans', sans-serif", fontSize: 13.5, color: COLORS.inkSoft, cursor: "pointer" }}
                    >
                      {medium}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}

          {isAdmin && (
            <button
              onClick={() => { onOpenAdmin(); onClose(); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${COLORS.paperDark}`, marginTop: 14, paddingTop: 16, padding: "16px 14px 12px", fontFamily: "'Kalam', cursive", fontSize: 16.5, fontWeight: 700, color: COLORS.margin, cursor: "pointer" }}
            >
              🛠 Admin Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loginWithGoogle() {
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (err) setError(err.message);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paperDark, fontFamily: "'Work Sans', sans-serif", color: COLORS.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{FONTS}</style>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}><Stamp size={90} /></div>
        <h1 style={{ fontFamily: "'Kalam', cursive", fontSize: 28, textAlign: "center", margin: "0 0 6px" }}>{TUITION_NAME}</h1>
        <p style={{ textAlign: "center", color: COLORS.inkSoft, fontSize: 14, marginBottom: 26 }}>Sign in to open your notebook.</p>
        <RuledCard style={{ padding: "22px 18px" }}>
          <button onClick={loginWithGoogle} disabled={loading} style={{ width: "100%", background: COLORS.paper, border: `1.5px solid ${COLORS.ink}`, borderRadius: 6, padding: "12px 16px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'Work Sans', sans-serif" }}>
            {loading ? "Redirecting..." : "Continue with Google"}
          </button>
          {error && <p style={{ color: COLORS.stampRed, fontSize: 12.5, marginTop: 12 }}>{error}</p>}
        </RuledCard>
      </div>
    </div>
  );
}

export default function NextGenNotes() {
  const [session, setSession] = useState(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nav, setNav] = useState(null);
  const [view, setView] = useState("store"); // "store" | "admin"
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadNotes() {
    const { data, error } = await supabase.from("notes").select("*");
    if (!error && data) setNotes(data);
  }

  useEffect(() => {
    if (session) loadNotes();
  }, [session, view]);

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.paperDark, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.inkSoft, fontFamily: "'Work Sans', sans-serif" }}>
        <style>{FONTS}</style>Loading...
      </div>
    );
  }
  if (!session) return <LoginScreen />;

  const isAdmin = session.user?.email === ADMIN_EMAIL;

  if (view === "admin" && isAdmin) {
    return <AdminPanel onBack={() => setView("store")} />;
  }

  const catalogRoot = nav?.category === "school" ? SCHOOL_CATALOG : nav?.category === "entrance" ? ENTRANCE_CATALOG : null;
  const subjectsObj = nav?.key && nav?.medium ? catalogRoot[nav.key][nav.medium] : null;

  function findNotes(category, key, medium, subject, chapter) {
    return notes.filter((n) => n.category === category && n.key === key && n.medium === medium && n.subject === subject && n.chapter === chapter);
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paperDark, fontFamily: "'Work Sans', sans-serif", color: COLORS.ink }}>
      <style>{FONTS}</style>

      <header style={{ background: COLORS.ink, color: COLORS.paper, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, cursor: "pointer" }} onClick={() => setNav(null)}>
          <span style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 22, color: COLORS.gold }}>{TUITION_NAME}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => supabase.auth.signOut()} style={{ background: "none", border: "none", color: `${COLORS.paper}99`, fontSize: 13, cursor: "pointer" }}>Sign out</button>
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" style={{ background: "transparent", border: `1.5px solid ${COLORS.paper}66`, color: COLORS.paper, borderRadius: 6, padding: "8px 12px", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>☰</button>
        </div>
      </header>

      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onHome={() => setNav(null)}
        onPickMedium={(category, key, medium) => setNav({ category, key, medium, subject: null, chapter: null })}
        isAdmin={isAdmin}
        onOpenAdmin={() => setView("admin")}
      />

      {!nav && (
        <section style={{ padding: "56px 24px 70px", maxWidth: 780, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><Stamp size={100} /></div>
          <h1 style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1.15, margin: "0 0 20px", textAlign: "center", color: COLORS.ink }}>
            {TUITION_NAME}
          </h1>
          <RuledCard style={{ padding: "20px 18px", marginBottom: 20 }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.margin, marginBottom: 8 }}>About this website</p>
            <p style={{ fontSize: 15, color: COLORS.inkSoft, lineHeight: 1.6, margin: 0 }}>{ABOUT_WEBSITE}</p>
          </RuledCard>
          <RuledCard style={{ padding: "20px 18px" }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.margin, marginBottom: 8 }}>About the tuition</p>
            <p style={{ fontSize: 15, color: COLORS.inkSoft, lineHeight: 1.6, margin: 0 }}>{ABOUT_TUITION}</p>
          </RuledCard>
          <p style={{ textAlign: "center", color: COLORS.inkSoft, fontSize: 13, marginTop: 26 }}>Tap ☰ above to browse notes.</p>
        </section>
      )}

      {nav && !nav.subject && (
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px 70px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.margin, marginBottom: 6 }}>{nav.key} · {nav.medium}</p>
          <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 24, margin: "0 0 20px", color: COLORS.ink }}>Subjects</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14 }}>
            {Object.keys(subjectsObj).map((subject) => (
              <button key={subject} onClick={() => setNav({ ...nav, subject, chapter: null })} style={{ background: COLORS.paper, border: `1.5px solid ${COLORS.paperDark}`, borderLeft: `4px solid ${COLORS.margin}`, borderRadius: 6, padding: "16px", textAlign: "left", cursor: "pointer", fontFamily: "'Kalam', cursive", fontSize: 17, fontWeight: 700, color: COLORS.ink }}>
                {subject}
              </button>
            ))}
          </div>
        </section>
      )}

      {nav && nav.subject && !nav.chapter && (
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px 70px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.margin, marginBottom: 6 }}>
            {nav.key} · {nav.medium} ·{" "}
            <button onClick={() => setNav({ ...nav, subject: null })} style={{ background: "none", border: "none", color: COLORS.margin, textDecoration: "underline", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: 0 }}>
              {nav.subject}
            </button>
          </p>
          <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 24, margin: "0 0 20px", color: COLORS.ink }}>Chapters</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {subjectsObj[nav.subject].map((chapter) => (
              <button key={chapter} onClick={() => setNav({ ...nav, chapter })} style={{ display: "block", width: "100%", textAlign: "left", background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 6, padding: "13px 16px", fontFamily: "'Work Sans', sans-serif", fontSize: 14.5, color: COLORS.ink, cursor: "pointer" }}>
                {chapter}
              </button>
            ))}
          </div>
        </section>
      )}

      {nav && nav.chapter && (
        <section style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 70px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.margin, marginBottom: 6 }}>
            {nav.key} · {nav.medium} ·{" "}
            <button onClick={() => setNav({ ...nav, chapter: null })} style={{ background: "none", border: "none", color: COLORS.margin, textDecoration: "underline", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: 0 }}>
              {nav.subject}
            </button>
          </p>
          <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 22, margin: "0 0 18px", color: COLORS.ink }}>{nav.chapter}</h2>
          {(() => {
            const chapterNotes = findNotes(nav.category, nav.key, nav.medium, nav.subject, nav.chapter);
            return chapterNotes.length > 0 ? (
              <div style={{ display: "grid", gap: 20 }}>
                {chapterNotes.map((n) => <PdfViewer key={n.id} note={n} />)}
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
