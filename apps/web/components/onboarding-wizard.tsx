"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, ArrowLeft, Loader2, Sparkles } from "lucide-react"

// ── Theme ──────────────────────────────────────────────────────────────────────
const T = {
  bg: "#06111b",
  bg2: "#0a1726",
  fg: "#edf2f7",
  fgDim: "rgba(237,242,247,0.62)",
  fgMute: "rgba(237,242,247,0.32)",
  card: "rgba(255,255,255,0.055)",
  cardEm: "rgba(255,255,255,0.085)",
  border: "rgba(255,255,255,0.09)",
  borderEm: "rgba(255,255,255,0.18)",
  inputBg: "rgba(255,255,255,0.04)",
  inputBorder: "rgba(255,255,255,0.10)",
  divider: "rgba(255,255,255,0.07)",
  accent: "#059669",
  accentBright: "#10b981",
  accentDeep: "#047857",
  accentSoft: "rgba(5,150,105,0.16)",
  accentRing: "rgba(5,150,105,0.30)",
  ctaShadow: "0 14px 34px rgba(5,150,105,0.36)",
  shadow: "0 30px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)",
}
const SERIF = "var(--font-sans)"
const SANS = "Inter, system-ui, sans-serif"

// ── Data ───────────────────────────────────────────────────────────────────────
const OB_CATEGORIES = [
  { id: "food",          name: "Food & drink",      color: "#f97316", icon: "🍔", tagline: "Groceries, restaurants, coffee." },
  { id: "transport",     name: "Transport",          color: "#0ea5e9", icon: "🚌", tagline: "Transit passes, fuel, rideshare." },
  { id: "utilities",     name: "Bills & utilities",  color: "#8b5cf6", icon: "💡", tagline: "Power, water, internet, rent." },
  { id: "entertainment", name: "Entertainment",      color: "#ec4899", icon: "🎬", tagline: "Subscriptions, cinema, gigs." },
  { id: "shopping",      name: "Shopping",           color: "#f59e0b", icon: "🛍️", tagline: "Clothes, gifts, household." },
  { id: "travel",        name: "Travel",             color: "#06b6d4", icon: "✈️", tagline: "Flights, hotels, holidays." },
  { id: "health",        name: "Health",             color: "#14b8a6", icon: "🏥", tagline: "Pharmacy, doctors, fitness." },
  { id: "other",         name: "Other",              color: "#64748b", icon: "✦",  tagline: "Anything the AI is unsure about." },
]

const PLANS = [
  {
    id: "free", name: "Free", price: "$0", period: "always",
    pitch: "For tracking the basics on your own.",
    features: ["25 file imports per month", "AI category suggestions", "1 household member"],
  },
  {
    id: "pro", name: "Pro", price: "$6", period: "/ month",
    pitch: "For people who want the full picture.",
    badge: "Recommended",
    features: ["60 file imports per month", "Subscription detection", "Custom budgets & alerts", "Forever history"],
  },
  {
    id: "family", name: "Family", price: "$12", period: "/ month",
    pitch: "Shared finances, separate logins.",
    features: ["1000 imports per month", "Up to 6 household members", "Shared budgets & insights", "Per-person spending views"],
  },
]

const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "CAD", symbol: "$" },
]

const HOUSEHOLDS = [
  { id: "solo",   label: "Just me",  sub: "Personal finances" },
  { id: "couple", label: "Couple",   sub: "Shared with one other" },
  { id: "family", label: "Family",   sub: "Multiple members & kids" },
]

const SAMPLE_TXS = [
  { merchant: "Whole Foods Market",  amount: 84.20,  catColor: "#f97316", catIcon: "🍔" },
  { merchant: "Spotify",             amount: 11.99,  catColor: "#ec4899", catIcon: "🎬" },
  { merchant: "BVG Monthly Pass",    amount: 49.00,  catColor: "#0ea5e9", catIcon: "🚌" },
  { merchant: "Netflix",             amount: 17.99,  catColor: "#ec4899", catIcon: "🎬" },
  { merchant: "Salary · May",        amount: 4200,   catColor: "#059669", catIcon: "💰", credit: true },
  { merchant: "Vattenfall Strom",    amount: 96.20,  catColor: "#8b5cf6", catIcon: "💡" },
]

