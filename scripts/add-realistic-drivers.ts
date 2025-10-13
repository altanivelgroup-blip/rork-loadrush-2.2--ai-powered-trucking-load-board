import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBWrYNQFTrhVXFVPORseQfQaI44s_yYQA",
  authDomain: "loadrush-admin-console.firebaseapp.com",
  projectId: "loadrush-admin-console",
  storageBucket: "loadrush-admin-console.firebasestorage.app",
  messagingSenderId: "71906929791",
  appId: "1:71906929791:web:4ece0f5394c4bb6ff4634a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface RealisticDriver {
  driverId: string;
  name: string;
  status: 'pickup' | 'in_transit' | 'accomplished' | 'breakdown';
  location: { lat: number; lng: number };
  currentLoad: string;
  pickupLocation: { latitude: number; longitude: number };
  dropoffLocation: { latitude: number; longitude: number };
  eta: number;
  distanceRemaining: number;
  cityLabel: string;
  state: string;
  highway: string;
  active: boolean;
}

const realisticDrivers: RealisticDriver[] = [
  {
    driverId: "DRV-100",
    name: "Marcus Johnson",
    status: "in_transit",
    location: { lat: 29.7604, lng: -95.3698 },
    currentLoad: "LR-900",
    pickupLocation: { latitude: 29.4241, longitude: -98.4936 },
    dropoffLocation: { latitude: 32.7767, longitude: -96.7970 },
    eta: 180,
    distanceRemaining: 240,
    cityLabel: "Houston",
    state: "TX",
    highway: "I-45 N",
    active: true,
  },
  {
    driverId: "DRV-101",
    name: "Sarah Williams",
    status: "pickup",
    location: { lat: 34.0522, lng: -118.2437 },
    currentLoad: "LR-901",
    pickupLocation: { latitude: 34.0522, longitude: -118.2437 },
    dropoffLocation: { latitude: 37.7749, longitude: -122.4194 },
    eta: 360,
    distanceRemaining: 380,
    cityLabel: "Los Angeles",
    state: "CA",
    highway: "I-5 N",
    active: true,
  },
  {
    driverId: "DRV-102",
    name: "James Rodriguez",
    status: "in_transit",
    location: { lat: 41.8781, lng: -87.6298 },
    currentLoad: "LR-902",
    pickupLocation: { latitude: 39.7392, longitude: -104.9903 },
    dropoffLocation: { latitude: 40.7128, longitude: -74.0060 },
    eta: 540,
    distanceRemaining: 790,
    cityLabel: "Chicago",
    state: "IL",
    highway: "I-80 E",
    active: true,
  },
  {
    driverId: "DRV-103",
    name: "Emily Chen",
    status: "accomplished",
    location: { lat: 25.7617, lng: -80.1918 },
    currentLoad: "LR-903",
    pickupLocation: { latitude: 28.5383, longitude: -81.3792 },
    dropoffLocation: { latitude: 25.7617, longitude: -80.1918 },
    eta: 30,
    distanceRemaining: 15,
    cityLabel: "Miami",
    state: "FL",
    highway: "FL Turnpike",
    active: true,
  },
  {
    driverId: "DRV-104",
    name: "Michael Brown",
    status: "in_transit",
    location: { lat: 47.6062, lng: -122.3321 },
    currentLoad: "LR-904",
    pickupLocation: { latitude: 45.5152, longitude: -122.6784 },
    dropoffLocation: { latitude: 49.2827, longitude: -123.1207 },
    eta: 240,
    distanceRemaining: 175,
    cityLabel: "Seattle",
    state: "WA",
    highway: "I-5 N",
    active: true,
  },
  {
    driverId: "DRV-105",
    name: "Jessica Martinez",
    status: "pickup",
    location: { lat: 33.4484, lng: -112.0740 },
    currentLoad: "LR-905",
    pickupLocation: { latitude: 33.4484, longitude: -112.0740 },
    dropoffLocation: { latitude: 36.1699, longitude: -115.1398 },
    eta: 300,
    distanceRemaining: 295,
    cityLabel: "Phoenix",
    state: "AZ",
    highway: "US-60 W",
    active: true,
  },
  {
    driverId: "DRV-106",
    name: "David Lee",
    status: "in_transit",
    location: { lat: 39.7392, lng: -104.9903 },
    currentLoad: "LR-906",
    pickupLocation: { latitude: 40.7608, longitude: -111.8910 },
    dropoffLocation: { latitude: 41.8781, longitude: -87.6298 },
    eta: 600,
    distanceRemaining: 920,
    cityLabel: "Denver",
    state: "CO",
    highway: "I-80 E",
    active: true,
  },
  {
    driverId: "DRV-107",
    name: "Amanda Taylor",
    status: "breakdown",
    location: { lat: 33.7490, lng: -84.3880 },
    currentLoad: "LR-907",
    pickupLocation: { latitude: 35.2271, longitude: -80.8431 },
    dropoffLocation: { latitude: 33.7490, longitude: -84.3880 },
    eta: 0,
    distanceRemaining: 0,
    cityLabel: "Atlanta",
    state: "GA",
    highway: "I-85 S",
    active: true,
  },
  {
    driverId: "DRV-108",
    name: "Christopher Davis",
    status: "in_transit",
    location: { lat: 40.7128, lng: -74.0060 },
    currentLoad: "LR-908",
    pickupLocation: { latitude: 42.3601, longitude: -71.0589 },
    dropoffLocation: { latitude: 38.9072, longitude: -77.0369 },
    eta: 300,
    distanceRemaining: 440,
    cityLabel: "New York",
    state: "NY",
    highway: "I-95 S",
    active: true,
  },
  {
    driverId: "DRV-109",
    name: "Nicole Anderson",
    status: "pickup",
    location: { lat: 32.7767, lng: -96.7970 },
    currentLoad: "LR-909",
    pickupLocation: { latitude: 32.7767, longitude: -96.7970 },
    dropoffLocation: { latitude: 29.7604, longitude: -95.3698 },
    eta: 240,
    distanceRemaining: 240,
    cityLabel: "Dallas",
    state: "TX",
    highway: "I-45 S",
    active: true,
  },
  {
    driverId: "DRV-110",
    name: "Robert Wilson",
    status: "in_transit",
    location: { lat: 30.2672, lng: -97.7431 },
    currentLoad: "LR-910",
    pickupLocation: { latitude: 29.4241, longitude: -98.4936 },
    dropoffLocation: { latitude: 32.7767, longitude: -96.7970 },
    eta: 210,
    distanceRemaining: 280,
    cityLabel: "Austin",
    state: "TX",
    highway: "I-35 N",
    active: true,
  },
  {
    driverId: "DRV-111",
    name: "Jennifer Thomas",
    status: "accomplished",
    location: { lat: 37.7749, lng: -122.4194 },
    currentLoad: "LR-911",
    pickupLocation: { latitude: 38.5816, longitude: -121.4944 },
    dropoffLocation: { latitude: 37.7749, longitude: -122.4194 },
    eta: 45,
    distanceRemaining: 20,
    cityLabel: "San Francisco",
    state: "CA",
    highway: "I-80 W",
    active: true,
  },
  {
    driverId: "DRV-112",
    name: "Daniel Jackson",
    status: "in_transit",
    location: { lat: 36.1699, lng: -115.1398 },
    currentLoad: "LR-912",
    pickupLocation: { latitude: 34.0522, longitude: -118.2437 },
    dropoffLocation: { latitude: 40.7608, longitude: -111.8910 },
    eta: 420,
    distanceRemaining: 585,
    cityLabel: "Las Vegas",
    state: "NV",
    highway: "I-15 N",
    active: true,
  },
  {
    driverId: "DRV-113",
    name: "Michelle White",
    status: "pickup",
    location: { lat: 45.5152, lng: -122.6784 },
    currentLoad: "LR-913",
    pickupLocation: { latitude: 45.5152, longitude: -122.6784 },
    dropoffLocation: { latitude: 47.6062, longitude: -122.3321 },
    eta: 180,
    distanceRemaining: 175,
    cityLabel: "Portland",
    state: "OR",
    highway: "I-5 N",
    active: true,
  },
  {
    driverId: "DRV-114",
    name: "Kevin Harris",
    status: "in_transit",
    location: { lat: 35.2271, lng: -80.8431 },
    currentLoad: "LR-914",
    pickupLocation: { latitude: 36.1627, longitude: -86.7816 },
    dropoffLocation: { latitude: 33.7490, longitude: -84.3880 },
    eta: 270,
    distanceRemaining: 365,
    cityLabel: "Charlotte",
    state: "NC",
    highway: "I-85 S",
    active: true,
  },
  {
    driverId: "DRV-115",
    name: "Lisa Martin",
    status: "accomplished",
    location: { lat: 42.3601, lng: -71.0589 },
    currentLoad: "LR-915",
    pickupLocation: { latitude: 43.6591, longitude: -70.2568 },
    dropoffLocation: { latitude: 42.3601, longitude: -71.0589 },
    eta: 60,
    distanceRemaining: 25,
    cityLabel: "Boston",
    state: "MA",
    highway: "I-95 S",
    active: true,
  },
  {
    driverId: "DRV-116",
    name: "Brian Thompson",
    status: "in_transit",
    location: { lat: 39.9526, lng: -75.1652 },
    currentLoad: "LR-916",
    pickupLocation: { latitude: 40.7128, longitude: -74.0060 },
    dropoffLocation: { latitude: 38.9072, longitude: -77.0369 },
    eta: 180,
    distanceRemaining: 140,
    cityLabel: "Philadelphia",
    state: "PA",
    highway: "I-95 S",
    active: true,
  },
  {
    driverId: "DRV-117",
    name: "Karen Garcia",
    status: "pickup",
    location: { lat: 38.9072, lng: -77.0369 },
    currentLoad: "LR-917",
    pickupLocation: { latitude: 38.9072, longitude: -77.0369 },
    dropoffLocation: { latitude: 35.2271, longitude: -80.8431 },
    eta: 360,
    distanceRemaining: 400,
    cityLabel: "Washington",
    state: "DC",
    highway: "I-85 S",
    active: true,
  },
  {
    driverId: "DRV-118",
    name: "Steven Martinez",
    status: "in_transit",
    location: { lat: 36.1627, lng: -86.7816 },
    currentLoad: "LR-918",
    pickupLocation: { latitude: 35.1495, longitude: -90.0490 },
    dropoffLocation: { latitude: 39.7684, longitude: -86.1581 },
    eta: 300,
    distanceRemaining: 290,
    cityLabel: "Nashville",
    state: "TN",
    highway: "I-65 N",
    active: true,
  },
  {
    driverId: "DRV-119",
    name: "Nancy Robinson",
    status: "accomplished",
    location: { lat: 39.7684, lng: -86.1581 },
    currentLoad: "LR-919",
    pickupLocation: { latitude: 39.0997, longitude: -94.5786 },
    dropoffLocation: { latitude: 39.7684, longitude: -86.1581 },
    eta: 90,
    distanceRemaining: 45,
    cityLabel: "Indianapolis",
    state: "IN",
    highway: "I-70 E",
    active: true,
  },
];

