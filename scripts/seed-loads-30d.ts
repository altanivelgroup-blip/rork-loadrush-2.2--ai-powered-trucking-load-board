// scripts/seed-loads-30d.ts
// Bun-safe Firestore seeder for test loads with 30-day persistence
// Standalone: does NOT import any React Native / Expo modules

/* eslint-disable no-console */

import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

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
  updatedAt: Record<string, unknown> | Timestamp; // placeholder for serverTimestamp
  expiresAt: Timestamp;
  ttlDays: number;
  miles: number;
  priceUSD: number;
  notes?: string;
}

// Minimal USA city catalog for visual testing
const US_CITIES: Array<{
  city: string;
  state: string;
  lat: number;
  lng: number;
}> = [
  { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { city: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
  { city: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.074 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.797 },
  { city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { city: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.265 },
  { city: 'St. Louis', state: 'MO', lat: 38.627, lng: -90.1994 },
  { city: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
  { city: 'Atlanta', state: 'GA', lat: 33.749, lng: -84.388 },
  { city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { city: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
  { city: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
  { city: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382 },
  { city: 'Washington', state: 'DC', lat: 38.9072, lng: -77.0369 },
  { city: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
  { city: 'New York', state: 'NY', lat: 40.7128, lng: -74.006 },
  { city: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
];

// Args parsing (no external deps)
function getArgValue(flag: string, fallback: string | number | boolean): string | number | boolean {
  const idx = process.argv.findIndex((a) => a === flag);
  if (idx !== -1) {
    const val = process.argv[idx + 1];
    if (!val || val.startsWith('-')) return true;
    return val;
  }
  return fallback;
}

const COUNT = Number(getArgValue('--count', 40));
const TTL_DAYS = Number(getArgValue('--ttlDays', 30));
const PREFIX = String(getArgValue('--prefix', 'LR'));
const START_NUM = Number(getArgValue('--start', 2000));

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

function buildFirebaseConfig(): FirebaseOptions {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '';
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '';

  if (!apiKey || !authDomain || !projectId) {
    throw new Error('Missing required Firebase env vars: EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  }

  return { apiKey, authDomain, projectId } satisfies FirebaseOptions;
}

function generateLoads(count: number, ttlDays: number, prefix: string, startNum: number): TestLoad[] {
  const loads: TestLoad[] = [];
  for (let i = 0; i < count; i += 1) {
    const o = US_CITIES[randomInt(0, US_CITIES.length - 1)];
    let d = US_CITIES[randomInt(0, US_CITIES.length - 1)];
    // ensure different city for better visuals
    if (d.city === o.city) {
      d = US_CITIES[(US_CITIES.indexOf(o) + 5) % US_CITIES.length];
    }

    const miles = Math.max(50, milesBetween({ lat: o.lat, lng: o.lng }, { lat: d.lat, lng: d.lng }));
    const priceUSD = Math.round(miles * (1.8 + Math.random() * 1.2));

    const idNum = startNum + i;
    const id = `${prefix}-${idNum}`;

    const now = new Date();
    const pickupDate = new Date(now);
    pickupDate.setDate(now.getDate() + randomInt(0, 5));

    const dropDate = new Date(pickupDate);
    dropDate.setDate(pickupDate.getDate() + Math.max(1, Math.round(miles / 600))); // 600 mi/day

    const exp = daysFromNow(ttlDays);

    const load: TestLoad = {
      id,
      refId: id,
      status: 'open',
      origin: { city: o.city, state: o.state, coords: { latitude: o.lat, longitude: o.lng } },
      destination: { city: d.city, state: d.state, coords: { latitude: d.lat, longitude: d.lng } },
      pickupAt: Timestamp.fromDate(pickupDate),
      dropoffAt: Timestamp.fromDate(dropDate),
      createdAt: Timestamp.fromDate(now),
      updatedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(exp),
      ttlDays: ttlDays,
      miles,
      priceUSD,
      notes: 'Demo load for sandbox; visual only, USA-only, auto-expires in 30 days.',
    };

    loads.push(load);
  }
  return loads;
}

async function seedLoads(): Promise<void> {
  console.log('—'.repeat(60));
  console.log('LoadRush: Seeding test loads with 30-day persistence');
  console.log(`Params → count=${COUNT}, ttlDays=${TTL_DAYS}, prefix=${PREFIX}, start=${START_NUM}`);

  const config = buildFirebaseConfig();
  console.log('Firebase projectId =', config.projectId);

  const app = initializeApp(config);
  const db = getFirestore(app);

  const loads = generateLoads(COUNT, TTL_DAYS, PREFIX, START_NUM);
  console.log(`Generated ${loads.length} loads. Writing to Firestore…`);

  let ok = 0;
  let fail = 0;

  for (const load of loads) {
    try {
      const ref = doc(db, 'loads', load.id);
      await setDoc(ref, load, { merge: true });
      ok += 1;
      if (ok % 10 === 0) console.log(`Progress: ${ok}/${loads.length} written…`);
    } catch (e) {
      fail += 1;
      console.error(`Write failed for ${load.id}:`, e);
    }
  }

  console.log(`Seeding complete → success=${ok}, failed=${fail}`);
  if (fail > 0) {
    process.exitCode = 1;
  }
}

seedLoads().catch((e) => {
  console.error('Fatal error while seeding loads:', e);
  process.exit(1);
});
