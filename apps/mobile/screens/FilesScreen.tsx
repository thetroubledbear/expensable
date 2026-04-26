import { useCallback, useEffect, useState } from "react"
import { useFocusEffect } from "@react-navigation/native"
import { FONTS } from "../lib/fonts"
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native"
import { Text } from "../components/Text"
import { apiGet, apiDeleteById } from "../lib/api"
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react-native"

interface UploadedFile {
  id: string
  name: string
  type: "csv" | "pdf" | "image"
  status: "pending" | "processing" | "done" | "failed"
  uploadedAt: string
  processedAt: string | null
  errorMsg: string | null
  _count: { transactions: number }
}

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  done: "#059669",
  failed: "#ef4444",
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  done: "Done",
  failed: "Failed",
}

function FileTypeIcon({ type }: { type: string }) {
  if (type === "pdf") return <FileText color="#8b5cf6" size={20} />
  if (type === "image") return <ImageIcon color="#0ea5e9" size={20} />
  return <FileSpreadsheet color="#059669" size={20} />
}

function StatusIcon({ status }: { status: string }) {
  if (status === "done") return <CheckCircle color="#059669" size={14} />
  if (status === "failed") return <AlertCircle color="#ef4444" size={14} />
  if (status === "processing") return <RefreshCw color="#3b82f6" size={14} />
  return <Clock color="#f59e0b" size={14} />
}

export default function FilesScreen() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await apiGet<UploadedFile[]>("/api/files")
      if (Array.isArray(data)) setFiles(data)
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  function onRefresh() {
    setRefreshing(true)
    load()
  }

  function confirmDelete(file: UploadedFile) {
    const txCount = file._count.transactions
    Alert.alert(
      "Delete file",
      `Delete "${file.name}"${txCount > 0 ? ` and its ${txCount} transaction${txCount !== 1 ? "s" : ""}` : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteById(`/api/files/${file.id}`)
              setFiles((prev) => prev.filter((f) => f.id !== file.id))
            } catch {
              Alert.alert("Error", "Failed to delete file")
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
    >
      <Text style={styles.title}>File Vault</Text>
      <Text style={styles.subtitle}>
        {files.length > 0 ? `${files.length} file${files.length !== 1 ? "s" : ""}` : "No files yet"}
      </Text>

      {files.length === 0 ? (
        <View style={styles.empty}>
          <FileText color="#cbd5e1" size={40} />
          <Text style={styles.emptyTitle}>No files uploaded</Text>
          <Text style={styles.emptyText}>
            Upload bank statements, receipts, or CSV exports using the Upload tab.
          </Text>
        </View>
      ) : (
        files.map((file) => (
          <View key={file.id} style={styles.card}>
            <View style={styles.fileRow}>
              <View style={styles.iconBox}>
                <FileTypeIcon type={file.type} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                <Text style={styles.fileMeta}>
                  {new Date(file.uploadedAt).toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {file.status === "done" && file._count.transactions > 0
                    ? ` · ${file._count.transactions} transactions`
                    : ""}
                </Text>
                {file.status === "failed" && file.errorMsg ? (
                  <Text style={styles.errorMsg} numberOfLines={2}>{file.errorMsg}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => confirmDelete(file)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 color="#94a3b8" size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.statusRow}>
              <StatusIcon status={file.status} />
              <Text style={[styles.statusText, { color: STATUS_COLOR[file.status] }]}>
                {STATUS_LABEL[file.status]}
              </Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{file.type.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginTop: 48, marginBottom: 4, fontFamily: FONTS.bold },
  subtitle: { fontSize: 13, color: "#64748b", marginBottom: 20 },
  empty: { alignItems: "center", paddingVertical: 48, gap: 12, backgroundColor: "#fff", borderRadius: 16, padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#64748b" },
  emptyText: { fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: "500", color: "#0f172a" },
  fileMeta: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  errorMsg: { fontSize: 11, color: "#ef4444", marginTop: 3 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  statusText: { fontSize: 12, fontWeight: "600", flex: 1 },
  typeBadge: { backgroundColor: "#f1f5f9", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 10, fontWeight: "700", color: "#64748b", letterSpacing: 0.5 },
})
