import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || !isReady) {
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
        segments,
        currentPath: segments.join('/')
      });

      const inAuthGroup = segments[0] === 'auth';
      const inDriverGroup = segments[0] === '(driver)';
      const inShipperGroup = segments[0] === '(shipper)';
      const inAdminGroup = segments[0] === '(admin)';

      if (!user && !inAuthGroup) {
        console.log('➡️ No user detected, redirecting to /auth');
        setIsNavigating(true);
        router.replace('/auth');
        setTimeout(() => setIsNavigating(false), 500);
        return;
      }

      if (user && inAuthGroup) {
        console.log('➡️ User authenticated with role:', user.role, '- redirecting to dashboard');
        setIsNavigating(true);
        
        const targetRoute = user.role === 'shipper' 
          ? '/(shipper)/dashboard'
          : user.role === 'admin'
          ? '/(admin)/dashboard'
          : '/(driver)/dashboard';
        
        console.log('🎯 Redirecting from auth to:', targetRoute);
        router.replace(targetRoute);
        setTimeout(() => setIsNavigating(false), 500);
        return;
      }

      if (user && !inAuthGroup) {
        const correctGroup = user.role === 'shipper' 
          ? inShipperGroup
          : user.role === 'admin'
          ? inAdminGroup
          : inDriverGroup;

        if (!correctGroup) {
          console.log('⚠️ User in wrong group! Role:', user.role, 'Current group:', segments[0]);
          setIsNavigating(true);
          
          const targetRoute = user.role === 'shipper' 
            ? '/(shipper)/dashboard'
            : user.role === 'admin'
            ? '/(admin)/dashboard'
            : '/(driver)/dashboard';
          
          console.log('🔄 Correcting navigation to:', targetRoute);
          router.replace(targetRoute);
          setTimeout(() => setIsNavigating(false), 500);
          return;
        }
      }

      console.log('✅ Navigation state correct');
    };

    performNavigation();
  }, [user, loading, segments, isNavigating, router, isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

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
