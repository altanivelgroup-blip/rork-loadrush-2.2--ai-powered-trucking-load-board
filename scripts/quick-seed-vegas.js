#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function csvToObjects(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const headers = lines.shift()?.split(',').map((h) => h.trim()) ?? [];
  const rows = [];
  
  for (const line of lines) {
    const cols = [];
    let i = 0;
    let current = '';
    let inQuotes = false;
    
    while (i < line.length) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(current);
        current = '';
      } else {
        current += ch;
      }
      i += 1;
    }
    cols.push(current);
    
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? '').trim();
    });
    rows.push(obj);
  }
  return rows;
}

async function seedDrivers(file) {
  console.log('\n📦 Seeding Drivers...');
  const content = fs.readFileSync(file, 'utf-8');
  const rows = csvToObjects(content);
  let ok = 0;
  
  for (const r of rows) {
    const id = r.id;
    if (!id) continue;
    
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    
    const payload = {
      id,
      driverId: id,
      name: `${r.firstName} ${r.lastName}`,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      status: r.status ?? 'active',
      lastActive: r.lastActive ?? new Date().toISOString(),
      truckInfo: {
        make: r.truckMake,
        model: r.truckModel,
        year: Number(r.truckYear ?? '2020'),
        vin: r.vin,
        mpg: Number(r.mpg ?? '7'),
        fuelType: r.fuelType ?? 'diesel',
        state: r.tractorState ?? 'NV',
        city: r.city,
      },
      trailerInfo: {
        type: r.trailerType ?? "53' Dry Van",
        length: Number(r.trailerLength ?? '53'),
        capacity: Number(r.trailerCapacity ?? '45000'),
      },
      equipment: (r.equipment ?? '').split(';').map((s) => s.trim()).filter(Boolean),
      wallet: Number(r.wallet ?? '0'),
      location: {
        latitude: lat,
        longitude: lng,
        lat,
        lng,
        city: r.city,
        state: r.state,
      },
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(doc(db, 'drivers', id), payload, { merge: true });
    console.log(`  ✅ Driver ${id}: ${payload.name} at (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    ok += 1;
  }
  console.log(`✅ Drivers seeded: ${ok}`);
}

async function seedShippers(file) {
  console.log('\n📦 Seeding Shippers...');
  const content = fs.readFileSync(file, 'utf-8');
  const rows = csvToObjects(content);
  let ok = 0;
  
  for (const r of rows) {
    const id = r.id;
    if (!id) continue;
    
    const payload = {
      id,
      companyName: r.companyName,
      contactName: r.contactName,
      phone: r.phone,
      email: r.email,
      address: r.address,
      city: r.city,
      state: r.state,
      zip: r.zip,
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(doc(db, 'shippers', id), payload, { merge: true });
    console.log(`  ✅ Shipper ${id}: ${r.companyName}`);
    ok += 1;
  }
  console.log(`✅ Shippers seeded: ${ok}`);
}

async function seedLoads(file) {
  console.log(`\n📦 Seeding Loads from ${path.basename(file)}...`);
  const content = fs.readFileSync(file, 'utf-8');
  const rows = csvToObjects(content);
  let ok = 0;
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  for (const r of rows) {
    const id = r.id;
    if (!id) continue;
    
    const distance = Number(r.distance_miles ?? '0');
    const rate = Number(r.rate_usd ?? '0');
    
    const payload = {
      id,
      shipperId: r.shipperId,
      shipperName: r.shipperName,
      status: r.status ?? 'posted',
      pickup: {
        location: r.pickup_location,
        city: r.pickup_city,
        state: r.pickup_state,
        date: r.pickup_date,
        time: r.pickup_time,
      },
      dropoff: {
        location: r.drop_location,
        city: r.drop_city,
        state: r.drop_state,
        date: r.drop_date,
        time: r.drop_time,
      },
      cargo: {
        type: r.cargo_type,
        weight: Number(r.weight_lbs ?? '0'),
        description: r.description,
      },
      rate,
      distance,
      ratePerMile: rate / Math.max(1, distance || 1),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    if (r.matchedDriverId && r.matchedDriverId.trim()) {
      payload.matchedDriverId = r.matchedDriverId.trim();
      payload.status = 'matched';
      console.log(`  ✅ Load ${id} matched to driver ${r.matchedDriverId}`);
    }
    if (r.matchedDriverName && r.matchedDriverName.trim()) {
      payload.matchedDriverName = r.matchedDriverName.trim();
    }
    
    await setDoc(doc(db, 'loads', id), payload, { merge: true });
    ok += 1;
  }
  console.log(`✅ Loads seeded: ${ok}`);
}

async function main() {
  console.log('\n🚀 Starting Vegas Data Seeding...');
  console.log('='.repeat(60));
  
  const root = path.resolve(process.cwd(), 'scripts', 'data');
  const driversPath = path.join(root, 'drivers-vegas.csv');
  const shippersPath = path.join(root, 'shippers-vegas.csv');
  
  if (!fs.existsSync(driversPath)) throw new Error(`Missing file: ${driversPath}`);
  if (!fs.existsSync(shippersPath)) throw new Error(`Missing file: ${shippersPath}`);
  
  await seedDrivers(driversPath);
  await seedShippers(shippersPath);
  
  console.log('\n📦 Seeding Loads...');
  const allFiles = fs.readdirSync(root);
  const loadCsvs = allFiles.filter((f) => f.startsWith('loads-') && f.endsWith('.csv'));
  
  if (loadCsvs.length === 0) {
    throw new Error(`No load CSV files found in ${root}`);
  }
  
  for (const f of loadCsvs) {
    await seedLoads(path.join(root, f));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Vegas Data Seeding Complete!');
  console.log('\n📊 Summary:');
  console.log('  - Drivers: Check Firestore "drivers" collection');
  console.log('  - Shippers: Check Firestore "shippers" collection');
  console.log('  - Loads: Check Firestore "loads" collection');
  console.log('\n🔍 Next Steps:');
  console.log('  1. Refresh your app');
  console.log('  2. Log in as driver (e.g., alex.martinez@example.com)');
  console.log('  3. Check Command Center as admin');
  console.log('='.repeat(60) + '\n');
  
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
