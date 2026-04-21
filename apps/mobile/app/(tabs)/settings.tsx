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
import { useAuth } from "../../lib/auth"
import { apiGet } from "../../lib/api"
import { LogOut, Home, CreditCard, User } from "lucide-react-native"

interface HouseholdData {
  id: string
  name: string
  defaultCurrency: string
  billing: { tier: string }
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const [household, setHousehold] = useState<HouseholdData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<HouseholdData>("/api/household")
      .then((data) => setHousehold("id" in data ? data : null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

      {/* User section */}
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

      {/* Household section */}
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

      {/* Sign out */}
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
})
