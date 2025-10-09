/**
 * Quick Fuel API Test - Node.js Compatible
 * Run with: node scripts/fuel-api-quick-test.js
 */

const FUEL_API_URL = 'https://api.fuelpricestracker.com/fuel-costs';
const FUEL_API_KEY = '10482|0Vh5MCrSC1OphlOuderbaNyQQWhTI7lpnpjpghTU';
const MIRROR_URL = 'https://fuel-data-mirror.loadrush.app/api/v1/prices';

console.log('\n🔍 FUEL PRICE API QUICK TEST\n');
console.log('═'.repeat(60));

async function testEndpoint(url, headers, label) {
  console.log(`\n📡 Testing ${label}...`);
  console.log(`URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText.substring(0, 200)}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    console.log(`✅ Response:`, JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (err) {
    console.log(`❌ Fetch Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function runTests() {
  console.log('\n📋 Testing Configuration:');
  console.log(`API URL: ${FUEL_API_URL}`);
  console.log(`API Key: ${FUEL_API_KEY.substring(0, 15)}...`);

  // Test 1: Primary endpoint with fuel_type parameter
  console.log('\n' + '═'.repeat(60));
  console.log('TEST 1: Primary API - fuel_type=diesel');
  console.log('═'.repeat(60));
  const test1 = await testEndpoint(
    `${FUEL_API_URL}?fuel_type=diesel`,
    {
      'Authorization': `Bearer ${FUEL_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    'Primary (fuel_type)'
  );

  // Test 2: Primary endpoint with fuel parameter
  console.log('\n' + '═'.repeat(60));
  console.log('TEST 2: Primary API - fuel=diesel&country=US');
  console.log('═'.repeat(60));
  const test2 = await testEndpoint(
    `${FUEL_API_URL}?fuel=diesel&country=US`,
    {
      'Authorization': `Bearer ${FUEL_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    'Primary (fuel)'
  );

  // Test 3: No parameters
  console.log('\n' + '═'.repeat(60));
  console.log('TEST 3: Primary API - No parameters');
  console.log('═'.repeat(60));
  const test3 = await testEndpoint(
    FUEL_API_URL,
    {
      'Authorization': `Bearer ${FUEL_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    'Primary (no params)'
  );

  // Test 4: Mirror endpoint
  console.log('\n' + '═'.repeat(60));
  console.log('TEST 4: Mirror API');
  console.log('═'.repeat(60));
  const test4 = await testEndpoint(
    `${MIRROR_URL}?fuel=diesel`,
    {
      'Authorization': `Bearer ${FUEL_API_KEY}`,
      'X-API-Key': FUEL_API_KEY,
      'Content-Type': 'application/json',
    },
    'Mirror API'
  );

  // Results summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('═'.repeat(60));

  const results = [
    { name: 'Primary (fuel_type)', ...test1 },
    { name: 'Primary (fuel)', ...test2 },
    { name: 'Primary (no params)', ...test3 },
    { name: 'Mirror API', ...test4 },
  ];

  let successCount = 0;
  results.forEach((result) => {
    if (result.success) {
      successCount++;
      const price = result.data?.price ?? result.data?.average ?? result.data?.data?.price ?? 'N/A';
      console.log(`\n✅ ${result.name}: SUCCESS`);
      console.log(`   Diesel Price: $${price}/gal`);
      console.log(`   Data Structure:`, Object.keys(result.data || {}).join(', '));
    } else {
      console.log(`\n❌ ${result.name}: FAILED - ${result.error}`);
    }
  });

  console.log('\n' + '═'.repeat(60));
  if (successCount > 0) {
    console.log(`\n✅ SUCCESS: ${successCount}/4 endpoints working\n`);
    const working = results.find(r => r.success);
    if (working) {
      console.log('🎯 WORKING CONFIGURATION:');
      console.log(`   Endpoint: ${working.name}`);
      console.log(`   Sample Data:`, JSON.stringify(working.data, null, 2));
    }
  } else {
    console.log(`\n❌ FAILED: All endpoints failed\n`);
    console.log('🔧 Possible Issues:');
    console.log('   • API key expired or invalid');
    console.log('   • API service down');
    console.log('   • Network/CORS issues');
    console.log('   • Wrong endpoint URL');
  }
  console.log('═'.repeat(60) + '\n');
}

runTests().catch(err => {
  console.error('\n💥 Test crashed:', err);
  process.exit(1);
});
