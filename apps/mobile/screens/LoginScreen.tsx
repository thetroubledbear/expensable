import { useState, useRef, useEffect } from "react"
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
  navigation: NativeStackNavigationProp<{ Login: undefined; Register: undefined }, "Login">
}

const EASE = Easing.out(Easing.cubic)
const DUR = 520

export default function LoginScreen({ navigation }: Props) {
  const { signIn, promptGoogleSignIn, googleLoading } = useAuth()
  const { alert } = useAlert()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const aLogo   = useRef(new Animated.Value(0)).current
  const yLogo   = useRef(new Animated.Value(32)).current
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
  const aOther  = useRef(new Animated.Value(0)).current
  const yOther  = useRef(new Animated.Value(14)).current

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
        Animated.timing(aOther,  { toValue: 1, duration: DUR, easing: EASE, useNativeDriver: true }),
        Animated.timing(yOther,  { toValue: 0, duration: DUR, easing: EASE, useNativeDriver: true }),
      ]),
    ]).start()
  }, [])

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      alert("Error", "Please fill in all fields")
      return
    }
    setLoading(true)
    const error = await signIn(email.trim(), password)
    setLoading(false)
    if (error) alert("Sign in failed", error)
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#06111b" />

      {/* Atmospheric glow orbs */}
      <View style={[s.orb, { top: -90, right: -60, width: 280, height: 280 }]} />
      <View style={[s.orb, { bottom: 100, left: -100, width: 210, height: 210, opacity: 0.055 }]} />
      <View style={[s.orb, { top: 200, right: -130, width: 170, height: 170, opacity: 0.038 }]} />

      {/* ── Brand ── */}
      <View style={s.brand}>
        <Animated.View style={{ opacity: aLogo, transform: [{ translateY: yLogo }, { scale: sLogo }] }}>
          <LogoMark size={62} />
        </Animated.View>

        <Animated.Text style={[s.appName, { opacity: aTitle, transform: [{ translateY: yTitle }] }]}>
          Expensable
        </Animated.Text>

        <Animated.View style={[s.accentLine, { opacity: aLine }]} />

        <Animated.Text style={[s.tagline, { opacity: aTag, transform: [{ translateY: yTag }] }]}>
          Your finances, beautifully organised.
        </Animated.Text>
      </View>

      {/* ── Form ── */}
      <View style={s.form}>

        <Animated.View style={{ opacity: aInputs, transform: [{ translateY: yInputs }] }}>
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
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            selectionColor="#10b981"
          />
        </Animated.View>

        <Animated.View style={{ opacity: aBtn, transform: [{ translateY: yBtn }] }}>
          <TouchableOpacity
            style={[s.primaryBtn, loading && s.dim]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.primaryBtnText}>Sign in</Text>}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[s.divRow, { opacity: aOther }]}>
          <View style={s.divLine} />
          <Text style={s.divText}>or</Text>
          <View style={s.divLine} />
        </Animated.View>

        <Animated.View style={{ opacity: aOther, transform: [{ translateY: yOther }] }}>
          <TouchableOpacity
            style={[s.googleBtn, googleLoading && s.dim]}
            onPress={promptGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.88}
          >
            {googleLoading ? (
              <ActivityIndicator color="#1e293b" size="small" />
            ) : (
              <>
                <Text style={s.googleG}>G</Text>
                <Text style={s.googleText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerMuted}>New to Expensable?{" "}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")} activeOpacity={0.7}>
              <Text style={s.footerLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </View>
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
  brand: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 52,
    paddingBottom: 12,
  },
  appName: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    color: "#edf2f7",
    letterSpacing: -0.6,
    marginTop: 22,
    marginBottom: 12,
  },
  accentLine: {
    width: 30,
    height: 2,
    backgroundColor: "#059669",
    borderRadius: 2,
    marginBottom: 14,
  },
  tagline: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.28)",
    letterSpacing: 0.1,
  },
  form: {
    paddingHorizontal: 28,
    paddingBottom: 46,
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
  divRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 18,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  divText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.2)",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  googleG: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4285F4",
  },
  googleText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1e293b",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
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
