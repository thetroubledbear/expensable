import { useEffect, useState } from "react"
import { FONTS } from "../lib/fonts"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native"
import { apiGet, apiPost, apiPatch, apiDeleteById } from "../lib/api"
import { Pencil, Trash2 } from "lucide-react-native"

const ACCOUNT_TYPES = ["checking", "savings", "credit", "cash", "investment"] as const
type AccountType = typeof ACCOUNT_TYPES[number]

const CURRENCIES = ["USD", "EUR", "PLN", "GBP", "CHF", "CAD", "AUD", "JPY", "NOK", "SEK", "DKK", "NZD", "SGD", "HKD"]

const TYPE_EMOJI: Record<AccountType, string> = {
  checking: "🏦",
  savings: "💰",
  credit: "💳",
  cash: "💵",
  investment: "📈",
}

const TYPE_LABEL: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit",
  cash: "Cash",
  investment: "Investment",
}

interface Account {
  id: string
  name: string
  type: AccountType
  isDefault: boolean
  currency: string
  _count: { transactions: number }
}

interface ModalState {
  visible: boolean
  mode: "add" | "edit"
  editId: string | null
  name: string
  type: AccountType
  currency: string
  isDefault: boolean
}

const INITIAL_MODAL: ModalState = {
  visible: false,
  mode: "add",
  editId: null,
  name: "",
  type: "checking",
  currency: "USD",
  isDefault: false,
}

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const data = await apiGet<Account[]>("/api/accounts")
      if (Array.isArray(data)) setAccounts(data)
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

  function openAdd() {
    const defaultCurrency = accounts.find((a) => a.isDefault)?.currency ?? "USD"
    setModal({ ...INITIAL_MODAL, visible: true, mode: "add", currency: defaultCurrency })
  }

  function openEdit(account: Account) {
    setModal({
      visible: true,
      mode: "edit",
      editId: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      isDefault: account.isDefault,
    })
  }

  function closeModal() {
    setModal(INITIAL_MODAL)
  }

  async function handleSave() {
    if (!modal.name.trim()) {
      Alert.alert("Validation", "Account name is required")
      return
    }
    setSaving(true)
    try {
      if (modal.mode === "add") {
        const created = await apiPost<Account>("/api/accounts", {
          name: modal.name.trim(),
          type: modal.type,
          currency: modal.currency,
          isDefault: modal.isDefault,
        })
        if ("id" in created) {
          setAccounts((prev) => {
            const updated = modal.isDefault
              ? prev.map((a) => ({ ...a, isDefault: false }))
              : prev
            return [...updated, created]
          })
          closeModal()
        } else {
          const err = created as unknown as { error?: string }
          Alert.alert("Error", err.error ?? "Failed to create account")
        }
      } else if (modal.editId) {
        const updated = await apiPatch<Account>(`/api/accounts/${modal.editId}`, {
          name: modal.name.trim(),
          type: modal.type,
          currency: modal.currency,
          isDefault: modal.isDefault,
        })
        if ("id" in updated) {
          setAccounts((prev) => {
            const withUpdated = prev.map((a) => {
              if (a.id === modal.editId) return updated
              if (modal.isDefault) return { ...a, isDefault: false }
              return a
            })
            return withUpdated
          })
          closeModal()
        } else {
          const err = updated as unknown as { error?: string }
          Alert.alert("Error", err.error ?? "Failed to update account")
        }
      }
    } catch {
      Alert.alert("Error", "Network error")
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(account: Account) {
    Alert.alert(
      "Delete account?",
      `"${account.name}" and its data will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(account.id)
            try {
              await apiDeleteById(`/api/accounts/${account.id}`)
              setAccounts((prev) => prev.filter((a) => a.id !== account.id))
            } catch (e: unknown) {
              const msg =
                e instanceof Error && e.message.includes("last")
                  ? "Cannot delete the last account"
                  : "Failed to delete account"
              Alert.alert("Error", msg)
            } finally {
              setDeletingId(null)
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#059669" size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      >
        <Text style={styles.title}>Accounts</Text>
        <Text style={styles.subtitle}>Manage your financial accounts</Text>

        {accounts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏦</Text>
            <Text style={styles.emptyTitle}>No accounts yet</Text>
            <Text style={styles.emptyText}>Tap + to add your first account.</Text>
          </View>
        ) : (
          accounts.map((account) => (
            <View key={account.id} style={styles.card}>
              <View style={styles.iconBox}>
                <Text style={styles.typeEmoji}>{TYPE_EMOJI[account.type]}</Text>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountType}>{TYPE_LABEL[account.type]}</Text>
                <Text style={styles.accountMeta}>
                  {account._count.transactions} transaction{account._count.transactions !== 1 ? "s" : ""} · {account.currency}
                </Text>
              </View>

              <View style={styles.cardRight}>
                {account.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                )}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openEdit(account)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Pencil color="#059669" size={16} />
                  </TouchableOpacity>
                  {accounts.length > 1 && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDelete(account)}
                      disabled={deletingId === account.id}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {deletingId === account.id ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <Trash2 color="#ef4444" size={16} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal
        visible={modal.visible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {modal.mode === "add" ? "Add Account" : "Edit Account"}
            </Text>

            {/* Name */}
            <Text style={styles.fieldLabel}>NAME</Text>
            <TextInput
              style={styles.input}
              value={modal.name}
              onChangeText={(v) => setModal((m) => ({ ...m, name: v }))}
              placeholder="e.g. Chase Checking"
              placeholderTextColor="#94a3b8"
              autoFocus
            />

            {/* Type */}
            <Text style={styles.fieldLabel}>TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {ACCOUNT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, modal.type === t && styles.pillActive]}
                  onPress={() => setModal((m) => ({ ...m, type: t }))}
                >
                  <Text style={[styles.pillText, modal.type === t && styles.pillTextActive]}>
                    {TYPE_EMOJI[t]} {TYPE_LABEL[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Currency */}
            <Text style={styles.fieldLabel}>CURRENCY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.pill, modal.currency === c && styles.pillActive]}
                  onPress={() => setModal((m) => ({ ...m, currency: c }))}
                >
                  <Text style={[styles.pillText, modal.currency === c && styles.pillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Default toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setModal((m) => ({ ...m, isDefault: !m.isDefault }))}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleLabel}>Set as default</Text>
              <View style={[styles.toggle, modal.isDefault ? styles.toggleOn : styles.toggleOff]}>
                <View style={[styles.toggleThumb, { alignSelf: modal.isDefault ? "flex-end" : "flex-start" }]} />
              </View>
            </TouchableOpacity>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 96 },

  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginTop: 48, marginBottom: 4, fontFamily: FONTS.bold },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 24 },

  empty: { alignItems: "center", paddingVertical: 56, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#64748b" },
  emptyText: { fontSize: 13, color: "#94a3b8" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  typeEmoji: { fontSize: 20 },
  cardInfo: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  accountType: { fontSize: 12, color: "#94a3b8", marginTop: 1 },
  accountMeta: { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  cardRight: { alignItems: "flex-end", gap: 6 },
  defaultBadge: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 9, fontWeight: "700", color: "#059669", letterSpacing: 0.5 },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: { padding: 4 },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: { fontSize: 30, color: "#fff", lineHeight: 34, fontWeight: "300" },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 20 },

  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  pillScroll: { marginBottom: 4 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
  },
  pillActive: { backgroundColor: "#059669" },
  pillText: { fontSize: 13, fontWeight: "500", color: "#64748b" },
  pillTextActive: { color: "#fff" },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 4,
  },
  toggleLabel: { fontSize: 15, fontWeight: "500", color: "#0f172a" },
  toggle: { width: 40, height: 22, borderRadius: 11, padding: 2, justifyContent: "center" },
  toggleOn: { backgroundColor: "#059669" },
  toggleOff: { backgroundColor: "#cbd5e1" },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff" },

  modalButtons: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#059669",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
})
