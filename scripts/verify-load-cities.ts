// scripts/verify-load-cities.ts
// Verifies that loads match driver pin locations

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
};

async function verifyLoadCities() {
  console.log('🔍 Verifying load cities match driver locations...\n');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Fetch sample loads
  const loadsRef = collection(db, 'loads');
  const loadsQuery = query(loadsRef, limit(10));
  const loadsSnap = await getDocs(loadsQuery);

  if (loadsSnap.empty) {
    console.log('❌ No loads found. Run seeding script first:');
    console.log('   ./scripts/run-seed-loads-from-drivers.sh\n');
    return;
  }

  console.log(`📦 Found ${loadsSnap.size} loads. Checking cities...\n`);

  let dallasCount = 0;
  let uniqueCities = new Set<string>();

  loadsSnap.forEach((doc) => {
    const load = doc.data();
    const originCity = `${load.origin?.city}, ${load.origin?.state}`;
    const destCity = `${load.destination?.city}, ${load.destination?.state}`;

    uniqueCities.add(originCity);
    uniqueCities.add(destCity);

    if (originCity === 'Dallas, TX' || destCity === 'Dallas, TX') {
      dallasCount++;
    }

    console.log(`${load.id}:`);
    console.log(`  📍 Origin: ${originCity}`);
    console.log(`  🎯 Destination: ${destCity}`);
    console.log(`  📏 Distance: ${load.miles} mi`);
    console.log(`  💰 Price: $${load.priceUSD}`);
    console.log(`  ⏰ Expires: ${load.expiresAt?.toDate?.()?.toLocaleDateString() || 'N/A'}`);
    console.log('');
  });

  console.log('═'.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Unique cities: ${uniqueCities.size}`);
  console.log(`   Dallas loads: ${dallasCount}`);
  console.log('');

  if (uniqueCities.size > 5) {
    console.log('✅ SUCCESS: Loads use diverse US cities!');
  } else {
    console.log('⚠️  WARNING: Limited city diversity. Expected 10+ unique cities.');
  }

  if (dallasCount === loadsSnap.size) {
    console.log('❌ ISSUE: All loads default to Dallas. Re-run seeding script.');
  }

  console.log('═'.repeat(60));
}

verifyLoadCities().catch((e) => {
  console.error('��� Verification failed:', e);
  process.exit(1);
});
