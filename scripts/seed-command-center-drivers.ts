import { collection, addDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DriverData {
  driverId: string;
  name: string;
  phone: string;
  status: 'pickup' | 'in_transit' | 'accomplished' | 'breakdown';
  location: {
    lat: number;
    lng: number;
  };
  currentLoad?: string;
  pickupLocation?: {
    latitude: number;
    longitude: number;
  };
  dropoffLocation?: {
    latitude: number;
    longitude: number;
  };
  eta?: number;
  distanceRemaining?: number;
}

const driversData: DriverData[] = [
  {
    driverId: 'DRV-001',
    name: 'Marcus Clay',
    phone: '+1 (469) 555-2031',
    status: 'in_transit',
    location: { lat: 32.7767, lng: -96.7970 },
    currentLoad: 'LR-013',
    pickupLocation: { latitude: 33.8366, longitude: -117.9143 },
    dropoffLocation: { latitude: 29.7604, longitude: -95.3698 },
    eta: 180.5,
    distanceRemaining: 245.3,
  },
  {
    driverId: 'DRV-002',
    name: 'Jorge Alvarez',
    phone: '+1 (956) 555-4018',
    status: 'pickup',
    location: { lat: 33.6846, lng: -117.8265 },
    currentLoad: 'LR-014',
    pickupLocation: { latitude: 33.6846, longitude: -117.8265 },
    dropoffLocation: { latitude: 30.2672, longitude: -97.7431 },
    eta: 25.0,
    distanceRemaining: 15.2,
  },
  {
    driverId: 'DRV-003',
    name: 'Caleb Ross',
    phone: '+1 (214) 555-2904',
    status: 'in_transit',
    location: { lat: 34.0522, lng: -106.0740 },
    currentLoad: 'LR-015',
    pickupLocation: { latitude: 37.9577, longitude: -121.2908 },
    dropoffLocation: { latitude: 32.7767, longitude: -96.7970 },
    eta: 420.0,
    distanceRemaining: 680.5,
  },
  {
    driverId: 'DRV-004',
    name: 'Tina Moreno',
    phone: '+1 (915) 555-0149',
    status: 'pickup',
    location: { lat: 36.3302, lng: -119.2921 },
    currentLoad: 'LR-016',
    pickupLocation: { latitude: 36.3302, longitude: -119.2921 },
    dropoffLocation: { latitude: 27.5036, longitude: -99.5075 },
    eta: 35.0,
    distanceRemaining: 22.8,
  },
  {
    driverId: 'DRV-005',
    name: 'Anthony Webb',
    phone: '+1 (682) 555-6720',
    status: 'in_transit',
    location: { lat: 33.4484, lng: -105.0740 },
    currentLoad: 'LR-017',
    pickupLocation: { latitude: 34.1083, longitude: -117.2898 },
    dropoffLocation: { latitude: 32.7555, longitude: -97.3308 },
    eta: 240.0,
    distanceRemaining: 385.2,
  },
  {
    driverId: 'DRV-006',
    name: 'Luis Herrera',
    phone: '+1 (915) 555-7721',
    status: 'in_transit',
    location: { lat: 32.3199, lng: -106.7637 },
    currentLoad: 'LR-018',
    pickupLocation: { latitude: 34.0633, longitude: -117.6509 },
    dropoffLocation: { latitude: 31.7619, longitude: -106.4850 },
    eta: 90.0,
    distanceRemaining: 125.5,
  },
  {
    driverId: 'DRV-007',
    name: 'Chris Vaughn',
    phone: '+1 (325) 555-9807',
    status: 'in_transit',
    location: { lat: 32.4487, lng: -103.7320 },
    currentLoad: 'LR-019',
    pickupLocation: { latitude: 34.8958, longitude: -117.0228 },
    dropoffLocation: { latitude: 31.8457, longitude: -102.3676 },
    eta: 180.0,
    distanceRemaining: 245.0,
  },
  {
    driverId: 'DRV-008',
    name: 'Ethan Brooks',
    phone: '+1 (682) 555-1892',
    status: 'accomplished',
    location: { lat: 32.7767, lng: -96.7970 },
    currentLoad: 'LR-020',
    pickupLocation: { latitude: 34.1478, longitude: -118.1445 },
    dropoffLocation: { latitude: 32.7767, longitude: -96.7970 },
    eta: 0,
    distanceRemaining: 0,
  },
  {
    driverId: 'DRV-009',
    name: 'Rafael Soto',
    phone: '+1 (713) 555-8804',
    status: 'accomplished',
    location: { lat: 29.7604, lng: -95.3698 },
    currentLoad: 'LR-021',
    pickupLocation: { latitude: 34.3917, longitude: -118.5426 },
    dropoffLocation: { latitude: 29.7604, longitude: -95.3698 },
    eta: 0,
    distanceRemaining: 0,
  },
  {
    driverId: 'DRV-010',
    name: "James O'Neal",
    phone: '+1 (830) 555-0199',
    status: 'accomplished',
    location: { lat: 30.2672, lng: -97.7431 },
    currentLoad: 'LR-022',
    pickupLocation: { latitude: 33.4936, longitude: -117.1484 },
    dropoffLocation: { latitude: 30.2672, longitude: -97.7431 },
    eta: 0,
    distanceRemaining: 0,
  },
  {
    driverId: 'DRV-011',
    name: 'Maria Gonzalez',
    phone: '+1 (210) 555-3344',
    status: 'accomplished',
    location: { lat: 29.4241, lng: -98.4936 },
    currentLoad: 'LR-023',
    pickupLocation: { latitude: 34.0922, longitude: -117.4350 },
    dropoffLocation: { latitude: 29.4241, longitude: -98.4936 },
    eta: 0,
    distanceRemaining: 0,
  },
  {
    driverId: 'DRV-012',
    name: 'David Martinez',
    phone: '+1 (915) 555-9988',
    status: 'breakdown',
    location: { lat: 32.2217, lng: -110.9265 },
    currentLoad: 'LR-024',
    pickupLocation: { latitude: 33.4484, longitude: -112.0740 },
    dropoffLocation: { latitude: 31.7619, longitude: -106.4850 },
    eta: 0,
    distanceRemaining: 285.5,
  },
  {
    driverId: 'DRV-013',
    name: 'Sarah Johnson',
    phone: '+1 (469) 555-7766',
    status: 'in_transit',
    location: { lat: 35.2220, lng: -101.8313 },
    currentLoad: 'LR-025',
    pickupLocation: { latitude: 37.3382, longitude: -121.8863 },
    dropoffLocation: { latitude: 33.5779, longitude: -101.8552 },
    eta: 320.0,
    distanceRemaining: 485.0,
  },
  {
    driverId: 'DRV-014',
    name: 'Michael Chen',
    phone: '+1 (512) 555-4433',
    status: 'pickup',
    location: { lat: 34.0522, lng: -118.2437 },
    currentLoad: 'LR-026',
    pickupLocation: { latitude: 34.0522, longitude: -118.2437 },
    dropoffLocation: { latitude: 29.4241, longitude: -98.4936 },
    eta: 18.0,
    distanceRemaining: 12.5,
  },
  {
    driverId: 'DRV-015',
    name: 'Jessica Williams',
    phone: '+1 (214) 555-2211',
    status: 'in_transit',
    location: { lat: 31.9686, lng: -99.9018 },
    currentLoad: 'LR-027',
    pickupLocation: { latitude: 33.7490, longitude: -116.3590 },
    dropoffLocation: { latitude: 30.2672, longitude: -97.7431 },
    eta: 280.0,
    distanceRemaining: 425.0,
  },
];

async function clearExistingDrivers() {
  console.log('🧹 Clearing existing drivers from Command Center...');
  
  try {
    const driversSnapshot = await getDocs(collection(db, 'drivers'));
    
    if (driversSnapshot.empty) {
      console.log('✅ No existing drivers to clear');
      return;
    }
    
    const batch = writeBatch(db);
    let deleteCount = 0;
    
    driversSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });
    
    await batch.commit();
    console.log(`✅ Deleted ${deleteCount} existing drivers`);
  } catch (error) {
    console.error('❌ Error clearing drivers:', error);
    throw error;
  }
}

async function seedDrivers() {
  console.log('\n🚗 Seeding Command Center drivers...');
  
  const driversRef = collection(db, 'drivers');
  let successCount = 0;
  
  for (const driver of driversData) {
    try {
      const driverDoc = {
        driverId: driver.driverId,
        name: driver.name,
        phone: driver.phone,
        status: driver.status,
        location: driver.location,
        currentLoad: driver.currentLoad || null,
        pickupLocation: driver.pickupLocation || null,
        dropoffLocation: driver.dropoffLocation || null,
        eta: driver.eta || null,
        distanceRemaining: driver.distanceRemaining || null,
        lastUpdate: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };
      
      await addDoc(driversRef, driverDoc);
      
      const statusEmoji = {
        pickup: '🟢',
        in_transit: '🟡',
        accomplished: '🟣',
        breakdown: '🔴',
      }[driver.status];
      
      console.log(`  ${statusEmoji} Created driver ${driver.driverId}: ${driver.name} - ${driver.status.toUpperCase()}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed to create driver ${driver.driverId}:`, error);
    }
  }
  
  console.log(`\n✅ Successfully created ${successCount}/${driversData.length} drivers`);
  return successCount;
}

async function seedCommandCenterDrivers() {
  console.log('🚀 Starting Command Center driver seeding...\n');
  console.log('📊 This will create:');
  console.log('   - 15 active drivers with live tracking');
  console.log('   - 3 drivers at pickup (🟢)');
  console.log('   - 7 drivers in transit (🟡)');
  console.log('   - 4 drivers accomplished (🟣)');
  console.log('   - 1 driver with breakdown (🔴)\n');
  
  try {
    await clearExistingDrivers();
    
    const driversCreated = await seedDrivers();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMMAND CENTER SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Drivers created: ${driversCreated}/15`);
    console.log(`\n🔍 Where to view:`);
    console.log(`   🎯 Admin Command Center: All ${driversCreated} drivers visible on map`);
    console.log(`   📱 Filter by status: Pickup, In Transit, Accomplished, Breakdown`);
    console.log(`   🗺️  Live tracking with ETA and distance remaining`);
    console.log(`\n💡 Access Command Center:`);
    console.log(`   1. Sign in as admin (long-press logo on auth screen)`);
    console.log(`   2. Navigate to "Command" tab at bottom`);
    console.log(`   3. View all drivers on live map with status indicators`);
    console.log(`\n✅ All drivers are live and ready for tracking!\n`);
    
  } catch (error) {
    console.error('\n💥 Seeding failed:', error);
    throw error;
  }
}

seedCommandCenterDrivers()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
