import { useCallback, useEffect, useState } from "react"
import { useFocusEffect } from "@react-navigation/native"
import { FONTS } from "../lib/fonts"
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native"
import { Text } from "../components/Text"
import { apiGet, apiDeleteById } from "../lib/api"
import { RefreshCw, Trash2 } from "lucide-react-native"

interface Subscription {
  id: string
  merchantName: string
  amount: number
  currency: string
  frequency: string
  lastSeenAt: string
  firstSeenAt: string
}

function fmt(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function freqLabel(freq: string) {
  if (freq === "monthly") return "/mo"
  if (freq === "annual") return "/yr"
  if (freq === "weekly") return "/wk"
  return `/${freq}`
}

function toMonthly(amount: number, freq: string): number {
  if (freq === "monthly") return amount
  if (freq === "annual") return amount / 12
  if (freq === "weekly") return amount * 4.33
  return amount
}

function freqBadgeColor(freq: string): string {
  if (freq === "monthly") return "#0ea5e9"
  if (freq === "annual") return "#8b5cf6"
  return "#f59e0b"
}

export default function SubscriptionsScreen() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [householdCurrency, setHouseholdCurrency] = useState("USD")

  useFocusEffect(useCallback(() => { load() }, []))

  useEffect(() => {
    apiGet<{ defaultCurrency?: string }>("/api/household")
      .then((d) => { if (d.defaultCurrency) setHouseholdCurrency(d.defaultCurrency) })
      .catch(() => {})
  }, [])

  async function load() {
    try {
      const data = await apiGet<Subscription[]>("/api/subscriptions")
      if (Array.isArray(data)) setSubs(data)
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function onRefresh() {
    setRefreshing(true)
    load()
  }

  function handleDelete(sub: Subscription) {
    Alert.alert(
      "Delete subscription?",
      "This will remove it from tracking.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(sub.id)
            try {
              await apiDeleteById("/api/subscriptions/" + sub.id)
              setSubs((prev) => prev.filter((s) => s.id !== sub.id))
            } catch {}
            finally {
              setDeletingId(null)
            }
          },
        },
      ]
    )
  }

  const monthlyTotal = subs.reduce((sum, s) => sum + toMonthly(s.amount, s.frequency), 0)
  const annualTotal = monthlyTotal * 12

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
      <Text style={styles.title}>Subscriptions</Text>

      {subs.length === 0 ? (
        <View style={styles.empty}>
          <RefreshCw color="#cbd5e1" size={36} />
          <Text style={styles.emptyTitle}>No subscriptions detected</Text>
          <Text style={styles.emptyText}>
            Recurring payments appear here once identified from your transaction history.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>MONTHLY</Text>
              <Text style={styles.summaryValue}>{fmt(monthlyTotal, householdCurrency)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>ANNUAL</Text>
              <Text style={styles.summaryValue}>{fmt(annualTotal, householdCurrency)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>COUNT</Text>
              <Text style={styles.summaryValue}>{subs.length}</Text>
            </View>
          </View>

          {subs.map((sub) => (
            <View key={sub.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.initials}>
                  <Text style={styles.initialsText}>
                    {sub.merchantName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.merchant}>{sub.merchantName}</Text>
                  <Text style={styles.meta}>
                    Since {new Date(sub.firstSeenAt).toLocaleDateString("en", { month: "short", year: "numeric" })}
                    {" · last "}
                    {new Date(sub.lastSeenAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={styles.amount}>{fmt(sub.amount, sub.currency)}</Text>
                  <View style={[styles.freqBadge, { backgroundColor: freqBadgeColor(sub.frequency) + "20" }]}>
                    <Text style={[styles.freqText, { color: freqBadgeColor(sub.frequency) }]}>
                      {freqLabel(sub.frequency)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.trashBtn}
                  onPress={() => handleDelete(sub)}
                  disabled={deletingId === sub.id}
                >
                  {deletingId === sub.id ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Trash2 color="#ef4444" size={16} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginTop: 48, marginBottom: 20, fontFamily: FONTS.bold },
  empty: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#64748b" },
  emptyText: { fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 20, maxWidth: 260 },
  summaryCard: {
    backgroundColor: "#059669",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 9, fontWeight: "700", color: "#a7f3d0", letterSpacing: 1, marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: "700", color: "#fff" },
  summaryDivider: { width: 1, height: 36, backgroundColor: "#34d399", opacity: 0.4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  initials: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { fontSize: 14, fontWeight: "700", color: "#059669" },
  cardInfo: { flex: 1 },
  merchant: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  meta: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  amountCol: { alignItems: "flex-end" },
  amount: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  freqBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  freqText: { fontSize: 11, fontWeight: "700" },
  trashBtn: { padding: 8 },
})
