import { useCallback, useEffect, useRef, useState } from "react"
import { useFocusEffect } from "@react-navigation/native"
import { FONTS } from "../lib/fonts"
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Text } from "../components/Text"
import { apiGet, apiDeleteById, apiPost } from "../lib/api"
import { RefreshCw, Trash2, Plus, X, Undo2 } from "lucide-react-native"

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

const CURRENCIES = ["USD", "EUR", "GBP", "PLN", "CHF", "CAD", "AUD", "JPY", "NOK", "SEK"]
const FREQUENCIES = ["monthly", "annual", "weekly"] as const

interface UndoState {
  sub: Subscription
  countdown: number
}

export default function SubscriptionsScreen() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [undoState, setUndoState] = useState<UndoState | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [householdCurrency, setHouseholdCurrency] = useState("USD")

  // Add modal
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ merchantName: "", amount: "", currency: "USD", frequency: "monthly" as typeof FREQUENCIES[number] })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState("")

  useFocusEffect(useCallback(() => { load() }, []))

  useEffect(() => {
    apiGet<{ defaultCurrency?: string }>("/api/household")
      .then((d) => { if (d.defaultCurrency) { setHouseholdCurrency(d.defaultCurrency); setAddForm((f) => ({ ...f, currency: d.defaultCurrency! })) } })
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
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current)
    // Flush previous pending delete immediately
    if (undoState) {
      apiDeleteById("/api/subscriptions/" + undoState.sub.id).catch(() => {})
    }

    setSubs((prev) => prev.filter((s) => s.id !== sub.id))
    setUndoState({ sub, countdown: 5 })

    undoIntervalRef.current = setInterval(() => {
      setUndoState((prev) => (prev ? { ...prev, countdown: Math.max(0, prev.countdown - 1) } : null))
    }, 1000)

    undoTimerRef.current = setTimeout(async () => {
      clearInterval(undoIntervalRef.current!)
      setUndoState(null)
      try {
        await apiDeleteById("/api/subscriptions/" + sub.id)
      } catch {}
    }, 5000)
  }

  function handleUndo() {
    if (!undoState) return
    clearTimeout(undoTimerRef.current!)
    clearInterval(undoIntervalRef.current!)
    setSubs((prev) => [undoState.sub, ...prev])
    setUndoState(null)
  }

  function openAdd() {
    setAddForm((f) => ({ ...f, merchantName: "", amount: "", frequency: "monthly" }))
    setAddError("")
    setAddOpen(true)
  }

  async function handleAdd() {
    if (!addForm.merchantName.trim()) { setAddError("Merchant name is required"); return }
    const amt = parseFloat(addForm.amount)
    if (isNaN(amt) || amt <= 0) { setAddError("Enter a valid amount"); return }
    setAdding(true)
    setAddError("")
    try {
      const sub = await apiPost<Subscription & { error?: string }>("/api/subscriptions", {
        merchantName: addForm.merchantName.trim(),
        amount: amt,
        currency: addForm.currency,
        frequency: addForm.frequency,
      })
      if ("error" in sub && sub.error) { setAddError(sub.error); return }
      setSubs((prev) => [sub, ...prev])
      setAddOpen(false)
    } catch {
      setAddError("Failed to add subscription")
    } finally {
      setAdding(false)
    }
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
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Subscriptions</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Plus color="#fff" size={16} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {subs.length === 0 ? (
          <View style={styles.empty}>
            <RefreshCw color="#cbd5e1" size={36} />
            <Text style={styles.emptyTitle}>No subscriptions detected</Text>
            <Text style={styles.emptyText}>
              Recurring payments appear here once identified, or add one manually.
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
                  >
                    <Trash2 color="#ef4444" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {undoState && (
        <View style={styles.undoToast}>
          <Text style={styles.undoText} numberOfLines={1}>
            {undoState.sub.merchantName} deleted
          </Text>
          <TouchableOpacity onPress={handleUndo} style={styles.undoBtn}>
            <Undo2 color="#fff" size={14} />
            <Text style={styles.undoBtnText}>Undo</Text>
          </TouchableOpacity>
          <Text style={styles.undoCountdown}>{undoState.countdown}s</Text>
        </View>
      )}

      {/* Add subscription modal */}
      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Subscription</Text>
              <TouchableOpacity onPress={() => setAddOpen(false)}>
                <X color="#94a3b8" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Merchant name</Text>
            <TextInput
              style={styles.fieldInput}
              value={addForm.merchantName}
              onChangeText={(v) => setAddForm((f) => ({ ...f, merchantName: v }))}
              placeholder="Netflix, Spotify…"
              placeholderTextColor="#94a3b8"
              autoFocus
            />

            <View style={styles.amountRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Amount</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={addForm.amount}
                  onChangeText={(v) => setAddForm((f) => ({ ...f, amount: v }))}
                  placeholder="9.99"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ width: 90 }}>
                <Text style={styles.fieldLabel}>Currency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyRow}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.currencyBtn, addForm.currency === c && styles.currencyBtnActive]}
                      onPress={() => setAddForm((f) => ({ ...f, currency: c }))}
                    >
                      <Text style={[styles.currencyBtnText, addForm.currency === c && styles.currencyBtnTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Frequency</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.freqBtn, addForm.frequency === f && styles.freqBtnActive]}
                  onPress={() => setAddForm((prev) => ({ ...prev, frequency: f }))}
                >
                  <Text style={[styles.freqBtnText, addForm.frequency === f && styles.freqBtnTextActive]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {addError ? <Text style={styles.errorText}>{addError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setAddOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, adding && { opacity: 0.6 }]}
                onPress={handleAdd}
                disabled={adding}
              >
                {adding
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalSaveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 48, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", fontFamily: FONTS.bold },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#059669", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  empty: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#64748b" },
  emptyText: { fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 20, maxWidth: 260 },
  summaryCard: { backgroundColor: "#059669", borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 9, fontWeight: "700", color: "#a7f3d0", letterSpacing: 1, marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: "700", color: "#fff" },
  summaryDivider: { width: 1, height: 36, backgroundColor: "#34d399", opacity: 0.4 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  initials: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  initialsText: { fontSize: 14, fontWeight: "700", color: "#059669" },
  cardInfo: { flex: 1 },
  merchant: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  meta: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  amountCol: { alignItems: "flex-end" },
  amount: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  freqBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  freqText: { fontSize: 11, fontWeight: "700" },
  trashBtn: { padding: 8 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  fieldInput: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#0f172a", backgroundColor: "#f8fafc" },
  amountRow: { flexDirection: "row", gap: 10 },
  currencyRow: { marginTop: 0 },
  currencyBtn: { paddingHorizontal: 10, paddingVertical: 10, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, marginRight: 6, backgroundColor: "#f8fafc" },
  currencyBtnActive: { backgroundColor: "#059669", borderColor: "#059669" },
  currencyBtnText: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  currencyBtnTextActive: { color: "#fff" },
  freqRow: { flexDirection: "row", gap: 8 },
  freqBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center" },
  freqBtnActive: { backgroundColor: "#059669" },
  freqBtnText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  freqBtnTextActive: { color: "#fff" },
  errorText: { fontSize: 12, color: "#ef4444", marginTop: 10 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#f1f5f9", alignItems: "center" },
  modalCancelBtnText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  modalSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#059669", alignItems: "center" },
  modalSaveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  undoToast: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  undoText: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "500" },
  undoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  undoBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  undoCountdown: { color: "#64748b", fontSize: 12, minWidth: 20, textAlign: "right" },
})
