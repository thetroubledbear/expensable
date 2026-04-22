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
import { apiGet } from "../lib/api"
import { Search, X } from "lucide-react-native"

interface Transaction {
  id: string
  merchantName: string | null
  description: string | null
  type: "debit" | "credit"
  amount: number
  date: string
  category: { id: string; name: string; color: string } | null
  needsReview: boolean
}

interface ApiResponse {
  data: Transaction[]
  total: number
  page: number
  totalPages: number
}

function fmt(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export default function TransactionsScreen() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<"" | "debit" | "credit">("")

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debouncedSearch, typeFilter])

  useEffect(() => { load() }, [debouncedSearch, typeFilter, page])

  async function load() {
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (typeFilter) params.set("type", typeFilter)
      const res = await apiGet<ApiResponse>(`/api/transactions?${params}`)
      if ("data" in res) setData(res)
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

  const currency = "USD"

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search color="#94a3b8" size={16} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X color="#94a3b8" size={16} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        <View style={styles.filters}>
          {(["", "debit", "credit"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, typeFilter === f && styles.filterBtnActive]}
              onPress={() => setTypeFilter(f)}
            >
              <Text style={[styles.filterText, typeFilter === f && styles.filterTextActive]}>
                {f === "" ? "All" : f === "debit" ? "Expenses" : "Income"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color="#059669" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        >
          {!data?.data.length ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          ) : (
            data.data.map((tx) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.typeDot, tx.type === "credit" ? styles.dotGreen : styles.dotRed]} />
                <View style={styles.txInfo}>
                  <Text style={styles.txName} numberOfLines={1}>
                    {tx.merchantName ?? tx.description ?? "Unknown"}
                  </Text>
                  <Text style={styles.txMeta}>
                    {new Date(tx.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                    {tx.category ? ` · ${tx.category.name}` : ""}
                    {tx.needsReview ? " · ⚠ Review" : ""}
                  </Text>
                </View>
                <Text style={[styles.txAmount, tx.type === "credit" ? styles.green : styles.dark]}>
                  {tx.type === "credit" ? "+" : "-"}{fmt(tx.amount, currency)}
                </Text>
              </View>
            ))
          )}

          {data && data.totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <Text style={styles.pageBtnText}>← Prev</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{page} / {data.totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageBtn, page >= data.totalPages && styles.pageBtnDisabled]}
                onPress={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
              >
                <Text style={styles.pageBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { backgroundColor: "#fff", paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginBottom: 12 },
  searchRow: { marginBottom: 10 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a" },
  filters: { flexDirection: "row", gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f1f5f9" },
  filterBtnActive: { backgroundColor: "#059669" },
  filterText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  filterTextActive: { color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyText: { color: "#94a3b8", fontSize: 14 },
  txRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  typeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12, flexShrink: 0 },
  dotGreen: { backgroundColor: "#059669" },
  dotRed: { backgroundColor: "#ef4444" },
  txInfo: { flex: 1, marginRight: 8 },
  txName: { fontSize: 14, fontWeight: "500", color: "#0f172a" },
  txMeta: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "600" },
  green: { color: "#059669" },
  dark: { color: "#0f172a" },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingVertical: 8 },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, color: "#0f172a", fontWeight: "500" },
  pageInfo: { fontSize: 13, color: "#64748b" },
})
