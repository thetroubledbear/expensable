import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { useAuth } from "../lib/auth"
import { apiGet } from "../lib/api"

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

  useEffect(() => { load() }, [])

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
          <Text style={styles.emptyText}>No data yet. Upload a file on the web to get started.</Text>
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

          {data.subscriptionsCount > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Subscriptions</Text>
              <View style={styles.row}>
                <Text style={styles.rowTitle}>{data.subscriptionsCount} detected</Text>
                <Text style={styles.rowAmount}>~{fmt(data.totalMonthlySubscriptions, data.currency)}/mo</Text>
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
})
