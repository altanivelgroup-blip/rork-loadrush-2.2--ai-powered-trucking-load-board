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
            let detectedRole: UserRole = 'driver';
            let profile: ShipperProfile | DriverProfile | AdminProfile = dummyDriverProfile;

            try {
              const { db } = await import('@/config/firebase');
              const { doc, getDoc } = await import('firebase/firestore');

              const shipperDoc = await getDoc(doc(db, 'shippers', uid));
              if (shipperDoc.exists()) {
                console.log('✅ Found shipper profile in Firestore (onAuthStateChanged)');
                detectedRole = 'shipper';
                const data = shipperDoc.data();
                profile = {
                  ...dummyShipperProfile,
                  ...data,
                  companyName: data.companyName || data.name || 'Company',
                };
              } else {
                const driverDoc = await getDoc(doc(db, 'drivers', uid));
                if (driverDoc.exists()) {
                  console.log('✅ Found driver profile in Firestore (onAuthStateChanged)');
                  detectedRole = 'driver';
                  const data = driverDoc.data();
                  profile = {
                    ...dummyDriverProfile,
                    ...data,
                    firstName: data.firstName || data.name || 'Driver',
                    lastName: data.lastName || '',
                  };
                } else {
                  const adminDoc = await getDoc(doc(db, 'admins', uid));
                  if (adminDoc.exists()) {
                    console.log('✅ Found admin profile in Firestore (onAuthStateChanged)');
                    detectedRole = 'admin';
                    const data = adminDoc.data();
                    profile = {
                      name: data.name || 'Admin User',
                      permissions: data.permissions || ['all'],
                    };
                  } else {
                    const storedRole = getStorageItem(`user_role_${uid}`) as UserRole;
                    if (storedRole) {
                      console.log('⚠️ No Firestore profile found (onAuthStateChanged), using stored role:', storedRole);
                      detectedRole = storedRole;
                      profile = storedRole === 'shipper' ? dummyShipperProfile : storedRole === 'admin' ? { name: 'Admin User', permissions: ['all'] } : dummyDriverProfile;
                    } else {
                      if (fbUser.email?.includes('shipper')) {
                        console.log('📧 Email contains "shipper" (onAuthStateChanged) - setting role to shipper');
                        detectedRole = 'shipper';
                        profile = dummyShipperProfile;
                      } else if (fbUser.email?.includes('admin')) {
                        console.log('📧 Email contains "admin" (onAuthStateChanged) - setting role to admin');
                        detectedRole = 'admin';
                        profile = { name: 'Admin User', permissions: ['all'] };
                      } else if (fbUser.email?.includes('driver')) {
                        console.log('📧 Email contains "driver" (onAuthStateChanged) - setting role to driver');
                        detectedRole = 'driver';
                        profile = dummyDriverProfile;
                      }
                      console.log('⚠️ No Firestore profile found (onAuthStateChanged), using email-based role:', detectedRole);
                    }
                  }
                }
              }
            } catch (firestoreError) {
              const errorMsg = firestoreError instanceof Error ? firestoreError.message : String(firestoreError);
              console.error('🔥 Firestore role lookup error (onAuthStateChanged):', errorMsg);
              const storedRole = getStorageItem(`user_role_${uid}`) as UserRole;
              if (storedRole) {
                console.log('⚠️ Firestore error (onAuthStateChanged), using stored role:', storedRole);
                detectedRole = storedRole;
                profile = storedRole === 'shipper' ? dummyShipperProfile : storedRole === 'admin' ? { name: 'Admin User', permissions: ['all'] } : dummyDriverProfile;
              } else {
                if (fbUser.email?.includes('shipper')) {
                  console.log('📧 Email contains "shipper" (onAuthStateChanged error fallback) - setting role to shipper');
                  detectedRole = 'shipper';
                  profile = dummyShipperProfile;
                } else if (fbUser.email?.includes('admin')) {
                  console.log('📧 Email contains "admin" (onAuthStateChanged error fallback) - setting role to admin');
                  detectedRole = 'admin';
                  profile = { name: 'Admin User', permissions: ['all'] };
                } else if (fbUser.email?.includes('driver')) {
                  console.log('📧 Email contains "driver" (onAuthStateChanged error fallback) - setting role to driver');
                  detectedRole = 'driver';
                  profile = dummyDriverProfile;
                }
                console.log('⚠️ Firestore error (onAuthStateChanged), using email-based role:', detectedRole);
              }
            }

            setStorageItem(`user_role_${uid}`, detectedRole);
            console.log('✅ onAuthStateChanged: Setting user with role:', detectedRole);

            setUser({
              id: uid,
              email: fbUser.email || '',
              role: detectedRole,
              createdAt: new Date().toISOString(),
              profile,
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        },
        (error) => {
          if (!mounted) return;
          console.error('🔥 Firebase Auth Error:', error);
          clearTimeout(timeoutId);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('🔥 Firebase Auth Setup Error:', error);
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
        } catch (error) {
          console.error('🔥 Error unsubscribing from auth:', error);
        }
      }
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
      const uid = userCredential.user.uid;
      const userEmail = userCredential.user.email || '';
      
      let detectedRole: UserRole = 'driver';
      let profile: ShipperProfile | DriverProfile | AdminProfile = dummyDriverProfile;

      try {
        const { db } = await import('@/config/firebase');
        const { doc, getDoc } = await import('firebase/firestore');

        const shipperDoc = await getDoc(doc(db, 'shippers', uid));
        if (shipperDoc.exists()) {
          console.log('✅ Found shipper profile in Firestore');
          detectedRole = 'shipper';
          const data = shipperDoc.data();
          profile = {
            ...dummyShipperProfile,
            ...data,
            companyName: data.companyName || data.name || 'Company',
          };
        } else {
          const driverDoc = await getDoc(doc(db, 'drivers', uid));
          if (driverDoc.exists()) {
            console.log('✅ Found driver profile in Firestore');
            detectedRole = 'driver';
            const data = driverDoc.data();
            profile = {
              ...dummyDriverProfile,
              ...data,
              firstName: data.firstName || data.name || 'Driver',
              lastName: data.lastName || '',
            };
          } else {
            const adminDoc = await getDoc(doc(db, 'admins', uid));
            if (adminDoc.exists()) {
              console.log('✅ Found admin profile in Firestore');
              detectedRole = 'admin';
              const data = adminDoc.data();
              profile = {
                name: data.name || 'Admin User',
                permissions: data.permissions || ['all'],
              };
            } else {
              const storedRole = getStorageItem(`user_role_${uid}`) as UserRole;
              if (storedRole) {
                console.log('⚠️ No Firestore profile found, using stored role:', storedRole);
                detectedRole = storedRole;
                profile = storedRole === 'shipper' ? dummyShipperProfile : storedRole === 'admin' ? { name: 'Admin User', permissions: ['all'] } : dummyDriverProfile;
              } else {
                if (userEmail.includes('shipper')) {
                  console.log('📧 Email contains "shipper" - setting role to shipper');
                  detectedRole = 'shipper';
                  profile = dummyShipperProfile;
                } else if (userEmail.includes('admin')) {
                  console.log('📧 Email contains "admin" - setting role to admin');
                  detectedRole = 'admin';
                  profile = { name: 'Admin User', permissions: ['all'] };
                } else if (userEmail.includes('driver')) {
                  console.log('📧 Email contains "driver" - setting role to driver');
                  detectedRole = 'driver';
                  profile = dummyDriverProfile;
                }
                console.log('⚠️ No Firestore profile found, using email-based role:', detectedRole);
              }
            }
          }
        }
      } catch (firestoreError) {
        const errorMsg = firestoreError instanceof Error ? firestoreError.message : String(firestoreError);
        console.error('🔥 Firestore role lookup error:', errorMsg);
        const storedRole = getStorageItem(`user_role_${uid}`) as UserRole;
        if (storedRole) {
          detectedRole = storedRole;
          profile = storedRole === 'shipper' ? dummyShipperProfile : storedRole === 'admin' ? { name: 'Admin User', permissions: ['all'] } : dummyDriverProfile;
        } else {
          if (userEmail.includes('shipper')) {
            console.log('📧 Email contains "shipper" - setting role to shipper');
            detectedRole = 'shipper';
            profile = dummyShipperProfile;
          } else if (userEmail.includes('admin')) {
            console.log('📧 Email contains "admin" - setting role to admin');
            detectedRole = 'admin';
            profile = { name: 'Admin User', permissions: ['all'] };
          } else if (userEmail.includes('driver')) {
            console.log('📧 Email contains "driver" - setting role to driver');
            detectedRole = 'driver';
            profile = dummyDriverProfile;
          }
          console.log('⚠️ Firestore error, using email-based role:', detectedRole);
        }
      }

      setStorageItem(`user_role_${uid}`, detectedRole);

      const existingUser: User = {
        id: uid,
        email: userEmail,
        role: detectedRole,
        createdAt: new Date().toISOString(),
        profile,
      };

      setUser(existingUser);
      console.log('✅ Sign in successful as:', detectedRole);
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
      console.log('🔥 Signing out user...');
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
      
      if (Platform.OS === 'web') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
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

      console.log(`✅ Creating ${role} fallback user:`, fallbackUser);
      setUser(fallbackUser);
      setStorageItem(`user_role_${fallbackUser.id}`, fallbackUser.role);
      console.log(`✅ ${role} fallback test account created successfully with role:`, fallbackUser.role);
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

