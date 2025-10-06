import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { auth } from '@/config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  AuthError
} from 'firebase/auth';
import { User, UserRole, ShipperProfile, DriverProfile } from '@/types';
import { dummyDriverProfile, dummyShipperProfile } from '@/mocks/dummyData';

const getStorageItem = (key: string): string | null => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return null;
};

const setStorageItem = (key: string, value: string): void => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  }
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔥 Firebase Auth: Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      console.log('🔥 Firebase Auth: State changed -', fbUser ? `User: ${fbUser.email}` : 'No user');
      
      if (fbUser) {
        const storedRole = getStorageItem(`user_role_${fbUser.uid}`) as UserRole || 'driver';
        console.log('🔥 Firebase Auth: User role -', storedRole);
        
        let profile;
        if (storedRole === 'driver') {
          profile = dummyDriverProfile;
        } else if (storedRole === 'shipper') {
          profile = dummyShipperProfile;
        } else {
          profile = { name: 'Admin User', permissions: ['all'] };
        }

        setUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          role: storedRole,
          createdAt: new Date().toISOString(),
          profile,
        });
        setError(null);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('🔥 Firebase Auth: Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, role: UserRole) => {
    try {
      console.log('🔥 Firebase Auth: Signing up -', email, role);
      setError(null);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setStorageItem(`user_role_${userCredential.user.uid}`, role);
      
      console.log('🔥 Firebase Auth: Sign up successful -', userCredential.user.uid);
    
    let profile;
    if (role === 'driver') {
      profile = dummyDriverProfile;
    } else if (role === 'shipper') {
      profile = dummyShipperProfile;
    } else {
      profile = { name: 'Admin User', permissions: ['all'] };
    }

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
      console.error('🔥 Firebase Auth: Sign up error -', authError.code, authError.message);
      
      let errorMessage = 'Failed to create account';
      if (authError.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔥 Firebase Auth: Signing in -', email);
      setError(null);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const storedRole = getStorageItem(`user_role_${userCredential.user.uid}`) as UserRole || 'driver';
      
      console.log('🔥 Firebase Auth: Sign in successful -', userCredential.user.uid, storedRole);
    
    let profile;
    if (storedRole === 'driver') {
      profile = dummyDriverProfile;
    } else if (storedRole === 'shipper') {
      profile = dummyShipperProfile;
    } else {
      profile = { name: 'Admin User', permissions: ['all'] };
    }

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
      console.error('🔥 Firebase Auth: Sign in error -', authError.code, authError.message);
      
      let errorMessage = 'Failed to sign in';
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (authError.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('🔥 Firebase Auth: Signing out');
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
      console.log('🔥 Firebase Auth: Sign out successful');
    } catch (err) {
      console.error('🔥 Firebase Auth: Sign out error -', err);
      setError('Failed to sign out');
      throw err;
    }
  }, []);

  const quickTestLogin = useCallback((role: UserRole) => {
    console.log('🔥 Firebase Auth: Quick test login (bypass) -', role);
    setError(null);
    
    let profile;
    if (role === 'driver') {
      profile = dummyDriverProfile;
    } else if (role === 'shipper') {
      profile = dummyShipperProfile;
    } else {
      profile = { name: 'Admin User', permissions: ['all'] };
    }

    const testUser: User = {
      id: `test-${role}-${Date.now()}`,
      email: `test-${role}@loadrush.app`,
      role,
      createdAt: new Date().toISOString(),
      profile,
    };

    setUser(testUser);
    setLoading(false);
  }, []);
  
  const updateProfile = useCallback(async (updatedProfile: ShipperProfile | DriverProfile) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    console.log('Updating profile:', updatedProfile);
    
    const updatedUser: User = {
      ...user,
      profile: updatedProfile,
    };
    
    setUser(updatedUser);
    
    if (user.id.startsWith('test-')) {
      console.log('🔥 Firebase Auth: Test user - profile updated in memory only');
    } else {
      setStorageItem(`user_profile_${user.id}`, JSON.stringify(updatedProfile));
      console.log('🔥 Firebase Auth: Profile updated in storage');
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(() => ({
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
  }), [user, loading, error, signUp, signIn, signOut, quickTestLogin, updateProfile, clearError]);
});
