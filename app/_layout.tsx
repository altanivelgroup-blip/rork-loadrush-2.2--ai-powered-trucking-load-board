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
    console.log('🔄 Navigation check:', { loading, user: user?.role, segments });
    
    if (loading) {
      console.log('⏳ Still loading auth state...');
      return;
    }

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
  }, [user, loading, segments]);

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
  useEffect(() => {
    console.log('🚀 RootLayout mounted');
    const timer = setTimeout(() => {
      console.log('🎬 Hiding splash screen');
      SplashScreen.hideAsync();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
