import { useEffect, useState } from "react"
import { FONTS } from "../lib/fonts"
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import { Text } from "../components/Text"
import { useAlert } from "../lib/alert"
import * as ImagePicker from "expo-image-picker"
import * as DocumentPicker from "expo-document-picker"
import { apiUploadFile, apiGet } from "../lib/api"
import { Camera, FileText, CheckCircle, XCircle, Image } from "lucide-react-native"

interface UploadResult {
  name: string
  status: "success" | "error"
  message?: string
}

const PLAN_LIMITS: Record<string, number> = {
  free: 25,
  pro: 60,
  family: 1000,
}

const TIER_COLORS: Record<string, string> = {
  free: "#64748b",
  pro: "#0ea5e9",
  family: "#8b5cf6",
}

export default function UploadScreen() {
  const { alert } = useAlert()
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<UploadResult[]>([])
  const [billing, setBilling] = useState<{ tier: string; filesUploadedThisMonth: number } | null>(null)

  useEffect(() => {
    apiGet<{ billing?: { tier: string; filesUploadedThisMonth: number } }>("/api/household")
      .then((res) => { if (res.billing) setBilling(res.billing) })
      .catch(() => {})
  }, [])

  async function uploadFile(uri: string, name: string, mimeType: string) {
    const formData = new FormData()
    formData.append("file", { uri, name, type: mimeType } as unknown as Blob)
    try {
      const res = await apiUploadFile(formData)
      if (res.id) {
        setResults((prev) => [...prev, { name, status: "success" }])
      } else {
        setResults((prev) => [...prev, { name, status: "error", message: res.error ?? "Upload failed" }])
      }
    } catch {
      setResults((prev) => [...prev, { name, status: "error", message: "Network error" }])
    }
  }

  async function handleCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      alert("Permission required", "Camera access is needed to take receipt photos.")
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    setUploading(true)
    try {
      await uploadFile(asset.uri, `receipt_${Date.now()}.jpg`, asset.mimeType ?? "image/jpeg")
    } finally {
      setUploading(false)
    }
  }

  async function handleGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      alert("Permission required", "Photo library access is needed.")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: false,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    setUploading(true)
    try {
      await uploadFile(asset.uri, `image_${Date.now()}.jpg`, asset.mimeType ?? "image/jpeg")
    } finally {
      setUploading(false)
    }
  }

  async function handleDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "text/csv", "text/plain", "application/octet-stream"],
      copyToCacheDirectory: true,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    setUploading(true)
    try {
      await uploadFile(asset.uri, asset.name, asset.mimeType ?? "application/octet-stream")
    } finally {
      setUploading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Upload</Text>
      <Text style={styles.subtitle}>Import bank statements, receipts, or CSV exports</Text>

      {billing && (() => {
        const tier = billing.tier ?? "free"
        const used = billing.filesUploadedThisMonth
        const limit = PLAN_LIMITS[tier] ?? 25
        const pct = Math.min(used / limit, 1)
        const atLimit = used >= limit
        const tierColor = TIER_COLORS[tier] ?? "#64748b"
        const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1) + " plan"
        return (
          <View style={styles.usageCard}>
            <View style={styles.usageRow}>
              <Text style={styles.usageLabel}>Files this month</Text>
              <Text style={styles.usageCount}>{used} / {limit}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct * 100}%` as unknown as number, backgroundColor: atLimit ? "#ef4444" : "#059669" }]} />
            </View>
            {atLimit && <Text style={styles.limitReached}>Limit reached</Text>}
            <View style={[styles.tierBadge, { backgroundColor: tierColor + "20" }]}>
              <Text style={[styles.tierText, { color: tierColor }]}>{tierLabel}</Text>
            </View>
          </View>
        )
      })()}

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCamera} disabled={uploading}>
          <View style={styles.actionIcon}>
            <Camera color="#059669" size={28} />
          </View>
          <View>
            <Text style={styles.actionTitle}>Take Photo</Text>
            <Text style={styles.actionSub}>Photograph a receipt</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleGallery} disabled={uploading}>
          <View style={styles.actionIcon}>
            <Image color="#0ea5e9" size={28} />
          </View>
          <View>
            <Text style={styles.actionTitle}>From Gallery</Text>
            <Text style={styles.actionSub}>Choose an existing image</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleDocument} disabled={uploading}>
          <View style={styles.actionIcon}>
            <FileText color="#8b5cf6" size={28} />
          </View>
          <View>
            <Text style={styles.actionTitle}>File (PDF / CSV)</Text>
            <Text style={styles.actionSub}>Bank statement or export</Text>
          </View>
        </TouchableOpacity>
      </View>

      {uploading && (
        <View style={styles.uploadingRow}>
          <ActivityIndicator color="#059669" />
          <Text style={styles.uploadingText}>Uploading and processing...</Text>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>Upload History</Text>
          {results.slice().reverse().map((r, i) => (
            <View key={i} style={styles.resultRow}>
              {r.status === "success" ? (
                <CheckCircle color="#059669" size={18} />
              ) : (
                <XCircle color="#ef4444" size={18} />
              )}
              <View style={styles.resultInfo}>
                <Text style={styles.resultName} numberOfLines={1}>{r.name}</Text>
                {r.status === "success" ? (
                  <Text style={styles.resultOk}>Processing — check back soon</Text>
                ) : (
                  <Text style={styles.resultErr}>{r.message}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Supported formats</Text>
        <Text style={styles.infoText}>{"• PDF bank statements\n• CSV exports\n• JPEG / PNG receipt photos\n• WebP images"}</Text>
        <Text style={styles.infoText2}>AI will extract all transactions automatically. Max 20 MB per file.</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginTop: 48, marginBottom: 4, fontFamily: FONTS.bold },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 16 },
  usageCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  usageRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  usageLabel: { fontSize: 13, fontWeight: "500", color: "#64748b" },
  usageCount: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  progressTrack: { height: 4, backgroundColor: "#f1f5f9", borderRadius: 2, overflow: "hidden", marginBottom: 10 },
  progressFill: { height: 4, borderRadius: 2 },
  limitReached: { fontSize: 12, color: "#ef4444", fontWeight: "600", marginBottom: 8 },
  tierBadge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tierText: { fontSize: 11, fontWeight: "700" },
  buttons: { gap: 12, marginBottom: 24 },
  actionBtn: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  actionSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  uploadingRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 },
  uploadingText: { color: "#64748b", fontSize: 14 },
  resultsCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  resultsTitle: { fontSize: 13, fontWeight: "600", color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  resultRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 13, fontWeight: "500", color: "#0f172a" },
  resultOk: { fontSize: 12, color: "#059669", marginTop: 2 },
  resultErr: { fontSize: 12, color: "#ef4444", marginTop: 2 },
  infoCard: { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#bbf7d0" },
  infoTitle: { fontSize: 13, fontWeight: "600", color: "#065f46", marginBottom: 8 },
  infoText: { fontSize: 13, color: "#065f46", lineHeight: 22 },
  infoText2: { fontSize: 12, color: "#6ee7b7", marginTop: 8 },
})