const STEP_LABELS = ["You", "Categories", "Plan", "Import"]

// ── Shared primitives ──────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <div style={{ width: 12, height: 1, background: T.accent }} />
      <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: T.accent, letterSpacing: 0.2 }}>
        {children}
      </span>
    </div>
  )
}

function Heading({ children, size = 34 }: { children: React.ReactNode; size?: number }) {
  return (
    <h1 style={{ fontSize: size, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.5, color: T.fg, margin: "4px 0 8px", fontFamily: SERIF }}>
      {children}
    </h1>
  )
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, lineHeight: 1.5, color: T.fgDim, margin: 0, fontFamily: SERIF }}>
      {children}
    </p>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: T.fgMute, letterSpacing: 1.4, textTransform: "uppercase" }}>
      {children}
    </div>
  )
}

function CTA({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: "100%", border: 0, cursor: disabled ? "not-allowed" : "pointer",
        background: disabled
          ? "rgba(255,255,255,0.08)"
          : `linear-gradient(135deg, ${T.accentBright} 0%, ${T.accent} 100%)`,
        color: disabled ? T.fgMute : "white",
        borderRadius: 16, padding: "15px 18px",
        fontSize: 15, fontWeight: 600, letterSpacing: 0.2,
        boxShadow: disabled ? "none" : T.ctaShadow,
        fontFamily: SERIF,
        transition: "background 160ms, box-shadow 160ms",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      {children}
    </button>
  )
}

