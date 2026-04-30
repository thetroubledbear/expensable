import { useCallback, useEffect, useRef, useState } from "react"
import { useFocusEffect } from "@react-navigation/native"
import { FONTS } from "../lib/fonts"
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
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
  Undo2,
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

interface UndoState {
  file: UploadedFile
  countdown: number
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
  const [undoState, setUndoState] = useState<UndoState | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  function handleDelete(file: UploadedFile) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current)
    // Flush previous pending delete immediately
    if (undoState) {
      apiDeleteById(`/api/files/${undoState.file.id}`).catch(() => {})
    }

    setFiles((prev) => prev.filter((f) => f.id !== file.id))
    setUndoState({ file, countdown: 5 })

    undoIntervalRef.current = setInterval(() => {
      setUndoState((prev) => (prev ? { ...prev, countdown: Math.max(0, prev.countdown - 1) } : null))
    }, 1000)

    undoTimerRef.current = setTimeout(async () => {
      clearInterval(undoIntervalRef.current!)
      setUndoState(null)
      try {
        await apiDeleteById(`/api/files/${file.id}`)
      } catch {}
    }, 5000)
  }

  function handleUndo() {
    if (!undoState) return
    clearTimeout(undoTimerRef.current!)
    clearInterval(undoIntervalRef.current!)
    setFiles((prev) => [...prev, undoState.file].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    ))
    setUndoState(null)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#059669" size="large" />
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
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
                  onPress={() => handleDelete(file)}
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

      {undoState && (
        <View style={styles.undoToast}>
          <Text style={styles.undoText} numberOfLines={1}>
            "{undoState.file.name.length > 22 ? undoState.file.name.slice(0, 22) + "…" : undoState.file.name}" deleted
          </Text>
          <TouchableOpacity onPress={handleUndo} style={styles.undoBtn}>
            <Undo2 color="#fff" size={14} />
            <Text style={styles.undoBtnText}>Undo</Text>
          </TouchableOpacity>
          <Text style={styles.undoCountdown}>{undoState.countdown}s</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
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
  undoToast: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  undoText: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "500" },
  undoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  undoBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  undoCountdown: { color: "#64748b", fontSize: 12, minWidth: 20, textAlign: "right" },
})
