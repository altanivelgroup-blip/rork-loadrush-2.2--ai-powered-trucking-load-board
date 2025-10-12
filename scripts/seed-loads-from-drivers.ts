// scripts/seed-loads-from-drivers.ts
// Generates loads that match driver pin locations with real US cities/states
// Uses driver coordinates to create realistic origin/destination pairs

/* eslint-disable no-console */

import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { driversData } from './drivers-data-v3';

// Types
interface GeoPointLike {
  latitude: number;
  longitude: number;
}

interface TestLoad {
  id: string;
  refId: string;
  status: 'open' | 'assigned' | 'in_transit' | 'delivered' | 'expired';
  origin: { city: string; state: string; coords: GeoPointLike };
  destination: { city: string; state: string; coords: GeoPointLike };
  pickupAt: Timestamp;
  dropoffAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Record<string, unknown> | Timestamp;
  expiresAt: Timestamp;
  ttlDays: number;
  miles: number;
  priceUSD: number;
  notes?: string;
  assignedDriverId?: string;
}

// Extract city/state from driver data
function parseCityState(cityLabel: string): { city: string; state: string } {
  const parts = cityLabel.split(', ');
  if (parts.length === 2) {
    return { city: parts[0], state: parts[1] };
  }
  return { city: cityLabel, state: 'USA' };
}

// Calculate distance between two points (Haversine formula)
function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8; // miles
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function buildFirebaseConfig(): FirebaseOptions {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '';
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '';

  if (!apiKey || !authDomain || !projectId) {
    throw new Error('Missing required Firebase env vars');
  }

  return { apiKey, authDomain, projectId } satisfies FirebaseOptions;
}

// Generate loads based on driver locations
function generateLoadsFromDrivers(ttlDays: number): TestLoad[] {
  const loads: TestLoad[] = [];
  const now = new Date();

  // Create loads for each driver using their actual locations
  driversData.forEach((driver, idx) => {
    const origin = parseCityState(driver.cityLabel);
    
    // Find a different driver for destination
    const destDriverIdx = (idx + randomInt(5, 15)) % driversData.length;
    const destDriver = driversData[destDriverIdx];
    const destination = parseCityState(destDriver.cityLabel);

    // Calculate distance
    const miles = Math.max(
      50,
      milesBetween(
        { lat: driver.location.lat, lng: driver.location.lng },
        { lat: destDriver.location.lat, lng: destDriver.location.lng }
      )
    );

    const priceUSD = Math.round(miles * (1.8 + Math.random() * 1.2));

    // Use driver's current load ID or generate new one
    const loadId = driver.currentLoad;

    const pickupDate = new Date(now);
    pickupDate.setDate(now.getDate() + randomInt(0, 3));

    const dropDate = new Date(pickupDate);
    dropDate.setDate(pickupDate.getDate() + Math.max(1, Math.round(miles / 600)));

    const exp = daysFromNow(ttlDays);

    // Map driver status to load status
    let loadStatus: 'open' | 'assigned' | 'in_transit' | 'delivered' | 'expired' = 'open';
    if (driver.status === 'in_transit') loadStatus = 'in_transit';
    else if (driver.status === 'accomplished') loadStatus = 'delivered';
    else if (driver.status === 'pickup') loadStatus = 'assigned';
    else if (driver.status === 'breakdown') loadStatus = 'in_transit';

    const load: TestLoad = {
      id: loadId,
      refId: loadId,
      status: loadStatus,
      origin: {
        city: origin.city,
        state: origin.state,
        coords: {
          latitude: driver.pickupLocation.latitude,
          longitude: driver.pickupLocation.longitude,
        },
      },
      destination: {
        city: destination.city,
        state: destination.state,
        coords: {
          latitude: driver.dropoffLocation.latitude,
          longitude: driver.dropoffLocation.longitude,
        },
      },
      pickupAt: Timestamp.fromDate(pickupDate),
      dropoffAt: Timestamp.fromDate(dropDate),
      createdAt: Timestamp.fromDate(now),
      updatedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(exp),
      ttlDays,
      miles,
      priceUSD,
      notes: `Load for ${driver.name} - ${origin.city}, ${origin.state} → ${destination.city}, ${destination.state}`,
      assignedDriverId: driver.driverId,
    };

    loads.push(load);
  });

  // Generate additional open loads using driver cities as origins/destinations
  const additionalCount = 15;
  for (let i = 0; i < additionalCount; i += 1) {
    const originDriver = driversData[randomInt(0, driversData.length - 1)];
    const destDriver = driversData[randomInt(0, driversData.length - 1)];

    const origin = parseCityState(originDriver.cityLabel);
    const destination = parseCityState(destDriver.cityLabel);

    const miles = Math.max(
      50,
      milesBetween(
        { lat: originDriver.location.lat, lng: originDriver.location.lng },
        { lat: destDriver.location.lat, lng: destDriver.location.lng }
      )
    );

    const priceUSD = Math.round(miles * (1.8 + Math.random() * 1.2));
    const loadId = `LR-${3000 + i}`;

    const pickupDate = new Date(now);
    pickupDate.setDate(now.getDate() + randomInt(0, 5));

    const dropDate = new Date(pickupDate);
    dropDate.setDate(pickupDate.getDate() + Math.max(1, Math.round(miles / 600)));

    const exp = daysFromNow(ttlDays);

    const load: TestLoad = {
      id: loadId,
      refId: loadId,
      status: 'open',
      origin: {
        city: origin.city,
        state: origin.state,
        coords: {
          latitude: originDriver.location.lat,
          longitude: originDriver.location.lng,
        },
      },
      destination: {
        city: destination.city,
        state: destination.state,
        coords: {
          latitude: destDriver.location.lat,
          longitude: destDriver.location.lng,
        },
      },
      pickupAt: Timestamp.fromDate(pickupDate),
      dropoffAt: Timestamp.fromDate(dropDate),
      createdAt: Timestamp.fromDate(now),
      updatedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(exp),
      ttlDays,
      miles,
      priceUSD,
      notes: `Open load - ${origin.city}, ${origin.state} → ${destination.city}, ${destination.state}`,
    };

    loads.push(load);
  }

  return loads;
}

