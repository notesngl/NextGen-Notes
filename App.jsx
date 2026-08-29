import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { COLORS, FONTS, TUITION_NAME, ABOUT_WEBSITE, ABOUT_TUITION, ADMIN_EMAIL } from "./siteConfig";
import AdminPanel from "./AdminPanel";

/*
  NextGen Notes — digital handwritten notes storefront.

  Notes live in a Supabase table called "notes" (unchanged).
  The MENU (Medium -> School/Entrance -> Class/Exam -> Subject -> Chapter)
  lives in Supabase in a table called "site_catalog", single row with
  id='catalog', shape:
    {
      "Hindi Medium":   { "school": { "Class 6": { Subject: [Chapters] } }, "entrance": {...} },
      "English Medium": { "school": {...}, "entrance": {...} }
    }
  Edited entirely from the Admin Panel -> Manage Menu tab.
  See catalog_migration_v2.sql for the one-time table setup.

  COIN + REFERRAL + DAILY LOGIN STREAK + BUY COINS SYSTEM
  - "profiles" table: id (=auth user id), coins, referred_by,
    last_login_date, current_streak, created_at.
  - Signing in calls register_profile(referrer_id) RPC once — creates the
    profile row, credits welcome bonus if referred, credits referrer.
  - If today's bonus hasn't been claimed yet (profile.last_login_date is
    not today), a "Claim your daily bonus" popup opens automatically.
    The student must tap "Claim" — only then does claim_daily_login_bonus()
    RPC run: +1 coin for a normal day, or +9 coins on the 7th continuous
    day (then the streak resets). Each claim is recorded in
    "login_history".
  - Each note can optionally have a "full_pdf_link" (Google Drive link,
    separate from the free-preview file_url). If present, a "Open with
    coins" button shows; clicking spends COIN_COST coins via the
    redeem_note RPC and opens the link.
  - "🎁 Refer & Earn" and "🪙 Buy Coins" are both reachable directly from
    the ☰ menu now (Refer was previously only reachable via the header
    coin badge — that shortcut still works too).
  - Buy Coins has no in-app payment gateway: it shows fixed coin
    packages, and tapping one opens WhatsApp (BUY_COINS_WHATSAPP_NUMBER)
    with a prefilled message — admin manually credits coins afterwards
    from Admin Panel -> Add Coins (by the student's email).
  - Login History page (from the ☰ menu) lists login_history rows for
    the signed-in user: date, which day of the streak, coins earned.
  See the SQL setup (profiles/login_history tables + register_profile +
  redeem_note + claim_daily_login_bonus + admin_add_coins functions) —
  run once in the Supabase SQL editor.
*/

const COIN_COST = 10; // coins required to unlock one note's full PDF

// Buy Coins config — edit these anytime
const BUY_COINS_WHATSAPP_NUMBER = "916206549468"; // country code + number, no +/spaces
const COIN_PACKAGES = [
  { coins: 50, price: 20 },
  { coins: 120, price: 40 },
  { coins: 300, price: 90 },
];

function todayStr() {
  // local YYYY-MM-DD, matches how login_history.login_date reads back
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
function PdfViewer({ note, profile, onRedeem }) {
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
        {note.whatsapp_link && (
          <a
            href={note.whatsapp_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: 12,
              background: "#25D366",
              color: "#fff",
              borderRadius: 6,
              padding: "11px 16px",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              fontFamily: "'Kalam', cursive",
            }}
          >
            📩 Poori Notes Kharidein (WhatsApp)
          </a>
        )}
        {note.full_pdf_link && (
          <button
            onClick={() => onRedeem(note)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              marginTop: 10,
              background: COLORS.gold,
              color: COLORS.ink,
              border: "none",
              borderRadius: 6,
              padding: "11px 16px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Kalam', cursive",
            }}
          >
            🪙 Coins Se Kholein ({COIN_COST} coins — Full PDF Free){profile ? ` · Aapke paas: ${profile.coins}` : ""}
          </button>
        )}
      </RuledCard>
      <TornEdge />
    </div>
  );
}