// ── DashboardPeek ──────────────────────────────────────────────────────────────
function DashboardPeek() {
  const peek = SAMPLE_TXS.slice(0, 3)
  return (
    <div style={{
      border: `1px solid ${T.border}`, background: T.cardEm,
      borderRadius: 18, padding: 14, boxShadow: T.shadow, position: "relative", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, color: T.fgMute, letterSpacing: 1.4, textTransform: "uppercase" }}>
            Money out · May
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: T.fg, fontVariantNumeric: "tabular-nums", letterSpacing: -0.4, lineHeight: 1, marginTop: 4, fontFamily: SERIF }}>
            $1,284.66
          </div>
        </div>
        <div style={{ padding: "4px 8px", borderRadius: 999, background: T.accentSoft, color: T.accent, fontFamily: SANS, fontSize: 10, fontWeight: 700 }}>
          −12%
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {peek.map((tx, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderTop: i > 0 ? `1px solid ${T.divider}` : "none" }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: tx.catColor + "38", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
              {tx.catIcon}
            </div>
            <div style={{ flex: 1, fontSize: 13, color: T.fg, fontFamily: SERIF }}>{tx.merchant}</div>
            <div style={{ fontSize: 13, fontVariantNumeric: "tabular-nums", color: T.fg, fontWeight: 500, fontFamily: SERIF }}>
              −${tx.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── AI Stage ───────────────────────────────────────────────────────────────────
function AIStage({ phase }: { phase: number }) {
  const visibleTxs = phase >= 2 ? SAMPLE_TXS.slice(0, phase === 3 ? 6 : 3) : []

  return (
    <div style={{
      position: "relative", border: `1px solid ${T.border}`, borderRadius: 20,
      background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)",
      padding: 22, boxShadow: T.shadow, overflow: "hidden", flex: 1,
    }}>
      <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: 999, background: T.accent, opacity: 0.08, filter: "blur(60px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", display: "flex", gap: 18, alignItems: "stretch", height: "100%" }}>
        {/* Statement sheet */}
        <div style={{ position: "relative", width: 120, flexShrink: 0 }}>
          <div style={{
            width: "100%", aspectRatio: "7 / 9",
            background: "#f1f5f9", border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 8, padding: "10px 8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            display: "flex", flexDirection: "column", gap: 4,
            position: "relative", overflow: "hidden",
            transform: phase >= 1 ? "translateY(0)" : "translateY(8px)",
            opacity: phase >= 1 ? 1 : 0.4,
            transition: "transform 600ms cubic-bezier(0.22,1,0.36,1), opacity 600ms",
          }}>
            <div style={{ fontFamily: SANS, fontSize: 7, fontWeight: 700, color: "#0f172a", letterSpacing: 0.3, marginBottom: 2 }}>STATEMENT</div>
            <div style={{ fontSize: 5, color: "#64748b", fontFamily: SANS, marginBottom: 4 }}>Bank · May 2026</div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", opacity: 1 - i * 0.06 }}>
                <span style={{ width: "60%", height: 3, background: "#cbd5e1", borderRadius: 2, display: "block" }} />
                <span style={{ width: "24%", height: 3, background: "#94a3b8", borderRadius: 2, display: "block" }} />
              </div>
            ))}
            {phase === 1 && (
              <div style={{
                position: "absolute", left: 0, right: 0, height: 14,
                background: `linear-gradient(180deg, transparent 0%, rgba(5,150,105,0.45) 50%, transparent 100%)`,
                animation: "ob-scan 1.4s ease-in-out infinite",
                pointerEvents: "none",
              }} />
            )}
          </div>
          <div style={{
            position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
            background: T.accent, color: "white",
            fontFamily: SANS, fontSize: 8, fontWeight: 700,
            padding: "2px 6px", borderRadius: 4, letterSpacing: 0.6,
          }}>PDF</div>
        </div>

        {/* AI processor */}
        <div style={{ width: 52, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%", background: T.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: phase >= 1 ? `0 0 30px rgba(5,150,105,0.55)` : "none",
            transition: "box-shadow 400ms", position: "relative",
          }}>
            <Sparkles size={22} color="white" strokeWidth={2} />
            {phase >= 1 && phase < 3 && (
              <div style={{
                position: "absolute", inset: -4, borderRadius: "50%",
                border: `1.5px dashed ${T.accent}`,
                animation: "ob-spin 6s linear infinite", opacity: 0.5,
              }} />
            )}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 8, fontWeight: 700, color: T.fgMute, letterSpacing: 1, textTransform: "uppercase" }}>AI</div>
          <div style={{ display: "flex", gap: 3 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 4, height: 4, borderRadius: "50%", background: T.accent,
                opacity: phase >= 1 && phase < 3 ? 0.8 : 0.2,
                animation: phase >= 1 && phase < 3 ? `ob-pulse 0.9s ease-in-out ${i * 0.15}s infinite` : "none",
              }} />
            ))}
          </div>
        </div>

        {/* Extracted rows */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const tx = visibleTxs[i]
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 7px",
                background: tx ? T.cardEm : "transparent",
                border: `1px solid ${tx ? T.border : "transparent"}`,
                borderRadius: 8,
                opacity: tx ? 1 : 0,
                transform: tx ? "translateX(0)" : "translateX(-6px)",
                transition: `opacity 360ms ${i * 90}ms, transform 360ms ${i * 90}ms`,
                minHeight: 26,
              }}>
                {tx && (
                  <>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: tx.catColor + "38", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
                      {tx.catIcon}
                    </div>
                    <div style={{ flex: 1, fontSize: 11, color: T.fg, fontFamily: SERIF, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {tx.merchant}
                    </div>
                    <div style={{ fontSize: 11, fontVariantNumeric: "tabular-nums", color: (tx as any).credit ? T.accent : T.fg, fontWeight: 500, flexShrink: 0, fontFamily: SERIF }}>
                      {(tx as any).credit ? "+" : "−"}${tx.amount.toFixed(0)}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Status line */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: SANS, fontSize: 10, letterSpacing: 0.6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.fgMute }}>
          <span style={{
            width: 6, height: 6, borderRadius: 4, display: "inline-block",
            background: phase >= 3 ? T.accent : T.fgMute,
            animation: phase < 3 ? "ob-pulse 1.4s ease-in-out infinite" : "none",
          }} />
          <span style={{ textTransform: "uppercase" }}>
            {phase === 0 && "Waiting for upload"}
            {phase === 1 && "AI is reading…"}
            {phase === 2 && "Extracting transactions"}
            {phase === 3 && "38 transactions imported"}
          </span>
        </div>
        <span style={{ color: T.fgMute, fontVariantNumeric: "tabular-nums" }}>
          {phase >= 2 ? (phase === 3 ? "38 / 38" : "24 / 38") : "0 / 38"}
        </span>
      </div>
    </div>
  )
}

