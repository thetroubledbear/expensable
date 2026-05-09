import { useRef, useEffect } from "react"
import { View, Text, Animated } from "react-native"
import { NoticesBanner } from "./components/NoticesBanner"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Home, ArrowLeftRight, FolderOpen, Settings, Plus, Wallet } from "lucide-react-native"
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
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#f1f5f9",
          borderTopWidth: 1,
          elevation: 30,
          shadowColor: "#0f172a",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
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
  const fade = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.82)).current
  const d1 = useRef(new Animated.Value(0.25)).current
  const d2 = useRef(new Animated.Value(0.25)).current
  const d3 = useRef(new Animated.Value(0.25)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
    ]).start()

    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.25, duration: 380, useNativeDriver: true }),
        ])
      )
    pulse(d1, 0).start()
    pulse(d2, 160).start()
    pulse(d3, 320).start()
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{ alignItems: "center", opacity: fade, transform: [{ scale }] }}>
        <View style={{
          width: 84, height: 84, borderRadius: 26,
          backgroundColor: "#059669",
          alignItems: "center", justifyContent: "center",
          marginBottom: 24,
          shadowColor: "#059669",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5, shadowRadius: 22,
          elevation: 16,
        }}>
          <Wallet color="#fff" size={40} />
        </View>
        <Text style={{ fontSize: 30, fontWeight: "700", color: "#f1f5f9", letterSpacing: -0.5, marginBottom: 6 }}>
          Expensable
        </Text>
        <Text style={{ fontSize: 13, color: "#475569", marginBottom: 48 }}>
          Track smarter, spend wiser
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {([d1, d2, d3] as Animated.Value[]).map((d, i) => (
            <Animated.View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#34d399", opacity: d }} />
          ))}
        </View>
      </Animated.View>
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
