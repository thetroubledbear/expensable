import { Stack, useRouter, useSegments } from "expo-router"
import { useEffect } from "react"
import { AuthProvider, useAuth } from "../lib/auth"

function RootLayoutNav() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === "(auth)"
    if (!user && !inAuth) {
      router.replace("/(auth)/login")
    } else if (user && inAuth) {
      router.replace("/(tabs)")
    }
  }, [user, loading, segments])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  )
}
