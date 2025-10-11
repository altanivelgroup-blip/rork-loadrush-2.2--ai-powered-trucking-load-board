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

      console.log('🔄 Navigation check:', { 
        loading, 
        hasUser: !!user, 
        userRole: user?.role, 
        userId: user?.id,
        segments 
      });

      const inAuthGroup = segments[0] === 'auth';

      if (!user && !inAuthGroup) {
        console.log('➡️ No user detected, redirecting to /auth');
        setIsNavigating(true);
        router.replace('/auth');
        setTimeout(() => setIsNavigating(false), 500);
      } else if (user && inAuthGroup) {
        console.log('➡️ User authenticated with role:', user.role, '- redirecting to dashboard');
        setIsNavigating(true);
        
        let targetRoute = '/(driver)/dashboard';
        
        if (user.role === 'shipper') {
          targetRoute = '/(shipper)/dashboard';
          console.log('🚚 Shipper role confirmed - navigating to:', targetRoute);
        } else if (user.role === 'admin') {
          targetRoute = '/(admin)/dashboard';
          console.log('👑 Admin role confirmed - navigating to:', targetRoute);
        } else if (user.role === 'driver') {
          targetRoute = '/(driver)/dashboard';
          console.log('🚛 Driver role confirmed - navigating to:', targetRoute);
        }
        
        console.log('🎯 Final navigation target:', targetRoute);
        router.replace(targetRoute);
        setTimeout(() => setIsNavigating(false), 500);
      } else if (!user && inAuthGroup) {
        console.log('✅ No user, staying on auth page');
      } else {
        console.log('✅ User authenticated, staying on current page:', segments.join('/'));
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
