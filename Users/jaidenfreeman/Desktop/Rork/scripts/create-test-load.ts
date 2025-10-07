import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

async function createTestLoad() {
  try {
    const loadData = {
      pickupAddress: "1111 N Lamb Blvd, Las Vegas, NV 89110",
      pickupLatitude: 36.1881,
      pickupLongitude: -115.0802,
      dropoffAddress: "8080 W Tropical Pkwy, Las Vegas, NV 89149",
      dropoffLatitude: 36.2945,
      dropoffLongitude: -115.2702,
      loadType: "Vehicle Transport Test",
      vehicleCount: 1,
      price: 120,
      status: "Available",
      createdAt: serverTimestamp(),
      assignedDriverId: null,
      matchedDriverId: null,
      notes: "Live ORS + GPS field test: N Lamb Blvd → Sam's Club Tropical Pkwy.",
    };

    const docRef = await addDoc(collection(db, "loads"), loadData);

    console.log("✅ Test load created successfully!");
    console.log("📄 Document ID:", docRef.id);
    console.log("📍 Pickup:", loadData.pickupAddress);
    console.log("📍 Dropoff:", loadData.dropoffAddress);
    console.log("🚗 Type:", loadData.loadType);
    console.log("💰 Price: $", loadData.price);
    console.log("📊 Status:", loadData.status);

    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating test load:", error);
    throw error;
  }
}

createTestLoad();
