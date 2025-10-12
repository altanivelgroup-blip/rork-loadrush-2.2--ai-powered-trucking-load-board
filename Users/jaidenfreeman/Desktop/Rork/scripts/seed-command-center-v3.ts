import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { driversData } from "./drivers-data-v3";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDrivers() {
  console.log("🚀 Starting LoadRush Command Center driver seed...");
  for (const d of driversData) {
    const ref = doc(db, "drivers", d.driverId);
    await setDoc(ref, { ...d, updatedAt: serverTimestamp(), createdAt: serverTimestamp() });
    console.log(`✅ Seeded: ${d.driverId} (${d.cityLabel})`);
  }
  console.log("✨ Done seeding Command Center drivers!");
}

seedDrivers().catch((e) => console.error("❌ Seeding error:", e));