// ── Rail (left panel for steps 1–3) ───────────────────────────────────────────
function Rail({ step }: { step: number }) {
  return (
    <div style={{
      width: 300, flexShrink: 0,
      background: `linear-gradient(180deg, rgba(5,150,105,0.10) 0%, ${T.bg2} 70%)`,
      borderRight: `1px solid ${T.border}`,
      padding: "36px 28px", display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(16,185,129,0.35)" }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: 14, fontFamily: SERIF }}>E</span>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2, color: T.fg, fontFamily: SERIF }}>Set up</div>
          <div style={{ fontSize: 12, color: T.fgMute, fontStyle: "italic", fontFamily: SERIF }}>~3 minutes</div>
        </div>
      </div>

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 4 }}>
        {STEP_LABELS.map((label, idx) => {
          const i = idx + 1
          const done = i < step
          const active = i === step
          return (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 8px", borderRadius: 10,
              background: active ? T.accentSoft : "transparent",
              transition: "background 200ms",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11,
                border: `1.5px solid ${done || active ? T.accent : T.borderEm}`,
                background: done ? T.accent : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {done
                  ? <Check size={12} color="white" strokeWidth={3} />
                  : <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: active ? T.accent : T.fgMute }}>{i}</span>
                }
              </div>
              <div style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? T.fg : done ? T.fgDim : T.fgMute, fontFamily: SERIF }}>
                {label}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${T.border}`, background: T.card }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: T.fgMute, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>
          🔒 Private by default
        </div>
        <div style={{ fontSize: 12, color: T.fgMute, fontStyle: "italic", lineHeight: 1.5, fontFamily: SERIF }}>
          Your statements never leave the household. Read-only AI access.
        </div>
      </div>
    </div>
  )
}

// ── Step 0: Welcome ────────────────────────────────────────────────────────────
function WelcomeStep({ onAdvance, onSkip }: { onAdvance: () => void; onSkip: () => void }) {
  return (
    <div style={{
      width: "100%", maxWidth: 1080,
      display: "grid", gridTemplateColumns: "1.05fr 1fr",
      borderRadius: 28, overflow: "hidden",
      background: T.cardEm, border: `1px solid ${T.border}`, boxShadow: T.shadow,
      minHeight: 560,
    }}>
      <div style={{
        position: "relative", padding: "64px 56px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        background: `linear-gradient(135deg, ${T.bg2} 0%, ${T.bg} 100%)`, overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -80, right: -60, width: 320, height: 320, borderRadius: 999, background: T.accent, opacity: 0.12, filter: "blur(80px)" }} />
        <div style={{ position: "relative" }}>
          <Eyebrow>Welcome</Eyebrow>
          <h1 style={{ fontSize: 52, fontWeight: 500, lineHeight: 1.04, letterSpacing: -1.2, color: T.fg, margin: "8px 0 24px", fontFamily: SERIF }}>
            Stop guessing where<br />your money goes.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: T.fgDim, margin: "0 0 32px", maxWidth: 400, fontFamily: SERIF }}>
            Drop in a bank statement, CSV, or receipt photo — AI reads every line and lays it out as a dashboard you'll actually open.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={onAdvance} style={{
              border: 0, cursor: "pointer",
              background: `linear-gradient(135deg, ${T.accentBright} 0%, ${T.accent} 100%)`,
              color: "white", borderRadius: 16, padding: "15px 28px",
              fontSize: 15, fontWeight: 600, letterSpacing: 0.2,
              boxShadow: T.ctaShadow, fontFamily: SERIF,
            }}>Set up your space →</button>
            <span style={{ fontFamily: SANS, fontSize: 11, color: T.fgMute, letterSpacing: 0.4 }}>About 3 minutes</span>
          </div>

          <div style={{ marginTop: 48, display: "flex", alignItems: "center", gap: 18, paddingTop: 20, borderTop: `1px solid ${T.divider}` }}>
            {["Drop a file", "AI reads it", "See your money"].map((t, i) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 11, border: `1px solid ${T.accent}`, color: T.accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: SANS, fontSize: 10, fontWeight: 700,
                }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: T.fgDim, fontStyle: "italic", fontFamily: SERIF }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        position: "relative", padding: "64px 40px",
        background: `radial-gradient(circle at 70% 30%, rgba(5,150,105,0.18) 0%, ${T.bg} 60%)`,
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}>
        <div style={{ width: 340, transform: "rotate(2deg)", filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.5))" }}>
          <DashboardPeek />
        </div>
        <div style={{ position: "absolute", bottom: 28, right: 28, fontFamily: SANS, fontSize: 10, color: T.fgMute, letterSpacing: 0.6, textTransform: "uppercase" }}>
          ↑ Your dashboard, preview
        </div>
        <button onClick={onSkip} style={{
          position: "absolute", top: 20, right: 20,
          background: "none", border: 0, cursor: "pointer",
          fontFamily: SERIF, fontSize: 13, fontStyle: "italic", color: T.fgMute,
        }}>Skip intro →</button>
      </div>
    </div>
  )
}

// ── Step 1: Profile ────────────────────────────────────────────────────────────
function ProfileStep({ name, setName, currency, setCurrency, household, setHousehold, onAdvance }: {
  name: string; setName: (v: string) => void
  currency: string; setCurrency: (v: string) => void
  household: string; setHousehold: (v: string) => void
  onAdvance: () => void
}) {
  const valid = name.trim().length > 0
  return (
    <>
      <Eyebrow>About you</Eyebrow>
      <Heading>Let's set up your space.</Heading>
      <Sub>Just a few details so the dashboard reads like yours.</Sub>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <FieldLabel>Your name</FieldLabel>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Alex Marlow"
            style={{
              width: "100%", boxSizing: "border-box", marginTop: 8,
              border: `1px solid ${name ? T.accent : T.inputBorder}`,
              background: T.inputBg, color: T.fg,
              borderRadius: 14, padding: "14px 16px",
              fontSize: 16, fontFamily: SERIF, outline: "none",
              boxShadow: name ? `0 0 0 3px ${T.accentRing}` : "none",
              transition: "border-color 160ms, box-shadow 160ms",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 18 }}>
          <div>
            <FieldLabel>Currency</FieldLabel>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {CURRENCIES.map(c => (
                <button key={c.code} onClick={() => setCurrency(c.code)} style={{
                  flex: 1, padding: "11px 4px", borderRadius: 10,
                  border: `1px solid ${currency === c.code ? T.accent : T.inputBorder}`,
                  background: currency === c.code ? T.accentSoft : T.inputBg,
                  color: T.fg, cursor: "pointer", fontFamily: SERIF,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{c.symbol}</span>
                  <span style={{ fontFamily: SANS, fontSize: 9, color: T.fgMute, letterSpacing: 0.6 }}>{c.code}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Household type</FieldLabel>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {HOUSEHOLDS.map(h => (
                <button key={h.id} onClick={() => setHousehold(h.id)} style={{
                  flex: 1, padding: "10px 10px", borderRadius: 10,
                  border: `1px solid ${household === h.id ? T.accent : T.inputBorder}`,
                  background: household === h.id ? T.accentSoft : T.inputBg,
                  color: T.fg, cursor: "pointer", fontFamily: SERIF, textAlign: "left",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{h.label}</div>
                  <div style={{ fontSize: 11, color: T.fgMute, fontStyle: "italic", marginTop: 2 }}>{h.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <span style={{ fontFamily: SANS, fontSize: 11, color: T.fgMute, letterSpacing: 0.3 }}>Step 1 of 4</span>
        <div style={{ width: 200 }}><CTA onClick={onAdvance} disabled={!valid}>Continue</CTA></div>
      </div>
    </>
  )
}

// ── Step 2: Categories ─────────────────────────────────────────────────────────
function CategoriesStep({ picked, setPicked, onAdvance }: { picked: string[]; setPicked: (v: string[]) => void; onAdvance: () => void }) {
  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter(x => x !== id) : [...picked, id])
  const valid = picked.length >= 3
  return (
    <>
      <Eyebrow>What matters</Eyebrow>
      <Heading>Pick what you want to watch.</Heading>
      <Sub>These get headline treatment in your dashboard. The AI still tracks everything else quietly.</Sub>

      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {OB_CATEGORIES.map(c => {
          const active = picked.includes(c.id)
          return (
            <button key={c.id} onClick={() => toggle(c.id)} style={{
              textAlign: "left", padding: "14px 12px",
              border: `1px solid ${active ? T.accent : T.inputBorder}`,
              background: active ? T.accentSoft : T.inputBg,
              color: T.fg, cursor: "pointer", borderRadius: 14,
              fontFamily: SERIF,
              transition: "background 160ms, border-color 160ms",
              display: "flex", flexDirection: "column", gap: 8, minHeight: 100,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: c.color + "38", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{c.icon}</div>
                <div style={{ width: 16, height: 16, borderRadius: 8, border: `1.5px solid ${active ? T.accent : T.inputBorder}`, background: active ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {active && <Check size={10} color="#fff" strokeWidth={3} />}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.fgMute, fontStyle: "italic", marginTop: 2, lineHeight: 1.4 }}>{c.tagline}</div>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <span style={{ fontFamily: SANS, fontSize: 11, color: T.fgMute, letterSpacing: 0.3 }}>{picked.length} selected · pick at least 3</span>
        <div style={{ width: 200 }}><CTA onClick={onAdvance} disabled={!valid}>Continue</CTA></div>
      </div>
    </>
  )
}

// ── Step 3: Plan ───────────────────────────────────────────────────────────────
function PlanStep({ plan, setPlan, onAdvance }: { plan: string; setPlan: (v: string) => void; onAdvance: () => void }) {
  return (
    <>
      <Eyebrow>Choose a plan</Eyebrow>
      <Heading>Start free. Upgrade when you need more.</Heading>
      <Sub>Pro and Family unlock unlimited imports, subscription detection, and custom budgets.</Sub>

      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {PLANS.map(p => {
          const active = plan === p.id
          return (
            <button key={p.id} onClick={() => setPlan(p.id)} style={{
              textAlign: "left", padding: "18px 16px 16px",
              border: `1.5px solid ${active ? T.accent : T.inputBorder}`,
              background: active ? T.accentSoft : T.inputBg,
              color: T.fg, cursor: "pointer", borderRadius: 18,
              fontFamily: SERIF, position: "relative",
              boxShadow: active ? `0 0 0 3px ${T.accentRing}` : "none",
              transition: "background 160ms, border-color 160ms, box-shadow 160ms",
              display: "flex", flexDirection: "column",
            }}>
              {(p as any).badge && (
                <span style={{
                  position: "absolute", top: -10, right: 16,
                  fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
                  padding: "4px 10px", borderRadius: 999,
                  background: T.accent, color: "white", textTransform: "uppercase",
                  boxShadow: T.ctaShadow,
                }}>{(p as any).badge}</span>
              )}
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 30, fontWeight: 500, fontVariantNumeric: "tabular-nums", letterSpacing: -0.6 }}>{p.price}</span>
                <span style={{ fontSize: 12, color: T.fgMute, fontStyle: "italic" }}>{p.period}</span>
              </div>
              <div style={{ fontSize: 13, color: T.fgDim, fontStyle: "italic", marginBottom: 12, lineHeight: 1.45 }}>{p.pitch}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingTop: 10, borderTop: `1px solid ${T.divider}` }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: T.fgDim }}>
                    <Check size={11} color={T.accent} strokeWidth={2.4} style={{ marginTop: 3, flexShrink: 0 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <span style={{ fontFamily: SANS, fontSize: 11, color: T.fgMute, letterSpacing: 0.3 }}>No credit card required · Cancel anytime</span>
        <div style={{ width: 240 }}>
          <CTA onClick={onAdvance}>Continue with {PLANS.find(p => p.id === plan)!.name}</CTA>
        </div>
      </div>
    </>
  )
}

// ── Step 4: AI ─────────────────────────────────────────────────────────────────
function AIStep({ onAdvance, onBack }: { onAdvance: () => void; onBack: () => void }) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 900),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 5200),
    ]
    return () => ts.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      width: "100%", maxWidth: 1080,
      borderRadius: 28, overflow: "hidden",
      background: T.cardEm, border: `1px solid ${T.border}`, boxShadow: T.shadow,
      padding: "48px 56px 32px", display: "flex", flexDirection: "column",
      position: "relative", minHeight: 560,
    }}>
      <button onClick={onBack} style={{ position: "absolute", top: 28, left: 28, display: "flex", alignItems: "center", gap: 6, border: 0, background: "none", color: T.fgDim, cursor: "pointer", fontFamily: SERIF, fontSize: 13, fontStyle: "italic" }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto", marginTop: 8 }}>
        <Eyebrow>The magic bit</Eyebrow>
        <h1 style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.6, color: T.fg, margin: "6px 0 10px", fontFamily: SERIF }}>
          Watch the AI read a statement.
        </h1>
        <p style={{ fontSize: 15, color: T.fgDim, margin: 0, fontFamily: SERIF }}>
          We'll run a real extraction on a sample PDF. CSV, receipt photos, and voice notes all flow through the same pipeline.
        </p>
      </div>

      <div style={{ flex: 1, marginTop: 28, display: "flex", minHeight: 240 }}>
        <AIStage phase={phase} />
      </div>

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: SANS, fontSize: 11, color: T.fgMute }}>
          {[{ icon: "📄", label: "PDF" }, { icon: "📊", label: "CSV" }, { icon: "📷", label: "Receipt photo" }, { icon: "🎙️", label: "Voice note" }].map(m => (
            <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span>{m.icon}</span> {m.label}
            </div>
          ))}
        </div>
        <div style={{ width: 260 }}>
          <CTA onClick={onAdvance} disabled={phase < 3}>
            {phase < 3
              ? <><Loader2 size={14} style={{ animation: "ob-spin 1.1s linear infinite" }} /> Extracting…</>
              : "Looks good — finish"
            }
          </CTA>
        </div>
      </div>
    </div>
  )
}

// ── Step 5: Done ───────────────────────────────────────────────────────────────
function DoneStep({ name, completing, onComplete }: { name: string; completing: boolean; onComplete: () => void }) {
  const first = name.trim().split(/\s+/)[0] || "friend"
  return (
    <div style={{
      width: "100%", maxWidth: 1080,
      borderRadius: 28, overflow: "hidden",
      background: T.cardEm, border: `1px solid ${T.border}`, boxShadow: T.shadow,
      display: "grid", gridTemplateColumns: "1fr 1fr",
      minHeight: 560,
    }}>
      <div style={{ padding: "64px 52px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 28,
          background: T.accentSoft, border: `1.5px solid ${T.accent}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 22, boxShadow: `0 0 36px rgba(5,150,105,0.55)`,
        }}>
          <Check size={26} color={T.accent} strokeWidth={2.2} />
        </div>
        <Eyebrow>Ready</Eyebrow>
        <h1 style={{ fontSize: 42, fontWeight: 500, lineHeight: 1.05, letterSpacing: -0.8, color: T.fg, margin: "6px 0 16px", fontFamily: SERIF }}>
          You're all set,<br /><em style={{ fontStyle: "italic" }}>{first}</em>.
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.5, color: T.fgDim, margin: "0 0 28px", maxWidth: 360, fontFamily: SERIF }}>
          We imported 38 transactions from a sample statement. Take a look — and when you're ready, drop in your own.
        </p>
        <div>
          <button onClick={onComplete} disabled={completing} style={{
            border: 0, cursor: completing ? "default" : "pointer",
            background: `linear-gradient(135deg, ${T.accentBright} 0%, ${T.accent} 100%)`,
            color: "white", borderRadius: 16, padding: "14px 24px",
            fontSize: 15, fontWeight: 600, letterSpacing: 0.2,
            boxShadow: T.ctaShadow, fontFamily: SERIF,
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            {completing ? <><Loader2 size={14} style={{ animation: "ob-spin 1.1s linear infinite" }} /> Opening…</> : "Open dashboard →"}
          </button>
        </div>

        <div style={{ marginTop: 36, paddingTop: 22, borderTop: `1px solid ${T.divider}`, display: "flex", gap: 28 }}>
          {[{ v: "38", l: "imported" }, { v: "14", l: "subscriptions caught" }, { v: "6", l: "categories active" }].map(s => (
            <div key={s.l}>
              <div style={{ fontSize: 22, fontWeight: 500, color: T.fg, fontVariantNumeric: "tabular-nums", letterSpacing: -0.2, lineHeight: 1, fontFamily: SERIF }}>{s.v}</div>
              <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, color: T.fgMute, letterSpacing: 0.6, textTransform: "uppercase", marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: "64px 40px",
        background: `radial-gradient(circle at 30% 30%, rgba(5,150,105,0.16) 0%, ${T.bg} 65%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ width: 360, filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.5))" }}>
          <DashboardPeek />
        </div>
      </div>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────────
export function OnboardingWizard({ firstName }: { firstName: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(firstName)
  const [currency, setCurrency] = useState("USD")
  const [household, setHousehold] = useState("solo")
  const [picked, setPicked] = useState(["food", "transport", "utilities", "entertainment", "shopping"])
  const [plan, setPlan] = useState("pro")
  const [completing, setCompleting] = useState(false)

  const advance = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  async function handleComplete() {
    setCompleting(true)
    try {
      await fetch("/api/user/complete-onboarding", { method: "POST" })
      if (currency !== "USD") {
        await fetch("/api/household", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ defaultCurrency: currency }) })
      }
    } catch {}
    router.push("/dashboard")
  }

  async function handleSkip() {
    try { await fetch("/api/user/complete-onboarding", { method: "POST" }) } catch {}
    router.push("/dashboard")
  }

  const showCard = step >= 1 && step <= 3

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.fg, fontFamily: SERIF, position: "relative", overflow: "hidden" }}>
      {/* CSS keyframes */}
      <style>{`
        @keyframes ob-scan { 0% { top: 0 } 50% { top: 80% } 100% { top: 0 } }
        @keyframes ob-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes ob-pulse { 0%,100% { opacity: 0.3 } 50% { opacity: 1 } }
      `}</style>

      {/* Backdrop */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -90, right: -60, width: 320, height: 320, borderRadius: 999, background: T.accent, opacity: 0.085, filter: "blur(70px)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -100, width: 280, height: 280, borderRadius: 999, background: T.accent, opacity: 0.055, filter: "blur(70px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.022 }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, transparent 45%, #06111b 78%)" }} />
      </div>

      {/* Header */}
      <header style={{ position: "relative", zIndex: 10, padding: "22px 36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(16,185,129,0.35)" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 13, fontFamily: SERIF }}>E</span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2, color: T.fg, fontFamily: SERIF }}>Expensable</span>
        </div>
        {step < 5 && (
          <button onClick={handleSkip} style={{ background: "none", border: 0, cursor: "pointer", fontFamily: SERIF, fontSize: 13, fontStyle: "italic", color: T.fgMute }}>
            Skip intro →
          </button>
        )}
      </header>

      {/* Content */}
      <main style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 40px 48px", minHeight: "calc(100vh - 90px)" }}>
        {step === 0 && <WelcomeStep onAdvance={advance} onSkip={handleSkip} />}

        {showCard && (
          <div style={{
            width: "100%", maxWidth: 1080, minHeight: 560,
            display: "grid", gridTemplateColumns: "300px 1fr",
            borderRadius: 28, overflow: "hidden",
            background: T.cardEm, border: `1px solid ${T.border}`, boxShadow: T.shadow,
          }}>
            <Rail step={step} />
            <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
              {step > 1 && (
                <button onClick={back} style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 6, border: 0, background: "none", color: T.fgDim, cursor: "pointer", fontFamily: SERIF, fontSize: 13, fontStyle: "italic" }}>
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              <div style={{ flex: 1, padding: "60px 56px 32px", display: "flex", flexDirection: "column" }}>
                {step === 1 && <ProfileStep name={name} setName={setName} currency={currency} setCurrency={setCurrency} household={household} setHousehold={setHousehold} onAdvance={advance} />}
                {step === 2 && <CategoriesStep picked={picked} setPicked={setPicked} onAdvance={advance} />}
                {step === 3 && <PlanStep plan={plan} setPlan={setPlan} onAdvance={advance} />}
              </div>
            </div>
          </div>
        )}

        {step === 4 && <AIStep onAdvance={advance} onBack={back} />}
        {step === 5 && <DoneStep name={name} completing={completing} onComplete={handleComplete} />}
      </main>
    </div>
  )
}
