import { collection, addDoc, serverTimestamp, Timestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

const SHIPPER_ID = 'K6JAh3s9jzdB0Usj2dkw4bmXdUk1';

interface LoadData {
  loadId: string;
  pickupCity: string;
  pickupState: string;
  dropoffCity: string;
  dropoffState: string;
  distanceMiles: number;
  ratePerMile: number;
  totalPay: number;
  vehicleType: string;
  status: 'Available' | 'assigned' | 'inTransit' | 'completed';
  driverName?: string;
  driverPhone?: string;
  notes: string;
  shipperId: string;
  shipperCompany: string;
  shipperEmail: string;
  email: string;
  shipperName: string;
  createdAt: string;
}

const loadsData: LoadData[] = [
  {
    "loadId": "LR-001",
    "pickupCity": "Los Angeles",
    "pickupState": "CA",
    "dropoffCity": "Phoenix",
    "dropoffState": "AZ",
    "distanceMiles": 372,
    "ratePerMile": 2.65,
    "totalPay": 986,
    "vehicleType": "Car Hauler",
    "status": "Available",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "3 sedans; flexible pickup; open delivery window"
  },
  {
    "loadId": "LR-002",
    "pickupCity": "San Diego",
    "pickupState": "CA",
    "dropoffCity": "Tucson",
    "dropoffState": "AZ",
    "distanceMiles": 408,
    "ratePerMile": 2.40,
    "totalPay": 979,
    "vehicleType": "Hotshot 40ft",
    "status": "Available",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "F150 and ATV; gate code provided"
  },
  {
    "loadId": "LR-003",
    "pickupCity": "Bakersfield",
    "pickupState": "CA",
    "dropoffCity": "Midland",
    "dropoffState": "TX",
    "distanceMiles": 1189,
    "ratePerMile": 2.50,
    "totalPay": 2972,
    "vehicleType": "Car Hauler",
    "status": "Available",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Dealer transfer: 2 SUVs and 1 coupe"
  },
  {
    "loadId": "LR-004",
    "pickupCity": "Fresno",
    "pickupState": "CA",
    "dropoffCity": "El Paso",
    "dropoffState": "TX",
    "distanceMiles": 875,
    "ratePerMile": 2.80,
    "totalPay": 2450,
    "vehicleType": "Flatbed 40ft",
    "status": "Available",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Light machinery; straps required"
  },
  {
    "loadId": "LR-005",
    "pickupCity": "Palm Springs",
    "pickupState": "CA",
    "dropoffCity": "Tucumcari",
    "dropoffState": "NM",
    "distanceMiles": 790,
    "ratePerMile": 2.40,
    "totalPay": 1896,
    "vehicleType": "Box Truck 26ft",
    "status": "Available",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Furniture; residential delivery"
  },
  {
    "loadId": "LR-006",
    "pickupCity": "Sacramento",
    "pickupState": "CA",
    "dropoffCity": "Las Cruces",
    "dropoffState": "NM",
    "distanceMiles": 1048,
    "ratePerMile": 2.35,
    "totalPay": 2462,
    "vehicleType": "Box Truck 26ft",
    "status": "Available",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Palletized electronics; liftgate required"
  },
  {
    "loadId": "LR-007",
    "pickupCity": "San Jose",
    "pickupState": "CA",
    "dropoffCity": "Abilene",
    "dropoffState": "TX",
    "distanceMiles": 1430,
    "ratePerMile": 2.75,
    "totalPay": 3932,
    "vehicleType": "Hotshot 40ft",
    "status": "Available",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Compact tractors; must tarp"
  },
  {
    "loadId": "LR-008",
    "pickupCity": "Riverside",
    "pickupState": "CA",
    "dropoffCity": "El Paso",
    "dropoffState": "TX",
    "distanceMiles": 728,
    "ratePerMile": 2.70,
    "totalPay": 1966,
    "vehicleType": "Hotshot",
    "status": "Available",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Light commercial equipment; 10K lbs"
  },
  {
    "loadId": "LR-009",
    "pickupCity": "Santa Barbara",
    "pickupState": "CA",
    "dropoffCity": "Odessa",
    "dropoffState": "TX",
    "distanceMiles": 1255,
    "ratePerMile": 2.55,
    "totalPay": 3200,
    "vehicleType": "Car Hauler",
    "status": "Available",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Luxury cars; enclosed trailer preferred"
  },
  {
    "loadId": "LR-010",
    "pickupCity": "Ventura",
    "pickupState": "CA",
    "dropoffCity": "Lubbock",
    "dropoffState": "TX",
    "distanceMiles": 1210,
    "ratePerMile": 2.60,
    "totalPay": 3146,
    "vehicleType": "Flatbed 40ft",
    "status": "Available",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Steel frames; forklift load"
  },
  {
    "loadId": "LR-011",
    "pickupCity": "Modesto",
    "pickupState": "CA",
    "dropoffCity": "Amarillo",
    "dropoffState": "TX",
    "distanceMiles": 1340,
    "ratePerMile": 2.55,
    "totalPay": 3417,
    "vehicleType": "Hotshot",
    "status": "Available",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Small construction load; tarps needed"
  },
  {
    "loadId": "LR-012",
    "pickupCity": "Santa Ana",
    "pickupState": "CA",
    "dropoffCity": "San Antonio",
    "dropoffState": "TX",
    "distanceMiles": 1375,
    "ratePerMile": 2.70,
    "totalPay": 3712,
    "vehicleType": "Car Hauler",
    "status": "Available",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "4 cars dealer-to-dealer; open trailer"
  },
  {
    "loadId": "LR-013",
    "pickupCity": "Anaheim",
    "pickupState": "CA",
    "dropoffCity": "Houston",
    "dropoffState": "TX",
    "distanceMiles": 1550,
    "ratePerMile": 2.80,
    "totalPay": 4340,
    "vehicleType": "Hotshot",
    "status": "inTransit",
    "driverName": "Marcus Clay",
    "driverPhone": "+1 (469) 555-2031",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "2 F250s in route; ETA 10/12"
  },
  {
    "loadId": "LR-014",
    "pickupCity": "Irvine",
    "pickupState": "CA",
    "dropoffCity": "Austin",
    "dropoffState": "TX",
    "distanceMiles": 1370,
    "ratePerMile": 2.85,
    "totalPay": 3904,
    "vehicleType": "Car Hauler",
    "status": "assigned",
    "driverName": "Jorge Alvarez",
    "driverPhone": "+1 (956) 555-4018",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "3 vehicles; in-transit"
  },
  {
    "loadId": "LR-015",
    "pickupCity": "Stockton",
    "pickupState": "CA",
    "dropoffCity": "Dallas",
    "dropoffState": "TX",
    "distanceMiles": 1450,
    "ratePerMile": 2.70,
    "totalPay": 3915,
    "vehicleType": "Flatbed 40ft",
    "status": "inTransit",
    "driverName": "Caleb Ross",
    "driverPhone": "+1 (214) 555-2904",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Machinery secured; rest stop in NM"
  },
  {
    "loadId": "LR-016",
    "pickupCity": "Visalia",
    "pickupState": "CA",
    "dropoffCity": "Laredo",
    "dropoffState": "TX",
    "distanceMiles": 1525,
    "ratePerMile": 2.65,
    "totalPay": 4041,
    "vehicleType": "Hotshot",
    "status": "assigned",
    "driverName": "Tina Moreno",
    "driverPhone": "+1 (915) 555-0149",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "In route; customs paperwork ready"
  },
  {
    "loadId": "LR-017",
    "pickupCity": "San Bernardino",
    "pickupState": "CA",
    "dropoffCity": "Fort Worth",
    "dropoffState": "TX",
    "distanceMiles": 1410,
    "ratePerMile": 2.60,
    "totalPay": 3666,
    "vehicleType": "Car Hauler",
    "status": "inTransit",
    "driverName": "Anthony Webb",
    "driverPhone": "+1 (682) 555-6720",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "All vehicles secured; ETA tonight"
  },
  {
    "loadId": "LR-018",
    "pickupCity": "Ontario",
    "pickupState": "CA",
    "dropoffCity": "El Paso",
    "dropoffState": "TX",
    "distanceMiles": 730,
    "ratePerMile": 2.75,
    "totalPay": 2007,
    "vehicleType": "Hotshot",
    "status": "assigned",
    "driverName": "Luis Herrera",
    "driverPhone": "+1 (915) 555-7721",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Crossing NM border"
  },
  {
    "loadId": "LR-019",
    "pickupCity": "Barstow",
    "pickupState": "CA",
    "dropoffCity": "Odessa",
    "dropoffState": "TX",
    "distanceMiles": 980,
    "ratePerMile": 2.50,
    "totalPay": 2450,
    "vehicleType": "Box Truck 26ft",
    "status": "inTransit",
    "driverName": "Chris Vaughn",
    "driverPhone": "+1 (325) 555-9807",
    "createdAt": "2025-10-10T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Halfway through NM; on schedule"
  },
  {
    "loadId": "LR-020",
    "pickupCity": "Pasadena",
    "pickupState": "CA",
    "dropoffCity": "Dallas",
    "dropoffState": "TX",
    "distanceMiles": 1435,
    "ratePerMile": 2.80,
    "totalPay": 4018,
    "vehicleType": "Flatbed",
    "status": "completed",
    "driverName": "Ethan Brooks",
    "driverPhone": "+1 (682) 555-1892",
    "createdAt": "2025-10-08T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Delivered 10/8; signed BOL uploaded"
  },
  {
    "loadId": "LR-021",
    "pickupCity": "Santa Clarita",
    "pickupState": "CA",
    "dropoffCity": "Houston",
    "dropoffState": "TX",
    "distanceMiles": 1550,
    "ratePerMile": 2.85,
    "totalPay": 4417,
    "vehicleType": "Car Hauler",
    "status": "completed",
    "driverName": "Rafael Soto",
    "driverPhone": "+1 (713) 555-8804",
    "createdAt": "2025-10-08T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Delivered early; paid in full"
  },
  {
    "loadId": "LR-022",
    "pickupCity": "Temecula",
    "pickupState": "CA",
    "dropoffCity": "Austin",
    "dropoffState": "TX",
    "distanceMiles": 1355,
    "ratePerMile": 2.65,
    "totalPay": 3590,
    "vehicleType": "Hotshot",
    "status": "completed",
    "driverName": "James O'Neal",
    "driverPhone": "+1 (830) 555-0199",
    "createdAt": "2025-10-08T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "On-time delivery; client satisfied"
  },
  {
    "loadId": "LR-023",
    "pickupCity": "Fontana",
    "pickupState": "CA",
    "dropoffCity": "San Antonio",
    "dropoffState": "TX",
    "distanceMiles": 1375,
    "ratePerMile": 2.70,
    "totalPay": 3712,
    "vehicleType": "Box Truck",
    "status": "completed",
    "driverName": "Maria Gonzalez",
    "driverPhone": "+1 (210) 555-3344",
    "createdAt": "2025-10-08T20:45:00Z",
    "shipperId": SHIPPER_ID,
    "shipperCompany": "LoadRush Logistics",
    "shipperEmail": "shipper@loadrush.com",
    "email": "shipper@loadrush.com",
    "shipperName": "Robert Lane",
    "notes": "Smooth delivery; no issues"
  }
];

function mapStatusToFirestore(status: string): string {
  switch (status) {
    case 'Available':
      return 'Available';
    case 'assigned':
      return 'matched';
    case 'inTransit':
      return 'in_transit';
    case 'completed':
      return 'delivered';
    default:
      return 'posted';
  }
}

async function clearExistingLoads() {
  console.log('🧹 Clearing existing loads...');
  
  try {
    const loadsSnapshot = await getDocs(collection(db, 'loads'));
    
    if (loadsSnapshot.empty) {
      console.log('✅ No existing loads to clear');
      return;
    }
    
    const batch = writeBatch(db);
    let deleteCount = 0;
    
    loadsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });
    
    await batch.commit();
    console.log(`✅ Deleted ${deleteCount} existing loads`);
  } catch (error) {
    console.error('❌ Error clearing loads:', error);
    throw error;
  }
}

