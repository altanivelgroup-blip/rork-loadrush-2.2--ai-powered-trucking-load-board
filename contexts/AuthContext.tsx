import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { auth } from '@/config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  AuthError,
} from 'firebase/auth';
import { User, UserRole, ShipperProfile, DriverProfile, AdminProfile } from '@/types';
import { dummyDriverProfile, dummyShipperProfile } from '@/mocks/dummyData';

// 🔧 Local storage helpers (web only)
const getStorageItem = (key: string): string | null => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return null;
};

const setStorageItem = (key: string, value: string): void => {
  if (Platform.OS === 'web') localStorage.setItem(key, value);
};

// 🔥 Auth Context Provider
export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for Firebase Auth state
  useEffect(() => {
    console.log('🔥 Firebase Auth: Setting up listener');

    const timeoutId = setTimeout(() => {
      console.log('⚠️ Auth timeout reached');
      setLoading(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      clearTimeout(timeoutId);
      if (fbUser) {
        const storedRole = (getStorageItem(`user_role_${fbUser.uid}`) as UserRole) || 'driver';
        let profile =
          storedRole === 'driver'
            ? dummyDriverProfile
            : storedRole === 'shipper'
            ? dummyShipperProfile
            : { name: 'Admin User', permissions: ['all'] };

        setUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          role: storedRole,
          createdAt: new Date().toISOString(),
          profile,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // 🔹 Sign Up
  const signUp = useCallback(async (email: string, password: string, role: UserRole) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setStorageItem(`user_role_${userCredential.user.uid}`, role);

      let profile =
        role === 'driver'
          ? dummyDriverProfile
          : role === 'shipper'
          ? dummyShipperProfile
          : { name: 'Admin User', permissions: ['all'] };

      const newUser: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        role,
        createdAt: new Date().toISOString(),
        profile,
      };

      setUser(newUser);
      return newUser;
    } catch (err) {
      const authError = err as AuthError;
      console.error('🔥 Sign up error:', authError.code, authError.message);
      let msg = 'Failed to create account';
      if (authError.code === 'auth/email-already-in-use') msg = 'Email already in use';
      else if (authError.code === 'auth/weak-password') msg = 'Weak password';
      else if (authError.code === 'auth/invalid-email') msg = 'Invalid email';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  // 🔹 Sign In
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const storedRole = (getStorageItem(`user_role_${userCredential.user.uid}`) as UserRole) || 'driver';

      let profile =
        storedRole === 'driver'
          ? dummyDriverProfile
          : storedRole === 'shipper'
          ? dummyShipperProfile
          : { name: 'Admin User', permissions: ['all'] };

      const existingUser: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        role: storedRole,
        createdAt: new Date().toISOString(),
        profile,
      };

      setUser(existingUser);
      return existingUser;
    } catch (err) {
      const authError = err as AuthError;
      console.error('🔥 Sign in error:', authError.code, authError.message);
      let msg = 'Failed to sign in';
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password')
        msg = 'Invalid email or password';
      else if (authError.code === 'auth/invalid-email') msg = 'Invalid email';
      else if (authError.code === 'auth/too-many-requests') msg = 'Too many attempts, try later';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  // 🔹 Sign Out
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('🔥 Sign out error:', err);
      setError('Failed to sign out');
      throw err;
    }
  }, []);

  // 🔹 Quick Test Login (Firestore connected with fallback)
  const quickTestLogin = useCallback(async (role: UserRole) => {
    console.log('🔥 Firestore Quick Test Login -', role);
    setError(null);
    setLoading(true);

    const createFallbackUser = (role: UserRole) => {
      let profile: ShipperProfile | DriverProfile | AdminProfile;
      
      if (role === 'driver') {
        profile = dummyDriverProfile;
      } else if (role === 'shipper') {
        profile = dummyShipperProfile;
      } else {
        profile = {
          name: 'Admin User',
          permissions: ['all'],
        };
      }

      const fallbackUser: User = {
        id: `test-${role}-${Date.now()}`,
        email: `${role}_test@loadrush.ai`,
        role: role,
        createdAt: new Date().toISOString(),
        profile,
      };

      setUser(fallbackUser);
      setStorageItem(`user_role_${fallbackUser.id}`, fallbackUser.role);
      console.log(`✅ ${role} fallback test account created successfully`);
      setLoading(false);
    };

    try {
      const { db } = await import('@/config/firebase');
      const { doc, getDoc } = await import('firebase/firestore');

      const collectionName = role === 'driver' ? 'driver_test' : role === 'shipper' ? 'shipper_test' : 'admin_test';
      const docId = role === 'driver' ? 'DRIVER_TEST_001' : role === 'shipper' ? 'SHIPPER_TEST_001' : 'ADMIN_TEST_001';
      
      console.log(`🔍 Attempting to fetch: ${collectionName}/${docId}`);
      
      const docRef = doc(db, collectionName, docId);
      
      const fetchPromise = getDoc(docRef);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Firestore timeout - using fallback')), 3000)
      );
      
      const docSnap = await Promise.race([fetchPromise, timeoutPromise]);

      if (!docSnap.exists()) {
        console.warn(`⚠️ No test document found in ${collectionName}, using fallback`);
        createFallbackUser(role);
        return;
      }

      const data = docSnap.data();
      console.log('✅ Firestore Test Account Loaded:', data);

      let profile: ShipperProfile | DriverProfile | AdminProfile;
      
      if (role === 'driver') {
        profile = {
          ...dummyDriverProfile,
          ...data,
          firstName: data.firstName || data.name || 'Demo',
          lastName: data.lastName || 'Driver',
        };
      } else if (role === 'shipper') {
        profile = {
          ...dummyShipperProfile,
          ...data,
          companyName: data.companyName || data.name || 'Demo Company',
        };
      } else {
        profile = {
          name: data.name || 'Admin User',
          permissions: data.permissions || ['all'],
        };
      }

      const testUser: User = {
        id: data.uid || docId,
        email: data.email || `${role}_test@loadrush.ai`,
        role: role,
        createdAt: data.createdAt || new Date().toISOString(),
        profile,
      };

      setUser(testUser);
      setStorageItem(`user_role_${testUser.id}`, testUser.role);
      console.log(`✅ ${role} test account connected successfully`, testUser);
    } catch (err: any) {
      console.error('🔥 Firestore Quick Login Error:', err);
      console.log('⚠️ Using fallback authentication due to:', err.message || 'Unknown error');
      createFallbackUser(role);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Update Profile
  const updateProfile = useCallback(
    async (updatedProfile: ShipperProfile | DriverProfile) => {
      if (!user) throw new Error('No user logged in');

      const updatedUser: User = { ...user, profile: updatedProfile };
      setUser(updatedUser);

      if (user.id.startsWith('test-')) {
        console.log('🔥 Test user - profile updated in memory only');
      } else {
        setStorageItem(`user_profile_${user.id}`, JSON.stringify(updatedProfile));
        console.log('🔥 Profile updated in local storage');
      }
    },
    [user]
  );

  const clearError = useCallback(() => setError(null), []);

  // Return full context
  return useMemo(
    () => ({
      user,
      loading,
      error,
      signUp,
      signIn,
      signOut,
      quickTestLogin,
      updateProfile,
      isAuthenticated: !!user,
      clearError,
    }),
    [user, loading, error, signUp, signIn, signOut, quickTestLogin, updateProfile, clearError]
  );
});

