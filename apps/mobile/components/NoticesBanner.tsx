import { useEffect, useState } from "react"
import { View, StyleSheet, TouchableOpacity, Linking } from "react-native"
import { Text } from "./Text"
import { BASE_URL } from "../lib/api"
import { X } from "lucide-react-native"

const XIcon = X as any

type Notice = {
  id: string
  title: string
  body?: string
  type: "banner" | "modal" | "toast"
  variant?: "info" | "warning" | "success" | "danger"
  cta?: { label?: string; url?: string }
}

const VARIANT_STYLES: Record<string, { bg: string; border: string; text: string; cta: string }> = {
  info:    { bg: "#eff6ff", border: "#bfdbfe", text: "#1e3a5f", cta: "#1d4ed8" },
  warning: { bg: "#fffbeb", border: "#fde68a", text: "#78350f", cta: "#b45309" },
  success: { bg: "#ecfdf5", border: "#a7f3d0", text: "#064e3b", cta: "#065f46" },
  danger:  { bg: "#fef2f2", border: "#fecaca", text: "#7f1d1d", cta: "#b91c1c" },
}

export function NoticesBanner() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch(`${BASE_URL}/api/notices`)
      .then((r) => r.json())
      .then((data: Notice[]) => setNotices(data.filter((n) => n.type === "banner")))
      .catch(() => {})
  }, [])

  const visible = notices.filter((n) => !dismissed.has(n.id))
  if (!visible.length) return null

  return (
    <View>
      {visible.map((notice) => {
        const v = VARIANT_STYLES[notice.variant ?? "info"] ?? VARIANT_STYLES.info
        return (
          <View key={notice.id} style={[styles.banner, { backgroundColor: v.bg, borderBottomColor: v.border }]}>
            <View style={styles.content}>
              <Text style={[styles.title, { color: v.text }]}>{notice.title}</Text>
              {notice.body ? (
                <Text style={[styles.body, { color: v.text }]} numberOfLines={2}>{notice.body}</Text>
              ) : null}
              {notice.cta?.label && notice.cta?.url ? (
                <TouchableOpacity onPress={() => Linking.openURL(notice.cta!.url!)}>
                  <Text style={[styles.cta, { color: v.cta }]}>{notice.cta.label}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => setDismissed((prev) => new Set([...prev, notice.id]))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <XIcon size={16} color={v.text} />
            </TouchableOpacity>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  content: { flex: 1, gap: 2 },
  title:   { fontSize: 13, fontWeight: "600" },
  body:    { fontSize: 12, opacity: 0.85 },
  cta:     { fontSize: 12, fontWeight: "600", marginTop: 2, textDecorationLine: "underline" },
})