async function seedLoads() {
  console.log('\n📦 Seeding LoadRush loads (USA-only, 30-day persistence)...');
  
  const loadsRef = collection(db, 'loads');
  let successCount = 0;
  
  for (const load of loadsData) {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      const expiresAt = Timestamp.fromDate(expirationDate);
      
      console.log(`  📅 Load ${load.loadId} expires: ${expirationDate.toLocaleDateString()} (30 days from now)`);
      
      const pickupDate = new Date();
      pickupDate.setHours(pickupDate.getHours() + 2);
      
      const dropoffDate = new Date();
      dropoffDate.setDate(dropoffDate.getDate() + 2);
      
      const firestoreStatus = mapStatusToFirestore(load.status);
      
      const loadData = {
        pickupAddress: `${load.pickupCity}, ${load.pickupState}`,
        pickupLatitude: 0,
        pickupLongitude: 0,
        dropoffAddress: `${load.dropoffCity}, ${load.dropoffState}`,
        dropoffLatitude: 0,
        dropoffLongitude: 0,
        loadType: load.vehicleType,
        vehicleCount: 1,
        price: load.totalPay,
        rate: load.totalPay,
        status: firestoreStatus,
        assignedDriverId: load.driverName ? `driver-${load.loadId}` : null,
        matchedDriverId: load.driverName ? `driver-${load.loadId}` : null,
        shipperId: load.shipperId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt,
        notes: load.notes,
        pickup: {
          address: `${load.pickupCity}, ${load.pickupState}`,
          city: load.pickupCity,
          state: load.pickupState,
          zip: '00000',
          date: pickupDate.toISOString(),
        },
        dropoff: {
          address: `${load.dropoffCity}, ${load.dropoffState}`,
          city: load.dropoffCity,
          state: load.dropoffState,
          zip: '00000',
          date: dropoffDate.toISOString(),
        },
        cargo: {
          type: load.vehicleType,
          weight: 5000,
          description: load.notes,
        },
        distance: load.distanceMiles,
        ratePerMile: load.ratePerMile,
        driverName: load.driverName || null,
        driverPhone: load.driverPhone || null,
        loadId: load.loadId,
      };
      
      await addDoc(loadsRef, loadData);
      console.log(`  ✅ Created load ${load.loadId}: ${load.pickupCity}, ${load.pickupState} → ${load.dropoffCity}, ${load.dropoffState} - Status: ${firestoreStatus}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed to create load ${load.loadId}:`, error);
    }
  }
  
  console.log(`\n✅ Successfully created ${successCount}/${loadsData.length} loads`);
  return successCount;
}