async function seedLoads(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('🚚 LoadRush: Seeding loads from driver pin locations');
  console.log('═'.repeat(60));

  const TTL_DAYS = 30;
  console.log(`📍 Using ${driversData.length} driver locations`);
  console.log(`⏰ TTL: ${TTL_DAYS} days`);

  const config = buildFirebaseConfig();
  console.log(`🔥 Firebase projectId: ${config.projectId}`);

  const app = initializeApp(config);
  const db = getFirestore(app);

  const loads = generateLoadsFromDrivers(TTL_DAYS);
  console.log(`\n📦 Generated ${loads.length} loads (${driversData.length} assigned + ${loads.length - driversData.length} open)`);
  console.log('✍️  Writing to Firestore…\n');

  let ok = 0;
  let fail = 0;

  for (const load of loads) {
    try {
      const ref = doc(db, 'loads', load.id);
      await setDoc(ref, load, { merge: true });
      ok += 1;
      
      const statusEmoji = load.status === 'open' ? '🟢' : load.status === 'in_transit' ? '🚛' : load.status === 'delivered' ? '✅' : '📍';
      console.log(`${statusEmoji} ${load.id}: ${load.origin.city}, ${load.origin.state} → ${load.destination.city}, ${load.destination.state} (${load.miles} mi)`);
      
    } catch (e) {
      fail += 1;
      console.error(`❌ Write failed for ${load.id}:`, e);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`✨ Seeding complete → ✅ ${ok} success, ❌ ${fail} failed`);
  console.log('═'.repeat(60));
  
  if (fail > 0) {
    process.exitCode = 1;
  }
}

seedLoads().catch((e) => {
  console.error('💥 Fatal error while seeding loads:', e);
  process.exit(1);
});
