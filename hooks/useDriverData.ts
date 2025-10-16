import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentData } from './useDocumentData';
import { useCollectionData } from './useCollectionData';
import { DriverProfile, Load, AnalyticsData } from '@/types';
import { db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';

/* -------------------------------------------------------------------------- */
/*                              DRIVER INTERFACES                             */
/* -------------------------------------------------------------------------- */

export interface DriverFirestoreProfile {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  avgMPG?: number;
  completedLoads?: number;
  totalLoads?: number;
  status?: 'active' | 'offline' | 'banned';
  lastActive?: string;
  dotNumber?: string;
  mcNumber?: string;
  truckInfo?: DriverProfile['truckInfo'];
  trailerInfo?: DriverProfile['trailerInfo'];
  equipment?: string[];
  wallet?: number;
  documents?: DriverProfile['documents'];
  maintenanceRecords?: DriverProfile['maintenanceRecords'];
}

interface DriverStats {
  totalLoads: number;
  completedLoads: number;
  activeLoads: number;
  totalEarnings: number;
  availableBalance: number;
  avgMPG: number;
  status: 'active' | 'inactive' | 'on_trip';
}

/* -------------------------------------------------------------------------- */
/*                              FETCH HELPER LOGIC                            */
/* -------------------------------------------------------------------------- */

async function fetchDriverProfile(uid: string): Promise<DriverFirestoreProfile | null> {
  console.log('🧭 Fetching driver profile for UID:', uid);

  // Try main driver collection first
  const mainRef = doc(db, 'drivers', uid);
  let snap = await getDoc(mainRef);

  // If not found, try test collection
  if (!snap.exists()) {
    console.log('⚠️ Not found in /drivers, checking /driver_test...');
    const testRef = doc(db, 'driver_test', uid);
    snap = await getDoc(testRef);
  }

  if (!snap.exists()) {
    console.warn('❌ No driver profile found for UID:', uid);
    return null;
  }

  console.log('✅ Profile loaded successfully for:', uid);
  return snap.data() as DriverFirestoreProfile;
}

/* -------------------------------------------------------------------------- */
/*                                 MAIN HOOKS                                 */
/* -------------------------------------------------------------------------- */

export function useDriverProfile() {
  const { user } = useAuth();
  const driverId = user?.id;

  const path = driverId ? `drivers/${driverId}` : '';
  const { data, loading, error } = useDocumentData<DriverFirestoreProfile>(path);

  console.log('[Driver Firestore] Profile fetch:', {
    uid: driverId,
    hasData: !!data,
    loading,
    error: error?.message,
  });

  return { profile: data, loading, error };
}

export function useDriverStats() {
  const { user } = useAuth();
  const driverId = user?.id;

  const path = driverId ? `driverStats/${driverId}` : '';
  const { data, loading, error } = useDocumentData<DriverStats>(path);

  console.log('[Driver Firestore] Stats fetch:', {
    uid: driverId,
    hasData: !!data,
    loading,
    error: error?.message,
  });

  return { stats: data, loading, error };
}

export function useDriverLoads() {
  const { user } = useAuth();
  const driverId = user?.id;

  const { data: rawData, loading, error } = useCollectionData<Load>('loads', {
    queries: driverId
      ? [{ field: 'matchedDriverId', operator: '==', value: driverId }]
      : undefined,
  });

  const data = useMemo(() => {
    return [...rawData].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [rawData]);

  const activeLoads = useMemo(
    () =>
      data.filter(
        (load) => load.status === 'matched' || load.status === 'in_transit'
      ),
    [data]
  );

  const completedLoads = useMemo(
    () => data.filter((load) => load.status === 'delivered'),
    [data]
  );

  console.log('[Driver Firestore] Loads fetch:', {
    uid: driverId,
    total: data.length,
    active: activeLoads.length,
    completed: completedLoads.length,
    loading,
    error: error?.message,
  });

  return {
    loads: data,
    activeLoads,
    completedLoads,
    loading,
    error,
  };
}

export function useDriverAnalytics() {
  const { user } = useAuth();
  const driverId = user?.id;

  const path = driverId ? `driverAnalytics/${driverId}` : '';
  const { data, loading, error } = useDocumentData<AnalyticsData>(path);

  console.log('[Driver Firestore] Analytics fetch:', {
    uid: driverId,
    hasData: !!data,
    loading,
    error: error?.message,
  });

  return { analytics: data, loading, error };
}

export function useAvailableLoads() {
  const { data: rawData, loading, error } = useCollectionData<Load>('loads', {
    queries: [{ field: 'status', operator: '==', value: 'posted' }],
  });

  const data = useMemo(() => {
    const sorted = [...rawData].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    return sorted.slice(0, 20);
  }, [rawData]);

  const matchedLoads = useMemo(
    () => data.filter((load) => load.aiScore && load.aiScore > 80),
    [data]
  );

  console.log('[Driver Firestore] Available loads:', {
    total: data.length,
    matched: matchedLoads.length,
    loading,
    error,
  });

  return {
    availableLoads: data,
    matchedLoads,
    loading,
    error,
  };
}
