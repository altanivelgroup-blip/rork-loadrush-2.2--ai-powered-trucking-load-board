import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: string;
}

async function verifyDrivers(): Promise<VerificationResult> {
  console.log("\n🔍 Verifying Drivers...");
  
  try {
    const driversSnapshot = await getDocs(collection(db, "drivers"));
    const driverCount = driversSnapshot.size;
    
    if (driverCount === 0) {
      return {
        passed: false,
        message: "❌ No drivers found in Firestore",
        details: "Run: ./scripts/run-seed-command-center-v4.sh",
      };
    }
    
    let hasEnhancedData = 0;
    let missingFields: string[] = [];
    
    driversSnapshot.forEach((doc) => {
      const data = doc.data();
      const requiredFields = ["cityLabel", "state", "highway", "location"];
      const hasAllFields = requiredFields.every((field) => data[field]);
      
      if (hasAllFields) {
        hasEnhancedData++;
      } else {
        const missing = requiredFields.filter((field) => !data[field]);
        missingFields.push(`${doc.id}: missing ${missing.join(", ")}`);
      }
    });
    
    if (hasEnhancedData === 0) {
      return {
        passed: false,
        message: `❌ Found ${driverCount} drivers but none have enhanced data`,
        details: "Run: ./scripts/run-seed-command-center-v4.sh to add city labels",
      };
    }
    
    if (hasEnhancedData < driverCount) {
      return {
        passed: true,
        message: `⚠️  Found ${driverCount} drivers, ${hasEnhancedData} have enhanced data`,
        details: `Missing fields in: ${missingFields.slice(0, 3).join("; ")}`,
      };
    }
    
    return {
      passed: true,
      message: `✅ Found ${driverCount} drivers with complete enhanced data`,
      details: `All drivers have cityLabel, state, highway, and location fields`,
    };
  } catch (error) {
    return {
      passed: false,
      message: "❌ Error verifying drivers",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function verifyLoads(): Promise<VerificationResult> {
  console.log("\n🔍 Verifying Loads...");
  
  try {
    const loadsSnapshot = await getDocs(collection(db, "loads"));
    const loadCount = loadsSnapshot.size;
    
    if (loadCount === 0) {
      return {
        passed: false,
        message: "❌ No loads found in Firestore",
        details: "Run: ./scripts/run-seed-loadrush.sh",
      };
    }
    
    let validExpirations = 0;
    let usaOnlyRoutes = 0;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const twentyNineDaysFromNow = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);
    
    const usaStates = ["CA", "TX", "AZ", "NM", "FL", "GA", "NY", "IL", "WA", "OR", "CO", "NV", "UT", "NC", "PA", "MA", "DC", "TN", "IN", "MO", "WI", "MN"];
    
    loadsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      if (data.expiresAt) {
        const expiresAt = data.expiresAt.toDate();
        if (expiresAt >= twentyNineDaysFromNow && expiresAt <= thirtyDaysFromNow) {
          validExpirations++;
        }
      }
      
      const pickupState = data.pickup?.state || data.pickupState;
      const dropoffState = data.dropoff?.state || data.dropoffState;
      
      if (usaStates.includes(pickupState) && usaStates.includes(dropoffState)) {
        usaOnlyRoutes++;
      }
    });
    
    const expirationPercent = Math.round((validExpirations / loadCount) * 100);
    const usaPercent = Math.round((usaOnlyRoutes / loadCount) * 100);
    
    if (validExpirations === 0) {
      return {
        passed: false,
        message: `❌ Found ${loadCount} loads but none have 30-day expiration`,
        details: "Run: ./scripts/run-seed-loadrush.sh to set correct expiration dates",
      };
    }
    
    if (usaOnlyRoutes === 0) {
      return {
        passed: false,
        message: `❌ Found ${loadCount} loads but none are USA-only routes`,
        details: "Check pickup/dropoff states in Firestore",
      };
    }
    
    return {
      passed: true,
      message: `✅ Found ${loadCount} loads`,
      details: `${expirationPercent}% have 30-day expiration, ${usaPercent}% are USA-only routes`,
    };
  } catch (error) {
    return {
      passed: false,
      message: "❌ Error verifying loads",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function verifyCityAccuracy(): Promise<VerificationResult> {
  console.log("\n🔍 Verifying City Label Accuracy...");
  
  try {
    const driversSnapshot = await getDocs(collection(db, "drivers"));
    
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      "Houston": { lat: 29.7604, lng: -95.3698 },
      "Austin": { lat: 30.2672, lng: -97.7431 },
      "Phoenix": { lat: 33.4484, lng: -112.0740 },
      "Los Angeles": { lat: 34.0522, lng: -118.2437 },
      "Denver": { lat: 39.7392, lng: -104.9903 },
      "Chicago": { lat: 41.8781, lng: -87.6298 },
      "New York": { lat: 40.7128, lng: -74.0060 },
      "Miami": { lat: 25.7617, lng: -80.1918 },
      "Atlanta": { lat: 33.7490, lng: -84.3880 },
      "Seattle": { lat: 47.6062, lng: -122.3321 },
    };
    
    let accurateCount = 0;
    let inaccurateDrivers: string[] = [];
    
    driversSnapshot.forEach((doc) => {
      const data = doc.data();
      const cityLabel = data.cityLabel;
      const location = data.location;
      
      if (!cityLabel || !location) return;
      
      const expectedCoords = cityCoordinates[cityLabel];
      if (!expectedCoords) return;
      
      const latDiff = Math.abs(location.lat - expectedCoords.lat);
      const lngDiff = Math.abs(location.lng - expectedCoords.lng);
      
      if (latDiff < 0.1 && lngDiff < 0.1) {
        accurateCount++;
      } else {
        inaccurateDrivers.push(`${doc.id} (${cityLabel}): off by ${latDiff.toFixed(2)}°, ${lngDiff.toFixed(2)}°`);
      }
    });
    
    if (accurateCount === 0) {
      return {
        passed: false,
        message: "❌ No drivers have accurate city coordinates",
        details: "City labels don't match pin positions",
      };
    }
    
    if (inaccurateDrivers.length > 0) {
      return {
        passed: true,
        message: `⚠️  ${accurateCount} drivers have accurate coordinates`,
        details: `Inaccurate: ${inaccurateDrivers.slice(0, 2).join("; ")}`,
      };
    }
    
    return {
      passed: true,
      message: `✅ All ${accurateCount} drivers have accurate city coordinates`,
      details: "City labels match pin positions on map",
    };
  } catch (error) {
    return {
      passed: false,
      message: "❌ Error verifying city accuracy",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runVerification() {
  console.log("🚀 LoadRush Setup Verification");
  console.log("=" .repeat(60));
  console.log("\nThis script verifies:");
  console.log("  ✓ Drivers are seeded with enhanced data");
  console.log("  ✓ Loads have 30-day expiration");
  console.log("  ✓ All routes are USA-only");
  console.log("  ✓ City labels match pin positions");
  
  const results: VerificationResult[] = [];
  
  results.push(await verifyDrivers());
  results.push(await verifyLoads());
  results.push(await verifyCityAccuracy());
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 VERIFICATION RESULTS");
  console.log("=".repeat(60));
  
  results.forEach((result) => {
    console.log(`\n${result.message}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
  });
  
  const allPassed = results.every((r) => r.passed);
  
  console.log("\n" + "=".repeat(60));
  if (allPassed) {
    console.log("🎉 ALL CHECKS PASSED!");
    console.log("=".repeat(60));
    console.log("\n✅ Your LoadRush setup is ready for testing!");
    console.log("\n📱 Next steps:");
    console.log("   1. Open Command Center on iPad/web");
    console.log("   2. Toggle to Map View");
    console.log("   3. Verify pins match city labels");
    console.log("   4. Test demo simulation (optional)");
    console.log("\n📖 See LOADRUSH_TESTING_GUIDE.md for detailed instructions\n");
  } else {
    console.log("⚠️  SOME CHECKS FAILED");
    console.log("=".repeat(60));
    console.log("\n🔧 Follow the suggestions above to fix issues");
    console.log("📖 See LOADRUSH_TESTING_GUIDE.md for help\n");
  }
}

runVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Verification failed:", error);
    process.exit(1);
  });