/* Modal: shows coin balance + personal referral link to share */
function ReferModal({ open, onClose, coins, refLink }) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(38,50,74,0.55)" }} />
      <div style={{ position: "relative", background: COLORS.paper, borderRadius: 10, padding: "24px 20px", maxWidth: 380, width: "100%" }}>
        <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 20, margin: "0 0 8px" }}>Refer & Earn 🪙</h3>
        <p style={{ fontSize: 13.5, color: COLORS.inkSoft, marginBottom: 14 }}>
          Apna link doston ko bhejo. Wo is link se sign up karega to aapko 30 coins milenge, aur use 5 coins welcome bonus milega.
        </p>
        <p style={{ fontSize: 13, marginBottom: 14 }}>Aapke coins: <b>{coins}</b></p>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            readOnly
            value={refLink}
            style={{ flex: 1, padding: "9px 10px", fontSize: 12, borderRadius: 6, border: `1.5px solid ${COLORS.inkSoft}55`, background: COLORS.paperDark, color: COLORS.ink }}
          />
          <button
            onClick={() => { navigator.clipboard.writeText(refLink); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            style={{ background: COLORS.margin, color: COLORS.paper, border: "none", borderRadius: 6, padding: "9px 12px", fontSize: 13, cursor: "pointer", fontWeight: 700 }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <button onClick={onClose} style={{ width: "100%", background: "none", border: `1.5px solid ${COLORS.inkSoft}55`, borderRadius: 6, padding: "10px", fontSize: 13.5, cursor: "pointer", color: COLORS.ink }}>
          Close
        </button>
      </div>
    </div>
  );
}

/* Modal: fixed coin packages -> WhatsApp with a prefilled message.
   No in-app payment; admin manually credits coins after payment via
   Admin Panel -> Add Coins. */
function BuyCoinsModal({ open, onClose, userEmail }) {
  if (!open) return null;

  function buyLink(pkg) {
    const msg = `Hi! Main ${pkg.coins} coins kharidna chahta/chahti hoon (₹${pkg.price}). Mera email: ${userEmail}`;
    return `https://wa.me/${BUY_COINS_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(38,50,74,0.55)" }} />
      <div style={{ position: "relative", background: COLORS.paper, borderRadius: 10, padding: "24px 20px", maxWidth: 380, width: "100%" }}>
        <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 20, margin: "0 0 8px" }}>Buy Coins 🪙</h3>
        <p style={{ fontSize: 13.5, color: COLORS.inkSoft, marginBottom: 16 }}>
          Package choose karke WhatsApp par payment confirm karein — coins jaldi hi aapke account mein add ho jayenge.
        </p>
        <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
          {COIN_PACKAGES.map((pkg) => (
            <a
              key={pkg.coins}
              href={buyLink(pkg)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: COLORS.paperDark,
                border: `1.5px solid ${COLORS.gold}88`,
                borderRadius: 8,
                padding: "13px 16px",
                textDecoration: "none",
                color: COLORS.ink,
              }}
            >
              <span style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 16 }}>🪙 {pkg.coins} coins</span>
              <span style={{ background: "#25D366", color: "#fff", borderRadius: 6, padding: "7px 12px", fontSize: 13, fontWeight: 700 }}>₹{pkg.price} · WhatsApp</span>
            </a>
          ))}
        </div>
        <button onClick={onClose} style={{ width: "100%", background: "none", border: `1.5px solid ${COLORS.inkSoft}55`, borderRadius: 6, padding: "10px", fontSize: 13.5, cursor: "pointer", color: COLORS.ink }}>
          Close
        </button>
      </div>
    </div>
  );
}

/* Popup: student must tap Claim to receive today's login bonus.
   previewDay/previewBonus are a best-effort guess (server has final say);
   after claiming, the real amount earned is shown. */
function DailyBonusModal({ open, onClose, previewDay, previewBonus, claiming, claimed, earnedCoins, onClaim }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(38,50,74,0.6)" }} />
      <div style={{ position: "relative", background: COLORS.paper, borderRadius: 10, padding: "26px 22px", maxWidth: 360, width: "100%", textAlign: "center" }}>
        {!claimed ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🎁</div>
            <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 21, margin: "0 0 8px" }}>Aaj ka Login Bonus</h3>
            <p style={{ fontSize: 13.5, color: COLORS.inkSoft, marginBottom: 4 }}>
              Streak — Din {previewDay} / 7
            </p>
            <p style={{ fontSize: 13.5, color: COLORS.inkSoft, marginBottom: 18 }}>
              {previewBonus >= 9
                ? "🎉 Aaj 7th continuous din hai — bada bonus milega!"
                : "Roz login karke coins kamayein. 7th continuous din +9 coins!"}
            </p>
            <button
              onClick={onClaim}
              disabled={claiming}
              style={{ width: "100%", background: COLORS.gold, color: COLORS.ink, border: "none", borderRadius: 6, padding: "13px 16px", fontSize: 15.5, fontWeight: 700, cursor: "pointer", fontFamily: "'Kalam', cursive" }}
            >
              {claiming ? "Claim ho raha hai..." : `🪙 Claim Karo (+${previewBonus} coins)`}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 21, margin: "0 0 8px" }}>Bonus Mil Gaya!</h3>
            <p style={{ fontSize: 15, color: COLORS.ink, marginBottom: 18 }}>
              +{earnedCoins} 🪙 coins add ho gaye.
            </p>
            <button
              onClick={onClose}
              style={{ width: "100%", background: COLORS.margin, color: COLORS.paper, border: "none", borderRadius: 6, padding: "12px 16px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "'Kalam', cursive" }}
            >
              Theek hai
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* Page: lists the signed-in user's daily login history + streak progress */
function LoginHistoryPage({ onBack, profile }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("login_history")
        .select("*")
        .order("login_date", { ascending: false })
        .limit(60);
      if (!error && data) setRows(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paperDark, fontFamily: "'Work Sans', sans-serif", color: COLORS.ink }}>
      <style>{FONTS}</style>
      <header style={{ background: COLORS.ink, color: COLORS.paper, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 20, color: COLORS.gold }}>Login History</span>
        <button onClick={onBack} style={{ background: "transparent", border: `1.5px solid ${COLORS.paper}66`, color: COLORS.paper, borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
          ← Back to site
        </button>
      </header>

      <section style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 60px" }}>
        <RuledCard style={{ padding: "18px 16px", marginBottom: 22 }}>
          <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: "0 0 4px" }}>Abhi ka streak</p>
          <p style={{ fontFamily: "'Kalam', cursive", fontSize: 24, fontWeight: 700, margin: 0 }}>
            Din {profile?.current_streak ?? 0} / 7
          </p>
          <p style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 6 }}>
            Roz login karke bonus claim karo — +1 coin, 7th continuous din +9 coins. Ek din miss hua to streak Din 1 se shuru hoga.
          </p>
        </RuledCard>

        <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 18, margin: "0 0 12px" }}>Login records</h3>

        {loading ? (
          <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Loading...</p>
        ) : rows.length === 0 ? (
          <p style={{ fontSize: 13, color: COLORS.inkSoft }}>Abhi koi login record nahi hai.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {rows.map((r) => {
              const isBonusDay = r.day_number >= 7;
              return (
                <div
                  key={r.id}
                  style={{
                    background: COLORS.paper,
                    border: `1px solid ${isBonusDay ? COLORS.gold : COLORS.paperDark}`,
                    borderRadius: 6,
                    padding: "10px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>
                      {new Date(r.login_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p style={{ margin: 0, fontSize: 11.5, color: COLORS.inkSoft }}>Streak din {r.day_number}</p>
                  </div>
                  <span style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 14, color: isBonusDay ? COLORS.stampRed : COLORS.margin, flexShrink: 0 }}>
                    +{r.bonus_coins} 🪙{isBonusDay ? " (7 din bonus!)" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* Menu: Medium (Hindi/English) -> School/Entrance Exam -> Class or Exam.
   Built live from the "catalog" prop (fetched from Supabase's
   site_catalog table, id='catalog'). */
function NavDrawer({ open, onClose, onHome, onPickKey, isAdmin, onOpenAdmin, onOpenLoginHistory, onOpenRefer, onOpenBuyCoins, catalog }) {
  const [openMedium, setOpenMedium] = useState(null);
  const [openBranch, setOpenBranch] = useState(null);

  if (!open) return null;

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

          <button onClick={() => { onOpenLoginHistory(); onClose(); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 14px", fontFamily: "'Kalam', cursive", fontSize: 16.5, fontWeight: 700, color: COLORS.ink, cursor: "pointer" }}>
            📅 Login History
          </button>

          <button onClick={() => { onOpenRefer(); onClose(); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 14px", fontFamily: "'Kalam', cursive", fontSize: 16.5, fontWeight: 700, color: COLORS.ink, cursor: "pointer" }}>
            🎁 Refer & Earn
          </button>

          <button onClick={() => { onOpenBuyCoins(); onClose(); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 14px", fontFamily: "'Kalam', cursive", fontSize: 16.5, fontWeight: 700, color: COLORS.ink, cursor: "pointer" }}>
            🪙 Buy Coins
          </button>

          {Object.keys(catalog || {}).map((medium) => (
            <div key={medium}>
              <button
                onClick={() => { setOpenMedium(openMedium === medium ? null : medium); setOpenBranch(null); }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: "12px 14px", fontFamily: "'Kalam', cursive", fontSize: 16.5, fontWeight: 700, color: COLORS.ink, cursor: "pointer" }}
              >
                <span>{medium}</span>
                <span style={{ color: COLORS.inkSoft, fontSize: 13 }}>{openMedium === medium ? "▾" : "▸"}</span>
              </button>

              {openMedium === medium && ["school", "entrance"].map((branch) => (
                <div key={branch}>
                  <button
                    onClick={() => setOpenBranch(openBranch === branch ? null : branch)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: "9px 14px 9px 28px", fontFamily: "'Work Sans', sans-serif", fontSize: 14.5, fontWeight: 600, color: COLORS.ink, cursor: "pointer" }}
                  >
                    <span>{branch === "school" ? "School" : "Entrance Exam"}</span>
                    <span style={{ color: COLORS.inkSoft, fontSize: 12 }}>{openBranch === branch ? "▾" : "▸"}</span>
                  </button>
                  {openBranch === branch && Object.keys(catalog[medium]?.[branch] || {}).map((key) => (
                    <button
                      key={key}
                      onClick={() => { onPickKey(medium, branch, key); onClose(); }}
                      style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "8px 14px 8px 42px", fontFamily: "'Work Sans', sans-serif", fontSize: 13.5, color: COLORS.inkSoft, cursor: "pointer" }}
                    >
                      {key}
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
  const [nav, setNav] = useState(null); // { medium, category, key, subject, chapter }
  const [view, setView] = useState("store"); // "store" | "admin" | "login-history"
  const [notes, setNotes] = useState([]);
  const [catalog, setCatalog] = useState(null); // { "Hindi Medium": {school:{}, entrance:{}}, "English Medium": {...} }
  const [profile, setProfile] = useState(null); // { id, coins, referred_by, current_streak, last_login_date, created_at }
  const [referOpen, setReferOpen] = useState(false);
  const [buyCoinsOpen, setBuyCoinsOpen] = useState(false);

  // Daily bonus claim popup state
  const [dailyBonusOpen, setDailyBonusOpen] = useState(false);
  const [dailyBonusClaiming, setDailyBonusClaiming] = useState(false);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);
  const [dailyBonusEarned, setDailyBonusEarned] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Capture ?ref=<user-id> from a shared referral link, stash it until sign-in
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("ngn_ref", ref);
  }, []);

  async function loadNotes() {
    const { data, error } = await supabase.from("notes").select("*");
    if (!error && data) setNotes(data);
  }

  async function loadCatalog() {
    const { data, error } = await supabase.from("site_catalog").select("data").eq("id", "catalog").single();
    setCatalog(!error && data ? data.data || {} : {});
  }

  async function loadProfile() {
    const refCode = localStorage.getItem("ngn_ref");
    const { data, error } = await supabase.rpc("register_profile", { referrer_id: refCode || null });
    if (error || !data) return;
    localStorage.removeItem("ngn_ref");
    setProfile(data);

    // Today's bonus not claimed yet -> open the claim popup (student taps to claim)
    if (!data.last_login_date || data.last_login_date !== todayStr()) {
      setDailyBonusClaimed(false);
      setDailyBonusEarned(0);
      setDailyBonusOpen(true);
    }
  }

  async function handleClaimDailyBonus() {
    setDailyBonusClaiming(true);
    const before = profile?.coins ?? 0;
    const { data: bonusData, error } = await supabase.rpc("claim_daily_login_bonus");
    setDailyBonusClaiming(false);
    if (error || !bonusData) {
      alert("Kuch error hua, dobara try karein.");
      return;
    }
    setProfile(bonusData);
    setDailyBonusEarned(bonusData.coins - before);
    setDailyBonusClaimed(true);
  }

  // Best-effort preview of what tapping Claim will give — server has final say
  function dailyBonusPreview() {
    const streak = profile?.current_streak ?? 0;
    const last = profile?.last_login_date;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
    const nextDay = last === yesterdayStr ? streak + 1 : 1;
    const nextBonus = nextDay >= 7 ? 9 : 1;
    return { nextDay, nextBonus };
  }

  useEffect(() => {
    if (session) {
      loadNotes();
      loadCatalog();
      loadProfile();
    }
  }, [session, view]);

  async function handleRedeem(note) {
    if (!profile) return;
    if (profile.coins < COIN_COST) {
      alert(`Aapke paas sirf ${profile.coins} coins hain. ${COIN_COST} coins chahiye. Refer karke, roz login bonus claim karke, ya Buy Coins se coins kamayein!`);
      setReferOpen(true);
      return;
    }
    const { data, error } = await supabase.rpc("redeem_note", { p_note_id: note.id, p_cost: COIN_COST });
    if (error) {
      alert("Kuch error hua: " + error.message);
      return;
    }
    setProfile((p) => ({ ...p, coins: data }));
    window.open(note.full_pdf_link, "_blank", "noopener,noreferrer");
  }

  if (session === undefined || (session && catalog === null)) {
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

  if (view === "login-history") {
    return <LoginHistoryPage onBack={() => setView("store")} profile={profile} />;
  }

  const subjectsObj = nav?.key ? catalog?.[nav.medium]?.[nav.category]?.[nav.key] : null;
  const branchLabel = (b) => (b === "school" ? "School" : "Entrance Exam");

  function findNotes(category, key, medium, subject, chapter) {
    return notes.filter((n) => n.category === category && n.key === key && n.medium === medium && n.subject === subject && n.chapter === chapter);
  }

  const { nextDay, nextBonus } = dailyBonusPreview();

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paperDark, fontFamily: "'Work Sans', sans-serif", color: COLORS.ink }}>
      <style>{FONTS}</style>

      <header style={{ background: COLORS.ink, color: COLORS.paper, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, cursor: "pointer" }} onClick={() => setNav(null)}>
          <span style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 22, color: COLORS.gold }}>{TUITION_NAME}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setReferOpen(true)} style={{ background: "none", border: `1.5px solid ${COLORS.gold}88`, color: COLORS.gold, borderRadius: 6, padding: "6px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            🪙 {profile?.coins ?? 0}
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{ background: "none", border: "none", color: `${COLORS.paper}99`, fontSize: 13, cursor: "pointer" }}>Sign out</button>
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" style={{ background: "transparent", border: `1.5px solid ${COLORS.paper}66`, color: COLORS.paper, borderRadius: 6, padding: "8px 12px", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>☰</button>
        </div>
      </header>

      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onHome={() => setNav(null)}
        onPickKey={(medium, category, key) => setNav({ medium, category, key, subject: null, chapter: null })}
        isAdmin={isAdmin}
        onOpenAdmin={() => setView("admin")}
        onOpenLoginHistory={() => setView("login-history")}
        onOpenRefer={() => setReferOpen(true)}
        onOpenBuyCoins={() => setBuyCoinsOpen(true)}
        catalog={catalog}
      />

      <ReferModal
        open={referOpen}
        onClose={() => setReferOpen(false)}
        coins={profile?.coins ?? 0}
        refLink={`${window.location.origin}${window.location.pathname}?ref=${session.user.id}`}
      />

      <BuyCoinsModal
        open={buyCoinsOpen}
        onClose={() => setBuyCoinsOpen(false)}
        userEmail={session.user.email}
      />

      <DailyBonusModal
        open={dailyBonusOpen}
        onClose={() => setDailyBonusOpen(false)}
        previewDay={nextDay}
        previewBonus={nextBonus}
        claiming={dailyBonusClaiming}
        claimed={dailyBonusClaimed}
        earnedCoins={dailyBonusEarned}
        onClaim={handleClaimDailyBonus}
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

      {nav && !nav.subject && subjectsObj && (
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px 70px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.margin, marginBottom: 6 }}>{nav.medium} · {branchLabel(nav.category)} · {nav.key}</p>
          <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 24, margin: "0 0 20px", color: COLORS.ink }}>Subjects</h2>
          {Object.keys(subjectsObj).length === 0 ? (
            <AvailableSoon />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14 }}>
              {Object.keys(subjectsObj).map((subject) => (
                <button key={subject} onClick={() => setNav({ ...nav, subject, chapter: null })} style={{ background: COLORS.paper, border: `1.5px solid ${COLORS.paperDark}`, borderLeft: `4px solid ${COLORS.margin}`, borderRadius: 6, padding: "16px", textAlign: "left", cursor: "pointer", fontFamily: "'Kalam', cursive", fontSize: 17, fontWeight: 700, color: COLORS.ink }}>
                  {subject}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {nav && nav.subject && !nav.chapter && (
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "40px 24px 70px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.margin, marginBottom: 6 }}>
            {nav.medium} · {branchLabel(nav.category)} · {nav.key} ·{" "}
            <button onClick={() => setNav({ ...nav, subject: null })} style={{ background: "none", border: "none", color: COLORS.margin, textDecoration: "underline", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: 0 }}>
              {nav.subject}
            </button>
          </p>
          <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 24, margin: "0 0 20px", color: COLORS.ink }}>Chapters</h2>
          {(subjectsObj[nav.subject] || []).length === 0 ? (
            <AvailableSoon />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {subjectsObj[nav.subject].map((chapter) => (
                <button key={chapter} onClick={() => setNav({ ...nav, chapter })} style={{ display: "block", width: "100%", textAlign: "left", background: COLORS.paper, border: `1px solid ${COLORS.paperDark}`, borderRadius: 6, padding: "13px 16px", fontFamily: "'Work Sans', sans-serif", fontSize: 14.5, color: COLORS.ink, cursor: "pointer" }}>
                  {chapter}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {nav && nav.chapter && (
        <section style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 70px" }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.margin, marginBottom: 6 }}>
            {nav.medium} · {branchLabel(nav.category)} · {nav.key} ·{" "}
            <button onClick={() => setNav({ ...nav, chapter: null })} style={{ background: "none", border: "none", color: COLORS.margin, textDecoration: "underline", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: 0 }}>
              {nav.subject}
            </button>
          </p>
          <h2 style={{ fontFamily: "'Kalam', cursive", fontSize: 22, margin: "0 0 18px", color: COLORS.ink }}>{nav.chapter}</h2>
          {(() => {
            const chapterNotes = findNotes(nav.category, nav.key, nav.medium, nav.subject, nav.chapter);
            return chapterNotes.length > 0 ? (
              <div style={{ display: "grid", gap: 20 }}>
                {chapterNotes.map((n) => <PdfViewer key={n.id} note={n} profile={profile} onRedeem={handleRedeem} />)}
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
