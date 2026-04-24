import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useAuth } from "../lib/auth"
import { apiGet, apiPatch } from "../lib/api"
import { LogOut, Home, CreditCard, User, RefreshCw, ChevronRight, UserPlus, BarChart2 } from "lucide-react-native"

interface HouseholdData {
  id: string
  name: string
  defaultCurrency: string
  socialComparison: boolean
  billing: { tier: string }
}

type Props = {
  navigation: NativeStackNavigationProp<{ SettingsMain: undefined; Subscriptions: undefined; Invite: undefined }, "SettingsMain">
}

export default function SettingsScreen({ navigation }: Props) {
  const { user, signOut } = useAuth()
  const [household, setHousehold] = useState<HouseholdData | null>(null)
  const [loading, setLoading] = useState(true)
  const [socialComparison, setSocialComparison] = useState(false)
  const [togglingComparison, setTogglingComparison] = useState(false)

  useEffect(() => {
    apiGet<HouseholdData>("/api/household")
      .then((data) => {
        if ("id" in data) {
          setHousehold(data)
          setSocialComparison(data.socialComparison ?? false)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function toggleSocialComparison() {
    setTogglingComparison(true)
    const next = !socialComparison
    setSocialComparison(next)
    try {
      await apiPatch("/api/household", { socialComparison: next })
    } catch {
      setSocialComparison(!next)
    } finally {
      setTogglingComparison(false)
    }
  }

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ])
  }

  const tier = household?.billing?.tier ?? "free"
  const tierLabel = tier === "free" ? "Free" : tier === "pro" ? "Pro" : "Family"
  const tierColor = tier === "free" ? "#64748b" : tier === "pro" ? "#0ea5e9" : "#8b5cf6"

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

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
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Household</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Home color="#059669" size={18} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{household.name}</Text>
                <Text style={styles.rowSub}>Currency: {household.defaultCurrency}</Text>
              </View>
            </View>
            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: "#f1f5f9" }]}>
              <View style={styles.iconBox}>
                <CreditCard color={tierColor} size={18} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Plan</Text>
                <Text style={[styles.rowSub, { color: tierColor }]}>{tierLabel}</Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

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
            style={[styles.row, { borderTopWidth: 1, borderTopColor: "#f1f5f9" }]}
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
            style={[styles.row, { borderTopWidth: 1, borderTopColor: "#f1f5f9" }]}
            onPress={toggleSocialComparison}
            disabled={togglingComparison}
          >
            <View style={[styles.iconBox, { backgroundColor: socialComparison ? "#eff6ff" : "#f8fafc" }]}>
              <BarChart2 color={socialComparison ? "#3b82f6" : "#94a3b8"} size={18} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Social Comparison</Text>
              <Text style={styles.rowSub}>Compare spend vs anonymized regional averages</Text>
            </View>
            <View style={[styles.toggle, socialComparison ? styles.toggleOn : styles.toggleOff]}>
              <View style={[styles.toggleThumb, { alignSelf: socialComparison ? "flex-end" : "flex-start" }]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut color="#ef4444" size={18} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Expensable · v1.0.0</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginTop: 48, marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 4 },
  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "500", color: "#0f172a" },
  rowSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  signOutBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  signOutText: { fontSize: 15, fontWeight: "500", color: "#ef4444" },
  version: { textAlign: "center", fontSize: 12, color: "#cbd5e1", marginTop: 8 },
  toggle: { width: 40, height: 22, borderRadius: 11, padding: 2, justifyContent: "center" },
  toggleOn: { backgroundColor: "#3b82f6" },
  toggleOff: { backgroundColor: "#cbd5e1" },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff" },
})
