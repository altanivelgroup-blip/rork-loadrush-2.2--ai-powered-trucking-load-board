import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const DRIVER_ID = 'driver-bypass';
const SHIPPER_ID = 'shipper-bypass';

const US_CITIES = [
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
  { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { city: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { city: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
];

const CARGO_TYPES = [
  { type: 'Electronics', weight: 15000 },
  { type: 'Furniture', weight: 20000 },
  { type: 'Food Products', weight: 25000 },
  { type: 'Auto Parts', weight: 18000 },
  { type: 'Building Materials', weight: 30000 },
  { type: 'Machinery', weight: 35000 },
  { type: 'Textiles', weight: 12000 },
  { type: 'Pharmaceuticals', weight: 8000 },
];

const STATUSES = ['posted', 'matched', 'in_transit'] as const;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

async function addTestLoads() {
  console.log('🚀 Starting to add test loads for driver and shipper...');
  console.log('👤 Driver ID:', DRIVER_ID);
  console.log('📦 Shipper ID:', SHIPPER_ID);

  try {
    const loadsRef = collection(db, 'loads');
    const now = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    const expiresAt = Timestamp.fromDate(expirationDate);

    const loadsToCreate = 15;
    let createdCount = 0;

    for (let i = 0; i < loadsToCreate; i++) {
      const pickupCity = US_CITIES[Math.floor(Math.random() * US_CITIES.length)];
      let dropoffCity = US_CITIES[Math.floor(Math.random() * US_CITIES.length)];
      
      while (dropoffCity.city === pickupCity.city) {
        dropoffCity = US_CITIES[Math.floor(Math.random() * US_CITIES.length)];
      }

      const cargo = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)];
      const distance = calculateDistance(pickupCity.lat, pickupCity.lng, dropoffCity.lat, dropoffCity.lng);
      const ratePerMile = 2.0 + Math.random() * 2.0;
      const rate = Math.round(distance * ratePerMile);
      const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

      const pickupDate = new Date(now);
      pickupDate.setDate(pickupDate.getDate() + Math.floor(Math.random() * 7));
      
      const dropoffDate = new Date(pickupDate);
      dropoffDate.setDate(dropoffDate.getDate() + Math.ceil(distance / 500));

      const loadData = {
        shipperId: SHIPPER_ID,
        shipperName: 'LoadRush Shipper',
        status,
        pickup: {
          location: `${pickupCity.city}, ${pickupCity.state}`,
          city: pickupCity.city,
          state: pickupCity.state,
          date: pickupDate.toISOString(),
          time: '08:00',
          latitude: pickupCity.lat,
          longitude: pickupCity.lng,
        },
        dropoff: {
          location: `${dropoffCity.city}, ${dropoffCity.state}`,
          city: dropoffCity.city,
          state: dropoffCity.state,
          date: dropoffDate.toISOString(),
          time: '17:00',
          latitude: dropoffCity.lat,
          longitude: dropoffCity.lng,
        },
        cargo: {
          type: cargo.type,
          weight: cargo.weight,
          description: `${cargo.type} shipment from ${pickupCity.city} to ${dropoffCity.city}`,
        },
        rate,
        distance,
        ratePerMile: parseFloat(ratePerMile.toFixed(2)),
        assignedDriverId: status === 'in_transit' ? DRIVER_ID : null,
        matchedDriverId: status === 'matched' || status === 'in_transit' ? DRIVER_ID : null,
        matchedDriverName: status === 'matched' || status === 'in_transit' ? 'LoadRush Driver' : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        expiresAt,
        bids: Math.floor(Math.random() * 5),
      };

      const docRef = await addDoc(loadsRef, loadData);
      createdCount++;
      
      console.log(`✅ Load ${createdCount}/${loadsToCreate} created:`, {
        id: docRef.id,
        status,
        route: `${pickupCity.city}, ${pickupCity.state} → ${dropoffCity.city}, ${dropoffCity.state}`,
        rate: `$${rate}`,
        distance: `${distance} mi`,
      });
    }

    console.log('\n🎉 Successfully created', createdCount, 'test loads!');
    console.log('\n📊 Summary:');
    console.log('  - These loads are linked to shipper ID:', SHIPPER_ID);
    console.log('  - Some loads are assigned/matched to driver ID:', DRIVER_ID);
    console.log('  - All loads expire in 30 days');
    console.log('\n✨ You should now see these loads in:');
    console.log('  - Driver Loads page (when signed in as driver@loadrush.co)');
    console.log('  - Shipper My Loads page (when signed in as shipper@loadrush.co)');

  } catch (error) {
    console.error('❌ Error creating test loads:', error);
    throw error;
  }
}

addTestLoads()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
