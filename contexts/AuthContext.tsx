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
  console.log('🔍 [resolveUserRole] Starting role resolution for:', { uid, email });
  
  const emailHint: UserRole | null = email?.includes('shipper')
    ? 'shipper'
    : email?.includes('admin')
    ? 'admin'
    : email?.includes('driver')
    ? 'driver'
    : null;

  console.log('📧 [resolveUserRole] Email hint detected:', emailHint);

  if (emailHint) {
    console.log('✅ [resolveUserRole] Email hint found - using as PRIMARY source:', emailHint);
    let profile: ShipperProfile | DriverProfile | AdminProfile = 
      emailHint === 'shipper' ? dummyShipperProfile :
      emailHint === 'admin' ? { name: 'Admin User', permissions: ['all'] } :
      dummyDriverProfile;

    try {
      const { db } = await import('@/config/firebase');
      const { doc, getDoc } = await import('firebase/firestore');

      const collectionName = emailHint === 'shipper' ? 'shippers' : emailHint === 'admin' ? 'admins' : 'drivers';
      console.log(`🔍 [resolveUserRole] Checking ${collectionName} collection for enhanced profile...`);
      
      const userDoc = await getDoc(doc(db, collectionName, uid));
      if (userDoc.exists()) {
        console.log(`✅ [resolveUserRole] Enhanced profile found in ${collectionName}!`);
        const data = userDoc.data() as any;
        
        if (emailHint === 'shipper') {
          profile = {
            ...dummyShipperProfile,
            ...data,
            companyName: data?.companyName || data?.name || 'Company',
          };
        } else if (emailHint === 'driver') {
          profile = {
            ...dummyDriverProfile,
            ...data,
            firstName: data?.firstName || data?.name || 'Driver',
            lastName: data?.lastName || '',
          };
        } else {
          profile = {
            name: data?.name || 'Admin User',
            permissions: data?.permissions || ['all'],
          };
        }
      } else {
        console.log(`⚠️ [resolveUserRole] No Firestore document found - using default ${emailHint} profile`);
      }
    } catch (firestoreError) {
      const errorMsg = firestoreError instanceof Error ? firestoreError.message : String(firestoreError);
      console.error('🔥 [resolveUserRole] Firestore error (non-critical):', errorMsg);
      console.log(`✅ [resolveUserRole] Continuing with default ${emailHint} profile`);
    }

    setStorageItem(`user_role_${uid}`, emailHint);
    console.log('✅ [resolveUserRole] Final resolved role:', emailHint);
    return { role: emailHint, profile };
  }

  console.log('⚠️ [resolveUserRole] No email hint - checking Firestore and storage...');
  let detectedRole: UserRole = 'driver';
  let profile: ShipperProfile | DriverProfile | AdminProfile = dummyDriverProfile;

  try {
    const { db } = await import('@/config/firebase');
    const { doc, getDoc } = await import('firebase/firestore');

    const collections: { name: string; role: UserRole }[] = [
      { name: 'drivers', role: 'driver' },
      { name: 'shippers', role: 'shipper' },
      { name: 'admins', role: 'admin' },
    ];

    for (const { name, role } of collections) {
      console.log(`🔍 [resolveUserRole] Checking ${name} collection...`);
      const userDoc = await getDoc(doc(db, name, uid));
      if (userDoc.exists()) {
        console.log(`✅ [resolveUserRole] Found in ${name}!`);
        detectedRole = role;
        const data = userDoc.data() as any;
        
        if (role === 'shipper') {
          profile = {
            ...dummyShipperProfile,
            ...data,
            companyName: data?.companyName || data?.name || 'Company',
          };
        } else if (role === 'driver') {
          profile = {
            ...dummyDriverProfile,
            ...data,
            firstName: data?.firstName || data?.name || 'Driver',
            lastName: data?.lastName || '',
          };
        } else {
          profile = {
            name: data?.name || 'Admin User',
            permissions: data?.permissions || ['all'],
          };
        }
        
        setStorageItem(`user_role_${uid}`, detectedRole);
        console.log('✅ [resolveUserRole] Final resolved role:', detectedRole);
        return { role: detectedRole, profile };
      }
    }

    console.log('⚠️ [resolveUserRole] No Firestore document found in any collection');
    
    const storedRole = getStorageItem(`user_role_${uid}`) as UserRole;
    if (storedRole) {
      console.log('✅ [resolveUserRole] Using stored role:', storedRole);
      detectedRole = storedRole;
      profile = detectedRole === 'shipper' ? dummyShipperProfile :
               detectedRole === 'admin' ? { name: 'Admin User', permissions: ['all'] } :
               dummyDriverProfile;
    } else {
      console.log('⚠️ [resolveUserRole] No stored role - defaulting to driver');
      detectedRole = 'driver';
      profile = dummyDriverProfile;
    }

  } catch (firestoreError) {
    const errorMsg = firestoreError instanceof Error ? firestoreError.message : String(firestoreError);
    console.error('🔥 [resolveUserRole] Firestore error:', errorMsg);
    
    const storedRole = getStorageItem(`user_role_${uid}`) as UserRole;
    if (storedRole) {
      console.log('✅ [resolveUserRole] Using stored role after error:', storedRole);
      detectedRole = storedRole;
      profile = detectedRole === 'shipper' ? dummyShipperProfile :
               detectedRole === 'admin' ? { name: 'Admin User', permissions: ['all'] } :
               dummyDriverProfile;
    } else {
      console.log('⚠️ [resolveUserRole] Falling back to driver after error');
      detectedRole = 'driver';
      profile = dummyDriverProfile;
    }
  }

  console.log('✅ [resolveUserRole] Final resolved role:', detectedRole);
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
            console.log('🔥 [onAuthStateChanged] User detected, resolving role...');
            const uid = fbUser.uid;
            const { role, profile } = await resolveUserRole(uid, fbUser.email);
            console.log('✅ [onAuthStateChanged] Setting user with role:', role);
            setUser({
              id: uid,
              email: fbUser.email || '',
              role,
              createdAt: new Date().toISOString(),
              profile,
            });
          } else {
            console.log('🔥 [onAuthStateChanged] No user detected');
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
      console.log('🔐 [signIn] Starting sign in for:', email);
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const userEmail = userCredential.user.email || '';

      console.log('🔐 [signIn] Firebase auth successful, resolving role...');
      const { role, profile } = await resolveUserRole(uid, userEmail);

      const existingUser: User = {
        id: uid,
        email: userEmail,
        role,
        createdAt: new Date().toISOString(),
        profile,
      };

      console.log('🔐 [signIn] Setting user with role:', role);
      setUser(existingUser);
      console.log('✅ [signIn] Sign in successful as:', role);
      return existingUser;
    } catch (err) {
      const authError = err as AuthError;
      console.error('🔥 [signIn] Sign in error:', authError.code, authError.message);
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

  const adminBypass = useCallback(() => {
    console.log('🔐 Admin bypass activated');
    const adminUser: User = {
      id: 'admin-bypass',
      email: 'admin@loadrush.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
      profile: { name: 'Admin User', permissions: ['all'] },
    };
    setUser(adminUser);
    return adminUser;
  }, []);

  return useMemo(
    () => ({
      user,
      loading,
      error,
      signUp,
      signIn,
      signOut,
      updateProfile,
      isAuthenticated: !!user,
      clearError,
      adminBypass,
    }),
    [user, loading, error, signUp, signIn, signOut, updateProfile, clearError, adminBypass],
  );
});
