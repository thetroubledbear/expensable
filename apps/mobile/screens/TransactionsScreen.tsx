"use no memo"
import { useCallback, useEffect, useRef, useState } from "react"
import { useFocusEffect } from "@react-navigation/native"
import type { RouteProp } from "@react-navigation/native"
import { FONTS } from "../lib/fonts"
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Text } from "../components/Text"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useAlert } from "../lib/alert"
import { apiGet, apiPatch, apiDelete } from "../lib/api"
import { Search, X } from "lucide-react-native"

interface Category {
  id: string
  name: string
  color: string
  icon?: string
}

interface Transaction {
  id: string
  merchantName: string | null
  description: string | null
  type: "debit" | "credit"
  amount: number
  date: string
  category: Category | null
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

type TransactionsStackParams = {
  TransactionsList: { initialSearch?: string; initialCategoryId?: string } | undefined
  AddTransaction: undefined
}

type Props = {
  navigation: NativeStackNavigationProp<TransactionsStackParams, "TransactionsList">
  route: RouteProp<TransactionsStackParams, "TransactionsList">
}

interface UndoQueue {
  ids: Set<string>
  snapshots: Transaction[]
  countdown: number
}

export default function TransactionsScreen({ navigation, route }: Props) {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<"" | "debit" | "credit">("")
  const [currency, setCurrency] = useState("USD")
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryFilter, setCategoryFilter] = useState("")
  const [needsReview, setNeedsReview] = useState(false)