async function addRealisticDrivers() {
  console.log("🚀 Adding Realistic Drivers to Firebase...\n");
  console.log("📊 This will create:");
  console.log("   - 20 new drivers with real US city locations");
  console.log("   - Diverse locations across the country");
  console.log("   - Accurate coordinates matching city names");
  console.log("   - All drivers will have blinking pins in Command Center\n");

  let successCount = 0;
  let errorCount = 0;

  for (const driver of realisticDrivers) {
    try {
      const ref = doc(db, "drivers", driver.driverId);
      await setDoc(ref, {
        ...driver,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      console.log(
        `✅ Added: ${driver.driverId} (${driver.name}) - ${driver.cityLabel}, ${driver.state} on ${driver.highway}`
      );
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to add ${driver.driverId}:`, error);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DRIVER ADDITION COMPLETE!");
  console.log("=".repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Drivers added: ${successCount}/20`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`\n🔍 Where to view:`);
  console.log(`   🎯 Admin Command Center: All drivers with blinking pins`);
  console.log(`   🗺️  Map View: Toggle to see drivers on map`);
  console.log(`   📍 City Labels: Click any pin to see accurate city/state`);
  console.log(`\n💡 Test on:`);
  console.log(`   - iPad/Mobile: Scan QR code`);
  console.log(`   - Web: Current browser window`);
  console.log(`   - Sign in as admin to access Command Center`);
  console.log(`\n✨ All drivers are live with realistic locations!\n`);
}

addRealisticDrivers()
  .then(() => {
    console.log("🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
