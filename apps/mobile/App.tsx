import { useRef, useEffect } from "react"
import { View, Text, Animated, Easing } from "react-native"
import { NoticesBanner } from "./components/NoticesBanner"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Home, ArrowLeftRight, FolderOpen, Settings, Plus, Wallet } from "lucide-react-native"
import { LogoMark } from "./components/LogoMark"
import { useFonts, LibreBaskerville_400Regular, LibreBaskerville_700Bold } from "@expo-google-fonts/libre-baskerville"
import { AuthProvider, useAuth } from "./lib/auth"
import { AlertProvider } from "./lib/alert"
import LoginScreen from "./screens/LoginScreen"
import RegisterScreen from "./screens/RegisterScreen"
import DashboardScreen from "./screens/DashboardScreen"
import TransactionsScreen from "./screens/TransactionsScreen"
import AddTransactionScreen from "./screens/AddTransactionScreen"
import UploadScreen from "./screens/UploadScreen"
import FilesScreen from "./screens/FilesScreen"
import SettingsScreen from "./screens/SettingsScreen"
import SubscriptionsScreen from "./screens/SubscriptionsScreen"
import InviteScreen from "./screens/InviteScreen"
import OnboardingScreen from "./screens/OnboardingScreen"
import AccountsScreen from "./screens/AccountsScreen"
import ManagePlanScreen from "./screens/ManagePlanScreen"

const AuthStack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const SettingsStack = createNativeStackNavigator()
const TransactionsStack = createNativeStackNavigator()

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  )
}

function TransactionsNavigator() {
  return (
    <TransactionsStack.Navigator screenOptions={{ headerShown: false }}>
      <TransactionsStack.Screen name="TransactionsList" component={TransactionsScreen} />
      <TransactionsStack.Screen name="AddTransaction" component={AddTransactionScreen} />
    </TransactionsStack.Navigator>
  )
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
      <SettingsStack.Screen name="Subscriptions" component={SubscriptionsScreen} />
      <SettingsStack.Screen name="ManagePlan" component={ManagePlanScreen} />
      <SettingsStack.Screen name="Invite" component={InviteScreen} />
      <SettingsStack.Screen name="Accounts" component={AccountsScreen} />
    </SettingsStack.Navigator>
  )
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#34d399",
        tabBarInactiveTintColor: "rgba(255,255,255,0.3)",
        tabBarStyle: {
          backgroundColor: "#06111b",
          borderTopColor: "rgba(255,255,255,0.07)",
          borderTopWidth: 1,
          elevation: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          height: 70,
          paddingBottom: 10,
          paddingTop: 5,
          paddingLeft: 5,
          paddingRight: 5,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "600",
          fontFamily: "LibreBaskerville_700Bold",
          letterSpacing: 0.2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} />, tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsNavigator}
        options={{ tabBarIcon: ({ color, size }) => <ArrowLeftRight color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          tabBarIcon: () => (
            <View style={{
              width: 46, height: 46, borderRadius: 23,
              backgroundColor: "#059669",
              alignItems: "center", justifyContent: "center",
              marginTop: -6,
              shadowColor: "#059669",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 10,
              elevation: 8,
            }}>
              <Plus color="#fff" size={24} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Files"
        component={FilesScreen}
        options={{ tabBarIcon: ({ color, size }) => <FolderOpen color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{ tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }}
      />
    </Tab.Navigator>
  )
}

function AppLoader() {
  const aLogo  = useRef(new Animated.Value(0)).current
  const sLogo  = useRef(new Animated.Value(0.65)).current
  const glow   = useRef(new Animated.Value(0.4)).current
  const aTitle = useRef(new Animated.Value(0)).current
  const yTitle = useRef(new Animated.Value(18)).current
  const aLine  = useRef(new Animated.Value(0)).current
  const aTag   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const ease = Easing.out(Easing.cubic)

    // Logo springs in
    Animated.parallel([
      Animated.timing(aLogo, { toValue: 1, duration: 480, easing: ease, useNativeDriver: true }),
      Animated.spring(sLogo, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }),
    ]).start()

    // Breathe glow — loops forever
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1,   duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start()

    // Wordmark and line stagger after logo
    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(aTitle, { toValue: 1, duration: 500, delay: 260, easing: ease, useNativeDriver: true }),
        Animated.timing(yTitle, { toValue: 0, duration: 500, delay: 260, easing: ease, useNativeDriver: true }),
      ]),
      Animated.timing(aLine,  { toValue: 1, duration: 380, delay: 320, easing: ease, useNativeDriver: true }),
      Animated.timing(aTag,   { toValue: 1, duration: 500, delay: 400, easing: ease, useNativeDriver: true }),
    ]).start()
  }, [])

  const glowOpacity = glow.interpolate({ inputRange: [0.4, 1], outputRange: [0.10, 0.20] })

  return (
    <View style={{ flex: 1, backgroundColor: "#06111b", alignItems: "center", justifyContent: "center" }}>
      {/* Breathing glow behind logo */}
      <Animated.View style={{
        position: "absolute",
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: "#059669",
        opacity: glowOpacity,
        marginTop: -80,
      }} />

      {/* Logo */}
      <Animated.View style={{ opacity: aLogo, transform: [{ scale: sLogo }], marginBottom: 28 }}>
        <LogoMark size={76} />
      </Animated.View>

      {/* Wordmark — system font (Baskerville not loaded yet) */}
      <Animated.Text style={{
        opacity: aTitle,
        transform: [{ translateY: yTitle }],
        fontSize: 28,
        fontWeight: "700",
        color: "#edf2f7",
        letterSpacing: -0.5,
        marginBottom: 12,
      }}>
        Expensable
      </Animated.Text>

      {/* Accent line */}
      <Animated.View style={{
        opacity: aLine,
        width: 28,
        height: 2,
        backgroundColor: "#059669",
        borderRadius: 2,
        marginBottom: 12,
      }} />

      {/* Tagline */}
      <Animated.Text style={{
        opacity: aTag,
        fontSize: 12,
        color: "rgba(255,255,255,0.28)",
        letterSpacing: 0.2,
      }}>
        Track smarter. Spend wiser.
      </Animated.Text>
    </View>
  )
}

function RootNavigator() {
  const { user, loading, onboardingCompleted } = useAuth()
  const [fontsLoaded] = useFonts({ LibreBaskerville_400Regular, LibreBaskerville_700Bold })

  if (loading || !fontsLoaded) {
    return <AppLoader />
  }

  // Apply globally — must run after fonts are confirmed loaded
  Text.defaultProps = { ...(Text.defaultProps ?? {}), style: { fontFamily: "LibreBaskerville_400Regular" } }

  if (!user) return <AuthNavigator />
  if (!onboardingCompleted) return <OnboardingScreen />
  return (
    <View key={user.id} style={{ flex: 1 }}>
      <NoticesBanner />
      <TabNavigator />
    </View>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AlertProvider>
    </AuthProvider>
  )
}
