import React, { useState, useEffect, useRef } from "react"
import {
  View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar,
  TextInput, ScrollView, Animated, Dimensions,
} from "react-native"
import { Text } from "../components/Text"
import { Check, ArrowLeft } from "lucide-react-native"
import { useAuth } from "../lib/auth"
import { FONTS } from "../lib/fonts"
import { Config } from "../lib/config"
import { getCookieHeader } from "../lib/cookies"

const { width } = Dimensions.get("window")

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
  accentSoft: "rgba(5,150,105,0.16)",
  accentRing: "rgba(5,150,105,0.30)",
  ctaShadow: { shadowColor: "#059669", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.36, shadowRadius: 18, elevation: 8 },
}

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
  { id: "free",   name: "Free",   price: "$0",  period: "always",   pitch: "For tracking the basics.",         features: ["25 file imports/month", "AI category suggestions", "1 household member"] },
  { id: "pro",    name: "Pro",    price: "$6",  period: "/ month",  pitch: "For the full picture.",             badge: "Recommended", features: ["60 file imports/month", "Subscription detection", "Custom budgets & alerts"] },
  { id: "family", name: "Family", price: "$12", period: "/ month",  pitch: "Shared finances, separate logins.", features: ["1000 imports/month", "Up to 6 members", "Shared budgets & insights"] },
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
  { merchant: "Whole Foods Market", amount: 84.20,  catColor: "#f97316", catIcon: "🍔" },
  { merchant: "Spotify",            amount: 11.99,  catColor: "#ec4899", catIcon: "🎬" },
  { merchant: "BVG Monthly Pass",   amount: 49.00,  catColor: "#0ea5e9", catIcon: "🚌" },
  { merchant: "Netflix",            amount: 17.99,  catColor: "#ec4899", catIcon: "🎬" },
  { merchant: "Vattenfall Strom",   amount: 96.20,  catColor: "#8b5cf6", catIcon: "💡" },
  { merchant: "Salary · May",       amount: 4200,   catColor: "#059669", catIcon: "💰", credit: true },
]

const STEP_LABELS = ["You", "Categories", "Plan", "Import"]
const TOTAL_STEPS = 4

// ── Chrome (progress + back) ───────────────────────────────────────────────────
function Chrome({ step, onBack }: { step: number; onBack: () => void }) {
  const midStep = step - 1
  const pct = (midStep / TOTAL_STEPS) * 100
  return (
    <View style={s.chrome}>
      <View style={s.chromeRow}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <ArrowLeft size={16} color={T.fg} />
        </TouchableOpacity>
        <Text style={s.chromeLabel}>Step {midStep} of {TOTAL_STEPS}</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  )
}

// ── DashboardPeek ──────────────────────────────────────────────────────────────
function DashboardPeek() {
  const peek = SAMPLE_TXS.slice(0, 3)
  return (
    <View style={s.peekCard}>
      <View style={s.peekHeader}>
        <View>
          <Text style={s.peekEyebrow}>MONEY OUT · MAY</Text>
          <Text style={s.peekAmount}>$1,284.66</Text>
        </View>
        <View style={s.peekBadge}><Text style={s.peekBadgeText}>−12%</Text></View>
      </View>
      {peek.map((tx, i) => (
        <View key={i} style={[s.peekTx, i > 0 && s.peekTxBorder]}>
          <View style={[s.peekIcon, { backgroundColor: tx.catColor + "38" }]}>
            <Text style={{ fontSize: 13 }}>{tx.catIcon}</Text>
          </View>
          <Text style={s.peekMerchant} numberOfLines={1}>{tx.merchant}</Text>
          <Text style={s.peekAmount2}>−${tx.amount.toFixed(2)}</Text>
        </View>
      ))}
    </View>
  )
}

