import React, { useState, useEffect, useRef } from "react";
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
  Edited entirely from the Admin Panel -> Manage Menu tab, which now also
  lets admin reorder Mediums, Classes/Exams, and Subjects (not just
  Chapters) — reordering just rewrites the JSON object's key order, which
  Object.keys() here picks up automatically. In the ☰ menu this sits
  inside a collapsible "📚 Notes" folder.
  See catalog_migration_v2.sql for the one-time table setup.

  MENU ORDER
  - Another row in site_catalog, id='menu_order', data = { order: [...] }
    — an array of keys from MENU_ITEM_KEYS controlling the order the
    non-fixed ☰ menu items appear in (Home is always first, Admin Panel
    is always last and admin-only). Edited from Admin Panel -> Manage
    Menu -> Menu Order. Unknown/missing keys are normalized at render
    time via normalizeMenuOrder() so old saved orders don't break when
    new menu items are added later.

  SETTINGS (payment + contact info)
  - Another row in site_catalog, id='settings', data = { upi_id,
    qr_image_url, contact_email, contact_whatsapp, contact_instagram }.
    Edited from Admin Panel -> Settings. qr_image_url and any DM
    screenshots are uploaded to the public "app-uploads" Storage bucket.

  PROFILE ONBOARDING
  - "profiles" table also has full_name and username (unique, case-
    insensitive). Right after the first successful register_profile()
    call, if either is missing, an OnboardingModal blocks the app
    (can't be dismissed) until the student sets both.

  COIN + REFERRAL + DAILY LOGIN STREAK + BUY COINS SYSTEM
  - "profiles" table: id (=auth user id), coins, referred_by,
    last_login_date, current_streak, full_name, username, created_at.
  - Signing in calls register_profile(referrer_id) RPC once, then (once
    onboarding is done) a daily login bonus popup: +1 coin normally, +9
    on the 7th continuous day (claim_daily_login_bonus RPC), recorded in
    "login_history".
  - Each note can optionally have a "full_pdf_link" unlocked for
    COIN_COST coins via the redeem_note RPC.
  - Buy Coins has NO WhatsApp and no automatic payment gateway: tapping
    a package shows the admin's QR code + UPI ID for that amount, then
    the student is taken to Message Admin to send a payment screenshot
    (DM now supports images). Admin manually verifies and credits coins
    via Admin Panel -> Add Coins, typically within 24 hours.
  - Login History page (from the ☰ menu) lists login_history rows.

  MESSAGE ADMIN (DM) + CONTACT
  - "messages" table: id, student_id, sender_role ('student'|'admin'),
    content, image_url, created_at, read_by_admin, read_by_student.
  - Student side (MessageAdminPage): reads own thread via RLS, sends
    text and/or images via send_message_to_admin RPC (images uploaded
    to the "app-uploads" Storage bucket first, public URL passed as
    p_image_url), marks read via mark_thread_read_student RPC, and
    subscribes to Realtime for live incoming admin replies.
  - "📞 Contact" menu item shows a modal with the admin's email,
    WhatsApp, and Instagram (from the settings row) as tappable links.
  - Admin side lives in AdminPanel.jsx (Messages / Students / Settings
    tabs).
  See the SQL setup (profiles/messages/site_catalog rows + Storage
  bucket + all RPC functions + realtime publication) — run once in the
  Supabase SQL editor.
*/

const COIN_COST = 10; // coins required to unlock one note's full PDF

const COIN_PACKAGES = [
  { coins: 5, price: 5 },
  { coins: 11, price: 10 },
  { coins: 23, price: 20 },
  { coins: 60, price: 50 },
  { coins: 130, price: 100 },
  { coins: 300, price: 200 },
];

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

// Reorderable ☰ menu items (Home is always first, Admin Panel always last/admin-only)
const MENU_ITEM_KEYS = ["messages", "login-history", "refer", "buy-coins", "notes", "contact"];
const DEFAULT_MENU_ORDER = [...MENU_ITEM_KEYS];

function normalizeMenuOrder(order) {
  const cleaned = (Array.isArray(order) ? order : []).filter((k) => MENU_ITEM_KEYS.includes(k));
  const missing = MENU_ITEM_KEYS.filter((k) => !cleaned.includes(k));
  return [...cleaned, ...missing];
}

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

/* Blocking popup right after first login: student must set a display
   name + a unique username before using the rest of the site. */
function OnboardingModal({ open, onSubmit, saving, error }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

  if (!open) return null;

  function handleUsernameChange(e) {
    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(fullName.trim(), username.trim());
  }

  const usernameValid = USERNAME_REGEX.test(username);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(38,50,74,0.65)" }} />
      <div style={{ position: "relative", background: COLORS.paper, borderRadius: 10, padding: "26px 22px", maxWidth: 380, width: "100%" }}>
        <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 21, margin: "0 0 6px" }}>Apna profile set karein</h3>
        <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 18 }}>
          Bas ek baar — naam aur ek unique username daal dein, phir aage badhein.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 5 }}>Aapka naam</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Kumar"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 14.5, borderRadius: 6, border: `1.5px solid ${COLORS.inkSoft}55`, fontFamily: "'Work Sans', sans-serif", background: COLORS.paperDark }}
            />
          </div>
          <div style={{ marginBottom: 6 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 5 }}>Username</label>
            <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${COLORS.inkSoft}55`, borderRadius: 6, background: COLORS.paperDark, paddingLeft: 12 }}>
              <span style={{ color: COLORS.inkSoft, fontSize: 14.5 }}>@</span>
              <input
                value={username}
                onChange={handleUsernameChange}
                placeholder="apna_username"
                style={{ flex: 1, boxSizing: "border-box", padding: "10px 10px 10px 4px", fontSize: 14.5, border: "none", background: "transparent", fontFamily: "'Work Sans', sans-serif", outline: "none" }}
              />
            </div>
          </div>
          <p style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 4, marginBottom: 16 }}>
            Sirf chhote letters, number, aur underscore (_) — 3 se 20 characters.
          </p>
          {error && <p style={{ fontSize: 12.5, color: COLORS.stampRed, marginBottom: 12 }}>{error}</p>}
          <button
            type="submit"
            disabled={saving || !fullName.trim() || !usernameValid}
            style={{ width: "100%", background: COLORS.margin, color: COLORS.paper, border: "none", borderRadius: 6, padding: "13px 16px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Kalam', cursive", opacity: saving || !fullName.trim() || !usernameValid ? 0.6 : 1 }}
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
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

/* Modal: pick a coin package -> shows admin's QR + UPI ID for that
   amount -> student pays manually and is handed off to Message Admin
   to send a screenshot. No WhatsApp, no automatic gateway. */
function BuyCoinsModal({ open, onClose, onGoToChat, settings }) {
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [notifying, setNotifying] = useState(false);

  if (!open) return null;

  function handleClose() {
    setSelectedPkg(null);
    onClose();
  }

  async function handleProceedToChat() {
    setNotifying(true);
    const content = `Maine ${selectedPkg.coins} coins ke liye ₹${selectedPkg.price} ka payment kiya hai. Screenshot neeche bhej raha/rahi hoon.`;
    await supabase.rpc("send_message_to_admin", { p_content: content });
    setNotifying(false);
    setSelectedPkg(null);
    onGoToChat();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={handleClose} style={{ position: "absolute", inset: 0, background: "rgba(38,50,74,0.55)" }} />
      <div style={{ position: "relative", background: COLORS.paper, borderRadius: 10, padding: "24px 20px", maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        {!selectedPkg ? (
          <>
            <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 20, margin: "0 0 8px" }}>Buy Coins 🪙</h3>
            <p style={{ fontSize: 13.5, color: COLORS.inkSoft, marginBottom: 16 }}>
              Package choose karein — QR/UPI se payment karke screenshot admin ko bhejein, 24 ghante mein coins add ho jayenge.
            </p>
            <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
              {COIN_PACKAGES.map((pkg) => (
                <button
                  key={pkg.coins}
                  onClick={() => setSelectedPkg(pkg)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: COLORS.paperDark, border: `1.5px solid ${COLORS.gold}88`, borderRadius: 8,
                    padding: "13px 16px", color: COLORS.ink, cursor: "pointer", width: "100%", textAlign: "left",
                  }}
                >
                  <span style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 16 }}>🪙 {pkg.coins} coins</span>
                  <span style={{ background: COLORS.margin, color: "#fff", borderRadius: 6, padding: "7px 12px", fontSize: 13, fontWeight: 700 }}>₹{pkg.price}</span>
                </button>
              ))}
            </div>
            <button onClick={handleClose} style={{ width: "100%", background: "none", border: `1.5px solid ${COLORS.inkSoft}55`, borderRadius: 6, padding: "10px", fontSize: 13.5, cursor: "pointer", color: COLORS.ink }}>
              Close
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setSelectedPkg(null)} style={{ background: "none", border: "none", color: COLORS.margin, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 10 }}>
              ← Packages
            </button>
            <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 19, margin: "0 0 4px" }}>
              🪙 {selectedPkg.coins} coins — ₹{selectedPkg.price}
            </h3>
            <p style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 14 }}>
              Neeche diye QR ya UPI ID se exactly ₹{selectedPkg.price} pay karein.
            </p>
            {settings?.qr_image_url && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <img src={settings.qr_image_url} alt="Payment QR" style={{ width: 200, height: 200, objectFit: "contain", background: "#fff", borderRadius: 8, border: `1px solid ${COLORS.paperDark}` }} />
              </div>
            )}
            {settings?.upi_id && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input readOnly value={settings.upi_id} style={{ flex: 1, padding: "9px 10px", fontSize: 13, borderRadius: 6, border: `1.5px solid ${COLORS.inkSoft}55`, background: COLORS.paperDark, color: COLORS.ink }} />
                <button
                  onClick={() => { navigator.clipboard.writeText(settings.upi_id); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  style={{ background: COLORS.margin, color: COLORS.paper, border: "none", borderRadius: 6, padding: "9px 12px", fontSize: 13, cursor: "pointer", fontWeight: 700 }}
                >
                  {copied ? "Copied!" : "Copy UPI ID"}
                </button>
              </div>
            )}
            {!settings?.qr_image_url && !settings?.upi_id && (
              <p style={{ fontSize: 13, color: COLORS.stampRed, marginBottom: 16 }}>
                Abhi payment details set nahi hui hain — Admin Panel se QR/UPI add karein.
              </p>
            )}
            <button
              onClick={handleProceedToChat}
              disabled={notifying}
              style={{ width: "100%", background: COLORS.gold, color: COLORS.ink, border: "none", borderRadius: 6, padding: "13px 16px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "'Kalam', cursive" }}
            >
              {notifying ? "Bhej rahe hain..." : "✅ Payment kar diya — Screenshot bhejne jayein"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* Modal: admin contact details (email / WhatsApp / Instagram) */
function ContactModal({ open, onClose, settings }) {
  if (!open) return null;

  function whatsappHref(v) {
    if (!v) return null;
    return v.startsWith("http") ? v : `https://wa.me/${v.replace(/[^0-9]/g, "")}`;
  }
  function instagramHref(v) {
    if (!v) return null;
    return v.startsWith("http") ? v : `https://instagram.com/${v.replace("@", "")}`;
  }

  const rows = [
    { label: "Email", value: settings?.contact_email, href: settings?.contact_email ? `mailto:${settings.contact_email}` : null, icon: "📧" },
    { label: "WhatsApp", value: settings?.contact_whatsapp, href: whatsappHref(settings?.contact_whatsapp), icon: "💚" },
    { label: "Instagram", value: settings?.contact_instagram, href: instagramHref(settings?.contact_instagram), icon: "📸" },
  ].filter((r) => r.value);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(38,50,74,0.55)" }} />
      <div style={{ position: "relative", background: COLORS.paper, borderRadius: 10, padding: "24px 20px", maxWidth: 360, width: "100%" }}>
        <h3 style={{ fontFamily: "'Kalam', cursive", fontSize: 20, margin: "0 0 14px" }}>📞 Contact Us</h3>
        {rows.length === 0 ? (
          <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 16 }}>Contact details abhi set nahi hui hain.</p>
        ) : (
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {rows.map((r) => (
              <a
                key={r.label}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, background: COLORS.paperDark, border: `1px solid ${COLORS.paperDark}`, borderRadius: 8, padding: "12px 14px", textDecoration: "none", color: COLORS.ink }}
              >
                <span style={{ fontSize: 20 }}>{r.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 11.5, color: COLORS.inkSoft }}>{r.label}</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{r.value}</p>
                </div>
              </a>
            ))}
          </div>
        )}
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

