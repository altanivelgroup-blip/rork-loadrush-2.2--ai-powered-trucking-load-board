// scripts/add-addresses-to-loads.ts
// Adds real-world street addresses to existing loads for navigation

/* eslint-disable no-console */

import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

// Real addresses mapped by major cities in the US
const cityAddresses: Record<string, { pickup: string[]; dropoff: string[] }> = {
  'Las Vegas': {
    pickup: [
      '3355 S Las Vegas Blvd, Las Vegas, NV 89109',
      '5757 Wayne Newton Blvd, Las Vegas, NV 89119',
      '3600 Las Vegas Blvd S, Las Vegas, NV 89109',
      '2880 S Las Vegas Blvd, Las Vegas, NV 89109',
    ],
    dropoff: [
      '3799 S Las Vegas Blvd, Las Vegas, NV 89109',
      '3570 S Las Vegas Blvd, Las Vegas, NV 89109',
      '3131 S Las Vegas Blvd, Las Vegas, NV 89109',
      '128 Fremont St, Las Vegas, NV 89101',
    ],
  },
  'Los Angeles': {
    pickup: [
      '1 World Way, Los Angeles, CA 90045',
      '1200 Getty Center Dr, Los Angeles, CA 90049',
      '100 Universal City Plaza, Universal City, CA 91608',
      '800 Olympic Blvd, Los Angeles, CA 90015',
    ],
    dropoff: [
      '6801 Hollywood Blvd, Los Angeles, CA 90028',
      '135 N Grand Ave, Los Angeles, CA 90012',
      '301 E Ocean Blvd, Long Beach, CA 90802',
      '750 S Alameda St, Los Angeles, CA 90021',
    ],
  },
  'San Diego': {
    pickup: [
      '3225 N Harbor Dr, San Diego, CA 92101',
      '2920 Zoo Dr, San Diego, CA 92101',
      '1549 El Prado, San Diego, CA 92101',
      '1500 Orange Ave, Coronado, CA 92118',
    ],
    dropoff: [
      '525 B St, San Diego, CA 92101',
      '1355 N Harbor Dr, San Diego, CA 92101',
      '910 N Harbor Dr, San Diego, CA 92101',
      '3841 Greenwood St, San Diego, CA 92110',
    ],
  },
  'San Francisco': {
    pickup: [
      'San Francisco International Airport, San Francisco, CA 94128',
      '1 Market St, San Francisco, CA 94105',
      'Pier 39, San Francisco, CA 94133',
      '100 Larkin St, San Francisco, CA 94102',
    ],
    dropoff: [
      'Golden Gate Bridge, San Francisco, CA 94129',
      'Lombard St, San Francisco, CA 94133',
      '401 Van Ness Ave, San Francisco, CA 94102',
      '2 Marina Blvd, San Francisco, CA 94123',
    ],
  },
  'Phoenix': {
    pickup: [
      '3400 E Sky Harbor Blvd, Phoenix, AZ 85034',
      '1111 W Jefferson St, Phoenix, AZ 85007',
      '2301 N Central Ave, Phoenix, AZ 85004',
      '1101 W Washington St, Phoenix, AZ 85007',
    ],
    dropoff: [
      '455 N Galvin Pkwy, Phoenix, AZ 85008',
      '6850 N 5th Ave, Phoenix, AZ 85013',
      '1850 N Central Ave, Phoenix, AZ 85004',
      '250 W Washington St, Phoenix, AZ 85003',
    ],
  },
  'Tucson': {
    pickup: [
      '7000 S Tucson Blvd, Tucson, AZ 85756',
      '260 S Church Ave, Tucson, AZ 85701',
      '2600 N Alvernon Way, Tucson, AZ 85712',
      '201 N Stone Ave, Tucson, AZ 85701',
    ],
    dropoff: [
      '3950 W Ina Rd, Tucson, AZ 85741',
      '800 E University Blvd, Tucson, AZ 85719',
      '140 N Stone Ave, Tucson, AZ 85701',
      '2002 N Forbes Blvd, Tucson, AZ 85745',
    ],
  },
  'Riverside': {
    pickup: [
      '3400 10th St, Riverside, CA 92501',
      '3801 Main St, Riverside, CA 92501',
      '3720 Orange St, Riverside, CA 92501',
      '1 University Ave, Riverside, CA 92521',
    ],
    dropoff: [
      '3405 Market St, Riverside, CA 92501',
      '3900 University Ave, Riverside, CA 92501',
      '4079 Mission Inn Ave, Riverside, CA 92501',
      '3801 Lemon St, Riverside, CA 92501',
    ],
  },
  'Bakersfield': {
    pickup: [
      '5001 Airport Dr, Bakersfield, CA 93308',
      '1501 Truxtun Ave, Bakersfield, CA 93301',
      '1801 L St, Bakersfield, CA 93301',
      '1600 Chester Ave, Bakersfield, CA 93301',
    ],
    dropoff: [
      '3801 Alfred Harrell Hwy, Bakersfield, CA 93306',
      '10500 Stockdale Hwy, Bakersfield, CA 93311',
      '8700 Ming Ave, Bakersfield, CA 93311',
      '2001 19th St, Bakersfield, CA 93301',
    ],
  },
  'Fresno': {
    pickup: [
      '5175 E McKinley Ave, Fresno, CA 93727',
      '2220 Tulare St, Fresno, CA 93721',
      '2425 Fresno St, Fresno, CA 93721',
      '894 N Van Ness Ave, Fresno, CA 93728',
    ],
    dropoff: [
      '5380 N Palm Ave, Fresno, CA 93704',
      '680 E Shaw Ave, Fresno, CA 93710',
      '2929 N Blackstone Ave, Fresno, CA 93703',
      '3033 N Maroa Ave, Fresno, CA 93704',
    ],
  },
  'Sacramento': {
    pickup: [
      '6900 Airport Blvd, Sacramento, CA 95837',
      '1315 10th St, Sacramento, CA 95814',
      '555 Capitol Mall, Sacramento, CA 95814',
      '1419 H St, Sacramento, CA 95814',
    ],
    dropoff: [
      '3000 Arena Blvd, Sacramento, CA 95834',
      '400 Capitol Mall, Sacramento, CA 95814',
      '1000 Front St, Sacramento, CA 95814',
      '980 9th St, Sacramento, CA 95814',
    ],
  },
};

