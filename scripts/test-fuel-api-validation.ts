/**
 * Fuel Price API Validation Test
 * Tests both primary and mirror endpoints with full logging
 */

const FUEL_API_URL = process.env.EXPO_PUBLIC_FUEL_API!;
const FUEL_API_KEY = process.env.EXPO_PUBLIC_FUEL_KEY!;
const MIRROR_URL = 'https://fuel-data-mirror.loadrush.app/api/v1/prices';

console.log('\n🔍 FUEL PRICE API VALIDATION TEST\n');
console.log('═'.repeat(60));

async function testEndpoint(
  url: string,
  headers: Record<string, string>,
  label: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  console.log(`\n📡 Testing ${label}...`);
  console.log(`URL: ${url}`);
  console.log(`Headers:`, JSON.stringify(headers, null, 2));

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      mode: 'cors',
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error Response Body:`, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    console.log(`✅ Success! Response Data:`, JSON.stringify(data, null, 2));

    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.log(`❌ Fetch Error:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function runTests() {
  console.log('\n📋 Configuration Check:');
  console.log(`EXPO_PUBLIC_FUEL_API: ${FUEL_API_URL || '❌ NOT SET'}`);
  console.log(`EXPO_PUBLIC_FUEL_KEY: ${FUEL_API_KEY ? '✅ SET (' + FUEL_API_KEY.substring(0, 10) + '...)' : '❌ NOT SET'}`);

  if (!FUEL_API_URL || !FUEL_API_KEY) {
    console.log('\n❌ CRITICAL: Missing API credentials in .env file');
    return;
  }

  console.log('\n' + '═'.repeat(60));
  console.log('TEST 1: Primary Endpoint (Diesel)');
  console.log('═'.repeat(60));

  const test1 = await testEndpoint(
    `${FUEL_API_URL}?fuel_type=diesel`,
    {
      'Authorization': `Bearer ${FUEL_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    'Primary API - Diesel'
  );

  console.log('\n' + '═'.repeat(60));
  console.log('TEST 2: Primary Endpoint (Gasoline)');
  console.log('═'.repeat(60));

  const test2 = await testEndpoint(
    `${FUEL_API_URL}?fuel_type=gasoline`,
    {
      'Authorization': `Bearer ${FUEL_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    'Primary API - Gasoline'
  );

  console.log('\n' + '═'.repeat(60));
  console.log('TEST 3: Alternative Query Format (fuel=diesel)');
  console.log('═'.repeat(60));

  const test3 = await testEndpoint(
    `${FUEL_API_URL}?fuel=diesel&country=US`,
    {
      'Authorization': `Bearer ${FUEL_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    'Primary API - Alternative Format'
  );

  console.log('\n' + '═'.repeat(60));
  console.log('TEST 4: Mirror Endpoint (Diesel)');
  console.log('═'.repeat(60));

  const test4 = await testEndpoint(
    `${MIRROR_URL}?fuel=diesel`,
    {
      'Authorization': `Bearer ${FUEL_API_KEY}`,
      'X-API-Key': FUEL_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    'Mirror API - Diesel'
  );

  console.log('\n' + '═'.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('═'.repeat(60));

  const results = [
    { name: 'Primary API (Diesel)', ...test1 },
    { name: 'Primary API (Gasoline)', ...test2 },
    { name: 'Alternative Format', ...test3 },
    { name: 'Mirror API', ...test4 },
  ];

  let successCount = 0;
  results.forEach((result) => {
    if (result.success) {
      successCount++;
      const price = result.data?.price ?? result.data?.average ?? result.data?.data?.price ?? 'N/A';
      console.log(`✅ ${result.name}: SUCCESS`);
      console.log(`   Price: $${price}/gal`);
    } else {
      console.log(`❌ ${result.name}: FAILED`);
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '═'.repeat(60));
  if (successCount > 0) {
    console.log(`✅ SUCCESS: ${successCount}/${results.length} endpoints working`);
    console.log('\n🎯 RECOMMENDATION:');
    const workingTest = results.find((r) => r.success);
    if (workingTest) {
      console.log(`Use this endpoint configuration in your app:`);
      if (workingTest.name.includes('Mirror')) {
        console.log(`URL: ${MIRROR_URL}`);
      } else {
        console.log(`URL: ${FUEL_API_URL}`);
      }
      console.log(`Data structure:`, JSON.stringify(workingTest.data, null, 2));
    }
  } else {
    console.log(`❌ FAILED: All endpoints failed`);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Verify API key is valid and active');
    console.log('2. Check if API service is operational');
    console.log('3. Verify network connectivity');
    console.log('4. Check CORS configuration');
  }
  console.log('═'.repeat(60) + '\n');
}

runTests().catch((err) => {
  console.error('\n💥 Test script crashed:', err);
});
