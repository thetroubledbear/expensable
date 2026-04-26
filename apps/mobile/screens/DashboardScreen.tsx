import { useCallback, useEffect, useRef, useState } from "react"
import { Mic, MicOff } from "lucide-react-native"
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native"
import { Text } from "../components/Text"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition"
import { useAuth } from "../lib/auth"
import { apiGet, apiPost, apiPatch } from "../lib/api"
import { FONTS } from "../lib/fonts"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  spent: number
  received: number
  net: number
  currency: string
  monthName: string
  momPct: number | null
  recentTx: Array<{ id: string; merchantName: string | null; description: string | null; type: string; amount: number; date: string }>
  topMerchants: Array<{ merchantName: string | null; amount: number; pct: number }>
  subscriptionsCount: number
  totalMonthlySubscriptions: number
  accountBalances: Array<{ id: string; name: string; type: string; currency: string; balance: number }>
  trend: Array<{ month: string; spent: number; received: number }>
  categories: Array<{ name: string; color: string; total: number }>
}

interface HealthScoreBreakdown {
  pts: number; max: number; label: string
}
interface HealthScore {
  score: number
  grade: "A" | "B" | "C" | "D" | "F"
  breakdown: { savings: HealthScoreBreakdown; stability: HealthScoreBreakdown; subscriptions: HealthScoreBreakdown; hygiene: HealthScoreBreakdown }
}

interface Alert {
  category: string; color: string; currentSpend: number; projected: number
  lastMonth: number; overagePct: number; daysLeft: number
}

interface CategoryComparison {
  name: string; color: string; thisMonth: number; lastMonth: number
  changePct: number | null; direction: "up" | "down" | "new" | "gone"
}

interface PatternData {
  weekendVsWeekday: { weekendAvgDaily: number; weekdayAvgDaily: number; diffPct: number } | null
  topDay: { day: string; avgSpend: number; vsAvgPct: number } | null
  quietDay: { day: string; avgSpend: number; vsAvgPct: number } | null
  currency: string
  monthsAnalyzed: number
}

interface RewindScenario {
  label: string; savedAmount: number; currency: string; period: string; type: string
}

interface SocialItem {
  category: string; color: string; userMonthly: number; benchmark: number; currency: string; diffPct: number
}

interface QuickLogResult {
  merchantName: string | null; description: string; amount: number; currency: string; type: "debit" | "credit"
}

