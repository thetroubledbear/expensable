import { useState } from "react"
import { FONTS } from "../lib/fonts"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Alert,
} from "react-native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { apiPost, BASE_URL } from "../lib/api"
import { Link2, Users } from "lucide-react-native"

type Props = {
  navigation: NativeStackNavigationProp<
    { SettingsMain: undefined; Subscriptions: undefined; Invite: undefined },
    "Invite"
  >
}

export default function InviteScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  async function generateInvite() {
    setLoading(true)
    try {
      const res = await apiPost<{ token?: string; expiresAt?: string; error?: string }>(
        "/api/household/invites",
        {}
      )
      if (res.token) {
        setInviteLink(`${BASE_URL}/invite/${res.token}`)
        setExpiresAt(res.expiresAt ?? null)
      } else {
        Alert.alert("Error", res.error ?? "Failed to generate invite")
      }
    } catch {
      Alert.alert("Error", "Network error")
    } finally {
      setLoading(false)
    }
  }

  async function shareInvite() {
    if (!inviteLink) return
    await Share.share({ message: `Join my household on Expensable: ${inviteLink}` })
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Invite Member</Text>
        <Text style={styles.subtitle}>Requires Family plan · Owner only</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Users color="#8b5cf6" size={28} />
        </View>
        <Text style={styles.cardTitle}>Share an invite link</Text>
        <Text style={styles.cardSub}>The link expires in 7 days and can be used once to join your household.</Text>

        {inviteLink ? (
          <>
            <View style={styles.linkBox}>
              <Link2 color="#059669" size={14} />
              <Text style={styles.linkText} numberOfLines={2}>{inviteLink}</Text>
            </View>
            {expiresAt && (
              <Text style={styles.expiry}>
                Expires{" "}
                {new Date(expiresAt).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            )}
            <TouchableOpacity style={styles.primaryBtn} onPress={shareInvite}>
              <Text style={styles.primaryBtnText}>Share link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={generateInvite}>
              <Text style={styles.secondaryBtnText}>Generate new link</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabled]}
            onPress={generateInvite}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Generate invite link</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  headerRow: { marginTop: 48, marginBottom: 24 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, color: "#059669", fontWeight: "500" },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", fontFamily: FONTS.bold },
  subtitle: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a", marginBottom: 6 },
  cardSub: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  linkBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    width: "100%",
  },
  linkText: { flex: 1, fontSize: 12, color: "#065f46" },
  expiry: { fontSize: 12, color: "#94a3b8", marginBottom: 16 },
  primaryBtn: {
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: { paddingVertical: 10 },
  secondaryBtnText: { color: "#059669", fontSize: 13, fontWeight: "500" },
  disabled: { opacity: 0.6 },
})