async function seedLoadRushData() {
  console.log('🚀 Starting LoadRush data seeding...\n');
  console.log('📊 This will create:');
  console.log('   - 23 test loads with varied statuses');
  console.log('   - 12 Available loads (visible to drivers)');
  console.log('   - 7 In-Transit/Assigned loads (tracked by shipper)');
  console.log('   - 4 Completed loads (delivery history)');
  console.log('   - ⏰ All loads persist for 30 days');
  console.log('   - 🇺🇸 USA-only routes (CA, TX, AZ, NM)\n');
  
  try {
    await clearExistingLoads();
    
    const loadsCreated = await seedLoads();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Loads created: ${loadsCreated}/23`);
    console.log(`\n🔍 Where to view:`);
    console.log(`   📱 Driver App: Check "Loads" tab for ${loadsData.filter(l => l.status === 'Available').length} available loads`);
    console.log(`   🚢 Shipper Dashboard: View all ${loadsCreated} posted/tracked loads`);
    console.log(`   🎯 Admin Loads: View all loads with filters`);
    console.log(`\n💡 Test on:`);
    console.log(`   - iPad/Mobile: Scan QR code`);
    console.log(`   - Web: Current browser window`);
    console.log(`   - Sign in as shipper: shipper@loadrush.com`);
    console.log(`   - Sign in as driver: driver@loadrush.com`);
    console.log('\n✅ All data is live and ready for testing!\n');
    
  } catch (error) {
    console.error('\n💥 Seeding failed:', error);
    throw error;
  }
}

seedLoadRushData()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
