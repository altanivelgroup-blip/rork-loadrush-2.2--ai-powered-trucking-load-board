/* eslint-disable no-console */
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import app from './firebase-node';

async function verifyVegasData() {
  console.log('\n🔍 Verifying Vegas Data in Firestore...');
  console.log('=' .repeat(60));
  
  const db = getFirestore(app);
  
  try {
    console.log('\n📊 Checking Drivers Collection...');
    const driversSnap = await getDocs(collection(db, 'drivers'));
    const vegasDrivers = driversSnap.docs.filter(doc => {
      const data = doc.data();
      return doc.id.startsWith('DRV-LV-');
    });
    
    console.log(`  ✅ Total drivers: ${driversSnap.size}`);
    console.log(`  ✅ Vegas drivers: ${vegasDrivers.length}`);
    
    if (vegasDrivers.length > 0) {
      console.log('\n  Sample Vegas Drivers:');
      vegasDrivers.slice(0, 3).forEach(doc => {
        const data = doc.data();
        const name = data.name || `${data.firstName} ${data.lastName}`;
        const lat = data.location?.lat || data.location?.latitude;
        const lng = data.location?.lng || data.location?.longitude;
        console.log(`    - ${doc.id}: ${name} at (${lat?.toFixed(4)}, ${lng?.toFixed(4)})`);
      });
    }
    
    console.log('\n📊 Checking Shippers Collection...');
    const shippersSnap = await getDocs(collection(db, 'shippers'));
    const vegasShippers = shippersSnap.docs.filter(doc => doc.id.startsWith('SHP-LV-'));
    
    console.log(`  ✅ Total shippers: ${shippersSnap.size}`);
    console.log(`  ✅ Vegas shippers: ${vegasShippers.length}`);
    
    if (vegasShippers.length > 0) {
      console.log('\n  Sample Vegas Shippers:');
      vegasShippers.slice(0, 3).forEach(doc => {
        const data = doc.data();
        console.log(`    - ${doc.id}: ${data.companyName}`);
      });
    }
    
    console.log('\n📊 Checking Loads Collection...');
    const loadsSnap = await getDocs(collection(db, 'loads'));
    const vegasLoads = loadsSnap.docs.filter(doc => {
      return doc.id.startsWith('LR-LV');
    });
    
    const matchedLoads = vegasLoads.filter(doc => {
      const data = doc.data();
      return data.matchedDriverId && data.matchedDriverId.trim() !== '';
    });
    
    console.log(`  ✅ Total loads: ${loadsSnap.size}`);
    console.log(`  ✅ Vegas loads: ${vegasLoads.length}`);
    console.log(`  ✅ Matched loads: ${matchedLoads.length}`);
    
    if (matchedLoads.length > 0) {
      console.log('\n  Sample Matched Loads:');
      matchedLoads.slice(0, 5).forEach(doc => {
        const data = doc.data();
        console.log(`    - ${doc.id}: ${data.matchedDriverId} (${data.status})`);
      });
    }
    
    console.log('\n📊 Checking Load Queries...');
    
    const testDriverId = 'DRV-LV-001';
    const matchedQuery = query(
      collection(db, 'loads'),
      where('matchedDriverId', '==', testDriverId)
    );
    const matchedSnap = await getDocs(matchedQuery);
    console.log(`  ✅ Loads for ${testDriverId}: ${matchedSnap.size}`);
    
    if (matchedSnap.size > 0) {
      matchedSnap.docs.forEach(doc => {
        const data = doc.data();
        console.log(`    - ${doc.id}: ${data.pickup?.city} → ${data.dropoff?.city}`);
      });
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Verification Complete!\n');
    
    if (vegasDrivers.length === 0) {
      console.log('⚠️  WARNING: No Vegas drivers found!');
      console.log('   Run: ./scripts/run-seed-from-csv.sh\n');
    } else if (matchedLoads.length === 0) {
      console.log('⚠️  WARNING: No matched loads found!');
      console.log('   Drivers won\'t see any loads in their view.\n');
    } else {
      console.log('🎉 Vegas data is properly seeded and ready for testing!\n');
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyVegasData().catch((e) => {
  console.error('Verification error:', e);
  process.exit(1);
});
