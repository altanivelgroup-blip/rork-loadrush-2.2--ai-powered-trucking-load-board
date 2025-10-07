import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface TestLoad {
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  loadType: string;
  vehicleCount: number;
  price: number;
  rate: number;
  status: string;
  assignedDriverId: null;
  matchedDriverId: null;
  shipperId: string;
  createdAt: any;
  updatedAt: any;
  expiresAt: Timestamp;
  notes: string;
  pickup: any;
  dropoff: any;
  cargo: any;
  distance: number;
  ratePerMile: number;
}

async function createTestLoad() {
  console.log('🚀 Starting test load creation...');

  const pickupAddress = "1111 N Lamb Blvd, Las Vegas, NV 89110";
  const dropoffAddress = "8080 W Tropical Pkwy, Las Vegas, NV 89149";

  try {
    const loadsRef = collection(db, 'loads');
    
    const existingQuery = query(
      loadsRef,
      where('pickupAddress', '==', pickupAddress),
      where('dropoffAddress', '==', dropoffAddress)
    );
    
    const existingDocs = await getDocs(existingQuery);
    
    if (!existingDocs.empty) {
      console.log('⚠️  Test load already exists!');
      console.log('📦 Existing document ID:', existingDocs.docs[0].id);
      console.log('🧭 Pickup:', pickupAddress);
      console.log('🧭 Dropoff:', dropoffAddress);
      return;
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    const expiresAt = Timestamp.fromDate(expirationDate);

    const testLoadData: TestLoad = {
      pickupAddress,
      pickupLatitude: 36.1881,
      pickupLongitude: -115.0802,
      dropoffAddress,
      dropoffLatitude: 36.2945,
      dropoffLongitude: -115.2702,
      loadType: "Vehicle Transport Test",
      vehicleCount: 1,
      price: 120,
      rate: 120,
      status: "Available",
      assignedDriverId: null,
      matchedDriverId: null,
      shipperId: "TEST_SHIPPER",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiresAt,
      notes: "Live ORS + GPS field test: N Lamb Blvd → Sam's Club Tropical Pkwy.",
      pickup: {
        address: pickupAddress,
        city: "Las Vegas",
        state: "NV",
        zip: "89110",
        date: new Date().toISOString(),
      },
      dropoff: {
        address: dropoffAddress,
        city: "Las Vegas",
        state: "NV",
        zip: "89149",
        date: new Date().toISOString(),
      },
      cargo: {
        type: "Vehicle Transport Test",
        weight: 5000,
      },
      distance: 15,
      ratePerMile: 8.0,
    };

    console.log('📝 Validating coordinates...');
    console.log('  Pickup Lat:', typeof testLoadData.pickupLatitude, testLoadData.pickupLatitude);
    console.log('  Pickup Lng:', typeof testLoadData.pickupLongitude, testLoadData.pickupLongitude);
    console.log('  Dropoff Lat:', typeof testLoadData.dropoffLatitude, testLoadData.dropoffLatitude);
    console.log('  Dropoff Lng:', typeof testLoadData.dropoffLongitude, testLoadData.dropoffLongitude);

    const docRef = await addDoc(loadsRef, testLoadData);

    console.log('\n✅ Test load created successfully!');
    console.log('🆔 Document ID:', docRef.id);
    console.log('\n📦 Load Summary:');
    console.log('  🚚 Type:', testLoadData.loadType);
    console.log('  💰 Price: $' + testLoadData.price);
    console.log('  📍 Pickup:', pickupAddress);
    console.log('  📍 Dropoff:', dropoffAddress);
    console.log('  🧭 Coordinates:');
    console.log('    Pickup: (' + testLoadData.pickupLatitude + ', ' + testLoadData.pickupLongitude + ')');
    console.log('    Dropoff: (' + testLoadData.dropoffLatitude + ', ' + testLoadData.dropoffLongitude + ')');
    console.log('  📝 Status:', testLoadData.status);
    console.log('  📋 Notes:', testLoadData.notes);
    console.log('  📅 Expires At:', expiresAt.toDate().toISOString());
    console.log('  🗓️  Expiration Date:', expiresAt.toDate().toLocaleDateString());

  } catch (error) {
    console.error('❌ Error creating test load:', error);
    throw error;
  }
}

createTestLoad()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
