import { useState, useRef, useEffect } from "react"
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
  StatusBar,
} from "react-native"
import { Text } from "../components/Text"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useAuth } from "../lib/auth"
import { useAlert } from "../lib/alert"
import { FONTS } from "../lib/fonts"
import { LogoMark } from "../components/LogoMark"

type Props = {
  navigation: NativeStackNavigationProp<{ Login: undefined; Register: undefined }, "Register">
}

const EASE = Easing.out(Easing.cubic)
const DUR = 520

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth()
  const { alert } = useAlert()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const aLogo   = useRef(new Animated.Value(0)).current
  const yLogo   = useRef(new Animated.Value(28)).current
  const sLogo   = useRef(new Animated.Value(0.7)).current
  const aTitle  = useRef(new Animated.Value(0)).current
  const yTitle  = useRef(new Animated.Value(20)).current
  const aLine   = useRef(new Animated.Value(0)).current
  const aTag    = useRef(new Animated.Value(0)).current
  const yTag    = useRef(new Animated.Value(14)).current
  const aInputs = useRef(new Animated.Value(0)).current
  const yInputs = useRef(new Animated.Value(20)).current
  const aBtn    = useRef(new Animated.Value(0)).current
  const yBtn    = useRef(new Animated.Value(16)).current
  const aFooter = useRef(new Animated.Value(0)).current
  const yFooter = useRef(new Animated.Value(12)).current

  useEffect(() => {
    Animated.spring(sLogo, { toValue: 1, friction: 7, tension: 52, useNativeDriver: true }).start()

    Animated.stagger(72, [
      Animated.parallel([
        Animated.timing(aLogo,   { toValue: 1, duration: DUR, easing: EASE, useNativeDriver: true }),
        Animated.timing(yLogo,   { toValue: 0, duration: DUR, easing: EASE, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(aTitle,  { toValue: 1, duration: DUR, easing: EASE, useNativeDriver: true }),
        Animated.timing(yTitle,  { toValue: 0, duration: DUR, easing: EASE, useNativeDriver: true }),
      ]),
      Animated.timing(aLine,   { toValue: 1, duration: 400, easing: EASE, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(aTag,    { toValue: 1, duration: DUR, easing: EASE, useNativeDriver: true }),
        Animated.timing(yTag,    { toValue: 0, duration: DUR, easing: EASE, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(aInputs, { toValue: 1, duration: DUR, easing: EASE, useNativeDriver: true }),
        Animated.timing(yInputs, { toValue: 0, duration: DUR, easing: EASE, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(aBtn,    { toValue: 1, duration: DUR, easing: EASE, useNativeDriver: true }),
        Animated.timing(yBtn,    { toValue: 0, duration: DUR, easing: EASE, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(aFooter, { toValue: 1, duration: DUR, easing: EASE, useNativeDriver: true }),
        Animated.timing(yFooter, { toValue: 0, duration: DUR, easing: EASE, useNativeDriver: true }),
      ]),
    ]).start()
  }, [])

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Error", "Please fill in all fields")
      return
    }
    if (password.length < 8) {
      alert("Error", "Password must be at least 8 characters")
      return
    }
    setLoading(true)
    const error = await register(name.trim(), email.trim(), password)
    setLoading(false)
    if (error) alert("Registration failed", error)
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#06111b" />

      <View style={[s.orb, { top: -90, left: -60, width: 280, height: 280 }]} />
      <View style={[s.orb, { bottom: 60, right: -110, width: 210, height: 210, opacity: 0.055 }]} />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Brand ── */}
        <View style={s.brand}>
          <Animated.View style={{ opacity: aLogo, transform: [{ translateY: yLogo }, { scale: sLogo }] }}>
            <LogoMark size={54} />
          </Animated.View>

          <Animated.Text style={[s.appName, { opacity: aTitle, transform: [{ translateY: yTitle }] }]}>
            Expensable
          </Animated.Text>

          <Animated.View style={[s.accentLine, { opacity: aLine }]} />

          <Animated.Text style={[s.tagline, { opacity: aTag, transform: [{ translateY: yTag }] }]}>
            Start tracking in seconds.
          </Animated.Text>
        </View>

        {/* ── Form ── */}
        <View style={s.form}>

          <Animated.View style={{ opacity: aInputs, transform: [{ translateY: yInputs }] }}>
            <TextInput
              style={s.input}
              placeholder="Full name"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              selectionColor="#10b981"
            />
            <TextInput
              style={s.input}
              placeholder="Email address"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              selectionColor="#10b981"
            />
            <TextInput
              style={s.input}
              placeholder="Password (8+ characters)"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              selectionColor="#10b981"
            />
          </Animated.View>

          <Animated.View style={{ opacity: aBtn, transform: [{ translateY: yBtn }] }}>
            <TouchableOpacity
              style={[s.primaryBtn, loading && s.dim]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.primaryBtnText}>Create account</Text>}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[s.footer, { opacity: aFooter, transform: [{ translateY: yFooter }] }]}>
            <Text style={s.footerMuted}>Already have an account?{" "}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")} activeOpacity={0.7}>
              <Text style={s.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#06111b",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#059669",
    opacity: 0.082,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  brand: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 36,
  },
  appName: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    color: "#edf2f7",
    letterSpacing: -0.6,
    marginTop: 20,
    marginBottom: 12,
  },
  accentLine: {
    width: 30,
    height: 2,
    backgroundColor: "#059669",
    borderRadius: 2,
    marginBottom: 13,
  },
  tagline: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.28)",
    letterSpacing: 0.1,
  },
  form: {
    paddingHorizontal: 28,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  primaryBtn: {
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 10,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
    fontFamily: FONTS.bold,
  },
  dim: { opacity: 0.45 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 26,
  },
  footerMuted: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 14,
  },
  footerLink: {
    color: "#34d399",
    fontSize: 14,
    fontWeight: "600",
  },
})
