import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

async function migrateLoadStatus() {
  console.log('🔄 Starting load status migration...');
  console.log('📋 Task: Update all loads with status "active" to "Available"\n');

  try {
    const loadsRef = collection(db, 'loads');
    
    console.log('🔍 Searching for loads with status "active"...');
    const activeQuery = query(loadsRef, where('status', '==', 'active'));
    const activeSnapshot = await getDocs(activeQuery);
    
    console.log(`📊 Found ${activeSnapshot.size} loads with status "active"\n`);

    if (activeSnapshot.empty) {
      console.log('✅ No loads need migration. All loads are using correct status values.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const docSnapshot of activeSnapshot.docs) {
      try {
        const loadData = docSnapshot.data();
        console.log(`📝 Migrating load ${docSnapshot.id}:`);
        console.log(`   Old status: "${loadData.status}"`);
        console.log(`   Pickup: ${loadData.pickupAddress || loadData.pickup?.address || 'N/A'}`);
        console.log(`   Dropoff: ${loadData.dropoffAddress || loadData.dropoff?.address || 'N/A'}`);

        await updateDoc(doc(db, 'loads', docSnapshot.id), {
          status: 'Available',
          updatedAt: new Date(),
        });

        console.log(`   ✅ Updated to status: "Available"\n`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error updating load ${docSnapshot.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount} loads`);
    console.log(`   ❌ Failed: ${errorCount} loads`);
    console.log(`   📦 Total processed: ${activeSnapshot.size} loads`);

    console.log('\n🔍 Verifying migration...');
    const verifyQuery = query(loadsRef, where('status', '==', 'active'));
    const verifySnapshot = await getDocs(verifyQuery);
    
    if (verifySnapshot.empty) {
      console.log('✅ Verification passed: No loads with status "active" remain');
    } else {
      console.log(`⚠️  Warning: ${verifySnapshot.size} loads still have status "active"`);
    }

    console.log('\n🔍 Checking Available loads...');
    const availableQuery = query(loadsRef, where('status', '==', 'Available'));
    const availableSnapshot = await getDocs(availableQuery);
    console.log(`📦 Total loads with status "Available": ${availableSnapshot.size}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateLoadStatus()
  .then(() => {
    console.log('\n🎉 Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });
