#!/usr/bin/env ts-node
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { enhancedDriversData } from './drivers-data-v4-enhanced';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateDriverMPG() {
  console.log('🚀 Starting MPG update for all driver profiles...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const driver of enhancedDriversData) {
    try {
      const driverDocRef = doc(db, 'drivers', driver.driverId);
      const driverDoc = await getDoc(driverDocRef);

      if (driverDoc.exists()) {
        await updateDoc(driverDocRef, {
          avgMPG: driver.avgMPG,
        });
        console.log(`✅ Updated ${driver.name} (${driver.driverId}): MPG = ${driver.avgMPG}`);
        successCount++;
      } else {
        console.log(`⚠️  Driver ${driver.name} (${driver.driverId}) not found in Firestore`);
      }
    } catch (error) {
      errorCount++;
      const errorMsg = `❌ Error updating ${driver.name} (${driver.driverId}): ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MPG UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📈 Total drivers processed: ${enhancedDriversData.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(err => console.log(err));
  }

  console.log('\n✨ MPG update complete!\n');

  const driversSnapshot = await getDocs(collection(db, 'drivers'));
  console.log(`📦 Total drivers in Firestore: ${driversSnapshot.size}`);
  
  let driversWithMPG = 0;
  const mpgValues: number[] = [];
  
  driversSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.avgMPG) {
      driversWithMPG++;
      mpgValues.push(data.avgMPG);
    }
  });

  console.log(`🎯 Drivers with MPG: ${driversWithMPG}`);
  
  if (mpgValues.length > 0) {
    const avgMPG = mpgValues.reduce((a, b) => a + b, 0) / mpgValues.length;
    const minMPG = Math.min(...mpgValues);
    const maxMPG = Math.max(...mpgValues);
    console.log(`📊 MPG Stats: Min=${minMPG.toFixed(1)}, Max=${maxMPG.toFixed(1)}, Avg=${avgMPG.toFixed(1)}`);
  }

  process.exit(0);
}

updateDriverMPG().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
