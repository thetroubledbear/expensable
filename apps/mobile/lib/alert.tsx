import { createContext, useCallback, useContext, useState } from "react"
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native"
import { Text } from "../components/Text"
import { FONTS } from "./fonts"

interface AlertButton {
  text: string
  style?: "default" | "cancel" | "destructive"
  onPress?: () => void
}

interface AlertConfig {
  title: string
  message?: string
  buttons: AlertButton[]
}

interface AlertContextType {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void
}

const Ctx = createContext<AlertContextType>({ alert: () => {} })

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [cfg, setCfg] = useState<AlertConfig | null>(null)

  const alert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    setCfg({ title, message, buttons: buttons ?? [{ text: "OK" }] })
  }, [])

  function dismiss() { setCfg(null) }

  function press(btn: AlertButton) {
    dismiss()
    btn.onPress?.()
  }

  const buttons = cfg?.buttons ?? []
  const hasCancel = buttons.some((b) => b.style === "cancel")

  return (
    <Ctx.Provider value={{ alert }}>
      {children}
      <Modal visible={!!cfg} transparent animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            {/* Title */}
            <Text style={styles.title}>{cfg?.title}</Text>

            {/* Message */}
            {cfg?.message ? <Text style={styles.message}>{cfg.message}</Text> : null}

            {/* Buttons */}
            <View style={[styles.btnRow, buttons.length === 1 && styles.btnRowSingle]}>
              {buttons.map((btn, i) => {
                const isDestructive = btn.style === "destructive"
                const isCancel = btn.style === "cancel"
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.btn,
                      buttons.length > 1 && i === 0 && styles.btnLeft,
                      buttons.length > 1 && i === buttons.length - 1 && styles.btnRight,
                      isDestructive && styles.btnDestructive,
                      !isDestructive && !isCancel && hasCancel && styles.btnPrimary,
                    ]}
                    onPress={() => press(btn)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        isDestructive && styles.btnTextDestructive,
                        isCancel && styles.btnTextCancel,
                        !isDestructive && !isCancel && hasCancel && styles.btnTextPrimary,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>
      </Modal>
    </Ctx.Provider>
  )
}

export function useAlert() {
  return useContext(Ctx)
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 340,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 4,
    fontFamily: FONTS.bold,
  },
  message: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 4,
    fontFamily: FONTS.regular,
  },
  btnRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  btnRowSingle: {},
  btn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLeft: {
    borderRightWidth: 1,
    borderRightColor: "#f1f5f9",
  },
  btnRight: {},
  btnDestructive: {
    backgroundColor: "#fef2f2",
  },
  btnPrimary: {
    backgroundColor: "#f0fdf4",
  },
  btnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#059669",
    fontFamily: FONTS.bold,
  },
  btnTextDestructive: {
    color: "#ef4444",
  },
  btnTextCancel: {
    color: "#64748b",
    fontWeight: "400",
    fontFamily: FONTS.regular,
  },
  btnTextPrimary: {
    color: "#059669",
  },
})
