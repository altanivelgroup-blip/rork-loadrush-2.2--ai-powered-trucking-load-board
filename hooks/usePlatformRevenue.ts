import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface PlatformRevenue {
  totalRevenue: number;
  commission: number;
  formattedRevenue: string;
  formattedCommission: string;
  completedLoadsCount: number;
  isLoading: boolean;
  error: string | null;
}

const COMMISSION_RATE = 0.05;

export function usePlatformRevenue(): PlatformRevenue {
  const [revenue, setRevenue] = useState<PlatformRevenue>({
    totalRevenue: 0,
    commission: 0,
    formattedRevenue: '$0.00',
    formattedCommission: '$0.00',
    completedLoadsCount: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    console.log('[Platform Revenue] Setting up real-time listener for completed loads...');

    const loadsQuery = query(
      collection(db, 'loads'),
      where('status', '==', 'Completed')
    );

    const unsubscribe = onSnapshot(
      loadsQuery,
      (snapshot) => {
        console.log('[Platform Revenue] Snapshot received:', snapshot.size, 'completed loads');

        let totalRevenue = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const price = data.price || data.rate || 0;
          totalRevenue += price;
        });

        const commission = totalRevenue * COMMISSION_RATE;

        const formattedRevenue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalRevenue);

        const formattedCommission = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(commission);

        console.log('[Platform Revenue] Computed:', {
          totalRevenue,
          commission,
          completedLoadsCount: snapshot.size,
        });

        setRevenue({
          totalRevenue,
          commission,
          formattedRevenue,
          formattedCommission,
          completedLoadsCount: snapshot.size,
          isLoading: false,
          error: null,
        });
      },
      (error) => {
        console.error('[Platform Revenue] Error listening to loads:', error);
        setRevenue((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      }
    );

    return () => {
      console.log('[Platform Revenue] Cleaning up listener...');
      unsubscribe();
    };
  }, []);

  return revenue;
}
