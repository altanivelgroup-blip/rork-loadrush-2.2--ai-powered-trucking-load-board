import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { trpc, trpcClient } from "@/lib/trpc";
import { FUEL_API_URL, FUEL_API_KEY } from '@env';

SplashScreen.preventAutoHideAsync();

console.log('🔧 Initial Environment Variables Check:');
try {
  const { FUEL_API_URL: url, FUEL_API_KEY: key } = require('@env');
  console.log('  FUEL_API_URL:', url);
  console.log('  FUEL_API_KEY:', key ? `${key.substring(0, 10)}...` : 'NOT SET');
} catch (error) {
  console.error('  ❌ Error loading @env:', error);
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = React.useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    const performNavigation = async () => {
      if (isNavigating) return;
      
      try {
        await SplashScreen.hideAsync();
      } catch {
        console.log('Splash screen already hidden');
      }

      console.log('🔄 Navigation check:', { loading, user: user?.role, segments });

      const inAuthGroup = segments[0] === 'auth';

      console.log('✅ Auth loaded:', { user: user?.role, segments, inAuthGroup });

      if (!user && !inAuthGroup) {
        console.log('➡️ No user, redirecting to /auth');
        setIsNavigating(true);
        router.replace('/auth');
        setTimeout(() => setIsNavigating(false), 500);
      } else if (user && inAuthGroup) {
        console.log('➡️ User logged in, redirecting to dashboard');
        setIsNavigating(true);
        if (user.role === 'driver') {
          router.replace('/(driver)/dashboard');
        } else if (user.role === 'shipper') {
          router.replace('/(shipper)/dashboard');
        } else if (user.role === 'admin') {
          router.replace('/(admin)/dashboard');
        }
        setTimeout(() => setIsNavigating(false), 500);
      } else if (!user && inAuthGroup) {
        console.log('✅ User on auth page, staying there');
      } else {
        console.log('✅ Navigation state is correct, no redirect needed');
      }
    };

    performNavigation();
  }, [user, loading, segments, isNavigating, router]);

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
  console.log('🔧 Environment Variables Check:');
  console.log('  FUEL_API_URL:', FUEL_API_URL);
  console.log('  FUEL_API_KEY:', FUEL_API_KEY ? `${FUEL_API_KEY.substring(0, 10)}...` : 'NOT SET');

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
