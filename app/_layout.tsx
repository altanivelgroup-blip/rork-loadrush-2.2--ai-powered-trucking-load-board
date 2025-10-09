import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    SplashScreen.hideAsync();
    console.log('🔄 Navigation check:', { loading, user: user?.role, segments });

    const inAuthGroup = segments[0] === 'auth';

    console.log('✅ Auth loaded:', { user: user?.role, segments, inAuthGroup });

    if (!user && !inAuthGroup) {
      console.log('➡️ No user, redirecting to /auth');
      router.replace('/auth');
    } else if (user && inAuthGroup) {
      console.log('➡️ User logged in, redirecting to dashboard');
      if (user.role === 'driver') {
        router.replace('/(driver)/dashboard');
      } else if (user.role === 'shipper') {
        router.replace('/(shipper)/dashboard');
      } else if (user.role === 'admin') {
        router.replace('/(admin)/dashboard');
      }
    } else {
      console.log('✅ Navigation state is correct, no redirect needed');
    }
  }, [user, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(driver)" options={{ headerShown: false }} />
      <Stack.Screen name="(shipper)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  console.log('🚀 RootLayout mounted');

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
