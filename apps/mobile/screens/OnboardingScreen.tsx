import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native"
import {
  Wallet,
  UploadCloud,
  Sparkles,
  LayoutDashboard,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react-native"
import { useAuth } from "../lib/auth"
import { FONTS } from "../lib/fonts"
import { LogoMark } from "../components/LogoMark"

const { width } = Dimensions.get("window")

// ── Step visuals ──────────────────────────────────────────────────────────────

function WelcomeVisual() {
  return (
    <View style={styles.visualRow}>
      {[
        { label: "Money Out", value: "$1,842", color: "#ef4444" },
        { label: "Money In", value: "$3,200", color: "#10b981" },
        { label: "Net", value: "+$1,358", color: "#34d399" },
      ].map((c) => (
        <View key={c.label} style={styles.statCard}>
          <Text style={styles.statLabel}>{c.label}</Text>
          <Text style={[styles.statValue, { color: c.color }]}>{c.value}</Text>
        </View>
      ))}
    </View>
  )
}

function UploadVisual() {
  return (
    <View style={styles.visualRow}>
      {[
        { ext: "CSV", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
        { ext: "PDF", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
        { ext: "IMG", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
      ].map(({ ext, color, bg }) => (
        <View key={ext} style={[styles.fileCard, { backgroundColor: bg, borderColor: color + "50" }]}>
          <UploadCloud size={20} color={color} />
          <Text style={[styles.fileExt, { color }]}>{ext}</Text>
        </View>
      ))}
    </View>
  )
}

function CategorizationVisual() {
  const rows = [
    { name: "Whole Foods", cat: "Food & Drink", color: "#10b981", amount: "-$67.40" },
    { name: "Uber", cat: "Transport", color: "#6366f1", amount: "-$14.20" },
    { name: "Netflix", cat: "Bills", color: "#f59e0b", amount: "-$15.99" },
  ]
  return (
    <View style={styles.visualColumn}>
      {rows.map((r) => (
        <View key={r.name} style={styles.txRow}>
          <View style={[styles.txDot, { backgroundColor: r.color }]} />
          <Text style={styles.txName}>{r.name}</Text>
          <View style={[styles.txBadge, { backgroundColor: r.color + "22" }]}>
            <Text style={[styles.txBadgeText, { color: r.color }]}>{r.cat}</Text>
          </View>
          <Text style={styles.txAmount}>{r.amount}</Text>
        </View>
      ))}
    </View>
  )
}

function DashboardVisual() {
  const bars = [42, 68, 55, 80, 63, 91]
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartLabel}>6-month spending trend</Text>
      <View style={styles.bars}>
        {bars.map((h, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: (h / 100) * 48,
                backgroundColor: "#10b981",
                opacity: i === bars.length - 1 ? 1 : 0.45,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.chartStats}>
        <View>
          <Text style={styles.chartStatLabel}>Top merchant</Text>
          <Text style={styles.chartStatValue}>Whole Foods</Text>
        </View>
        <View>
          <Text style={styles.chartStatLabel}>Subscriptions</Text>
          <Text style={styles.chartStatValue}>4 detected</Text>
        </View>
      </View>
    </View>
  )
}

function FamilyVisual() {
  const members = [
    { initials: "You", color: "#10b981" },
    { initials: "JD", color: "#6366f1" },
    { initials: "SK", color: "#f59e0b" },
  ]
  return (
    <View style={styles.familyContainer}>
      <View style={styles.avatarRow}>
        {members.map((m, i) => (
          <View
            key={i}
            style={[styles.avatar, { backgroundColor: m.color, marginLeft: i > 0 ? -10 : 0, zIndex: members.length - i }]}
          >
            <Text style={styles.avatarText}>{m.initials}</Text>
          </View>
        ))}
        <View style={[styles.avatar, styles.avatarPlus, { marginLeft: -10 }]}>
          <Text style={styles.avatarPlusText}>+3</Text>
        </View>
      </View>
      <View style={styles.familyBadge}>
        <Users size={12} color="#34d399" />
        <Text style={styles.familyBadgeText}>Up to 6 household members</Text>
      </View>
    </View>
  )
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  {
    Icon: Wallet,
    badge: "Welcome",
    title: "Meet Expensable",
    description:
      "Your AI-powered finance tracker. Import files, auto-categorize transactions, and understand your spending — all in one place.",
    Visual: WelcomeVisual,
  },
  {
    Icon: UploadCloud,
    badge: "Step 1",
    title: "Import Any File",
    description:
      "Upload bank statements, CSV exports, PDF invoices, or snap a receipt photo. AI extracts every transaction in seconds.",
    Visual: UploadVisual,
  },
  {
    Icon: Sparkles,
    badge: "Step 2",
    title: "AI Does the Work",
    description:
      "Transactions are labelled instantly — Food, Transport, Bills, and more. Unusual entries get flagged so you stay in control.",
    Visual: CategorizationVisual,
  },
  {
    Icon: LayoutDashboard,
    badge: "Step 3",
    title: "Powerful Dashboard",
    description:
      "Spending trends, money in vs. out, top merchants, and auto-detected subscriptions — all in one view.",
    Visual: DashboardVisual,
  },
  {
    Icon: Users,
    badge: "Step 4",
    title: "Bring Your Household",
    description:
      "Invite family members to track shared expenses together. Pro and Family plans support up to 6 members.",
    Visual: FamilyVisual,
  },
]

// ── Screen ────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth()
  const [step, setStep] = useState(0)
  const [completing, setCompleting] = useState(false)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  async function handleNext() {
    if (isLast) {
      setCompleting(true)
      await completeOnboarding()
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060d1a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <LogoMark size={16} />
        </View>
        <Text style={styles.logoText}>Expensable</Text>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={async () => {
            setCompleting(true)
            await completeOnboarding()
          }}
          disabled={completing}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>

        {/* Icon badge */}
        <View style={styles.iconContainer}>
          <current.Icon size={28} color="#10b981" />
        </View>

        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{current.badge}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{current.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{current.description}</Text>

        {/* Visual */}
        <View style={styles.visualContainer}>
          <current.Visual />
        </View>
      </View>

      {/* Bottom navigation */}
      <View style={styles.bottom}>

        {/* Progress dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setStep(i)}>
              <View
                style={[
                  styles.dot,
                  i === step
                    ? styles.dotActive
                    : i < step
                    ? styles.dotDone
                    : styles.dotInactive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          {step > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={() => setStep((s) => s - 1)}>
              <ArrowLeft size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, step === 0 && styles.nextButtonFull]}
            onPress={handleNext}
            disabled={completing}
          >
            {isLast ? (
              <>
                <CheckCircle2 size={16} color="white" />
                <Text style={styles.nextButtonText}>
                  {completing ? "Starting…" : "Get started"}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.nextButtonText}>Next</Text>
                <ArrowRight size={16} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060d1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.18)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#34d399",
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "rgba(255,255,255,0.93)",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 30,
    fontFamily: FONTS.bold,
  },
  description: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  visualContainer: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: "#10b981",
  },
  dotDone: {
    width: 6,
    backgroundColor: "rgba(16,185,129,0.4)",
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
  },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#059669",
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
  // Visuals
  visualRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 80,
  },
  statLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  fileCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    gap: 6,
  },
  fileExt: {
    fontSize: 11,
    fontWeight: "700",
  },
  visualColumn: {
    width: "100%",
    gap: 8,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  txDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  txName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
  },
  txBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  txBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  txAmount: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
  },
  chartContainer: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 12,
  },
  chartLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
    marginBottom: 8,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 48,
  },
  bar: {
    flex: 1,
    borderRadius: 3,
  },
  chartStats: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
  chartStatLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
  },
  chartStatValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  familyContainer: {
    alignItems: "center",
    gap: 14,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#060d1a",
  },
  avatarText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
  },
  avatarPlus: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed",
  },
  avatarPlusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
  },
  familyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16,185,129,0.1)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  familyBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#34d399",
  },
})