// ── AI Stage ───────────────────────────────────────────────────────────────────
function AIStage({ phase }: { phase: number }) {
  const scanAnim = useRef(new Animated.Value(0)).current
  const spinAnim = useRef(new Animated.Value(0)).current
  const dotAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current

  useEffect(() => {
    if (phase === 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start()
    } else {
      scanAnim.setValue(0)
    }
  }, [phase])

  useEffect(() => {
    if (phase >= 1 && phase < 3) {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 6000, useNativeDriver: true })
      ).start()
      dotAnims.forEach((a, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 150),
            Animated.timing(a, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.timing(a, { toValue: 0.3, duration: 450, useNativeDriver: true }),
          ])
        ).start()
      })
    } else {
      spinAnim.setValue(0)
    }
  }, [phase])

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] })
  const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] })

  const visibleTxs = phase >= 2 ? SAMPLE_TXS.slice(0, phase === 3 ? 6 : 3) : []

  return (
    <View style={s.aiCard}>
      <View style={s.aiRow}>
        {/* Statement */}
        <View style={[s.statementWrap, { opacity: phase >= 1 ? 1 : 0.4 }]}>
          <View style={s.statementSheet}>
            <Text style={s.stmtHeader}>STATEMENT</Text>
            <Text style={s.stmtSub}>Bank · May 2026</Text>
            {Array.from({ length: 7 }).map((_, i) => (
              <View key={i} style={[s.stmtRow, { opacity: 1 - i * 0.08 }]}>
                <View style={s.stmtBarLong} />
                <View style={s.stmtBarShort} />
              </View>
            ))}
            {phase === 1 && (
              <Animated.View style={[s.scanLine, { transform: [{ translateY: scanY }] }]} />
            )}
          </View>
          <View style={s.pdfLabel}><Text style={s.pdfLabelText}>PDF</Text></View>
        </View>

        {/* Processor */}
        <View style={s.processorCol}>
          <View style={[s.processorCircle, phase >= 1 && s.processorActive]}>
            <Text style={{ fontSize: 18 }}>✦</Text>
            {phase >= 1 && phase < 3 && (
              <Animated.View style={[s.spinRing, { transform: [{ rotate: spin }] }]} />
            )}
          </View>
          <Text style={s.aiLabel}>AI</Text>
          <View style={s.dotRow}>
            {dotAnims.map((a, i) => (
              <Animated.View key={i} style={[s.dot, { opacity: phase >= 1 && phase < 3 ? a : 0.2 }]} />
            ))}
          </View>
        </View>

        {/* Extracted rows */}
        <View style={s.extractedCol}>
          {Array.from({ length: 5 }).map((_, i) => {
            const tx = visibleTxs[i]
            return (
              <View key={i} style={[s.extractedRow, !tx && { opacity: 0, borderWidth: 0, backgroundColor: "transparent" }]}>
                {tx && (
                  <>
                    <View style={[s.txIcon, { backgroundColor: tx.catColor + "38" }]}>
                      <Text style={{ fontSize: 9 }}>{tx.catIcon}</Text>
                    </View>
                    <Text style={s.txName} numberOfLines={1}>{tx.merchant}</Text>
                    <Text style={[s.txAmt, (tx as any).credit && { color: T.accent }]}>
                      {(tx as any).credit ? "+" : "−"}${tx.amount.toFixed(0)}
                    </Text>
                  </>
                )}
              </View>
            )
          })}
        </View>
      </View>

      {/* Status */}
      <View style={s.aiStatus}>
        <View style={[s.statusDot, phase >= 3 && { backgroundColor: T.accent }]} />
        <Text style={s.statusText}>
          {phase === 0 && "Waiting for upload"}
          {phase === 1 && "AI is reading…"}
          {phase === 2 && "Extracting transactions"}
          {phase === 3 && "38 transactions imported"}
        </Text>
        <Text style={s.statusCount}>{phase >= 2 ? (phase === 3 ? "38/38" : "24/38") : "0/38"}</Text>
      </View>
    </View>
  )
}

