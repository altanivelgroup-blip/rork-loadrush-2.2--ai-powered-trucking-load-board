import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export type AlertType = 'loadCreated' | 'statusChanged' | 'driverAssigned';

export interface Alert {
  id: string;
  type: AlertType;
  loadId: string;
  oldStatus?: string;
  newStatus?: string;
  oldDriverId?: string;
  newDriverId?: string;
  timestamp: Timestamp;
  triggeredBy?: string;
  message: string;
}

export interface AdminAlertsState {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
}

export function useAdminAlerts() {
  const [state, setState] = useState<AdminAlertsState>({
    alerts: [],
    isLoading: true,
    error: null,
  });

  const loadCacheRef = useRef<Map<string, DocumentData>>(new Map());

  useEffect(() => {
    console.log('[Admin Alerts] Setting up real-time load listener...');

    const loadsQuery = query(collection(db, 'loads'), orderBy('createdAt', 'desc'));

    const unsubscribeLoads = onSnapshot(
      loadsQuery,
      async (snapshot) => {
        console.log('[Admin Alerts] Loads snapshot received:', snapshot.size, 'documents');

        snapshot.docChanges().forEach(async (change) => {
          const loadId = change.doc.id;
          const newData = change.doc.data();

          if (change.type === 'added') {
            const isInitialLoad = !loadCacheRef.current.size;
            
            if (!isInitialLoad) {
              console.log('[Admin Alerts] New load created:', loadId);
              
              const alert: Omit<Alert, 'id'> = {
                type: 'loadCreated',
                loadId,
                timestamp: Timestamp.now(),
                triggeredBy: newData.shipperId || 'unknown',
                message: `New load posted: ${newData.originCity || 'Unknown'} → ${newData.destinationCity || 'Unknown'}`,
              };

              await logAlertToFirestore(alert);
              await sendTwilioAlert(alert);
            }

            loadCacheRef.current.set(loadId, newData);
          } else if (change.type === 'modified') {
            const oldData = loadCacheRef.current.get(loadId);

            if (oldData) {
              if (oldData.status !== newData.status) {
                console.log('[Admin Alerts] Load status changed:', loadId, oldData.status, '→', newData.status);

                const alert: Omit<Alert, 'id'> = {
                  type: 'statusChanged',
                  loadId,
                  oldStatus: oldData.status,
                  newStatus: newData.status,
                  timestamp: Timestamp.now(),
                  triggeredBy: newData.assignedDriverId || newData.shipperId || 'unknown',
                  message: `Load status updated: ${oldData.status} → ${newData.status}`,
                };

                await logAlertToFirestore(alert);
                await sendTwilioAlert(alert);
              }

              if (oldData.assignedDriverId !== newData.assignedDriverId && newData.assignedDriverId) {
                console.log('[Admin Alerts] Driver assigned to load:', loadId, newData.assignedDriverId);

                const alert: Omit<Alert, 'id'> = {
                  type: 'driverAssigned',
                  loadId,
                  oldDriverId: oldData.assignedDriverId,
                  newDriverId: newData.assignedDriverId,
                  timestamp: Timestamp.now(),
                  triggeredBy: newData.assignedDriverId,
                  message: `Driver assigned to load ${loadId.substring(0, 8)}`,
                };

                await logAlertToFirestore(alert);
                await sendTwilioAlert(alert);
              }
            }

            loadCacheRef.current.set(loadId, newData);
          }
        });

        setState((prev) => ({ ...prev, isLoading: false }));
      },
      (error) => {
        console.error('[Admin Alerts] Error listening to loads:', error);
        setState((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      }
    );

    const alertsQuery = query(
      collection(db, 'automation_logs'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribeAlerts = onSnapshot(
      alertsQuery,
      (snapshot) => {
        console.log('[Admin Alerts] Alerts snapshot received:', snapshot.size, 'documents');

        const alerts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Alert[];

        setState((prev) => ({
          ...prev,
          alerts,
          isLoading: false,
        }));
      },
      (error) => {
        console.error('[Admin Alerts] Error listening to alerts:', error);
        setState((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      }
    );

    return () => {
      console.log('[Admin Alerts] Cleaning up listeners...');
      unsubscribeLoads();
      unsubscribeAlerts();
      loadCacheRef.current.clear();
    };
  }, []);

  return state;
}

async function logAlertToFirestore(alert: Omit<Alert, 'id'>) {
  try {
    console.log('[Admin Alerts] Logging alert to Firestore:', alert.type);
    
    const docRef = await addDoc(collection(db, 'automation_logs'), {
      ...alert,
      timestamp: serverTimestamp(),
    });

    console.log('[Admin Alerts] Alert logged successfully:', docRef.id);
  } catch (error) {
    console.error('[Admin Alerts] Error logging alert to Firestore:', error);
  }
}

async function sendTwilioAlert(alert: Omit<Alert, 'id'>) {
  try {
    console.log('[Admin Alerts] Attempting to send Twilio SMS for:', alert.type);

    const twilioEndpoint = process.env.EXPO_PUBLIC_TWILIO_ENDPOINT;
    const adminPhone = process.env.EXPO_PUBLIC_ADMIN_PHONE;

    if (!twilioEndpoint || !adminPhone) {
      console.log('[Admin Alerts] Twilio not configured (missing endpoint or admin phone)');
      return;
    }

    const response = await fetch(twilioEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: adminPhone,
        message: `[LoadRush Alert] ${alert.message}`,
        alertType: alert.type,
        loadId: alert.loadId,
      }),
    });

    if (response.ok) {
      console.log('[Admin Alerts] Twilio SMS sent successfully');
    } else {
      console.error('[Admin Alerts] Twilio SMS failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('[Admin Alerts] Error sending Twilio SMS:', error);
  }
}
