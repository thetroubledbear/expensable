import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from "react-native"
import { useAuth } from "../lib/auth"
import { apiGet, apiPost } from "../lib/api"

interface DashboardData {
  spent: number
  received: number
  net: number
  currency: string
  monthName: string
  momPct: number | null
  recentTx: Array<{
    id: string
    merchantName: string | null
    description: string | null
    type: string
    amount: number
    date: string
  }>
  topMerchants: Array<{ merchantName: string | null; amount: number; pct: number }>
  subscriptionsCount: number
  totalMonthlySubscriptions: number
  accountBalances: Array<{ id: string; name: string; type: string; currency: string; balance: number }>
  trend: Array<{ month: string; spent: number; received: number }>
  categories: Array<{ name: string; color: string; total: number }>
}

function fmt(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(0)}`
  }
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>
}

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, positive !== undefined && (positive ? styles.green : styles.red)]}>
        {value}
      </Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </Card>
  )
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [noHousehold, setNoHousehold] = useState(false)
  const [aiInsights, setAiInsights] = useState<string[] | null>(null)
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false)
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [aiQuerying, setAiQuerying] = useState(false)

  useEffect(() => { load(); loadInsights() }, [])

  async function load() {
    try {
      const res = await apiGet<{ error?: string } & Partial<DashboardData>>("/api/mobile/dashboard")
      if ("error" in res && res.error) {
        setNoHousehold(true)
      } else {
        setData(res as DashboardData)
      }
    } catch {
      setNoHousehold(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function onRefresh() {
    setRefreshing(true)
    load()
    loadInsights()
  }

  async function loadInsights() {
    setAiInsightsLoading(true)
    try {
      const res = await apiGet<{ insights?: string[]; available?: boolean }>("/api/insights/ai")
      if (res.available && res.insights && res.insights.length > 0) {
        setAiInsights(res.insights)
      }
    } catch {}
    setAiInsightsLoading(false)
  }

  async function askAI() {
    const q = aiQuestion.trim()
    if (!q || aiQuerying) return
    setAiQuerying(true)
    setAiAnswer(null)
    try {
      const res = await apiPost<{ answer?: string; error?: string }>("/api/ai/query", { question: q })
      if (res.answer) setAiAnswer(res.answer)
    } catch {}
    setAiQuerying(false)
  }

  const firstName = user?.name?.split(" ")[0] ?? "there"
  const now = new Date()
  const h = now.getHours()
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#059669" size="large" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}, {firstName}</Text>
        {data && <Text style={styles.headerSub}>{data.monthName} overview</Text>}
      </View>

      {noHousehold || !data ? (
        <Card>
          <Text style={styles.emptyText}>No data yet. Upload a file using the Upload tab to get started.</Text>
        </Card>
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Spent" value={fmt(data.spent, data.currency)} positive={false} />
            <StatCard label="Received" value={fmt(data.received, data.currency)} positive />
          </View>
          <StatCard
            label="Net"
            value={fmt(data.net, data.currency)}
            positive={data.net >= 0}
            sub={data.momPct !== null ? `${data.momPct > 0 ? "+" : ""}${data.momPct}% vs last month` : undefined}
          />

          {data.accountBalances.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Account Balances</Text>
              {data.accountBalances.map((a) => (
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

          {data.recentTx.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              {data.recentTx.map((tx) => (
                <View key={tx.id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {tx.merchantName ?? tx.description ?? "Unknown"}
                    </Text>
                    <Text style={styles.rowSub}>
                      {new Date(tx.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </Text>
                  </View>
                  <Text style={[styles.rowAmount, tx.type === "credit" ? styles.green : styles.red]}>
                    {tx.type === "credit" ? "+" : "-"}{fmt(tx.amount, data.currency)}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {data.topMerchants.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Top Spending</Text>
              {data.topMerchants.map((m, i) => (
                <View key={i} style={styles.merchantRow}>
                  <View style={styles.merchantTop}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{m.merchantName ?? "Unknown"}</Text>
                    <Text style={styles.rowAmount}>{fmt(m.amount, data.currency)}</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${m.pct}%` as `${number}%` }]} />
                  </View>
                </View>
              ))}
            </Card>
          )}

          {data.categories.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>By Category</Text>
              {(() => {
                const maxCat = Math.max(...data.categories.map((c) => c.total), 1)
                return data.categories.map((c, i) => (
                  <View key={i} style={styles.merchantRow}>
                    <View style={styles.merchantTop}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{c.name}</Text>
                      <Text style={styles.rowAmount}>{fmt(c.total, data.currency)}</Text>
                    </View>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, {
                        width: `${Math.round((c.total / maxCat) * 100)}%` as `${number}%`,
                        backgroundColor: c.color,
                      }]} />
                    </View>
                  </View>
                ))
              })()}
            </Card>
          )}

          {data.subscriptionsCount > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Subscriptions</Text>
              <View style={styles.row}>
                <Text style={styles.rowTitle}>{data.subscriptionsCount} detected</Text>
                <Text style={styles.rowAmount}>~{fmt(data.totalMonthlySubscriptions, data.currency)}/mo</Text>
              </View>
            </Card>
          )}

          <Card>
            <Text style={styles.sectionTitle}>AI Insights</Text>
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

          <Card>
            <Text style={styles.sectionTitle}>Ask AI</Text>
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
                {aiQuerying ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.askBtnText}>Ask</Text>
                )}
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

          {data.trend.length > 1 && (
            <Card>
              <Text style={styles.sectionTitle}>6-Month Trend</Text>
              <View style={styles.trendContainer}>
                {(() => {
                  const maxVal = Math.max(...data.trend.map((t) => Math.max(t.spent, t.received)), 1)
                  return data.trend.map((t, i) => (
                    <View key={i} style={styles.trendCol}>
                      <View style={styles.trendBars}>
                        <View
                          style={[
                            styles.trendBar,
                            styles.trendBarSpent,
                            { height: Math.max(4, (t.spent / maxVal) * 60) },
                          ]}
                        />
                        <View
                          style={[
                            styles.trendBar,
                            styles.trendBarReceived,
                            { height: Math.max(4, (t.received / maxVal) * 60) },
                          ]}
                        />
                      </View>
                      <Text style={styles.trendMonth}>{t.month.slice(5)}</Text>
                    </View>
                  ))
                })()}
              </View>
              <View style={styles.trendLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
                  <Text style={styles.legendText}>Spent</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#059669" }]} />
                  <Text style={styles.legendText}>Received</Text>
                </View>
              </View>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  header: { marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  headerSub: { fontSize: 13, color: "#64748b", marginTop: 2 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 2 },
  statCard: { flex: 1 },
  statLabel: { fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: "500" },
  statValue: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  statSub: { fontSize: 11, color: "#94a3b8", marginTop: 3 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  rowLeft: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 14, fontWeight: "500", color: "#0f172a" },
  rowSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  merchantRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  merchantTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  barBg: { height: 4, backgroundColor: "#f1f5f9", borderRadius: 2, overflow: "hidden" },
  barFill: { height: 4, backgroundColor: "#059669", borderRadius: 2 },
  green: { color: "#059669" },
  red: { color: "#ef4444" },
  emptyText: { color: "#64748b", textAlign: "center", fontSize: 14, lineHeight: 22 },
  trendContainer: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 8 },
  trendCol: { flex: 1, alignItems: "center", gap: 4 },
  trendBars: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 64 },
  trendBar: { width: 8, borderRadius: 3 },
  trendBarSpent: { backgroundColor: "#ef4444" },
  trendBarReceived: { backgroundColor: "#059669" },
  trendMonth: { fontSize: 10, color: "#94a3b8", fontWeight: "500" },
  trendLegend: { flexDirection: "row", gap: 16, justifyContent: "center", marginTop: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: "#64748b" },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  insightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34d399", marginTop: 5, flexShrink: 0 },
  insightText: { flex: 1, fontSize: 13, color: "#475569", lineHeight: 20 },
  askRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  askInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  askBtn: {
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 48,
  },
  askBtnDisabled: { opacity: 0.4 },
  askBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  answerBox: { marginTop: 12, backgroundColor: "#f8fafc", borderRadius: 12, padding: 12 },
  answerText: { fontSize: 13, color: "#334155", lineHeight: 20 },
  askAgain: { marginTop: 8, fontSize: 12, color: "#94a3b8" },
})
