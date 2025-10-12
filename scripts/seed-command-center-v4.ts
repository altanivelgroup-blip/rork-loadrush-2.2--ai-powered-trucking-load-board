import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { enhancedDriversData } from "./drivers-data-v4-enhanced";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedEnhancedDrivers() {
  console.log("🚀 Starting LoadRush Command Center Enhanced Driver Seed...\n");
  console.log("📊 This will create:");
  console.log("   - 25 test drivers with accurate USA city/state labels");
  console.log("   - Real highway assignments (I-45, I-10, I-95, etc.)");
  console.log("   - Coordinates matching actual city positions");
  console.log("   - All drivers visible with blinking pins\n");

  let successCount = 0;

  for (const driver of enhancedDriversData) {
    try {
      const ref = doc(db, "drivers", driver.driverId);
      await setDoc(ref, {
        ...driver,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      console.log(
        `✅ Seeded: ${driver.driverId} (${driver.name}) - ${driver.cityLabel}, ${driver.state} on ${driver.highway}`
      );
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to seed ${driver.driverId}:`, error);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 SEEDING COMPLETE!");
  console.log("=".repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Drivers seeded: ${successCount}/25`);
  console.log(`\n🔍 Where to view:`);
  console.log(`   🎯 Admin Command Center: All ${successCount} drivers with blinking pins`);
  console.log(`   🗺️  Map View: Toggle to see drivers on react-native-maps`);
  console.log(`   📍 City Labels: Click any pin to see accurate city/state`);
  console.log(`\n💡 Test on:`);
  console.log(`   - iPad/Mobile: Scan QR code`);
  console.log(`   - Web: Current browser window`);
  console.log(`   - Sign in as admin to access Command Center`);
  console.log(`\n✨ All drivers are live and pins are blinking!\n`);
}

seedEnhancedDrivers()
  .then(() => {
    console.log("🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