interface Tradeoff { label: string; emoji: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string, decimals = 0): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: decimals }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(decimals)}`
  }
}

const GRADE_COLOR: Record<string, string> = {
  A: "#059669", B: "#22c55e", C: "#f59e0b", D: "#f97316", F: "#ef4444",
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>
}

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleDot} />
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  )
}

function Bar({ pct, color = "#059669" }: { pct: number; color?: string }) {
  const w = `${Math.min(100, Math.max(0, pct))}%` as `${number}%`
  return (
    <View style={styles.barBg}>
      <View style={[styles.barFill, { width: w, backgroundColor: color }]} />
    </View>
  )
}

function Badge({ text, up }: { text: string; up: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: up ? "#fef2f2" : "#f0fdf4" }]}>
      <Text style={[styles.badgeText, { color: up ? "#ef4444" : "#059669" }]}>{text}</Text>
    </View>
  )
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()

  // Core data
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [noHousehold, setNoHousehold] = useState(false)

  // AI
  const [aiInsights, setAiInsights] = useState<string[] | null>(null)
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false)
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [aiQuerying, setAiQuerying] = useState(false)

  // Voice log
  type VoiceState = "idle" | "listening" | "processing" | "success" | "error"
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [voiceState, setVoiceState] = useState<VoiceState>("idle")
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const voiceTranscriptRef = useRef("")
  const [voiceResult, setVoiceResult] = useState<QuickLogResult | null>(null)
  const [voiceTradeoffs, setVoiceTradeoffs] = useState<Tradeoff[]>([])
  const [voiceError, setVoiceError] = useState("")
  const [isRecording, setIsRecording] = useState(false)

  useSpeechRecognitionEvent("start", () => { setVoiceState("listening"); setIsRecording(true) })
  useSpeechRecognitionEvent("end", () => {
    setIsRecording(false)
    setVoiceState((s) => {
      if (s !== "listening") return s
      return voiceTranscriptRef.current.trim() ? "listening" : "idle"
    })
  })
  useSpeechRecognitionEvent("result", (event) => {
    const t = event.results[0]?.transcript ?? ""
    voiceTranscriptRef.current = t
    setVoiceTranscript(t)
  })
  useSpeechRecognitionEvent("error", (event) => {
    setVoiceError(event.error === "no-speech" ? "No speech detected. Try again." : `Mic error: ${event.error}`)
    setVoiceState("error")
  })

  async function startVoice() {
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    if (!granted) {
      setVoiceError("Microphone permission denied.")
      setVoiceState("error")
      return
    }
    setVoiceTranscript("")
    setVoiceResult(null)
    setVoiceTradeoffs([])
    setVoiceError("")
    ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: false })
  }

  function stopVoice() {
    ExpoSpeechRecognitionModule.stop()
  }

  async function submitVoiceText(text: string) {
    try {
      const res = await apiPost<{ transaction?: QuickLogResult; error?: string }>(
        "/api/transactions/voice",
        { transcript: text }
      )
      if (res.error || !res.transaction) {
        setVoiceError(res.error ?? "Could not understand that")
        setVoiceState("error")
      } else {
        setVoiceResult(res.transaction)
        setVoiceState("success")
        apiGet<{ tradeoffs?: Tradeoff[] }>(`/api/insights/tradeoffs?amount=${res.transaction.amount}`)
          .then((r) => { if (r.tradeoffs?.length) setVoiceTradeoffs(r.tradeoffs) })
          .catch(() => {})
      }
    } catch {
      setVoiceError("Network error. Check connection.")
      setVoiceState("error")
    }
  }

  async function submitVoice() {
    const text = voiceTranscript.trim()
    if (!text) return
    stopVoice()
    setVoiceState("processing")
    await submitVoiceText(text)
  }

  function resetVoice() {
    stopVoice()
    setVoiceState("idle")
    setIsRecording(false)
    voiceTranscriptRef.current = ""
    setVoiceTranscript("")
    setVoiceResult(null)
    setVoiceTradeoffs([])
    setVoiceError("")
  }

  function closeVoice() {
    resetVoice()
    setVoiceOpen(false)
  }

  // Insights
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [comparison, setComparison] = useState<CategoryComparison[]>([])
  const [patterns, setPatterns] = useState<PatternData | null>(null)
  const [rewind, setRewind] = useState<RewindScenario[]>([])
  const [socialData, setSocialData] = useState<{ optIn: boolean; comparisons?: SocialItem[] } | null>(null)
  const [socialOptInLoading, setSocialOptInLoading] = useState(false)

  // Reload core stats whenever this tab comes into focus (picks up changes from other screens)
  useFocusEffect(useCallback(() => { load() }, []))

  // Load insights + extras once on mount — they're heavy and don't need per-focus refresh
  useEffect(() => {
    loadInsights()
    loadExtras()
  }, [])

  async function load() {
    try {
      const res = await apiGet<{ error?: string } & Partial<DashboardData>>("/api/mobile/dashboard")
      if ("error" in res && res.error) setNoHousehold(true)
      else setData(res as DashboardData)
    } catch {
      setNoHousehold(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function loadInsights() {
    setAiInsightsLoading(true)
    try {
      const res = await apiGet<{ insights?: string[]; available?: boolean }>("/api/insights/ai")
      if (res.available && res.insights?.length) setAiInsights(res.insights)
    } catch {}
    setAiInsightsLoading(false)
  }

  async function loadExtras() {
    await Promise.allSettled([
      apiGet<Alert[]>("/api/insights/predictions").then((r) => { if (Array.isArray(r)) setAlerts(r) }),
      apiGet<HealthScore>("/api/dashboard/health-score").then((r) => { if (r.score !== undefined) setHealthScore(r) }),
      apiGet<CategoryComparison[]>("/api/insights/spending-comparison").then((r) => { if (Array.isArray(r)) setComparison(r) }),
      apiGet<PatternData>("/api/insights/patterns").then((r) => { if (r.monthsAnalyzed !== undefined) setPatterns(r) }),
      apiGet<RewindScenario[]>("/api/insights/rewind").then((r) => { if (Array.isArray(r)) setRewind(r) }),
      apiGet<{ optIn: boolean; comparisons?: SocialItem[] }>("/api/insights/social-comparison").then((r) => { if (r.optIn !== undefined) setSocialData(r) }),
    ])
  }

  function onRefresh() {
    setRefreshing(true)
    load()
    loadInsights()
    loadExtras()
  }

  async function askAI() {
    const q = aiQuestion.trim()
    if (!q || aiQuerying) return
    setAiQuerying(true)
    setAiAnswer(null)
    try {
      const res = await apiPost<{ answer?: string }>("/api/ai/query", { question: q })
      if (res.answer) setAiAnswer(res.answer)
    } catch {}
    setAiQuerying(false)
  }

  async function enableSocialComparison() {
    setSocialOptInLoading(true)
    try {
      await apiPatch("/api/household", { socialComparison: true })
      const r = await apiGet<{ optIn: boolean; comparisons?: SocialItem[] }>("/api/insights/social-comparison")
      setSocialData(r)
    } catch {}
    setSocialOptInLoading(false)
  }

  const firstName = user?.name?.split(" ")[0] ?? "there"
  const h = new Date().getHours()
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: "#0f172a" }]}>
        <ActivityIndicator color="#34d399" size="large" />
      </View>
    )
  }

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.category))
  const hasData = !noHousehold && data !== null

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34d399" />}
    >
      {/* ── Dark hero header ── */}
      <View style={[styles.heroWrap, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <Text style={styles.greeting}>
          {greeting},{" "}
          <Text style={styles.greetingAccent}>{firstName}</Text>
        </Text>
        {data && <Text style={styles.headerSub}>{data.monthName} overview</Text>}

        {hasData && (
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>SPENT</Text>
              <Text style={[styles.heroStatValue, { color: "#f87171" }]}>{fmt(data!.spent, data!.currency)}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>NET</Text>
              <Text style={[styles.heroStatValue, data!.net >= 0 ? styles.heroGreen : { color: "#f87171" }]}>
                {fmt(data!.net, data!.currency)}
              </Text>
              {data!.momPct !== null && (
                <Text style={styles.heroStatSub}>
                  {data!.momPct > 0 ? "+" : ""}{data!.momPct}% vs last mo
                </Text>
              )}
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>IN</Text>
              <Text style={[styles.heroStatValue, styles.heroGreen]}>{fmt(data!.received, data!.currency)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Light content area ── */}
      <View style={styles.lightContent}>

        {/* ── Predictive alerts ── */}
        {visibleAlerts.map((alert) => (
          <View key={alert.category} style={styles.alertCard}>
            <View style={styles.alertContent}>
              <Text style={styles.alertEmoji}>⚠️</Text>
              <Text style={styles.alertText}>
                <Text style={styles.alertBold}>{alert.category}: </Text>
                at this pace you'll spend {fmt(alert.projected, alert.currency)} this month — {alert.overagePct}% more than last month.
                {alert.daysLeft > 0 ? ` ${alert.daysLeft} day${alert.daysLeft !== 1 ? "s" : ""} left.` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setDismissedAlerts((prev) => new Set(prev).add(alert.category))}>
              <Text style={styles.alertDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* ── Voice Log button ── */}
        <TouchableOpacity style={styles.voiceLogBtn} onPress={() => setVoiceOpen(true)}>
          <View style={styles.voiceLogBtnIconWrap}>
            <Mic size={20} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.voiceLogBtnText}>Voice Log</Text>
            <Text style={styles.voiceLogBtnHint}>Tap to log by voice</Text>
          </View>
        </TouchableOpacity>

        {/* ── Voice Log modal ── */}
        <Modal visible={voiceOpen} transparent animationType="fade" onRequestClose={closeVoice}>
          <Pressable style={styles.modalOverlay} onPress={closeVoice}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Voice log</Text>
                <TouchableOpacity onPress={closeVoice}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {voiceState === "idle" && (
                <View style={styles.voiceCenter}>
                  <Text style={styles.voiceHint}>Say something like{"\n"}<Text style={styles.voiceHintItalic}>"I spent 12 euros on lunch"</Text></Text>
                  <TouchableOpacity style={styles.micBtn} onPress={startVoice}>
                    <Mic size={28} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.micTapHint}>Tap to start</Text>
                </View>
              )}

              {voiceState === "listening" && (
                <View style={styles.voiceCenter}>
                  <View style={[styles.micBtn, isRecording ? styles.micBtnActive : styles.micBtnReview]}>
                    {isRecording ? <MicOff size={28} color="#fff" /> : <Mic size={28} color="#fff" />}
                  </View>
                  <Text style={styles.listeningLabel}>{isRecording ? "LISTENING…" : "REVIEW"}</Text>
                  <Text style={styles.transcriptText}>{voiceTranscript || "Speak now…"}</Text>
                  <View style={styles.voiceActions}>
                    <TouchableOpacity style={styles.voiceSecondaryBtn} onPress={resetVoice}>
                      <Text style={styles.voiceSecondaryBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.voicePrimaryBtn, !voiceTranscript.trim() && styles.askBtnDisabled]}
                      disabled={!voiceTranscript.trim()}
                      onPress={submitVoice}
                    >
                      <Text style={styles.voicePrimaryBtnText}>Log it</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {voiceState === "processing" && (
                <View style={styles.voiceCenter}>
                  <ActivityIndicator color="#059669" size="large" style={{ marginBottom: 12 }} />
                  <Text style={styles.processingLabel}>Logging transaction…</Text>
                  <Text style={styles.processingTranscript}>"{voiceTranscript}"</Text>
                </View>
              )}

              {voiceState === "success" && voiceResult && (
                <View>
                  <View style={styles.successHeader}>
                    <Text style={styles.successCheck}>✅</Text>
                    <Text style={styles.successLabel}>Transaction logged</Text>
                  </View>
                  <View style={styles.resultCard}>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultKey}>Amount</Text>
                      <Text style={styles.resultVal}>
                        {voiceResult.type === "debit" ? "-" : "+"}{fmt(voiceResult.amount, voiceResult.currency, 2)}
                      </Text>
                    </View>
                    {voiceResult.merchantName && (
                      <View style={styles.resultRow}>
                        <Text style={styles.resultKey}>Merchant</Text>
                        <Text style={styles.resultVal}>{voiceResult.merchantName}</Text>
                      </View>
                    )}
                    <View style={styles.resultRow}>
                      <Text style={styles.resultKey}>Description</Text>
                      <Text style={[styles.resultVal, { flex: 1, textAlign: "right" }]}>{voiceResult.description}</Text>
                    </View>
                  </View>
                  {voiceTradeoffs.length > 0 && (
                    <View style={styles.tradeoffRow}>
                      <Text style={styles.tradeoffLabel}>{"That's about…"}</Text>
                      <View style={styles.tradeoffTags}>
                        {voiceTradeoffs.map((t) => (
                          <View key={t.label} style={styles.tradeoffTag}>
                            <Text style={styles.tradeoffTagText}>{t.emoji} {t.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  <View style={styles.voiceActions}>
                    <TouchableOpacity style={styles.voiceSecondaryBtn} onPress={resetVoice}>
                      <Text style={styles.voiceSecondaryBtnText}>Log another</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.voicePrimaryBtn} onPress={closeVoice}>
                      <Text style={styles.voicePrimaryBtnText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {voiceState === "error" && (
                <View style={styles.voiceCenter}>
                  <Text style={styles.voiceErrorText}>{voiceError}</Text>
                  <TouchableOpacity style={styles.voiceSecondaryBtn} onPress={resetVoice}>
                    <Text style={styles.voiceSecondaryBtnText}>Try again</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {!hasData ? (
          <Card><Text style={styles.emptyText}>No data yet. Upload a file using the Upload tab.</Text></Card>
        ) : (
          <>
            {/* ── Account balances ── */}
            {data!.accountBalances.length > 0 && (
              <Card>
                <SectionTitle>Account Balances</SectionTitle>
                {data!.accountBalances.map((a) => (
                  <View key={a.id} style={styles.row}>
                    <View>
                      <Text style={styles.rowTitle}>{a.name}</Text>
                      <Text style={styles.rowSub}>{a.type}</Text>
                    </View>
                    <Text style={[styles.rowAmount, a.balance >= 0 ? styles.green : styles.red]}>
                      {fmt(a.balance, a.currency)}
                    </Text>
                  </View>
                ))}
              </Card>
            )}

            {/* ── Recent transactions ── */}
            {data!.recentTx.length > 0 && (
              <Card>
                <SectionTitle>Recent Transactions</SectionTitle>
                {data!.recentTx.map((tx) => (
                  <View key={tx.id} style={styles.row}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{tx.merchantName ?? tx.description ?? "Unknown"}</Text>
                      <Text style={styles.rowSub}>{new Date(tx.date).toLocaleDateString("en", { month: "short", day: "numeric" })}</Text>
                    </View>
                    <Text style={[styles.rowAmount, tx.type === "credit" ? styles.green : styles.red]}>
                      {tx.type === "credit" ? "+" : "-"}{fmt(tx.amount, data!.currency)}
                    </Text>
                  </View>
                ))}
              </Card>
            )}

            {/* ── Top spending ── */}
            {data!.topMerchants.length > 0 && (
              <Card>
                <SectionTitle>Top Spending</SectionTitle>
                {data!.topMerchants.map((m, i) => (
                  <View key={i} style={styles.merchantRow}>
                    <View style={styles.merchantTop}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{m.merchantName ?? "Unknown"}</Text>
                      <Text style={styles.rowAmount}>{fmt(m.amount, data!.currency)}</Text>
                    </View>
                    <Bar pct={m.pct} />
                  </View>
                ))}
              </Card>
            )}

            {/* ── By category ── */}
            {data!.categories.length > 0 && (
              <Card>
                <SectionTitle>By Category</SectionTitle>
                {(() => {
                  const maxCat = Math.max(...data!.categories.map((c) => c.total), 1)
                  return data!.categories.map((c, i) => (
                    <View key={i} style={styles.merchantRow}>
                      <View style={styles.merchantTop}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{c.name}</Text>
                        <Text style={styles.rowAmount}>{fmt(c.total, data!.currency)}</Text>
                      </View>
                      <Bar pct={Math.round((c.total / maxCat) * 100)} color={c.color} />
                    </View>
                  ))
                })()}
              </Card>
            )}

            {/* ── Subscriptions ── */}
            {data!.subscriptionsCount > 0 && (
              <Card>
                <SectionTitle>Subscriptions</SectionTitle>
                <View style={styles.row}>
                  <Text style={styles.rowTitle}>{data!.subscriptionsCount} detected</Text>
                  <Text style={styles.rowAmount}>~{fmt(data!.totalMonthlySubscriptions, data!.currency)}/mo</Text>
                </View>
              </Card>
            )}

            {/* ── Health score ── */}
            {healthScore && (
              <Card>
                <SectionTitle>Financial Health</SectionTitle>
                <View style={styles.healthRow}>
                  <View style={[styles.scoreRing, { borderColor: GRADE_COLOR[healthScore.grade] ?? "#94a3b8" }]}>
                    <Text style={[styles.scoreNum, { color: GRADE_COLOR[healthScore.grade] }]}>{healthScore.score}</Text>
                    <Text style={[styles.scoreGrade, { color: GRADE_COLOR[healthScore.grade] }]}>{healthScore.grade}</Text>
                  </View>
                  <View style={styles.healthBars}>
                    {Object.values(healthScore.breakdown).map((b) => (
                      <View key={b.label} style={styles.healthBarRow}>
                        <Text style={styles.healthBarLabel}>{b.label}</Text>
                        <View style={styles.healthBarTrack}>
                          <View style={[styles.healthBarFill, { width: `${Math.round((b.pts / b.max) * 100)}%` as `${number}%` }]} />
                        </View>
                        <Text style={styles.healthBarPts}>{b.pts}/{b.max}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Card>
            )}

            {/* ── Spending vs last month ── */}
            {comparison.length > 0 && (
              <Card>
                <SectionTitle>Spending vs Last Month</SectionTitle>
                {comparison.map((item) => (
                  <View key={item.name} style={styles.compRow}>
                    <View style={[styles.dot, { backgroundColor: item.color }]} />
                    <Text style={styles.compName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.compAmount}>{fmt(item.thisMonth, data!.currency)}</Text>
                    {item.direction === "new" && <View style={styles.badgeNew}><Text style={styles.badgeNewText}>new</Text></View>}
                    {item.direction === "gone" && <View style={styles.badgeGone}><Text style={styles.badgeGoneText}>gone</Text></View>}
                    {item.changePct !== null && item.direction === "up" && <Badge text={`+${item.changePct}%`} up />}
                    {item.changePct !== null && item.direction === "down" && <Badge text={`${item.changePct}%`} up={false} />}
                  </View>
                ))}
              </Card>
            )}

            {/* ── Life patterns ── */}
            {patterns && (patterns.weekendVsWeekday || patterns.topDay || patterns.quietDay) && (
              <Card>
                <SectionTitle>Spending Patterns</SectionTitle>
                {patterns.weekendVsWeekday && (
                  <View style={styles.patternRow}>
                    <Text style={styles.patternEmoji}>{patterns.weekendVsWeekday.diffPct > 0 ? "📈" : "📉"}</Text>
                    <Text style={styles.patternText}>
                      You spend{" "}
                      <Text style={styles.patternBold}>{Math.abs(patterns.weekendVsWeekday.diffPct)}% {patterns.weekendVsWeekday.diffPct > 0 ? "more" : "less"}</Text>
                      {" "}on weekends than weekdays
                    </Text>
                  </View>
                )}
                {patterns.topDay && (
                  <View style={styles.patternRow}>
                    <Text style={styles.patternEmoji}>💸</Text>
                    <Text style={styles.patternText}>
                      <Text style={styles.patternBold}>{patterns.topDay.day}s</Text> are your biggest spending day (+{patterns.topDay.vsAvgPct}% vs average)
                    </Text>
                  </View>
                )}
                {patterns.quietDay && (
                  <View style={styles.patternRow}>
                    <Text style={styles.patternEmoji}>😌</Text>
                    <Text style={styles.patternText}>
                      <Text style={styles.patternBold}>{patterns.quietDay.day}s</Text> you spend the least ({patterns.quietDay.vsAvgPct}% vs average)
                    </Text>
                  </View>
                )}
              </Card>
            )}

            {/* ── Financial rewind ── */}
            {rewind.length > 0 && (
              <Card>
                <SectionTitle>Financial Rewind</SectionTitle>
                <Text style={styles.rewindHeader}>💡 What could have been…</Text>
                {rewind.map((s) => (
                  <View key={s.label} style={styles.rewindRow}>
                    <View style={styles.rewindLeft}>
                      <Text style={styles.rewindLabel}>{s.label}</Text>
                      <Text style={styles.rewindPeriod}>{s.period}</Text>
                    </View>
                    <Text style={styles.rewindAmount}>{fmt(s.savedAmount, s.currency)}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* ── Social comparison ── */}
            {socialData !== null && (
              <Card>
                <SectionTitle>How You Compare</SectionTitle>
                {!socialData.optIn ? (
                  <View>
                    <Text style={styles.socialOptInText}>
                      Compare your spending with people like you — anonymized averages from similar households.
                    </Text>
                    <TouchableOpacity
                      onPress={enableSocialComparison}
                      disabled={socialOptInLoading}
                      style={[styles.socialOptInBtn, socialOptInLoading && styles.askBtnDisabled]}
                    >
                      {socialOptInLoading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.socialOptInBtnText}>Enable comparison</Text>}
                    </TouchableOpacity>
                  </View>
                ) : socialData.comparisons && socialData.comparisons.length > 0 ? (
                  socialData.comparisons.map((item) => {
                    const maxVal = Math.max(item.userMonthly, item.benchmark, 1)
                    return (
                      <View key={item.category} style={styles.socialRow}>
                        <View style={styles.socialRowHeader}>
                          <View style={styles.compRow}>
                            <View style={[styles.dot, { backgroundColor: item.color }]} />
                            <Text style={styles.compName}>{item.category}</Text>
                          </View>
                          {item.diffPct > 0
                            ? <Badge text={`+${item.diffPct}% more`} up />
                            : item.diffPct < 0
                            ? <Badge text={`${item.diffPct}% below`} up={false} />
                            : <View style={styles.badgeGone}><Text style={styles.badgeGoneText}>on par</Text></View>}
                        </View>
                        <View style={styles.socialBars}>
                          <View style={styles.socialBarRow}>
                            <Text style={styles.socialBarLabel}>You</Text>
                            <View style={styles.socialBarTrack}>
                              <View style={[styles.socialBarFill, { width: `${Math.round((item.userMonthly / maxVal) * 100)}%` as `${number}%`, backgroundColor: "#64748b" }]} />
                            </View>
                            <Text style={styles.socialBarAmt}>{fmt(item.userMonthly, item.currency)}</Text>
                          </View>
                          <View style={styles.socialBarRow}>
                            <Text style={styles.socialBarLabel}>Avg</Text>
                            <View style={styles.socialBarTrack}>
                              <View style={[styles.socialBarFill, { width: `${Math.round((item.benchmark / maxVal) * 100)}%` as `${number}%`, backgroundColor: "#059669" }]} />
                            </View>
                            <Text style={styles.socialBarAmt}>{fmt(item.benchmark, item.currency)}</Text>
                          </View>
                        </View>
                      </View>
                    )
                  })
                ) : (
                  <Text style={styles.rowSub}>Not enough data yet — upload more transactions</Text>
                )}
              </Card>
            )}

            {/* ── AI insights ── */}
            <Card>
              <SectionTitle>AI Insights</SectionTitle>
              {aiInsightsLoading ? (
                <ActivityIndicator color="#059669" style={{ marginVertical: 8 }} />
              ) : aiInsights ? (
                aiInsights.map((insight, i) => (
                  <View key={i} style={styles.insightRow}>
                    <View style={styles.insightDot} />
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.rowSub}>Not enough data yet or AI unavailable</Text>
              )}
            </Card>

            {/* ── Ask AI ── */}
            <Card>
              <SectionTitle>Ask AI</SectionTitle>
              <View style={styles.askRow}>
                <TextInput
                  style={styles.askInput}
                  value={aiQuestion}
                  onChangeText={setAiQuestion}
                  placeholder="Ask about your spending…"
                  placeholderTextColor="#94a3b8"
                  onSubmitEditing={askAI}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  onPress={askAI}
                  disabled={aiQuerying || !aiQuestion.trim()}
                  style={[styles.askBtn, (aiQuerying || !aiQuestion.trim()) && styles.askBtnDisabled]}
                >
                  {aiQuerying ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.askBtnText}>Ask</Text>}
                </TouchableOpacity>
              </View>
              {aiAnswer && (
                <View style={styles.answerBox}>
                  <Text style={styles.answerText}>{aiAnswer}</Text>
                  <TouchableOpacity onPress={() => { setAiAnswer(null); setAiQuestion("") }}>
                    <Text style={styles.askAgain}>Ask another question</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>

            {/* ── 6-month trend ── */}
            {data!.trend.length > 1 && (
              <Card>
                <SectionTitle>6-Month Trend</SectionTitle>
                <View style={styles.trendContainer}>
                  {(() => {
                    const maxVal = Math.max(...data!.trend.map((t) => Math.max(t.spent, t.received)), 1)
                    return data!.trend.map((t, i) => (
                      <View key={i} style={styles.trendCol}>
                        <View style={styles.trendBars}>
                          <View style={[styles.trendBar, styles.trendBarSpent, { height: Math.max(4, (t.spent / maxVal) * 64) }]} />
                          <View style={[styles.trendBar, styles.trendBarReceived, { height: Math.max(4, (t.received / maxVal) * 64) }]} />
                        </View>
                        <Text style={styles.trendMonth}>{t.month.slice(5)}</Text>
                      </View>
                    ))
                  })()}
                </View>
                <View style={styles.trendLegend}>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#f87171" }]} /><Text style={styles.legendText}>Spent</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#34d399" }]} /><Text style={styles.legendText}>Received</Text></View>
                </View>
              </Card>
            )}
          </>
        )}
      </View>
    </ScrollView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Hero header
  heroWrap: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: "#e2e8f0",
    fontFamily: FONTS.bold,
    marginBottom: 3,
  },
  greetingAccent: { color: "#34d399", fontFamily: FONTS.bold },
  headerSub: { fontSize: 13, color: "#475569", fontFamily: FONTS.regular },
  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroStatItem: { flex: 1, alignItems: "center", paddingVertical: 16 },
  heroStatLabel: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
    fontFamily: FONTS.bold,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: FONTS.bold,
  },
  heroStatSub: {
    fontSize: 10,
    color: "#475569",
    marginTop: 3,
    fontFamily: FONTS.regular,
  },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 12 },
  heroGreen: { color: "#34d399" },

  // Light content area
  lightContent: { padding: 16, paddingTop: 14 },

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },

  // Section titles
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 },
  sectionTitleDot: { width: 3, height: 14, backgroundColor: "#059669", borderRadius: 2 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontFamily: FONTS.bold,
  },

  // Rows
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  rowLeft: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 14, fontWeight: "500", color: "#0f172a", fontFamily: FONTS.regular },
  rowSub: { fontSize: 12, color: "#94a3b8", marginTop: 2, fontFamily: FONTS.regular },
  rowAmount: { fontSize: 14, fontWeight: "600", color: "#0f172a", fontFamily: FONTS.bold },
  merchantRow: { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  merchantTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },

  // Bar
  barBg: { height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },

  // Colors
  green: { color: "#059669" },
  red: { color: "#ef4444" },
  emptyText: { color: "#64748b", textAlign: "center", fontSize: 14, lineHeight: 22, fontFamily: FONTS.regular },

  // Alert
  alertCard: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fffbeb", borderColor: "#fde68a", borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10, gap: 8 },
  alertContent: { flex: 1, flexDirection: "row", gap: 8, alignItems: "flex-start" },
  alertEmoji: { fontSize: 16, marginTop: 1 },
  alertText: { flex: 1, fontSize: 12, color: "#92400e", lineHeight: 18, fontFamily: FONTS.regular },
  alertBold: { fontWeight: "700", fontFamily: FONTS.bold },
  alertDismiss: { fontSize: 14, color: "#d97706", padding: 2, fontFamily: FONTS.regular },

  // Voice log button
  voiceLogBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  voiceLogBtnIconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  voiceLogBtnText: { fontSize: 15, fontWeight: "600", color: "#059669", fontFamily: FONTS.bold },
  voiceLogBtnHint: { fontSize: 11, color: "#94a3b8", marginTop: 1, fontFamily: FONTS.regular },

  // Voice modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 20, width: "100%", maxWidth: 420, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 28, elevation: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: "600", color: "#0f172a", fontFamily: FONTS.bold },
  modalClose: { fontSize: 18, color: "#94a3b8", padding: 4, fontFamily: FONTS.regular },
  voiceCenter: { alignItems: "center", paddingVertical: 16 },
  voiceHint: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 20, lineHeight: 20, fontFamily: FONTS.regular },
  voiceHintItalic: { fontStyle: "italic", color: "#334155", fontFamily: FONTS.regular },
  micBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#059669", alignItems: "center", justifyContent: "center", shadowColor: "#059669", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8, marginBottom: 10 },
  micBtnActive: { backgroundColor: "#ef4444", shadowColor: "#ef4444" },
  micBtnReview: { backgroundColor: "#0f172a", shadowColor: "#0f172a" },
  micTapHint: { fontSize: 11, color: "#94a3b8", fontFamily: FONTS.regular },
  listeningLabel: { fontSize: 10, color: "#94a3b8", letterSpacing: 1.5, fontWeight: "600", marginBottom: 10, fontFamily: FONTS.bold },
  transcriptText: { fontSize: 14, color: "#334155", fontStyle: "italic", textAlign: "center", marginBottom: 16, minHeight: 40, paddingHorizontal: 8, lineHeight: 22, fontFamily: FONTS.regular },
  processingLabel: { fontSize: 14, color: "#64748b", fontFamily: FONTS.regular },
  processingTranscript: { fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginTop: 4, fontFamily: FONTS.regular },
  successHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  successCheck: { fontSize: 18 },
  successLabel: { fontSize: 14, fontWeight: "500", color: "#059669", fontFamily: FONTS.regular },
  resultCard: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, marginBottom: 10 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  resultKey: { fontSize: 12, color: "#94a3b8", fontFamily: FONTS.regular },
  resultVal: { fontSize: 13, fontWeight: "600", color: "#0f172a", fontFamily: FONTS.bold },
  voiceActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  voiceSecondaryBtn: { flex: 1, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingVertical: 11, alignItems: "center" },
  voiceSecondaryBtnText: { fontSize: 13, color: "#64748b", fontFamily: FONTS.regular },
  voicePrimaryBtn: { flex: 1, backgroundColor: "#059669", borderRadius: 12, paddingVertical: 11, alignItems: "center" },
  voicePrimaryBtnText: { fontSize: 13, fontWeight: "600", color: "#fff", fontFamily: FONTS.bold },
  voiceErrorText: { fontSize: 13, color: "#ef4444", textAlign: "center", marginBottom: 16, fontFamily: FONTS.regular },

  // Trade-offs
  tradeoffRow: { marginBottom: 10 },
  tradeoffLabel: { fontSize: 11, color: "#94a3b8", marginBottom: 6, fontFamily: FONTS.regular },
  tradeoffTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tradeoffTag: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tradeoffTagText: { fontSize: 12, color: "#475569", fontFamily: FONTS.regular },

  // Ask AI
  askRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  askInput: { flex: 1, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: "#0f172a", backgroundColor: "#f8fafc", fontFamily: FONTS.regular },
  askBtn: { backgroundColor: "#059669", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, justifyContent: "center", alignItems: "center", minWidth: 52 },
  askBtnDisabled: { opacity: 0.4 },
  askBtnText: { color: "#fff", fontWeight: "600", fontSize: 13, fontFamily: FONTS.bold },
  answerBox: { marginTop: 12, backgroundColor: "#f8fafc", borderRadius: 12, padding: 12 },
  answerText: { fontSize: 13, color: "#334155", lineHeight: 20, fontFamily: FONTS.regular },
  askAgain: { marginTop: 8, fontSize: 12, color: "#94a3b8", fontFamily: FONTS.regular },

  // Health score
  healthRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  scoreRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  scoreNum: { fontSize: 26, fontWeight: "700", fontFamily: FONTS.bold },
  scoreGrade: { fontSize: 14, fontWeight: "600", fontFamily: FONTS.bold },
  healthBars: { flex: 1, gap: 8 },
  healthBarRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  healthBarLabel: { fontSize: 10, color: "#64748b", width: 68, flexShrink: 0, fontFamily: FONTS.regular },
  healthBarTrack: { flex: 1, height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  healthBarFill: { height: 6, backgroundColor: "#059669", borderRadius: 3 },
  healthBarPts: { fontSize: 10, color: "#64748b", width: 28, textAlign: "right", fontFamily: FONTS.regular },

  // Comparison
  compRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, paddingVertical: 5 },
  compName: { flex: 1, fontSize: 13, color: "#0f172a", fontWeight: "500", fontFamily: FONTS.regular },
  compAmount: { fontSize: 12, color: "#64748b", marginRight: 4, fontFamily: FONTS.regular },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  badge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "600", fontFamily: FONTS.bold },
  badgeNew: { backgroundColor: "#f5f3ff", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeNewText: { fontSize: 11, fontWeight: "600", color: "#7c3aed", fontFamily: FONTS.bold },
  badgeGone: { backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeGoneText: { fontSize: 11, color: "#64748b", fontFamily: FONTS.regular },

  // Patterns
  patternRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  patternEmoji: { fontSize: 18 },
  patternText: { flex: 1, fontSize: 13, color: "#475569", lineHeight: 20, fontFamily: FONTS.regular },
  patternBold: { fontWeight: "700", color: "#0f172a", fontFamily: FONTS.bold },

  // Rewind
  rewindHeader: { fontSize: 11, color: "#94a3b8", fontStyle: "italic", marginBottom: 10, fontFamily: FONTS.regular },
  rewindRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderLeftWidth: 3, borderLeftColor: "#d1fae5", paddingLeft: 10, marginBottom: 6 },
  rewindLeft: { flex: 1, marginRight: 8 },
  rewindLabel: { fontSize: 13, color: "#334155", fontWeight: "500", fontFamily: FONTS.regular },
  rewindPeriod: { fontSize: 11, color: "#94a3b8", marginTop: 2, fontFamily: FONTS.regular },
  rewindAmount: { fontSize: 16, fontWeight: "700", color: "#059669", fontFamily: FONTS.bold },

  // Social comparison
  socialOptInText: { fontSize: 13, color: "#64748b", lineHeight: 20, marginBottom: 12, fontFamily: FONTS.regular },
  socialOptInBtn: { backgroundColor: "#059669", borderRadius: 12, paddingVertical: 11, alignItems: "center" },
  socialOptInBtnText: { color: "#fff", fontWeight: "600", fontSize: 14, fontFamily: FONTS.bold },
  socialRow: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  socialRowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  socialBars: { gap: 5 },
  socialBarRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  socialBarLabel: { fontSize: 10, color: "#94a3b8", width: 24, fontFamily: FONTS.regular },
  socialBarTrack: { flex: 1, height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  socialBarFill: { height: 6, borderRadius: 3 },
  socialBarAmt: { fontSize: 10, color: "#64748b", width: 48, textAlign: "right", fontFamily: FONTS.regular },

  // AI
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  insightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34d399", marginTop: 5, flexShrink: 0 },
  insightText: { flex: 1, fontSize: 13, color: "#475569", lineHeight: 20, fontFamily: FONTS.regular },

  // Trend
  trendContainer: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 8 },
  trendCol: { flex: 1, alignItems: "center", gap: 4 },
  trendBars: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 68 },
  trendBar: { width: 9, borderRadius: 4 },
  trendBarSpent: { backgroundColor: "#f87171" },
  trendBarReceived: { backgroundColor: "#34d399" },
  trendMonth: { fontSize: 10, color: "#94a3b8", fontWeight: "500", fontFamily: FONTS.regular },
  trendLegend: { flexDirection: "row", gap: 16, justifyContent: "center", marginTop: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: "#64748b", fontFamily: FONTS.regular },
})
