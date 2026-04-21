import { Stack, useRouter, useSegments } from "expo-router"
import { useEffect } from "react"
import { AuthProvider, useAuth } from "../lib/auth"

function RootLayoutNav() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return
    const inAuth = (segments[0] as string) === "(auth)"
    if (!user && !inAuth) {
      router.replace("/(auth)/login" as never)
    } else if (user && inAuth) {
      router.replace("/(tabs)" as never)
    }
  }, [user, loading, segments])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
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
