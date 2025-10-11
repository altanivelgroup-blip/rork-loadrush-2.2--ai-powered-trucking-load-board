import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

async function verifyTestData() {
  console.log('🔍 Verifying LoadRush Test Data...\n');
  console.log('='.repeat(60));
  
  let allChecksPass = true;
  
  try {
    console.log('\n📊 Checking Drivers Collection...');
    const driversSnapshot = await getDocs(collection(db, 'drivers'));
    const driversCount = driversSnapshot.size;
    
    if (driversCount === 0) {
      console.log('❌ No drivers found in Firestore');
      console.log('   Run: npm run seed-test-data');
      allChecksPass = false;
    } else {
      console.log(`✅ Found ${driversCount} drivers`);
      
      const statusCounts: Record<string, number> = {};
      const missingFields: string[] = [];
      
      driversSnapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        
        if (!data.location || typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number') {
          missingFields.push(`${doc.id}: invalid location`);
        }
        if (!data.name) {
          missingFields.push(`${doc.id}: missing name`);
        }
        if (!data.status) {
          missingFields.push(`${doc.id}: missing status`);
        }
      });
      
      console.log('\n   Status Breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
      
      if (missingFields.length > 0) {
        console.log('\n   ⚠️  Issues found:');
        missingFields.forEach((issue) => console.log(`   - ${issue}`));
        allChecksPass = false;
      }
    }
    
    console.log('\n📦 Checking Loads Collection...');
    const loadsSnapshot = await getDocs(collection(db, 'loads'));
    const loadsCount = loadsSnapshot.size;
    
    if (loadsCount === 0) {
      console.log('❌ No loads found in Firestore');
      console.log('   Run: npm run seed-test-data');
      allChecksPass = false;
    } else {
      console.log(`✅ Found ${loadsCount} loads`);
      
      const statusCounts: Record<string, number> = {};
      const missingFields: string[] = [];
      const expiredLoads: string[] = [];
      const now = new Date();
      
      loadsSnapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        
        if (typeof data.pickupLatitude !== 'number' || typeof data.pickupLongitude !== 'number') {
          missingFields.push(`${doc.id}: invalid pickup coordinates`);
        }
        if (typeof data.dropoffLatitude !== 'number' || typeof data.dropoffLongitude !== 'number') {
          missingFields.push(`${doc.id}: invalid dropoff coordinates`);
        }
        if (!data.pickup || !data.pickup.city || !data.pickup.state) {
          missingFields.push(`${doc.id}: missing pickup details`);
        }
        if (!data.dropoff || !data.dropoff.city || !data.dropoff.state) {
          missingFields.push(`${doc.id}: missing dropoff details`);
        }
        if (!data.expiresAt) {
          missingFields.push(`${doc.id}: missing expiresAt`);
        } else {
          const expiresAt = data.expiresAt.toDate();
          if (expiresAt < now) {
            expiredLoads.push(`${doc.id}: expired on ${expiresAt.toLocaleDateString()}`);
          }
        }
      });
      
      console.log('\n   Status Breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
      
      if (missingFields.length > 0) {
        console.log('\n   ⚠️  Issues found:');
        missingFields.forEach((issue) => console.log(`   - ${issue}`));
        allChecksPass = false;
      }
      
      if (expiredLoads.length > 0) {
        console.log('\n   ⚠️  Expired loads:');
        expiredLoads.forEach((issue) => console.log(`   - ${issue}`));
        allChecksPass = false;
      }
    }
    
    console.log('\n📱 Checking Driver-Visible Loads...');
    const availableLoadsQuery = query(
      collection(db, 'loads'),
      where('status', '==', 'Available')
    );
    const availableLoadsSnapshot = await getDocs(availableLoadsQuery);
    const availableCount = availableLoadsSnapshot.size;
    
    if (availableCount === 0) {
      console.log('⚠️  No loads with status "Available" found');
      console.log('   Drivers won\'t see any loads in their app');
      console.log('   This might be expected if all loads are assigned');
    } else {
      console.log(`✅ Found ${availableCount} available loads for drivers`);
    }
    
    console.log('\n🔍 Checking Data Quality...');
    
    const sampleLoad = loadsSnapshot.docs[0];
    if (sampleLoad) {
      const data = sampleLoad.data();
      console.log('\n   Sample Load Structure:');
      console.log(`   - ID: ${sampleLoad.id}`);
      console.log(`   - Status: ${data.status}`);
      console.log(`   - Pickup: ${data.pickup?.city}, ${data.pickup?.state}`);
      console.log(`   - Dropoff: ${data.dropoff?.city}, ${data.dropoff?.state}`);
      console.log(`   - Coordinates: (${data.pickupLatitude}, ${data.pickupLongitude}) → (${data.dropoffLatitude}, ${data.dropoffLongitude})`);
      console.log(`   - Price: $${data.price}`);
      console.log(`   - Distance: ${data.distance} mi`);
      console.log(`   - Rate/mi: $${data.ratePerMile}`);
      console.log(`   - Expires: ${data.expiresAt?.toDate?.()?.toLocaleDateString() || 'N/A'}`);
    }
    
    const sampleDriver = driversSnapshot.docs[0];
    if (sampleDriver) {
      const data = sampleDriver.data();
      console.log('\n   Sample Driver Structure:');
      console.log(`   - ID: ${sampleDriver.id}`);
      console.log(`   - Driver ID: ${data.driverId}`);
      console.log(`   - Name: ${data.name}`);
      console.log(`   - Status: ${data.status}`);
      console.log(`   - Location: (${data.location?.lat}, ${data.location?.lng})`);
      console.log(`   - Current Load: ${data.currentLoad || 'None'}`);
      console.log(`   - Phone: ${data.phone || 'N/A'}`);
      console.log(`   - Truck: ${data.truckInfo?.make} ${data.truckInfo?.model} ${data.truckInfo?.year || ''}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (allChecksPass) {
      console.log('\n✅ ALL CHECKS PASSED!');
      console.log('\n🎉 Your test data is properly configured and ready to use!');
      console.log('\n📱 Next Steps:');
      console.log('   1. Sign in as Driver → Check Loads tab');
      console.log('   2. Sign in as Shipper → Check Loads section');
      console.log('   3. Long-press logo → Admin → Command Center');
      console.log('   4. Test on iPad/Mobile via QR code');
      console.log('   5. Verify data appears on web version');
    } else {
      console.log('\n⚠️  SOME CHECKS FAILED');
      console.log('\n🔧 Recommended Actions:');
      console.log('   1. Run: npm run seed-test-data');
      console.log('   2. Check Firebase connection in config/firebase.ts');
      console.log('   3. Verify Firestore security rules');
      console.log('   4. Re-run this verification script');
    }
    
    console.log('\n📊 Summary:');
    console.log(`   - Drivers: ${driversCount}`);
    console.log(`   - Loads: ${loadsCount}`);
    console.log(`   - Available for Drivers: ${availableCount}`);
    console.log(`   - Status: ${allChecksPass ? '✅ READY' : '⚠️  NEEDS ATTENTION'}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check Firebase connection');
    console.log('   2. Verify credentials in .env file');
    console.log('   3. Ensure Firestore is initialized');
    console.log('   4. Check network connectivity');
    throw error;
  }
}

verifyTestData()
  .then(() => {
    console.log('🎉 Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