// ── Step 0: Welcome ────────────────────────────────────────────────────────────
function WelcomeStep({ name, onAdvance, onSkip }: { name: string; onAdvance: () => void; onSkip: () => void }) {
  const first = name.split(" ")[0] || "there"
  return (
    <View style={s.welcomeWrap}>
      <View style={s.logoBlock}>
        <View style={s.logoMark}>
          <Text style={{ color: "white", fontWeight: "700", fontSize: 22, fontFamily: FONTS.bold }}>E</Text>
        </View>
        <Text style={s.logoName}>Expensable</Text>
        <View style={s.logoDivider} />
        <Text style={s.logoSub}>Your finances, beautifully organised.</Text>
      </View>

      <View style={s.welcomeBody}>
        <Text style={s.welcomeHello}>Hey {first}, welcome aboard 👋</Text>
        <Text style={s.welcomeHead}>Stop guessing where your money goes.</Text>
        <Text style={s.welcomeSub}>
          Upload a bank statement, CSV or receipt photo. AI reads every transaction and organises them into the dashboard for you.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={s.ctaBtn} onPress={onAdvance}>
        <Text style={s.ctaBtnText}>Get started</Text>
      </TouchableOpacity>
      <Text style={s.welcomeFooter}>Free plan forever · No credit card</Text>
      <TouchableOpacity style={s.skipBtn} onPress={onSkip}>
        <Text style={s.skipText}>Skip intro →</Text>
      </TouchableOpacity>
    </View>
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
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={s.eyebrow}>About you</Text>
      <Text style={s.stepHead}>Let's set up your space.</Text>
      <Text style={s.stepSub}>Just a few details so the dashboard reads like yours.</Text>

      <View style={s.fieldBlock}>
        <Text style={s.fieldLabel}>YOUR NAME</Text>
        <TextInput
          autoFocus
          value={name}
          onChangeText={setName}
          placeholder="Alex Marlow"
          placeholderTextColor={T.fgMute}
          style={[s.textInput, name.trim() && s.textInputActive]}
        />
      </View>

      <View style={s.fieldBlock}>
        <Text style={s.fieldLabel}>HOUSEHOLD CURRENCY</Text>
        <View style={s.currencyRow}>
          {CURRENCIES.map(c => (
            <TouchableOpacity
              key={c.code}
              style={[s.currencyBtn, currency === c.code && s.currencyBtnActive]}
              onPress={() => setCurrency(c.code)}
            >
              <Text style={[s.currencySymbol, currency === c.code && { color: T.accent }]}>{c.symbol}</Text>
              <Text style={s.currencyCode}>{c.code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.fieldBlock}>
        <Text style={s.fieldLabel}>HOUSEHOLD</Text>
        <View style={{ gap: 8 }}>
          {HOUSEHOLDS.map(h => (
            <TouchableOpacity
              key={h.id}
              style={[s.householdBtn, household === h.id && s.householdBtnActive]}
              onPress={() => setHousehold(h.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.householdLabel, household === h.id && { color: T.fg }]}>{h.label}</Text>
                <Text style={s.householdSub}>{h.sub}</Text>
              </View>
              <View style={[s.radio, household === h.id && s.radioActive]}>
                {household === h.id && <Check size={10} color="#fff" strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={[s.ctaBtn, !valid && s.ctaBtnDisabled]} onPress={valid ? onAdvance : undefined}>
        <Text style={s.ctaBtnText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ── Step 2: Categories ─────────────────────────────────────────────────────────
function CategoriesStep({ picked, setPicked, onAdvance }: { picked: string[]; setPicked: (v: string[]) => void; onAdvance: () => void }) {
  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter(x => x !== id) : [...picked, id])
  const valid = picked.length >= 3
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={s.eyebrow}>What matters</Text>
      <Text style={s.stepHead}>Pick what you want to watch.</Text>
      <Text style={s.stepSub}>We'll feature these in your dashboard. Tap to add or remove — the AI still tracks everything else.</Text>

      <View style={s.catGrid}>
        {OB_CATEGORIES.map((c, idx) => {
          const active = picked.includes(c.id)
          return (
            <TouchableOpacity
              key={c.id}
              style={[s.catCard, active && s.catCardActive, idx % 2 === 0 && s.catCardOdd]}
              onPress={() => toggle(c.id)}
            >
              <View style={s.catCardTop}>
                <View style={[s.catIcon, { backgroundColor: c.color + "38" }]}>
                  <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                </View>
                <View style={[s.radio, active && s.radioActive]}>
                  {active && <Check size={10} color="#fff" strokeWidth={3} />}
                </View>
              </View>
              <Text style={s.catName}>{c.name}</Text>
              <Text style={s.catTagline} numberOfLines={2}>{c.tagline}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={s.catCount}>{picked.length} selected · pick at least 3</Text>

      <TouchableOpacity style={[s.ctaBtn, !valid && s.ctaBtnDisabled]} onPress={valid ? onAdvance : undefined}>
        <Text style={s.ctaBtnText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ── Step 3: Plan ───────────────────────────────────────────────────────────────
function PlanStep({ plan, setPlan, onAdvance }: { plan: string; setPlan: (v: string) => void; onAdvance: () => void }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={s.eyebrow}>Choose a plan</Text>
      <Text style={s.stepHead}>Start free. Upgrade when you need more.</Text>
      <Text style={s.stepSub}>You can switch any time from Settings.</Text>

      <View style={{ gap: 10, marginTop: 20 }}>
        {PLANS.map(p => {
          const active = plan === p.id
          return (
            <TouchableOpacity
              key={p.id}
              style={[s.planCard, active && s.planCardActive]}
              onPress={() => setPlan(p.id)}
            >
              {(p as any).badge && (
                <View style={s.planBadge}><Text style={s.planBadgeText}>{(p as any).badge}</Text></View>
              )}
              <View style={s.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.planName}>{p.name}</Text>
                  <Text style={s.planPitch}>{p.pitch}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.planPrice}>{p.price}</Text>
                  <Text style={s.planPeriod}>{p.period}</Text>
                </View>
              </View>
              {active && (
                <View style={s.planFeatures}>
                  {p.features.map(f => (
                    <View key={f} style={s.planFeatureRow}>
                      <Check size={12} color={T.accent} strokeWidth={2.4} />
                      <Text style={s.planFeatureText}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      <TouchableOpacity style={[s.ctaBtn, { marginTop: 20 }]} onPress={onAdvance}>
        <Text style={s.ctaBtnText}>Continue with {PLANS.find(p => p.id === plan)!.name}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ── Step 4: AI ─────────────────────────────────────────────────────────────────
function AIStep({ onAdvance }: { onAdvance: () => void }) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1900),
      setTimeout(() => setPhase(3), 4400),
    ]
    return () => ts.forEach(clearTimeout)
  }, [])

  return (
    <View style={s.stepContent}>
      <Text style={s.eyebrow}>The magic bit</Text>
      <Text style={s.stepHead}>Watch the AI read a statement.</Text>
      <Text style={s.stepSub}>
        This is a 6-second demo. You can also snap a receipt photo or log a spend by voice — AI handles all of it.
      </Text>

      <AIStage phase={phase} />

      <View style={s.inputMethods}>
        {["📄 PDF / CSV", "📷 Receipt photo", "🎙️ Voice note"].map(m => (
          <View key={m} style={s.methodPill}><Text style={s.methodText}>{m}</Text></View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity
        style={[s.ctaBtn, phase < 3 && s.ctaBtnDisabled]}
        onPress={phase >= 3 ? onAdvance : undefined}
      >
        {phase < 3
          ? <Text style={s.ctaBtnText}>Extracting…</Text>
          : <Text style={s.ctaBtnText}>Looks good — finish</Text>
        }
      </TouchableOpacity>
    </View>
  )
}

// ── Step 5: Done ───────────────────────────────────────────────────────────────
function DoneStep({ name, completing, onComplete }: { name: string; completing: boolean; onComplete: () => void }) {
  const first = name.trim().split(/\s+/)[0] || "friend"
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.stepContent, { paddingTop: 48 }]}>
      <View style={s.doneCheck}>
        <Check size={28} color={T.accent} strokeWidth={2.2} />
      </View>
      <Text style={s.doneHead}>You're all set, {first}.</Text>
      <Text style={s.doneSub}>
        We've imported 38 transactions from a sample statement. Take a look at your dashboard.
      </Text>

      <View style={s.doneStats}>
        {[{ v: "38", l: "Imported" }, { v: "14", l: "Subscriptions caught" }, { v: "6", l: "Categories active" }].map(s2 => (
          <View key={s2.l} style={{ alignItems: "center" }}>
            <Text style={s.doneStat}>{s2.v}</Text>
            <Text style={s.doneStatLabel}>{s2.l}</Text>
          </View>
        ))}
      </View>

      <DashboardPeek />

      <View style={{ height: 20 }} />

      <TouchableOpacity style={[s.ctaBtn, completing && s.ctaBtnDisabled]} onPress={completing ? undefined : onComplete}>
        <Text style={s.ctaBtnText}>{completing ? "Opening…" : "Open dashboard"}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { completeOnboarding, user } = useAuth()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(user?.name ?? "")
  const [currency, setCurrency] = useState("USD")
  const [household, setHousehold] = useState("solo")
  const [picked, setPicked] = useState(["food", "transport", "utilities", "entertainment"])
  const [plan, setPlan] = useState("pro")
  const [completing, setCompleting] = useState(false)

  const advance = () => setStep(s => s + 1)
  const back = () => setStep(s => Math.max(0, s - 1))

  const showChrome = step >= 1 && step <= 4

  async function handleComplete() {
    setCompleting(true)
    try {
      if (currency !== "USD") {
        await fetch(`${Config.API_URL}/api/household`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Cookie: getCookieHeader() },
          body: JSON.stringify({ defaultCurrency: currency }),
        })
      }
      await completeOnboarding()
    } catch {
      await completeOnboarding()
    }
  }

  async function handleSkip() {
    setCompleting(true)
    await completeOnboarding()
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      {showChrome && <Chrome step={step} onBack={back} />}

      <View style={[s.main, showChrome && { paddingTop: 0 }]}>
        {step === 0 && <WelcomeStep name={name} onAdvance={advance} onSkip={handleSkip} />}
        {step === 1 && <ProfileStep name={name} setName={setName} currency={currency} setCurrency={setCurrency} household={household} setHousehold={setHousehold} onAdvance={advance} />}
        {step === 2 && <CategoriesStep picked={picked} setPicked={setPicked} onAdvance={advance} />}
        {step === 3 && <PlanStep plan={plan} setPlan={setPlan} onAdvance={advance} />}
        {step === 4 && <AIStep onAdvance={advance} />}
        {step === 5 && <DoneStep name={name} completing={completing} onComplete={handleComplete} />}
      </View>
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  main: { flex: 1, paddingHorizontal: 24 },

  // Chrome
  chrome: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 12 },
  chromeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: T.border, backgroundColor: T.card, alignItems: "center", justifyContent: "center" },
  chromeLabel: { fontFamily: FONTS.regular, fontSize: 10, fontWeight: "700", color: T.fgMute, letterSpacing: 1.6 },
  progressTrack: { height: 3, backgroundColor: T.divider, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: T.accent, borderRadius: 2 },

  // Welcome
  welcomeWrap: { flex: 1, paddingTop: 32, paddingBottom: 20 },
  logoBlock: { alignItems: "center", marginTop: 24 },
  logoMark: { width: 76, height: 76, borderRadius: 18, backgroundColor: T.accent, alignItems: "center", justifyContent: "center" },
  logoName: { fontFamily: FONTS.bold, fontSize: 32, fontWeight: "700", letterSpacing: -0.6, color: T.fg, marginTop: 18, marginBottom: 6 },
  logoDivider: { width: 36, height: 2, backgroundColor: T.accent, borderRadius: 2, marginBottom: 10 },
  logoSub: { fontFamily: FONTS.regular, fontSize: 14, color: T.fgMute, letterSpacing: 0.1 },
  welcomeBody: { marginTop: 36, paddingHorizontal: 4 },
  welcomeHello: { fontFamily: FONTS.regular, fontSize: 13, color: T.fgMute, textAlign: "center", marginBottom: 10 },
  welcomeHead: { fontFamily: FONTS.bold, fontSize: 30, fontWeight: "700", lineHeight: 36, letterSpacing: -0.5, color: T.fg, marginBottom: 14 },
  welcomeSub: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 23, color: T.fgDim },
  welcomeFooter: { fontFamily: FONTS.regular, fontSize: 11, color: T.fgMute, letterSpacing: 0.4, textAlign: "center", marginTop: 12 },
  skipBtn: { alignItems: "center", marginTop: 8, paddingVertical: 6 },
  skipText: { fontFamily: FONTS.regular, fontSize: 13, color: T.fgMute },

  // Shared CTA
  ctaBtn: {
    width: "100%", borderRadius: 16, paddingVertical: 15, alignItems: "center",
    backgroundColor: T.accent,
    shadowColor: "#059669", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.36, shadowRadius: 18, elevation: 8,
    marginTop: 16,
  },
  ctaBtnDisabled: { backgroundColor: "rgba(255,255,255,0.08)", shadowOpacity: 0, elevation: 0 },
  ctaBtnText: { fontFamily: FONTS.bold, fontSize: 15, fontWeight: "600", color: "white", letterSpacing: 0.2 },

  // Step content
  stepContent: { paddingTop: 8, paddingBottom: 32 },
  eyebrow: { fontFamily: FONTS.regular, fontSize: 13, color: T.accent, letterSpacing: 0.2, marginBottom: 6 },
  stepHead: { fontFamily: FONTS.bold, fontSize: 24, fontWeight: "700", lineHeight: 30, letterSpacing: -0.4, color: T.fg, marginBottom: 8 },
  stepSub: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 21, color: T.fgDim, marginBottom: 4 },

  // Fields
  fieldBlock: { marginTop: 20 },
  fieldLabel: { fontFamily: FONTS.regular, fontSize: 10, fontWeight: "700", color: T.fgMute, letterSpacing: 1.4, marginBottom: 8 },
  textInput: {
    borderWidth: 1, borderColor: T.inputBorder, backgroundColor: T.inputBg,
    borderRadius: 14, padding: 14, fontSize: 16, fontFamily: FONTS.regular, color: T.fg,
  },
  textInputActive: { borderColor: T.accent },

  // Currency
  currencyRow: { flexDirection: "row" },
  currencyBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: T.inputBorder, backgroundColor: T.inputBg, alignItems: "center", marginHorizontal: 4 },
  currencyBtnActive: { borderColor: T.accent, backgroundColor: T.accentSoft },
  currencySymbol: { fontFamily: FONTS.bold, fontSize: 18, fontWeight: "600", color: T.fg },
  currencyCode: { fontFamily: FONTS.regular, fontSize: 10, color: T.fgMute, letterSpacing: 0.6, marginTop: 2 },

  // Household
  householdBtn: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: T.inputBorder, backgroundColor: T.inputBg },
  householdBtnActive: { borderColor: T.accent, backgroundColor: T.accentSoft },
  householdLabel: { fontFamily: FONTS.bold, fontSize: 15, fontWeight: "500", color: T.fgDim },
  householdSub: { fontFamily: FONTS.regular, fontSize: 12, color: T.fgMute, marginTop: 2 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: T.inputBorder, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: T.accent, backgroundColor: T.accent },

  // Categories
  catGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 20 },
  catCard: {
    width: (width - 48 - 10) / 2,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: T.inputBorder, backgroundColor: T.inputBg,
    minHeight: 88, marginBottom: 10,
  },
  catCardOdd: { marginRight: 10 },
  catCardActive: { borderColor: T.accent, backgroundColor: T.accentSoft },
  catCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  catIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catName: { fontFamily: FONTS.bold, fontSize: 13, fontWeight: "500", color: T.fg, lineHeight: 18 },
  catTagline: { fontFamily: FONTS.regular, fontSize: 11, color: T.fgMute, marginTop: 2, lineHeight: 15 },
  catCount: { fontFamily: FONTS.regular, fontSize: 11, color: T.fgMute, letterSpacing: 0.3, textAlign: "center", marginTop: 12 },

  // Plans
  planCard: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: T.inputBorder, backgroundColor: T.inputBg, position: "relative" },
  planCardActive: { borderColor: T.accent, backgroundColor: T.accentSoft },
  planBadge: { position: "absolute", top: -8, right: 14, backgroundColor: T.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  planBadgeText: { fontFamily: FONTS.regular, fontSize: 9, fontWeight: "700", color: "white", letterSpacing: 0.8 },
  planHeader: { flexDirection: "row", alignItems: "flex-start" },
  planName: { fontFamily: FONTS.bold, fontSize: 17, fontWeight: "600", color: T.fg },
  planPitch: { fontFamily: FONTS.regular, fontSize: 12, color: T.fgDim, marginTop: 2 },
  planPrice: { fontFamily: FONTS.bold, fontSize: 22, fontWeight: "600", color: T.fg },
  planPeriod: { fontFamily: FONTS.regular, fontSize: 11, color: T.fgMute },
  planFeatures: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: T.divider },
  planFeatureRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  planFeatureText: { fontFamily: FONTS.regular, fontSize: 13, color: T.fgDim, flex: 1, marginLeft: 8 },

  // AI Stage
  aiCard: { marginTop: 16, borderWidth: 1, borderColor: T.border, borderRadius: 18, backgroundColor: T.cardEm, padding: 14 },
  aiRow: { flexDirection: "row", alignItems: "stretch" },
  statementWrap: { width: 84, position: "relative", marginRight: 12 },
  statementSheet: {
    width: "100%", aspectRatio: 7 / 9, backgroundColor: "#f1f5f9", borderRadius: 6,
    padding: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  stmtHeader: { fontFamily: FONTS.regular, fontSize: 5, fontWeight: "700", color: "#0f172a", letterSpacing: 0.3, marginBottom: 2 },
  stmtSub: { fontFamily: FONTS.regular, fontSize: 4, color: "#64748b", marginBottom: 3 },
  stmtRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  stmtBarLong: { width: "60%", height: 2, backgroundColor: "#cbd5e1", borderRadius: 2 },
  stmtBarShort: { width: "24%", height: 2, backgroundColor: "#94a3b8", borderRadius: 2 },
  scanLine: { position: "absolute", left: 0, right: 0, height: 10, backgroundColor: "rgba(5,150,105,0.4)" },
  pdfLabel: { position: "absolute", bottom: -6, alignSelf: "center", backgroundColor: T.accent, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  pdfLabelText: { fontFamily: FONTS.regular, fontSize: 7, fontWeight: "700", color: "white", letterSpacing: 0.5 },
  processorCol: { width: 40, alignItems: "center", justifyContent: "center", marginRight: 12 },
  processorCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.accent, alignItems: "center", justifyContent: "center" },
  processorActive: { shadowColor: T.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 4 },
  spinRing: { position: "absolute", width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: T.accent, borderStyle: "dashed", opacity: 0.5 },
  aiLabel: { fontFamily: FONTS.regular, fontSize: 7, fontWeight: "700", color: T.fgMute, letterSpacing: 1 },
  dotRow: { flexDirection: "row" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: T.accent, marginHorizontal: 1.5 },
  extractedCol: { flex: 1, justifyContent: "flex-start" },
  extractedRow: { flexDirection: "row", alignItems: "center", padding: 4, borderRadius: 6, borderWidth: 1, borderColor: T.border, backgroundColor: T.cardEm, minHeight: 22, marginBottom: 4 },
  txIcon: { width: 14, height: 14, borderRadius: 4, alignItems: "center", justifyContent: "center", marginRight: 5 },
  txName: { flex: 1, fontFamily: FONTS.regular, fontSize: 9, color: T.fg },
  txAmt: { fontFamily: FONTS.regular, fontSize: 9, fontWeight: "500", color: T.fg },
  aiStatus: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.fgMute, marginRight: 6 },
  statusText: { fontFamily: FONTS.regular, fontSize: 9, color: T.fgMute, letterSpacing: 0.6, flex: 1 },
  statusCount: { fontFamily: FONTS.regular, fontSize: 9, color: T.fgMute },

  // Input methods
  inputMethods: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  methodPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: T.border, backgroundColor: T.card, marginRight: 8, marginBottom: 6 },
  methodText: { fontFamily: FONTS.regular, fontSize: 10, color: T.fgDim, fontWeight: "500" },

  // Done
  doneCheck: { width: 64, height: 64, borderRadius: 32, backgroundColor: T.accentSoft, borderWidth: 1.5, borderColor: T.accent, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 20 },
  doneHead: { fontFamily: FONTS.bold, fontSize: 28, fontWeight: "500", lineHeight: 34, letterSpacing: -0.4, color: T.fg, textAlign: "center", marginBottom: 10 },
  doneSub: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 22, color: T.fgDim, textAlign: "center", maxWidth: 280, alignSelf: "center", marginBottom: 24 },
  doneStats: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: T.divider, marginBottom: 20 },
  doneStat: { fontFamily: FONTS.bold, fontSize: 22, fontWeight: "500", color: T.fg, textAlign: "center" },
  doneStatLabel: { fontFamily: FONTS.regular, fontSize: 9, fontWeight: "600", color: T.fgMute, letterSpacing: 0.6, textAlign: "center", marginTop: 3 },

  // DashboardPeek
  peekCard: { borderWidth: 1, borderColor: T.border, backgroundColor: T.cardEm, borderRadius: 16, padding: 14 },
  peekHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 },
  peekEyebrow: { fontFamily: FONTS.regular, fontSize: 9, fontWeight: "700", color: T.fgMute, letterSpacing: 1.4 },
  peekAmount: { fontFamily: FONTS.bold, fontSize: 26, fontWeight: "500", color: T.fg, letterSpacing: -0.4, lineHeight: 32, marginTop: 4 },
  peekBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: T.accentSoft },
  peekBadgeText: { fontFamily: FONTS.regular, fontSize: 10, fontWeight: "700", color: T.accent },
  peekTx: { flexDirection: "row", alignItems: "center", paddingVertical: 7 },
  peekTxBorder: { borderTopWidth: 1, borderTopColor: T.divider },
  peekIcon: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center", marginRight: 10 },
  peekMerchant: { flex: 1, fontFamily: FONTS.regular, fontSize: 13, color: T.fg },
  peekAmount2: { fontFamily: FONTS.bold, fontSize: 13, fontWeight: "500", color: T.fg },
})
