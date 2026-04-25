import { ActivityIndicator, View, Text } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Home, ArrowLeftRight, Upload, FolderOpen, Settings } from "lucide-react-native"
import { useFonts, LibreBaskerville_400Regular, LibreBaskerville_700Bold } from "@expo-google-fonts/libre-baskerville"
import { AuthProvider, useAuth } from "./lib/auth"
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
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#e2e8f0" },
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
        options={{ tabBarIcon: ({ color, size }) => <Upload color={color} size={size} /> }}
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

function RootNavigator() {
  const { user, loading, onboardingCompleted } = useAuth()
  const [fontsLoaded] = useFonts({ LibreBaskerville_400Regular, LibreBaskerville_700Bold })

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator color="#059669" size="large" />
      </View>
    )
  }

  // Apply Libre Baskerville globally — mirrors web where it's the base font-sans
  if (!Text.defaultProps) Text.defaultProps = {}
  Text.defaultProps.style = { fontFamily: "LibreBaskerville_400Regular" }

  if (!user) return <AuthNavigator />
  if (!onboardingCompleted) return <OnboardingScreen />
  return <TabNavigator />
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  )
}