function buildFirebaseConfig(): FirebaseOptions {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '';
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '';

  if (!apiKey || !authDomain || !projectId) {
    throw new Error('Missing required Firebase env vars');
  }

  return { apiKey, authDomain, projectId } satisfies FirebaseOptions;
}

function getRandomAddress(city: string, type: 'pickup' | 'dropoff'): string {
  const cityKey = Object.keys(cityAddresses).find((key) =>
    city.toLowerCase().includes(key.toLowerCase())
  );

  if (cityKey && cityAddresses[cityKey]) {
    const addresses = cityAddresses[cityKey][type];
    return addresses[Math.floor(Math.random() * addresses.length)];
  }

  // Fallback for cities not in our list
  return `${Math.floor(Math.random() * 9000) + 1000} Main St, ${city}`;
}

async function addAddressesToLoads(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('🚚 LoadRush: Adding real addresses to loads');
  console.log('═'.repeat(60));

  const config = buildFirebaseConfig();
  console.log(`🔥 Firebase projectId: ${config.projectId}`);

  const app = initializeApp(config);
  const db = getFirestore(app);

  console.log('\n📦 Fetching loads from Firestore...\n');

  const loadsRef = collection(db, 'loads');
  const snapshot = await getDocs(loadsRef);

  console.log(`Found ${snapshot.size} loads\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const loadDoc of snapshot.docs) {
    const load = loadDoc.data();
    const loadId = loadDoc.id;

    try {
      // Check if load already has addresses in pickup.location and dropoff.location
      const hasPickupAddress = load.pickup?.location && load.pickup.location.length > 20;
      const hasDropoffAddress = load.dropoff?.location && load.dropoff.location.length > 20;

      if (hasPickupAddress && hasDropoffAddress) {
        console.log(`⏭️  ${loadId}: Already has addresses - skipping`);
        skipped += 1;
        continue;
      }

      // Get city names from origin/destination or pickup/dropoff
      const pickupCity = load.origin?.city || load.pickup?.city || 'Unknown';
      const dropoffCity = load.destination?.city || load.dropoff?.city || 'Unknown';

      // Generate addresses
      const pickupAddress = getRandomAddress(pickupCity, 'pickup');
      const dropoffAddress = getRandomAddress(dropoffCity, 'dropoff');

      // Update the load
      const updateData: any = {
        updatedAt: Timestamp.now(),
      };

      // Update pickup location if needed
      if (!hasPickupAddress) {
        updateData['pickup.location'] = pickupAddress;
      }

      // Update dropoff location if needed
      if (!hasDropoffAddress) {
        updateData['dropoff.location'] = dropoffAddress;
      }

      const docRef = doc(db, 'loads', loadId);
      await updateDoc(docRef, updateData);

      console.log(`✅ ${loadId}: ${pickupCity} → ${dropoffCity}`);
      console.log(`   📍 Pickup: ${pickupAddress}`);
      console.log(`   📍 Dropoff: ${dropoffAddress}\n`);
      updated += 1;
    } catch (e) {
      failed += 1;
      console.error(`❌ Failed to update ${loadId}:`, e);
    }
  }

  console.log('═'.repeat(60));
  console.log(`✨ Update complete:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('═'.repeat(60));

  if (failed > 0) {
    process.exitCode = 1;
  }
}

addAddressesToLoads().catch((e) => {
  console.error('💥 Fatal error:', e);
  process.exit(1);
});
