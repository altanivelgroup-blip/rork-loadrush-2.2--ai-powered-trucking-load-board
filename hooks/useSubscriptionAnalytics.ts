import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface SubscriptionData {
  id: string;
  role: 'driver' | 'shipper';
  plan: string;
  price: number;
  status: string;
  renewalDate?: any;
}

export interface SubscriptionAnalytics {
  driverCount: number;
  shipperCount: number;
  driverMRR: number;
  shipperMRR: number;
  totalCount: number;
  totalMRR: number;
  formattedDriverMRR: string;
  formattedShipperMRR: string;
  formattedTotalMRR: string;
  isLoading: boolean;
  error: string | null;
}

export function useSubscriptionAnalytics(): SubscriptionAnalytics {
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics>({
    driverCount: 0,
    shipperCount: 0,
    driverMRR: 0,
    shipperMRR: 0,
    totalCount: 0,
    totalMRR: 0,
    formattedDriverMRR: '$0.00',
    formattedShipperMRR: '$0.00',
    formattedTotalMRR: '$0.00',
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    console.log('[Subscription Analytics] Setting up real-time listener...');

    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      subscriptionsQuery,
      (snapshot) => {
        console.log('[Subscription Analytics] Snapshot received:', snapshot.size, 'active subscriptions');

        let driverCount = 0;
        let shipperCount = 0;
        let driverMRR = 0;
        let shipperMRR = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as SubscriptionData;
          const price = data.price || 0;

          if (data.role === 'driver') {
            driverCount++;
            driverMRR += price;
          } else if (data.role === 'shipper') {
            shipperCount++;
            shipperMRR += price;
          }
        });

        const totalCount = driverCount + shipperCount;
        const totalMRR = driverMRR + shipperMRR;

        const formatCurrency = (amount: number) =>
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(amount);

        console.log('[Subscription Analytics] Computed:', {
          driverCount,
          shipperCount,
          driverMRR,
          shipperMRR,
          totalMRR,
        });

        setAnalytics({
          driverCount,
          shipperCount,
          driverMRR,
          shipperMRR,
          totalCount,
          totalMRR,
          formattedDriverMRR: formatCurrency(driverMRR),
          formattedShipperMRR: formatCurrency(shipperMRR),
          formattedTotalMRR: formatCurrency(totalMRR),
          isLoading: false,
          error: null,
        });
      },
      (error) => {
        console.error('[Subscription Analytics] Error listening to subscriptions:', error);
        setAnalytics((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      }
    );

    const intervalId = setInterval(() => {
      console.log('[Subscription Analytics] Auto-refresh triggered (30s interval)');
    }, 30000);

    return () => {
      console.log('[Subscription Analytics] Cleaning up listener...');
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  return analytics;
}
