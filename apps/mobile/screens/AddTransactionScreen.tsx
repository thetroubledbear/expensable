import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { apiGet, apiPost } from "../lib/api"

const CURRENCIES = ["USD", "EUR", "PLN", "GBP", "CHF", "CAD", "AUD", "JPY", "NOK", "SEK", "DKK", "NZD", "SGD", "HKD"]

type Props = {
  navigation: NativeStackNavigationProp<{ TransactionsList: undefined; AddTransaction: undefined }, "AddTransaction">
}

export default function AddTransactionScreen({ navigation }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [description, setDescription] = useState("")
  const [merchantName, setMerchantName] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<"debit" | "credit">("debit")
  const [currency, setCurrency] = useState("USD")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiGet<{ defaultCurrency?: string }>("/api/household")
      .then((d) => { if (d.defaultCurrency) setCurrency(d.defaultCurrency) })
      .catch(() => {})
  }, [])

  async function handleSave() {
    const amt = parseFloat(amount)
    if (!description.trim()) {
      Alert.alert("Validation", "Description is required")
      return
    }
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Validation", "Enter a valid positive amount")
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Validation", "Date must be in YYYY-MM-DD format")
      return
    }
    setSaving(true)
    try {
      const res = await apiPost<{ id?: string; error?: string }>("/api/transactions", {
        date,
        description: description.trim(),
        merchantName: merchantName.trim() || null,
        amount: amt,
        type,
        currency,
      })
      if (res.id) {
        navigation.goBack()
      } else {
        Alert.alert("Error", res.error ?? "Failed to create transaction")
      }
    } catch {
      Alert.alert("Error", "Network error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Transaction</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {(["debit", "credit"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, type === t && (t === "debit" ? styles.typeBtnDebit : styles.typeBtnCredit)]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                  {t === "debit" ? "Expense" : "Income"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2025-01-15"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Grocery shopping"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Merchant (optional)</Text>
          <TextInput
            style={styles.input}
            value={merchantName}
            onChangeText={setMerchantName}
            placeholder="e.g. Walmart"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currScroll}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.currBtn, currency === c && styles.currBtnActive]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[styles.currBtnText, currency === c && styles.currBtnTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Transaction</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { marginTop: 48, marginBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, color: "#059669", fontWeight: "500" },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 6,
    marginTop: 14,
    textTransform: "uppercase",
    letterSpacing: 0.4,
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
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#f1f5f9" },
  typeBtnDebit: { backgroundColor: "#fef2f2" },
  typeBtnCredit: { backgroundColor: "#f0fdf4" },
  typeBtnText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  typeBtnTextActive: { color: "#0f172a" },
  currScroll: { marginTop: 4 },
  currBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f1f5f9", marginRight: 8 },
  currBtnActive: { backgroundColor: "#059669" },
  currBtnText: { fontSize: 13, fontWeight: "500", color: "#64748b" },
  currBtnTextActive: { color: "#fff" },
  saveBtn: { backgroundColor: "#059669", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
})
