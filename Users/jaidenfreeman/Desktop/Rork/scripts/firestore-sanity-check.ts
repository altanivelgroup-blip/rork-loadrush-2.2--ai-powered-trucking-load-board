import { db } from '../config/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

const COLLECTIONS_TO_CHECK = [
  'drivers',
  'loads',
  'vehicles',
  'trips',
  'alerts',
  'analytics',
  'users'
];

async function runFirestoreSanityCheck() {
  console.log('🔍 Starting Firestore Sanity Check...\n');
  console.log('=' .repeat(60));
  
  const results: Record<string, any> = {
    connectionStatus: 'unknown',
    collections: {},
    errors: [],
    warnings: []
  };

  try {
    console.log('\n✅ Firebase initialized successfully');
    console.log(`📦 Project ID: ${db.app.options.projectId}`);
    console.log(`🔑 API Key: ${db.app.options.apiKey?.substring(0, 20)}...`);
    console.log(`🌐 Auth Domain: ${db.app.options.authDomain}`);
    results.connectionStatus = 'connected';

    console.log('\n' + '='.repeat(60));
    console.log('📊 Checking Collections...\n');

    for (const collectionName of COLLECTIONS_TO_CHECK) {
      try {
        const collectionRef = collection(db, collectionName);
        const q = query(collectionRef, limit(5));
        const snapshot = await getDocs(q);
        
        const docCount = snapshot.size;
        const sampleDocs = snapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }));

        results.collections[collectionName] = {
          exists: true,
          sampleCount: docCount,
          hasData: docCount > 0
        };

        if (docCount > 0) {
          console.log(`✅ ${collectionName}: ${docCount} documents found`);
          console.log(`   Sample IDs: ${sampleDocs.map(d => d.id).join(', ')}`);
        } else {
          console.log(`⚠️  ${collectionName}: Collection exists but is empty`);
          results.warnings.push(`${collectionName} collection is empty`);
        }
      } catch (error: any) {
        console.log(`❌ ${collectionName}: Error - ${error.message}`);
        results.collections[collectionName] = {
          exists: false,
          error: error.message
        };
        results.errors.push(`${collectionName}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔐 Security Rules Check...\n');

    try {
      const testRef = collection(db, 'drivers');
      await getDocs(query(testRef, limit(1)));
      console.log('✅ Read permissions: OK');
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.log('❌ Read permissions: DENIED');
        results.errors.push('Firestore security rules may be blocking reads');
      } else {
        console.log(`⚠️  Read permissions: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 Summary\n');
    console.log(`Connection: ${results.connectionStatus}`);
    console.log(`Collections checked: ${COLLECTIONS_TO_CHECK.length}`);
    console.log(`Collections with data: ${Object.values(results.collections).filter((c: any) => c.hasData).length}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log(`Warnings: ${results.warnings.length}`);

    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      results.errors.forEach((err: string) => console.log(`   - ${err}`));
    }

    if (results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      results.warnings.forEach((warn: string) => console.log(`   - ${warn}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Sanity check complete!\n');

    return results;

  } catch (error: any) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    results.connectionStatus = 'failed';
    results.errors.push(`Critical: ${error.message}`);
    return results;
  }
}

runFirestoreSanityCheck()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