/* Page: student <-> admin DM thread, with live updates + image sending */
function MessageAdminPage({ onBack, session }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("student_id", session.user.id)
      .order("created_at", { ascending: true });
    if (!error && data) setMessages(data);
    setLoading(false);
    await supabase.rpc("mark_thread_read_student");
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("messages-student-" + session.user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `student_id=eq.${session.user.id}` },
        (payload) => {
          setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
          if (payload.new.sender_role === "admin") supabase.rpc("mark_thread_read_student");
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSending(true);
    const { data, error } = await supabase.rpc("send_message_to_admin", { p_content: content });
    setSending(false);
    if (error) {
      alert("Message send nahi hua: " + error.message);
      return;
    }
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
    setText("");
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const path = `chat/${session.user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("app-uploads").upload(path, file);
    if (upErr) {
      setUploadingImage(false);
      alert("Image upload nahi hua: " + upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("app-uploads").getPublicUrl(path);
    const { data, error } = await supabase.rpc("send_message_to_admin", { p_content: "", p_image_url: pub.publicUrl });
    setUploadingImage(false);
    if (error) {
      alert("Send nahi hua: " + error.message);
      return;
    }
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paperDark, fontFamily: "'Work Sans', sans-serif", color: COLORS.ink, display: "flex", flexDirection: "column" }}>
      <style>{FONTS}</style>
      <header style={{ background: COLORS.ink, color: COLORS.paper, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 20, color: COLORS.gold }}>💬 Message Admin</span>
        <button onClick={onBack} style={{ background: "transparent", border: `1.5px solid ${COLORS.paper}66`, color: COLORS.paper, borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
          ← Back to site
        </button>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10, maxWidth: 640, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {loading ? (
          <p style={{ fontSize: 13, color: COLORS.inkSoft, textAlign: "center" }}>Loading...</p>
        ) : messages.length === 0 ? (
          <p style={{ fontSize: 13, color: COLORS.inkSoft, textAlign: "center", marginTop: 30 }}>
            Abhi koi message nahi hai. Neeche se admin ko message ya payment screenshot bhejein.
          </p>
        ) : (
          messages.map((m) => {
            const isStudent = m.sender_role === "student";
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isStudent ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "78%",
                    background: isStudent ? COLORS.margin : COLORS.paper,
                    color: isStudent ? COLORS.paper : COLORS.ink,
                    border: isStudent ? "none" : `1px solid ${COLORS.paperDark}`,
                    borderRadius: 12,
                    borderBottomRightRadius: isStudent ? 3 : 12,
                    borderBottomLeftRadius: isStudent ? 12 : 3,
                    padding: "9px 13px",
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {!isStudent && <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.margin, marginBottom: 2 }}>Admin</div>}
                  {m.image_url && (
                    <img src={m.image_url} alt="attachment" style={{ maxWidth: "100%", borderRadius: 8, display: "block", marginBottom: m.content ? 6 : 2 }} />
                  )}
                  {m.content}
                  <div style={{ fontSize: 10, opacity: 0.65, marginTop: 4, textAlign: "right" }}>
                    {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ flexShrink: 0, display: "flex", gap: 8, padding: "12px 16px", background: COLORS.ink, maxWidth: 640, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: "none" }} id="chat-image-input" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          style={{ background: "transparent", border: `1.5px solid ${COLORS.paper}66`, color: COLORS.paper, borderRadius: 20, width: 40, height: 40, flexShrink: 0, fontSize: 16, cursor: "pointer" }}
          title="Screenshot bhejein"
        >
          {uploadingImage ? "…" : "📎"}
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Apna message likhein..."
          style={{ flex: 1, padding: "11px 14px", fontSize: 14, borderRadius: 20, border: "none", fontFamily: "'Work Sans', sans-serif" }}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          style={{ background: COLORS.gold, color: COLORS.ink, border: "none", borderRadius: 20, padding: "0 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

/* Menu: Home -> reorderable items (Message Admin / Login History /
   Refer & Earn / Buy Coins / Notes folder / Contact) -> Admin Panel
   (admin only, always last). The Notes folder holds Medium -> School/
   Entrance -> Class/Exam -> Subject -> Chapter, built live from the
   "catalog" prop, in whatever key order the admin has set. */
function NavDrawer({ open, onClose, onHome, onPickKey, isAdmin, onOpenAdmin, onOpenLoginHistory, onOpenRefer, onOpenBuyCoins, onOpenMessages, onOpenContact, unreadMessages, catalog, menuOrder }) {
  const [openNotesFolder, setOpenNotesFolder] = useState(false);
  const [openMedium, setOpenMedium] = useState(null);
  const [openBranch, setOpenBranch] = useState(null);

  if (!open) return null;

  const topItemStyle = { display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 14px", fontFamily: "'Kalam', cursive", fontSize: 16.5, fontWeight: 700, color: COLORS.ink, cursor: "pointer" };

  function renderItem(key) {
    if (key === "messages") {
      return (
        <button key={key} onClick={() => { onOpenMessages(); onClose(); }} style={{ ...topItemStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>💬 Message Admin</span>
          {unreadMessages > 0 && (
            <span style={{ background: COLORS.stampRed, color: "#fff", borderRadius: 999, minWidth: 20, height: 20, fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
              {unreadMessages}
            </span>
          )}
        </button>
      );
    }
    if (key === "login-history") {
      return (
        <button key={key} onClick={() => { onOpenLoginHistory(); onClose(); }} style={topItemStyle}>
          📅 Login History
        </button>
      );
    }
    if (key === "refer") {
      return (
        <button key={key} onClick={() => { onOpenRefer(); onClose(); }} style={topItemStyle}>
          🎁 Refer & Earn
        </button>
      );
    }
    if (key === "buy-coins") {
      return (
        <button key={key} onClick={() => { onOpenBuyCoins(); onClose(); }} style={topItemStyle}>
          🪙 Buy Coins
        </button>
      );
    }
    if (key === "contact") {
      return (
        <button key={key} onClick={() => { onOpenContact(); onClose(); }} style={topItemStyle}>
          📞 Contact
        </button>
      );
    }
    if (key === "notes") {
      return (
        <div key={key}>
          <button
            onClick={() => setOpenNotesFolder(!openNotesFolder)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: "12px 14px", fontFamily: "'Kalam', cursive", fontSize: 16.5, fontWeight: 700, color: COLORS.ink, cursor: "pointer" }}
          >
            <span>📚 Notes</span>
            <span style={{ color: COLORS.inkSoft, fontSize: 13 }}>{openNotesFolder ? "▾" : "▸"}</span>
          </button>

          {openNotesFolder && Object.keys(catalog || {}).map((medium) => (
            <div key={medium}>
              <button
                onClick={() => { setOpenMedium(openMedium === medium ? null : medium); setOpenBranch(null); }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: "10px 14px 10px 28px", fontFamily: "'Kalam', cursive", fontSize: 15, fontWeight: 700, color: COLORS.ink, cursor: "pointer" }}
              >
                <span>{medium}</span>
                <span style={{ color: COLORS.inkSoft, fontSize: 12 }}>{openMedium === medium ? "▾" : "▸"}</span>
              </button>

              {openMedium === medium && ["school", "entrance"].map((branch) => (
                <div key={branch}>
                  <button
                    onClick={() => setOpenBranch(openBranch === branch ? null : branch)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: "9px 14px 9px 42px", fontFamily: "'Work Sans', sans-serif", fontSize: 14, fontWeight: 600, color: COLORS.ink, cursor: "pointer" }}
                  >
                    <span>{branch === "school" ? "School" : "Entrance Exam"}</span>
                    <span style={{ color: COLORS.inkSoft, fontSize: 12 }}>{openBranch === branch ? "▾" : "▸"}</span>
                  </button>
                  {openBranch === branch && Object.keys(catalog[medium]?.[branch] || {}).map((key) => (
                    <button
                      key={key}
                      onClick={() => { onPickKey(medium, branch, key); onClose(); }}
                      style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "8px 14px 8px 56px", fontFamily: "'Work Sans', sans-serif", fontSize: 13.5, color: COLORS.inkSoft, cursor: "pointer" }}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(38,50,74,0.55)" }} />
      <div style={{ position: "relative", width: "min(340px, 86vw)", height: "100%", background: COLORS.paperDark, overflowY: "auto", boxShadow: "-12px 0 32px -16px rgba(0,0,0,0.4)", fontFamily: "'Work Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 18px 14px", background: COLORS.ink }}>
          <span style={{ fontFamily: "'Kalam', cursive", fontSize: 19, fontWeight: 700, color: COLORS.gold }}>Menu</span>
          <button onClick={onClose} aria-label="Close menu" style={{ background: "none", border: "none", color: COLORS.paper, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: "10px 6px 30px" }}>
          <button onClick={() => { onHome(); onClose(); }} style={topItemStyle}>
            🏠 Home
          </button>

          {menuOrder.map((key) => renderItem(key))}

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
  const [view, setView] = useState("store"); // "store" | "admin" | "login-history" | "messages"
  const [notes, setNotes] = useState([]);
  const [catalog, setCatalog] = useState(null); // { "Hindi Medium": {school:{}, entrance:{}}, "English Medium": {...} }
  const [menuOrder, setMenuOrder] = useState(DEFAULT_MENU_ORDER);
  const [settings, setSettings] = useState(null); // { upi_id, qr_image_url, contact_email, contact_whatsapp, contact_instagram }
  const [profile, setProfile] = useState(null); // { id, coins, referred_by, current_streak, last_login_date, full_name, username, created_at }
  const [referOpen, setReferOpen] = useState(false);
  const [buyCoinsOpen, setBuyCoinsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Onboarding (name + username) popup state
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

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

  async function loadMenuOrder() {
    const { data, error } = await supabase.from("site_catalog").select("data").eq("id", "menu_order").single();
    setMenuOrder(!error && data?.data?.order ? normalizeMenuOrder(data.data.order) : DEFAULT_MENU_ORDER);
  }

  async function loadSettings() {
    const { data, error } = await supabase.from("site_catalog").select("data").eq("id", "settings").single();
    setSettings(!error && data?.data ? data.data : {});
  }

  function checkAndOpenDailyBonus(data) {
    if (!data.last_login_date || data.last_login_date !== todayStr()) {
      setDailyBonusClaimed(false);
      setDailyBonusEarned(0);
      setDailyBonusOpen(true);
    }
  }

  async function loadUnreadMessages(userId) {
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("sender_role", "admin")
      .eq("read_by_student", false);
    setUnreadMessages(count || 0);
  }

  async function loadProfile() {
    const refCode = localStorage.getItem("ngn_ref");
    const { data, error } = await supabase.rpc("register_profile", { referrer_id: refCode || null });
    if (error || !data) return;
    localStorage.removeItem("ngn_ref");
    setProfile(data);

    if (!data.full_name || !data.username) {
      setOnboardingOpen(true);
      return; // wait for onboarding before showing the daily bonus popup
    }
    checkAndOpenDailyBonus(data);
  }

  async function handleOnboardingSubmit(fullName, username) {
    setOnboardingError("");
    if (!fullName) {
      setOnboardingError("Naam daalna zaroori hai.");
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setOnboardingError("Username sirf chhote letters, number, underscore — 3-20 characters ka ho sakta hai.");
      return;
    }
    setOnboardingSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, username })
      .eq("id", session.user.id)
      .select()
      .single();
    setOnboardingSaving(false);
    if (error) {
      if (error.code === "23505") {
        setOnboardingError("Ye username already liya gaya hai — dusra try karein.");
      } else {
        setOnboardingError(error.message);
      }
      return;
    }
    setProfile(data);
    setOnboardingOpen(false);
    checkAndOpenDailyBonus(data);
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
      loadMenuOrder();
      loadSettings();
      loadProfile();
      loadUnreadMessages(session.user.id);
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

  if (view === "messages") {
    return <MessageAdminPage onBack={() => setView("store")} session={session} />;
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
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" style={{ background: "transparent", border: `1.5px solid ${COLORS.paper}66`, color: COLORS.paper, borderRadius: 6, padding: "8px 12px", fontSize: 18, cursor: "pointer", lineHeight: 1, position: "relative" }}>
            ☰
            {unreadMessages > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, background: COLORS.stampRed, color: "#fff", borderRadius: 999, width: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {unreadMessages}
              </span>
            )}
          </button>
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
        onOpenMessages={() => setView("messages")}
        onOpenContact={() => setContactOpen(true)}
        unreadMessages={unreadMessages}
        catalog={catalog}
        menuOrder={menuOrder}
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
        onGoToChat={() => { setBuyCoinsOpen(false); setView("messages"); }}
        settings={settings}
      />

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        settings={settings}
      />

      <OnboardingModal
        open={onboardingOpen}
        onSubmit={handleOnboardingSubmit}
        saving={onboardingSaving}
        error={onboardingError}
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
