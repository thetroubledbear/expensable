import { useEffect, useState } from "react"
import { FONTS } from "../lib/fonts"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { ChevronLeft, Check, Zap, Users, Star } from "lucide-react-native"
import { apiGet } from "../lib/api"
import { BASE_URL } from "../lib/api"

interface Billing {
  tier: string
  filesUploadedThisMonth: number
}

const PLANS = [
  {
    id: "free",
    label: "Free",
    price: "$0",
    period: "/month",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
    features: ["25 files / month", "1 member", "AI parsing", "Dashboard insights"],
    icon: Star,
  },
  {
    id: "pro",
    label: "Pro",
    price: "$9",
    period: "/month",
    color: "#0ea5e9",
    bg: "#eff6ff",
    border: "#bae6fd",
    features: ["60 files / month", "1 member", "AI parsing", "Dashboard insights", "Priority support"],
    icon: Zap,
    popular: true,
  },
  {
    id: "family",
    label: "Family",
    price: "$19",
    period: "/month",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    features: ["1000 files / month", "Up to 6 members", "AI parsing", "Dashboard insights", "Priority support", "Household analytics"],
    icon: Users,
  },
]

type Props = {
  navigation: NativeStackNavigationProp<any>
}

export default function ManagePlanScreen({ navigation }: Props) {
  const [billing, setBilling] = useState<Billing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<{ billing?: Billing; error?: string }>("/api/household")
      .then((d) => { if (d.billing) setBilling(d.billing) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleUpgrade(planId: string) {
    const url = `${BASE_URL}/settings/billing?plan=${planId}`
    Alert.alert(
      "Upgrade Plan",
      `Manage your subscription on the Expensable web app.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Web", onPress: () => Linking.openURL(url) },
      ]
    )
  }

  const currentTier = billing?.tier ?? "free"

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ChevronLeft color="#059669" size={22} />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Subscription</Text>
        <Text style={styles.subtitle}>Choose the plan that fits your household</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#059669" style={{ marginVertical: 32 }} />
      ) : (
        <View style={styles.plans}>
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.id
            const Icon = plan.icon
            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  { borderColor: isCurrent ? plan.color : plan.border },
                  isCurrent && { borderWidth: 2 },
                ]}
              >
                {plan.popular && !isCurrent && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
                {isCurrent && (
                  <View style={[styles.currentBadge, { backgroundColor: plan.color + "22" }]}>
                    <Text style={[styles.currentText, { color: plan.color }]}>CURRENT PLAN</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: plan.bg }]}>
                    <Icon color={plan.color} size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planLabel, { color: plan.color }]}>{plan.label}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.featureList}>
                  {plan.features.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <Check color="#059669" size={14} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>

                {!isCurrent && (
                  <TouchableOpacity
                    style={[styles.upgradeBtn, { backgroundColor: plan.color }]}
                    onPress={() => handleUpgrade(plan.id)}
                  >
                    <Text style={styles.upgradeBtnText}>
                      {PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === currentTier)
                        ? `Downgrade to ${plan.label}`
                        : `Upgrade to ${plan.label}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          })}
        </View>
      )}

      <Text style={styles.note}>Billing is managed securely. Cancel anytime.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 48 },

  header: { marginTop: 48, marginBottom: 28 },
  back: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },
  backText: { fontSize: 15, color: "#059669", fontWeight: "500" },
  title: { fontSize: 26, fontWeight: "700", color: "#0f172a", fontFamily: FONTS.bold, marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#64748b" },

  plans: { gap: 16 },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  popularBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#0ea5e922",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12,
  },
  popularText: { fontSize: 10, fontWeight: "700", color: "#0ea5e9", letterSpacing: 0.6 },
  currentBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12,
  },
  currentText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },

  planHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  planIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  planLabel: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  planPrice: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  planPeriod: { fontSize: 13, color: "#94a3b8" },

  featureList: { gap: 9, marginBottom: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, color: "#334155" },

  upgradeBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  upgradeBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  note: { textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 24 },
})
