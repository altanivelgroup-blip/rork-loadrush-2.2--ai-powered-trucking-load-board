/* eslint-disable no-console */
import { doc, setDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import * as fs from 'node:fs';
import * as path from 'node:path';
import app from './firebase-node';

function csvToObjects(csv: string): Record<string, string>[] {
  const lines = csv.trim().split(/\r?\n/);
  const headers = lines.shift()?.split(',').map((h) => h.trim()) ?? [];
  const rows: Record<string, string>[] = [];
  for (const line of lines) {
    const cols: string[] = [];
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
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? '').trim();
    });
    rows.push(obj);
  }
  return rows;
}

async function seedDrivers(file: string, db: ReturnType<typeof getFirestore>) {
  const content = fs.readFileSync(file, 'utf-8');
  const rows = csvToObjects(content);
  let ok = 0;
  for (const r of rows) {
    const id = r.id;
    if (!id) continue;
    const payload = {
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
      },
      trailerInfo: {
        type: r.trailerType ?? "53' Dry Van",
        length: Number(r.trailerLength ?? '53'),
        capacity: Number(r.trailerCapacity ?? '45000'),
      },
      equipment: (r.equipment ?? '').split(';').map((s) => s.trim()).filter(Boolean),
      wallet: Number(r.wallet ?? '0'),
      location: {
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        city: r.city,
        state: r.state,
      },
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'drivers', id), payload, { merge: true });
    ok += 1;
  }
  console.log(`Drivers seeded: ${ok}`);
}

async function seedShippers(file: string, db: ReturnType<typeof getFirestore>) {
  const content = fs.readFileSync(file, 'utf-8');
  const rows = csvToObjects(content);
  let ok = 0;
  for (const r of rows) {
    const id = r.id;
    if (!id) continue;
    const payload = {
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
    ok += 1;
  }
  console.log(`Shippers seeded: ${ok}`);
}

async function seedLoads(file: string, db: ReturnType<typeof getFirestore>) {
  console.log(`[seedLoads] Reading ${file}`);
  const content = fs.readFileSync(file, 'utf-8');
  const rows = csvToObjects(content);
  let ok = 0;
  for (const r of rows) {
    const id = r.id;
    if (!id) continue;
    const distance = Number(r.distance_miles ?? '0');
    const rate = Number(r.rate_usd ?? '0');
    const payload: Record<string, any> = {
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (r.matchedDriverId && r.matchedDriverId.trim()) {
      payload.matchedDriverId = r.matchedDriverId.trim();
    }
    if (r.matchedDriverName && r.matchedDriverName.trim()) {
      payload.matchedDriverName = r.matchedDriverName.trim();
    }
    await setDoc(doc(db, 'loads', id), payload, { merge: true });
    ok += 1;
  }
  console.log(`Loads seeded from ${path.basename(file)}: ${ok}`);
}

async function main() {
  const db = getFirestore(app);

  const root = path.resolve(process.cwd(), 'scripts', 'data');
  const driversPath = path.join(root, 'drivers-vegas.csv');
  const shippersPath = path.join(root, 'shippers-vegas.csv');

  if (!fs.existsSync(driversPath)) throw new Error(`Missing file: ${driversPath}`);
  if (!fs.existsSync(shippersPath)) throw new Error(`Missing file: ${shippersPath}`);

  await seedDrivers(driversPath, db);
  await seedShippers(shippersPath, db);

  const allFiles = fs.readdirSync(root);
  const loadCsvs = allFiles.filter((f) => f.startsWith('loads-') && f.endsWith('.csv'));
  if (loadCsvs.length === 0) {
    throw new Error(`No load CSV files found in ${root}. Expected files like 'loads-*.csv'`);
  }
  for (const f of loadCsvs) {
    await seedLoads(path.join(root, f), db);
  }

  console.log('Seeding complete.');
}

main().catch((e) => {
  console.error('Seeding failed', e);
  process.exit(1);
});
