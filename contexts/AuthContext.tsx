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

const getStorageItem = (key: string): string | null => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return null;
};

const setStorageItem = (key: string, value: string): void => {
  if (Platform.OS === 'web') localStorage.setItem(key, value);
};

async function resolveUserRole(
  uid: string,
  email: string | null | undefined,
): Promise<{ role: UserRole; profile: ShipperProfile | DriverProfile | AdminProfile }> {
  let detectedRole: UserRole = 'driver';
  let profile: ShipperProfile | DriverProfile | AdminProfile = dummyDriverProfile;

  const emailHint: UserRole | null = email?.includes('shipper')
    ? 'shipper'
    : email?.includes('admin')
    ? 'admin'
    : email?.includes('driver')
    ? 'driver'
    : null;

  try {
    const { db } = await import('@/config/firebase');
    const { doc, getDoc } = await import('firebase/firestore');

    const shipperDoc = await getDoc(doc(db, 'shippers', uid));
    if (shipperDoc.exists()) {
      console.log('✅ Found shipper profile in Firestore');
      detectedRole = 'shipper';
      const data = shipperDoc.data() as any;
      profile = {
        ...dummyShipperProfile,
        ...data,
        companyName: data?.companyName || data?.name || 'Company',
      };
    } else {
      const driverDoc = await getDoc(doc(db, 'drivers', uid));
      if (driverDoc.exists()) {
        console.log('✅ Found driver profile in Firestore');
        detectedRole = 'driver';
        const data = driverDoc.data() as any;
        profile = {
          ...dummyDriverProfile,
          ...data,
          firstName: data?.firstName || data?.name || 'Driver',
          lastName: data?.lastName || '',
        };
      } else {
        const adminDoc = await getDoc(doc(db, 'admins', uid));
        if (adminDoc.exists()) {
          console.log('✅ Found admin profile in Firestore');
          detectedRole = 'admin';
          const data = adminDoc.data() as any;
          profile = {
            name: data?.name || 'Admin User',
            permissions: data?.permissions || ['all'],
          };
        } else {
          const storedRole = getStorageItem(`user_role_${uid}`) as UserRole;
          if (emailHint && storedRole && storedRole !== emailHint) {
            console.log('⚠️ Stored role conflicts with email hint. Using email hint', { storedRole, emailHint });
            detectedRole = emailHint;
          } else if (storedRole) {
            console.log('⚠️ No Firestore profile found, using stored role:', storedRole);
            detectedRole = storedRole;
          } else if (emailHint) {
            console.log('📧 Using email-based role:', emailHint);
            detectedRole = emailHint;
          } else {
            console.log('⚠️ No source for role. Falling back to driver');
            detectedRole = 'driver';
          }

          profile =
            detectedRole === 'shipper'
              ? dummyShipperProfile
              : detectedRole === 'admin'
              ? { name: 'Admin User', permissions: ['all'] }
              : dummyDriverProfile;
        }
      }
    }
  } catch (firestoreError) {
    const errorMsg = firestoreError instanceof Error ? firestoreError.message : String(firestoreError);
    console.error('🔥 Firestore role lookup error:', errorMsg);
    const storedRole = getStorageItem(`user_role_${uid}`) as UserRole;
    if (emailHint && storedRole && storedRole !== emailHint) {
      console.log('⚠️ Firestore error: stored role conflicts with email hint. Using email hint', { storedRole, emailHint });
      detectedRole = emailHint;
    } else if (storedRole) {
      console.log('⚠️ Firestore error, using stored role:', storedRole);
      detectedRole = storedRole;
    } else if (emailHint) {
      console.log('📧 Firestore error, using email-based role:', emailHint);
      detectedRole = emailHint;
    } else {
      console.log('⚠️ Firestore error, falling back to driver');
      detectedRole = 'driver';
    }

    profile =
      detectedRole === 'shipper'
        ? dummyShipperProfile
        : detectedRole === 'admin'
        ? { name: 'Admin User', permissions: ['all'] }
        : dummyDriverProfile;
  }

  setStorageItem(`user_role_${uid}`, detectedRole);
  return { role: detectedRole, profile };
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔥 Firebase Auth: Setting up listener');
    let mounted = true;

    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.log('⚠️ Auth timeout reached - proceeding without Firebase');
        setLoading(false);
      }
    }, 2000);

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (fbUser) => {
          if (!mounted) return;
          clearTimeout(timeoutId);

          if (fbUser) {
            const uid = fbUser.uid;
            const { role, profile } = await resolveUserRole(uid, fbUser.email);
            console.log('✅ onAuthStateChanged: Setting user with role:', role);
            setUser({
              id: uid,
              email: fbUser.email || '',
              role,
              createdAt: new Date().toISOString(),
              profile,
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        },
        (err) => {
          if (!mounted) return;
          console.error('🔥 Firebase Auth Error:', err);
          clearTimeout(timeoutId);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('🔥 Firebase Auth Setup Error:', err);
      clearTimeout(timeoutId);
      if (mounted) {
        setLoading(false);
      }
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (err) {
          console.error('🔥 Error unsubscribing from auth:', err);
        }
      }
    };
  }, []);

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

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const userEmail = userCredential.user.email || '';

      const { role, profile } = await resolveUserRole(uid, userEmail);

      const existingUser: User = {
        id: uid,
        email: userEmail,
        role,
        createdAt: new Date().toISOString(),
        profile,
      };

      setUser(existingUser);
      console.log('✅ Sign in successful as:', role);
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

  const signOut = useCallback(async () => {
    try {
      console.log('🔥 Signing out user...');
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);

      if (Platform.OS === 'web') {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith('user_role_') || key.startsWith('user_profile_')) {
            localStorage.removeItem(key);
          }
        });
      }

      console.log('✅ Sign out successful');
    } catch (err) {
      console.error('🔥 Sign out error:', err);
      setError('Failed to sign out');
      throw err;
    }
  }, []);

  const quickTestLogin = useCallback(async (role: UserRole) => {
    console.log('🔥 Firestore Quick Test Login -', role);
    setError(null);
    setLoading(true);

    const createFallbackUser = (r: UserRole) => {
      let profile: ShipperProfile | DriverProfile | AdminProfile;

      if (r === 'driver') {
        profile = dummyDriverProfile;
      } else if (r === 'shipper') {
        profile = dummyShipperProfile;
      } else {
        profile = {
          name: 'Admin User',
          permissions: ['all'],
        };
      }

      const fallbackUser: User = {
        id: `test-${r}-${Date.now()}`,
        email: `${r}_test@loadrush.ai`,
        role: r,
        createdAt: new Date().toISOString(),
        profile,
      };

      console.log(`✅ Creating ${r} fallback user:`, fallbackUser);
      setUser(fallbackUser);
      setStorageItem(`user_role_${fallbackUser.id}`, fallbackUser.role);
      console.log(`✅ ${r} fallback test account created successfully with role:`, fallbackUser.role);
      setLoading(false);
    };

    try {
      const { db } = await import('@/config/firebase');
      const { doc, getDoc } = await import('firebase/firestore');

      let collectionName: string;
      let docId: string;

      if (role === 'driver') {
        collectionName = 'driver_test';
        docId = 'DRIVER_TEST_001';
      } else if (role === 'shipper') {
        collectionName = 'shipper_test';
        docId = 'SHIPPER_TEST_001';
      } else {
        collectionName = 'admin_test';
        docId = 'ADMIN_TEST_001';
      }

      console.log(`🔍 Attempting to fetch: ${collectionName}/${docId}`);

      const docRef = doc(db, collectionName, docId);

      const fetchPromise = getDoc(docRef);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout - using fallback')), 3000),
      );

      const docSnap = await Promise.race([fetchPromise, timeoutPromise] as const);

      if (!(docSnap as any).exists()) {
        console.warn(`⚠️ No test document found in ${collectionName}, using fallback`);
        createFallbackUser(role);
        return;
      }

      const data: any = (docSnap as any).data();
      console.log('✅ Firestore Test Account Loaded:', data);

      let profile: ShipperProfile | DriverProfile | AdminProfile;

      if (role === 'driver') {
        profile = {
          ...dummyDriverProfile,
          ...data,
          firstName: data?.firstName || data?.name || 'Demo',
          lastName: data?.lastName || 'Driver',
        };
      } else if (role === 'shipper') {
        profile = {
          ...dummyShipperProfile,
          ...data,
          companyName: data?.companyName || data?.name || 'Demo Company',
        };
      } else {
        profile = {
          name: data?.name || 'Admin User',
          permissions: data?.permissions || ['all'],
        };
      }

      const testUser: User = {
        id: data?.uid || docId,
        email: data?.email || `${role}_test@loadrush.ai`,
        role: role,
        createdAt: data?.createdAt || new Date().toISOString(),
        profile,
      };

      console.log(`✅ Creating ${role} test user from Firestore:`, testUser);
      setUser(testUser);
      setStorageItem(`user_role_${testUser.id}`, testUser.role);
      console.log(`✅ ${role} test account connected successfully with role:`, testUser.role);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('🔥 Firestore Quick Login Error -', errorMessage);
      console.log('⚠️ Using fallback authentication due to -', errorMessage);
      createFallbackUser(role);
    } finally {
      setLoading(false);
    }
  }, []);

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
    [user],
  );

  const clearError = useCallback(() => setError(null), []);

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
    [user, loading, error, signUp, signIn, signOut, quickTestLogin, updateProfile, clearError],
  );
});
