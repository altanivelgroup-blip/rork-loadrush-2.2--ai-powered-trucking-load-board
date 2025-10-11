import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCBWrYNQFTrhVXFVPORseQfQaI44s_yYQA",
  authDomain: "loadrush-admin-console.firebaseapp.com",
  projectId: "loadrush-admin-console",
  storageBucket: "loadrush-admin-console.firebasestorage.app",
  messagingSenderId: "71906929791",
  appId: "1:71906929791:web:4ece0f5394c4bb6ff4634a"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const drivers = [
  {
    driverId: "DRV-001",
    name: "Marcus Clay",
    status: "pickup",
    location: { lat: 34.0522, lng: -118.2437 },
    currentLoad: "LR-013",
    pickupLocation: { latitude: 34.0522, longitude: -118.2437 },
    dropoffLocation: { latitude: 29.7604, longitude: -95.3698 },
    assignedBy: "K6JAh3s9jzdB0Usj2dkw4bmXdUk1",
    truckType: "Hotshot 40ft",
    active: true,
  },
  {
    driverId: "DRV-002",
    name: "Tina Moreno",
    status: "in_transit",
    location: { lat: 32.7157, lng: -117.1611 },
    currentLoad: "LR-016",
    pickupLocation: { latitude: 32.7157, longitude: -117.1611 },
    dropoffLocation: { latitude: 27.5306, longitude: -99.4803 },
    assignedBy: "K6JAh3s9jzdB0Usj2dkw4bmXdUk1",
    truckType: "Hotshot",
    active: true,
  },
  {
    driverId: "DRV-003",
    name: "Luis Herrera",
    status: "in_transit",
    location: { lat: 33.4484, lng: -112.0740 },
    currentLoad: "LR-018",
    pickupLocation: { latitude: 33.4484, longitude: -112.0740 },
    dropoffLocation: { latitude: 31.7619, longitude: -106.4850 },
    assignedBy: "K6JAh3s9jzdB0Usj2dkw4bmXdUk1",
    truckType: "Car Hauler",
    active: true,
  },
  {
    driverId: "DRV-004",
    name: "Chris Vaughn",
    status: "accomplished",
    location: { lat: 31.7619, lng: -106.4850 },
    currentLoad: "LR-019",
    pickupLocation: { latitude: 34.8958, longitude: -117.0173 },
    dropoffLocation: { latitude: 31.8457, longitude: -102.3676 },
    assignedBy: "K6JAh3s9jzdB0Usj2dkw4bmXdUk1",
    truckType: "Box Truck 26ft",
    active: true,
  },
  {
    driverId: "DRV-005",
    name: "Anthony Webb",
    status: "breakdown",
    location: { lat: 32.7767, lng: -96.7970 },
    currentLoad: "LR-017",
    pickupLocation: { latitude: 34.1083, longitude: -117.2898 },
    dropoffLocation: { latitude: 32.7555, longitude: -97.3308 },
    assignedBy: "K6JAh3s9jzdB0Usj2dkw4bmXdUk1",
    truckType: "Car Hauler",
    active: false,
  }
];

async function seedDrivers() {
  console.log('🚀 Starting Command Center driver seeding...');

  try {
    for (const driver of drivers) {
      const driverRef = doc(collection(db, 'drivers'), driver.driverId);
      
      await setDoc(driverRef, {
        ...driver,
        lastUpdate: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      console.log(`✅ Added driver: ${driver.name} (${driver.driverId}) - Status: ${driver.status}`);
    }

    console.log('\n🎉 Successfully seeded all Command Center drivers!');
    console.log(`📊 Total drivers added: ${drivers.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding drivers:', error);
    throw error;
  }
}

seedDrivers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