  // Category assignment
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryPickerFor, setCategoryPickerFor] = useState<"inline" | "edit">("inline")

  // Select & delete
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Undo delete
  const [undoQueue, setUndoQueue] = useState<UndoQueue | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Edit modal
  const [editModal, setEditModal] = useState<Transaction | null>(null)
  const [editForm, setEditForm] = useState({
    merchantName: "",
    description: "",
    amount: "",
    type: "debit" as "debit" | "credit",
    date: "",
    categoryId: null as string | null,
    category: null as Category | null,
  })
  const [editSaving, setEditSaving] = useState(false)

  const { alert } = useAlert()

  // Apply initialSearch / initialCategoryId params from navigation
  useEffect(() => {
    const q = route.params?.initialSearch
    if (q) {
      setSearch(q)
      navigation.setParams({ initialSearch: undefined })
    }
  }, [route.params?.initialSearch])

  useEffect(() => {
    const catId = route.params?.initialCategoryId
    if (catId) {
      setCategoryFilter(catId)
      navigation.setParams({ initialCategoryId: undefined })
    }
  }, [route.params?.initialCategoryId])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    apiGet<{ defaultCurrency?: string }>("/api/household")
      .then((d) => { if (d.defaultCurrency) setCurrency(d.defaultCurrency) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    apiGet<Category[]>("/api/categories")
      .then((cats) => { if (Array.isArray(cats)) setCategories(cats) })
      .catch(() => {})
  }, [])

  useEffect(() => { setPage(1) }, [debouncedSearch, typeFilter, categoryFilter, needsReview])
  useEffect(() => { load() }, [debouncedSearch, typeFilter, categoryFilter, needsReview, page])

  useFocusEffect(useCallback(() => { load() }, []))

  async function load() {
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (typeFilter) params.set("type", typeFilter)
      if (categoryFilter) params.set("categoryId", categoryFilter)
      if (needsReview) params.set("needsReview", "true")
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

  // ── Category picker ──────────────────────────────────────────────────────────

  function openCategoryModal(tx: Transaction) {
    setEditingTx(tx)
    setCategoryPickerFor("inline")
    setCategoryModalOpen(true)
  }

  function openEditCategoryPicker() {
    setCategoryPickerFor("edit")
    setCategoryModalOpen(true)
  }

  async function assignCategory(cat: Category | null) {
    if (categoryPickerFor === "edit") {
      setEditForm((f) => ({ ...f, categoryId: cat?.id ?? null, category: cat }))
      setCategoryModalOpen(false)
      return
    }
    if (!editingTx) return
    const body = cat ? { categoryId: cat.id } : { categoryId: null }
    try {
      await apiPatch(`/api/transactions/${editingTx.id}`, body)
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          data: prev.data.map((tx) =>
            tx.id === editingTx.id ? { ...tx, category: cat } : tx
          ),
        }
      })
    } catch {}
    setCategoryModalOpen(false)
    setEditingTx(null)
  }

  // ── Select mode ──────────────────────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleLongPress(tx: Transaction) {
    if (!selectMode) {
      setSelectMode(true)
      setSelectedIds(new Set([tx.id]))
    }
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  // ── Undo delete ──────────────────────────────────────────────────────────────

  function clearUndoTimers() {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current)
  }

  function handleUndo() {
    if (!undoQueue) return
    clearUndoTimers()
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        data: [...undoQueue.snapshots, ...prev.data],
        total: prev.total + undoQueue.snapshots.length,
      }
    })
    setUndoQueue(null)
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return
    const snapshots = data?.data.filter((tx) => selectedIds.has(tx.id)) ?? []
    const ids = new Set(selectedIds)

    // Optimistic remove
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        data: prev.data.filter((tx) => !ids.has(tx.id)),
        total: Math.max(0, prev.total - ids.size),
      }
    })
    exitSelectMode()
    clearUndoTimers()

    setUndoQueue({ ids, snapshots, countdown: 5 })

    undoIntervalRef.current = setInterval(() => {
      setUndoQueue((prev) => {
        if (!prev) return null
        if (prev.countdown <= 1) {
          clearInterval(undoIntervalRef.current!)
          return null
        }
        return { ...prev, countdown: prev.countdown - 1 }
      })
    }, 1000)

    undoTimerRef.current = setTimeout(async () => {
      clearInterval(undoIntervalRef.current!)
      setUndoQueue(null)
      try {
        await apiDelete("/api/transactions", { ids: Array.from(ids) })
      } catch {
        // Restore on error
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            data: [...snapshots, ...prev.data],
            total: prev.total + snapshots.length,
          }
        })
        alert("Error", "Failed to delete transactions. Changes restored.")
      }
    }, 5000)
  }

  // ── Edit modal ───────────────────────────────────────────────────────────────

  function openEdit(tx: Transaction) {
    setEditModal(tx)
    setEditForm({
      merchantName: tx.merchantName ?? "",
      description: tx.description ?? "",
      amount: tx.amount.toString(),
      type: tx.type,
      date: tx.date.slice(0, 10),
      categoryId: tx.category?.id ?? null,
      category: tx.category,
    })
  }

  async function saveEdit() {
    if (!editModal || editSaving) return
    setEditSaving(true)
    const body: Record<string, unknown> = {}
    if (editForm.merchantName !== (editModal.merchantName ?? "")) body.merchantName = editForm.merchantName || null
    if (editForm.description !== (editModal.description ?? "")) body.description = editForm.description
    const amt = parseFloat(editForm.amount)
    if (!isNaN(amt) && amt > 0 && amt !== editModal.amount) body.amount = amt
    if (editForm.type !== editModal.type) body.type = editForm.type
    if (editForm.date !== editModal.date.slice(0, 10)) body.date = editForm.date
    if (editForm.categoryId !== (editModal.category?.id ?? null)) body.categoryId = editForm.categoryId

    if (Object.keys(body).length === 0) {
      setEditModal(null)
      setEditSaving(false)
      return
    }

    try {
      await apiPatch(`/api/transactions/${editModal.id}`, body)
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          data: prev.data.map((tx) =>
            tx.id === editModal.id
              ? {
                  ...tx,
                  merchantName: editForm.merchantName || null,
                  description: editForm.description || null,
                  amount: parseFloat(editForm.amount) || tx.amount,
                  type: editForm.type,
                  date: editForm.date,
                  category: editForm.category,
                  needsReview: editForm.categoryId ? false : tx.needsReview,
                }
              : tx
          ),
        }
      })
      setEditModal(null)
    } catch {
      alert("Error", "Failed to save changes")
    } finally {
      setEditSaving(false)
    }
  }

  const catPills: { label: string; value: string }[] = [
    { label: "All categories", value: "" },
    { label: "Uncategorized", value: "uncategorized" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ]

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
          <TouchableOpacity
            style={[styles.reviewBtn, needsReview && styles.reviewBtnActive]}
            onPress={() => setNeedsReview((v) => !v)}
          >
            <Text style={[styles.reviewBtnText, needsReview ? { color: "#92400e" } : { color: "#64748b" }]}>
              ⚠ Review
            </Text>
          </TouchableOpacity>
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catFilterRow}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          {catPills.map((pill) => (
            <TouchableOpacity
              key={pill.value}
              style={[styles.catPill, categoryFilter === pill.value && styles.catPillActive]}
              onPress={() => setCategoryFilter(pill.value)}
            >
              <Text style={[styles.catPillText, categoryFilter === pill.value && styles.catPillTextActive]}>
                {pill.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color="#059669" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, (selectMode || undoQueue) && { paddingBottom: 120 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        >
          {!data?.data.length ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          ) : (
            data.data.map((tx) => {
              const isSelected = selectedIds.has(tx.id)
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={[styles.txRow, selectMode && isSelected && styles.txRowSelected]}
                  onLongPress={() => handleLongPress(tx)}
                  onPress={() => {
                    if (selectMode) toggleSelect(tx.id)
                    else openEdit(tx)
                  }}
                  activeOpacity={0.7}
                >
                  {selectMode && (
                    <View style={styles.checkbox}>
                      <View style={[styles.checkboxInner, isSelected && styles.checkboxInnerSelected]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </View>
                  )}
                  <View style={[styles.typeDot, tx.type === "credit" ? styles.dotGreen : styles.dotRed]} />
                  <View style={styles.txInfo}>
                    <Text style={styles.txName} numberOfLines={1}>
                      {tx.merchantName ?? tx.description ?? "Unknown"}
                    </Text>
                    {tx.description && tx.description !== tx.merchantName ? (
                      <Text style={styles.txDescription} numberOfLines={1}>{tx.description}</Text>
                    ) : null}
                    <Text style={styles.txMeta}>
                      {new Date(tx.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                    <TouchableOpacity
                      style={styles.catBadge}
                      onPress={() => openCategoryModal(tx)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.catBadgeDot, { backgroundColor: tx.category?.color ?? "#94a3b8" }]} />
                      <Text style={styles.catBadgeText}>{tx.category?.name ?? "Uncategorized"}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={[styles.txAmount, tx.type === "credit" ? styles.green : styles.dark]}>
                      {tx.type === "credit" ? "+" : "-"}{fmt(tx.amount, currency)}
                    </Text>
                    {tx.needsReview ? (
                      <Text style={styles.reviewBadge}>
                        ⚠ {tx.category ? "Check date & currency" : "Missing category"}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )
            })
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

      {/* Select mode bottom bar */}
      {selectMode && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.cancelBtn} onPress={exitSelectMode}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteBtn, selectedIds.size === 0 && styles.deleteBtnDisabled]}
            onPress={deleteSelected}
            disabled={selectedIds.size === 0}
          >
            <Text style={styles.deleteBtnText}>Delete ({selectedIds.size})</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Undo toast */}
      {undoQueue && (
        <View style={styles.undoToast}>
          <Text style={styles.undoToastText}>
            Deleted {undoQueue.snapshots.length} transaction{undoQueue.snapshots.length !== 1 ? "s" : ""} · {undoQueue.countdown}s
          </Text>
          <TouchableOpacity onPress={handleUndo} style={styles.undoBtn}>
            <Text style={styles.undoBtnText}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectMode && !undoQueue && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("AddTransaction")}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Category picker modal */}
      <Modal
        visible={categoryModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => { setCategoryModalOpen(false); setEditingTx(null) }}
      >
        <View style={styles.categoryModal}>
          <View style={styles.categoryModalCard}>
            <Text style={styles.categoryModalTitle}>Assign category</Text>
            <FlatList
              data={[null, ...categories] as (Category | null)[]}
              keyExtractor={(item) => item?.id ?? "__uncategorized__"}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.categoryItem} onPress={() => assignCategory(item)}>
                  <View style={[styles.categoryDot, { backgroundColor: item?.color ?? "#94a3b8" }]} />
                  <Text style={styles.categoryName}>{item?.name ?? "Uncategorized"}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Edit transaction modal */}
      <Modal
        visible={editModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModal(null)}
      >
        <KeyboardAvoidingView
          style={styles.editModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.editModalCard}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Transaction</Text>
              <TouchableOpacity onPress={() => setEditModal(null)}>
                <X color="#94a3b8" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.editLabel}>Merchant</Text>
              <TextInput
                style={styles.editInput}
                value={editForm.merchantName}
                onChangeText={(v) => setEditForm((f) => ({ ...f, merchantName: v }))}
                placeholder="Merchant name"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.editLabel}>Description</Text>
              <TextInput
                style={styles.editInput}
                value={editForm.description}
                onChangeText={(v) => setEditForm((f) => ({ ...f, description: v }))}
                placeholder="Description"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.editLabel}>Amount</Text>
              <TextInput
                style={styles.editInput}
                value={editForm.amount}
                onChangeText={(v) => setEditForm((f) => ({ ...f, amount: v }))}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
              />

              <Text style={styles.editLabel}>Type</Text>
              <View style={styles.typeToggle}>
                {(["debit", "credit"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, editForm.type === t && (t === "debit" ? styles.typeBtnDebit : styles.typeBtnCredit)]}
                    onPress={() => setEditForm((f) => ({ ...f, type: t }))}
                  >
                    <Text style={[styles.typeBtnText, editForm.type === t && styles.typeBtnTextActive]}>
                      {t === "debit" ? "Expense" : "Income"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.editLabel}>Date</Text>
              <TextInput
                style={styles.editInput}
                value={editForm.date}
                onChangeText={(v) => setEditForm((f) => ({ ...f, date: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.editLabel}>Category</Text>
              <TouchableOpacity style={styles.catPickerRow} onPress={openEditCategoryPicker}>
                {editForm.category && (
                  <View style={[styles.catBadgeDot, { backgroundColor: editForm.category.color }]} />
                )}
                <Text style={styles.catPickerText}>
                  {editForm.category ? editForm.category.name : "Uncategorized"}
                </Text>
                <Text style={styles.catPickerChevron}>›</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.editActions}>
              <TouchableOpacity style={styles.editCancelBtn} onPress={() => setEditModal(null)}>
                <Text style={styles.editCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSaveBtn, editSaving && { opacity: 0.6 }]}
                onPress={saveEdit}
                disabled={editSaving}
              >
                {editSaving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.editSaveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#06111b" },
  header: { backgroundColor: "#06111b", paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  title: { fontSize: 22, fontWeight: "700", color: "#edf2f7", marginBottom: 12, fontFamily: FONTS.bold },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#edf2f7" },
  filters: { flexDirection: "row", gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.07)" },
  filterBtnActive: { backgroundColor: "#059669" },
  filterText: { fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: "500" },
  filterTextActive: { color: "#fff" },
  catFilterRow: { marginBottom: 8 },
  catPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.07)", marginRight: 6 },
  catPillActive: { backgroundColor: "#059669" },
  catPillText: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  catPillTextActive: { color: "#fff" },
  reviewBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.07)" },
  reviewBtnActive: { backgroundColor: "rgba(245,158,11,0.15)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)" },
  reviewBtnText: { fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyText: { color: "rgba(255,255,255,0.28)", fontSize: 14 },
  txRow: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "rgba(255,255,255,0.055)", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  typeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12, marginTop: 4, flexShrink: 0 },
  dotGreen: { backgroundColor: "#059669" },
  dotRed: { backgroundColor: "#ef4444" },
  txInfo: { flex: 1, marginRight: 8 },
  txName: { fontSize: 14, fontWeight: "600", color: "#edf2f7" },
  txDescription: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 1 },
  txMeta: { fontSize: 12, color: "rgba(255,255,255,0.28)", marginTop: 2 },
  catBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5, alignSelf: "flex-start" },
  catBadgeDot: { width: 8, height: 8, borderRadius: 4 },
  catBadgeText: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  amountCol: { alignItems: "flex-end", gap: 4, maxWidth: 120 },
  txAmount: { fontSize: 14, fontWeight: "600" },
  green: { color: "#34d399" },
  dark: { color: "#edf2f7" },
  reviewBadge: { fontSize: 11, color: "#f59e0b", textAlign: "right" },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingVertical: 8 },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, color: "#edf2f7", fontWeight: "500" },
  pageInfo: { fontSize: 13, color: "rgba(255,255,255,0.5)" },
  checkbox: { width: 24, height: 24, marginRight: 8, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  checkboxInner: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center" },
  checkboxInnerSelected: { backgroundColor: "#059669", borderColor: "#059669" },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "700" },
  txRowSelected: { backgroundColor: "rgba(5,150,105,0.15)" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", padding: 16, gap: 12, backgroundColor: "#06111b", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#edf2f7" },
  deleteBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  undoToast: { position: "absolute", bottom: 24, left: 16, right: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0b1a26", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  undoToastText: { fontSize: 13, color: "#edf2f7", flex: 1 },
  undoBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#059669", borderRadius: 8 },
  undoBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  fab: { position: "absolute", right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: "#059669", alignItems: "center", justifyContent: "center", shadowColor: "#059669", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4 },
  fabText: { fontSize: 30, color: "#fff", lineHeight: 34, fontWeight: "300" },
  categoryModal: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  categoryModalCard: { backgroundColor: "#0b1a26", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: 400, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  categoryModalTitle: { fontSize: 16, fontWeight: "600", color: "#edf2f7", marginBottom: 16 },
  categoryItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { fontSize: 14, color: "#edf2f7" },
  editModalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  editModalCard: { backgroundColor: "#0b1a26", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "85%" as const, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  editModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  editModalTitle: { fontSize: 17, fontWeight: "700", color: "#edf2f7" },
  editLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, marginTop: 14 },
  editInput: { borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#edf2f7", backgroundColor: "rgba(255,255,255,0.05)" },
  typeToggle: { flexDirection: "row", gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center" },
  typeBtnDebit: { backgroundColor: "rgba(239,68,68,0.15)" },
  typeBtnCredit: { backgroundColor: "rgba(52,211,153,0.12)" },
  typeBtnText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.5)" },
  typeBtnTextActive: { color: "#edf2f7" },
  catPickerRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.05)" },
  catPickerText: { flex: 1, fontSize: 14, color: "#edf2f7" },
  catPickerChevron: { fontSize: 20, color: "rgba(255,255,255,0.28)" },
  editActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  editCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center" },
  editCancelBtnText: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.5)" },
  editSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#059669", alignItems: "center" },
  editSaveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
})
