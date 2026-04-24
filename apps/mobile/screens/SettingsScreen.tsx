import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useAuth } from "../lib/auth"
import { apiGet, apiPatch } from "../lib/api"
import {
  LogOut, Home, CreditCard, User, RefreshCw, ChevronRight,
  UserPlus, BarChart2, Wallet, Pencil, Check, X,
} from "lucide-react-native"

const CURRENCIES = ["USD","EUR","GBP","CHF","CAD","AUD","JPY","NOK","SEK","DKK","NZD","SGD","HKD"]
const PLAN_LIMITS: Record<string, number> = { free: 25, pro: 60, family: 1000 }

interface HouseholdData {
  id: string
  name: string
  defaultCurrency: string
  socialComparison: boolean
  billing: { tier: string; filesUploadedThisMonth: number }
}

interface Member {
  id: string
  userId: string
  role: string
  name: string | null
  email: string | null
}

type Props = {
  navigation: NativeStackNavigationProp<
    { SettingsMain: undefined; Subscriptions: undefined; Invite: undefined; Accounts: undefined },
    "SettingsMain"
  >
}

export default function SettingsScreen({ navigation }: Props) {
  const { user, signOut } = useAuth()
  const [household, setHousehold] = useState<HouseholdData | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)

  // Edit household
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editCurrency, setEditCurrency] = useState("USD")
  const [saving, setSaving] = useState(false)
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)

  // Social comparison
  const [socialComparison, setSocialComparison] = useState(false)
  const [togglingComparison, setTogglingComparison] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [h, m] = await Promise.all([
        apiGet<HouseholdData & { error?: string }>("/api/household"),
        apiGet<{ members?: Member[]; isOwner?: boolean; error?: string }>("/api/household/members"),
      ])
      if ("id" in h) {
        setHousehold(h)
        setSocialComparison(h.socialComparison ?? false)
        setEditName(h.name)
        setEditCurrency(h.defaultCurrency)
      }
      if (m.members) {
        setMembers(m.members)
        setIsOwner(m.isOwner ?? false)
      }
    } catch {}
    finally { setLoading(false) }
  }

  async function saveHousehold() {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const updated = await apiPatch<HouseholdData>("/api/household", {
        name: editName.trim(),
        defaultCurrency: editCurrency,
      })
      if ("id" in updated) setHousehold(updated)
      setEditing(false)
    } catch {
      Alert.alert("Error", "Failed to save changes")
    } finally { setSaving(false) }
  }

  function cancelEdit() {
    setEditName(household?.name ?? "")
    setEditCurrency(household?.defaultCurrency ?? "USD")
    setEditing(false)
  }

  async function toggleSocialComparison() {
    setTogglingComparison(true)
    const next = !socialComparison
    setSocialComparison(next)
    try {
      await apiPatch("/api/household", { socialComparison: next })
    } catch {
      setSocialComparison(!next)
    } finally { setTogglingComparison(false) }
  }

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ])
  }

  const tier = household?.billing?.tier ?? "free"
  const tierLabel = tier === "free" ? "Free" : tier === "pro" ? "Pro" : "Family"
  const tierColor = tier === "free" ? "#64748b" : tier === "pro" ? "#0ea5e9" : "#8b5cf6"
  const filesUsed = household?.billing?.filesUploadedThisMonth ?? 0
  const filesLimit = PLAN_LIMITS[tier] ?? 25
  const filesPct = Math.min(100, Math.round((filesUsed / filesLimit) * 100))
  const filesAtLimit = filesPct >= 100
  const filesNearLimit = filesPct >= 80

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* ── Account ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <User color="#059669" size={18} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{user?.name ?? "User"}</Text>
                <Text style={styles.rowSub}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#059669" style={{ marginVertical: 16 }} />
        ) : household ? (
          <>
            {/* ── Household ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>Household</Text>
                {isOwner && !editing && (
                  <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                    <Pencil color="#059669" size={12} />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.card}>
                {editing ? (
                  <View style={styles.editArea}>
                    <Text style={styles.editLabel}>Household name</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Household name"
                      placeholderTextColor="#94a3b8"
                      autoFocus
                    />
                    <Text style={[styles.editLabel, { marginTop: 14 }]}>Currency</Text>
                    <TouchableOpacity style={styles.currencyPicker} onPress={() => setCurrencyModalOpen(true)}>
                      <Text style={styles.currencyPickerText}>{editCurrency}</Text>
                      <ChevronRight color="#94a3b8" size={16} />
                    </TouchableOpacity>
                    <View style={styles.editActions}>
                      <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveBtn, (!editName.trim() || saving) && { opacity: 0.5 }]}
                        onPress={saveHousehold}
                        disabled={!editName.trim() || saving}
                      >
                        {saving
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={styles.saveBtnText}>Save</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.row}>
                    <View style={styles.iconBox}>
                      <Home color="#059669" size={18} />
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>{household.name}</Text>
                      <Text style={styles.rowSub}>{household.defaultCurrency} · {tierLabel} plan</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* ── Plan & Usage ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Plan & Usage</Text>
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, {
                    backgroundColor: tier === "pro" ? "#eff6ff" : tier === "family" ? "#f5f3ff" : "#f8fafc"
                  }]}>
                    <CreditCard color={tierColor} size={18} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle}>{tierLabel} plan</Text>
                    {!isOwner && <Text style={styles.rowSub}>Managed by owner</Text>}
                  </View>
                  <View style={[styles.tierBadge, { backgroundColor: tierColor + "22" }]}>
                    <Text style={[styles.tierBadgeText, { color: tierColor }]}>{tierLabel.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.usageSection}>
                  <View style={styles.usageRow}>
                    <Text style={styles.usageLabel}>Files this month</Text>
                    <Text style={[styles.usageCount, filesNearLimit && { color: filesAtLimit ? "#ef4444" : "#f59e0b" }]}>
                      {filesUsed} / {filesLimit}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, {
                      width: `${filesPct}%` as `${number}%`,
                      backgroundColor: filesAtLimit ? "#ef4444" : filesNearLimit ? "#f59e0b" : "#059669",
                    }]} />
                  </View>
                  {filesAtLimit && <Text style={styles.limitText}>Monthly limit reached — upgrade to upload more</Text>}
                </View>
              </View>
            </View>

            {/* ── Members ── */}
            {members.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Members</Text>
                <View style={styles.card}>
                  {members.map((m, i) => (
                    <View
                      key={m.id}
                      style={[styles.memberRow, i > 0 && { borderTopWidth: 1, borderTopColor: "#f1f5f9" }]}
                    >
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberInitials}>
                          {(m.name ?? m.email ?? "?").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowTitle}>{m.name ?? "Member"}</Text>
                        <Text style={styles.rowSub}>{m.email}</Text>
                      </View>
                      <View style={[styles.roleBadge, m.role === "owner" ? styles.roleBadgeOwner : styles.roleBadgeMember]}>
                        <Text style={[styles.roleBadgeText, m.role === "owner" ? styles.roleBadgeOwnerText : styles.roleBadgeMemberText]}>
                          {m.role}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : null}

        {/* ── Features ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Features</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("Subscriptions")}>
              <View style={styles.iconBox}>
                <RefreshCw color="#8b5cf6" size={18} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Subscriptions</Text>
                <Text style={styles.rowSub}>Recurring payments detected</Text>
              </View>
              <ChevronRight color="#cbd5e1" size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, styles.rowBorder]}
              onPress={() => navigation.navigate("Accounts")}
            >
              <View style={styles.iconBox}>
                <Wallet color="#059669" size={18} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Accounts</Text>
                <Text style={styles.rowSub}>Manage your financial accounts</Text>
              </View>
              <ChevronRight color="#cbd5e1" size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, styles.rowBorder]}
              onPress={() => navigation.navigate("Invite")}
            >
              <View style={styles.iconBox}>
                <UserPlus color="#059669" size={18} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Invite Member</Text>
                <Text style={styles.rowSub}>Add someone to your household</Text>
              </View>
              <ChevronRight color="#cbd5e1" size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.row, styles.rowBorder]}
              onPress={toggleSocialComparison}
              disabled={togglingComparison}
            >
              <View style={[styles.iconBox, { backgroundColor: socialComparison ? "#eff6ff" : "#f8fafc" }]}>
                <BarChart2 color={socialComparison ? "#3b82f6" : "#94a3b8"} size={18} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Social Comparison</Text>
                <Text style={styles.rowSub}>Compare spend vs regional averages</Text>
              </View>
              <View style={[styles.toggle, socialComparison ? styles.toggleOn : styles.toggleOff]}>
                <View style={[styles.toggleThumb, { alignSelf: socialComparison ? "flex-end" : "flex-start" }]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Sign out ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <LogOut color="#ef4444" size={18} />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Expensable · v1.0.0</Text>
      </ScrollView>

      {/* Currency picker modal */}
      <Modal visible={currencyModalOpen} transparent animationType="slide" onRequestClose={() => setCurrencyModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModalOpen(false)}>
                <X color="#94a3b8" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.currencyItem, editCurrency === c && styles.currencyItemActive]}
                  onPress={() => { setEditCurrency(c); setCurrencyModalOpen(false) }}
                >
                  <Text style={[styles.currencyItemText, editCurrency === c && styles.currencyItemTextActive]}>{c}</Text>
                  {editCurrency === c && <Check color="#059669" size={16} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginTop: 48, marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 4 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingHorizontal: 4 },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "500", color: "#0f172a" },
  rowSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  // Edit household
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  editBtnText: { fontSize: 12, color: "#059669", fontWeight: "500" },
  editArea: { padding: 14 },
  editLabel: { fontSize: 11, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  editInput: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: "#0f172a", backgroundColor: "#f8fafc" },
  currencyPicker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "#f8fafc" },
  currencyPickerText: { fontSize: 14, color: "#0f172a", fontWeight: "500" },
  editActions: { flexDirection: "row", gap: 8, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingVertical: 9, alignItems: "center" },
  cancelBtnText: { fontSize: 13, color: "#64748b" },
  saveBtn: { flex: 1, backgroundColor: "#059669", borderRadius: 10, paddingVertical: 9, alignItems: "center" },
  saveBtnText: { fontSize: 13, fontWeight: "600", color: "#fff" },

  // Billing
  tierBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tierBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  usageSection: { paddingHorizontal: 14, paddingBottom: 14 },
  usageRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  usageLabel: { fontSize: 12, color: "#64748b" },
  usageCount: { fontSize: 12, fontWeight: "600", color: "#0f172a" },
  progressTrack: { height: 4, backgroundColor: "#f1f5f9", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  limitText: { fontSize: 11, color: "#ef4444", marginTop: 6 },

  // Members
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  memberInitials: { fontSize: 14, fontWeight: "700", color: "#059669" },
  roleBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  roleBadgeOwner: { backgroundColor: "#f0fdf4" },
  roleBadgeMember: { backgroundColor: "#f8fafc" },
  roleBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  roleBadgeOwnerText: { color: "#059669" },
  roleBadgeMemberText: { color: "#94a3b8" },

  // Sign out
  signOutBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  signOutText: { fontSize: 15, fontWeight: "500", color: "#ef4444" },
  version: { textAlign: "center", fontSize: 12, color: "#cbd5e1", marginTop: 8 },

  // Toggle
  toggle: { width: 40, height: 22, borderRadius: 11, padding: 2, justifyContent: "center" },
  toggleOn: { backgroundColor: "#3b82f6" },
  toggleOff: { backgroundColor: "#cbd5e1" },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff" },

  // Currency modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: 420 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  currencyItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  currencyItemActive: { },
  currencyItemText: { fontSize: 15, color: "#334155" },
  currencyItemTextActive: { fontWeight: "700", color: "#059669" },
})
