#!/usr/bin/env node

console.log('🚀 ========================================');
console.log('🚀 FUEL API INTEGRATION TEST');
console.log('🚀 Platform: Node.js (Cross-platform test)');
console.log('🚀 ========================================\n');

const results = [];

async function testAPI(name, url, apiKey) {
  console.log(`\n📋 Testing: ${name}`);
  console.log('----------------------------------------');
  console.log('URL:', url);
  console.log('API Key:', apiKey ? apiKey.substring(0, 20) + '...' : 'MISSING');

  const result = {
    name,
    url,
    passed: false,
    status: null,
    data: null,
    error: null,
  };

  if (!url || !apiKey) {
    result.error = 'Missing URL or API key';
    console.error('❌ FAILED: Missing URL or API key\n');
    results.push(result);
    return result;
  }

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    const endTime = Date.now();

    result.status = response.status;
    console.log('Response status:', response.status);
    console.log('Response time:', endTime - startTime, 'ms');
    console.log('Response OK:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      result.error = `HTTP ${response.status}: ${errorText.substring(0, 200)}`;
      console.error('❌ FAILED:', result.error);
      console.error('Full error:', errorText.substring(0, 500));
    } else {
      const data = await response.json();
      result.data = data;
      result.passed = true;

      console.log('✅ SUCCESS!');
      console.log('Response keys:', Object.keys(data));
      console.log('Response preview:', JSON.stringify(data).substring(0, 300) + '...');

      if (data.result && Array.isArray(data.result)) {
        console.log('📊 Result array length:', data.result.length);
        if (data.result.length > 0) {
          console.log('📊 First item:', JSON.stringify(data.result[0], null, 2));
        }
      }

      if (data.diesel || data.gasoline) {
        console.log('💰 Diesel price:', data.diesel);
        console.log('💰 Gasoline price:', data.gasoline);
      }
    }
  } catch (error) {
    result.error = error.message;
    console.error('❌ FAILED: Fetch error:', error.message);
    console.error('Error details:', error);
  }

  results.push(result);
  return result;
}

async function runAllTests() {
  console.log('🔍 Reading environment variables...\n');

  const ZYLA_URL = 'https://zylalabs.com/api/7700/fuel+prices+tracker+api/12475/fuel+costs';
  const ZYLA_KEY = process.env.FUEL_API_KEY || '[YOUR_ACTUAL_API_KEY]';

  const ALT_URL = process.env.EXPO_PUBLIC_FUEL_API || 'https://api.fuelpricestracker.com/fuel-costs';
  const ALT_KEY = process.env.EXPO_PUBLIC_FUEL_KEY || '10482|0Vh5MCrSC1OphlOuderbaNyQQWhTI7lpnpjpghTU';

  console.log('Environment variables detected:');
  console.log('- FUEL_API_KEY:', ZYLA_KEY !== '[YOUR_ACTUAL_API_KEY]' ? 'SET' : 'NOT SET');
  console.log('- EXPO_PUBLIC_FUEL_API:', ALT_URL);
  console.log('- EXPO_PUBLIC_FUEL_KEY:', ALT_KEY ? 'SET' : 'NOT SET');

  await testAPI('ZYLA API (react-native-dotenv)', ZYLA_URL, ZYLA_KEY);
  await testAPI('Alternative API (EXPO_PUBLIC)', ALT_URL, ALT_KEY);

  console.log('\n\n🚀 ========================================');
  console.log('🚀 TEST SUMMARY');
  console.log('🚀 ========================================\n');

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.name}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${result.status || 'N/A'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.passed && result.data) {
      const dataKeys = Object.keys(result.data);
      console.log(`   Data keys: ${dataKeys.join(', ')}`);
    }
    console.log('');
  });

  console.log(`📊 Results: ${passedTests}/${totalTests} tests passed\n`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Fuel API integration is working correctly.');
    console.log('✅ You can now use this in your React Native app.');
  } else if (passedTests > 0) {
    console.log('⚠️ PARTIAL SUCCESS');
    console.log('⚠️ Some APIs are working, but not all.');
    console.log('⚠️ Check the failed tests above for details.');
  } else {
    console.log('❌ ALL TESTS FAILED');
    console.log('❌ Fuel API integration is not working.');
    console.log('❌ Check your API keys and network connection.');
  }

  console.log('\n🚀 ========================================');
  console.log('🚀 RECOMMENDATIONS');
  console.log('🚀 ========================================\n');

  const zylaTest = results.find(r => r.name.includes('ZYLA'));
  const altTest = results.find(r => r.name.includes('Alternative'));

  if (!zylaTest?.passed && ZYLA_KEY === '[YOUR_ACTUAL_API_KEY]') {
    console.log('📝 ZYLA API:');
    console.log('   1. Get a real API key from https://zylalabs.com/');
    console.log('   2. Update .env file: FUEL_API_KEY=your_real_key');
    console.log('   3. Restart Expo: npx expo start --clear\n');
  }

  if (!altTest?.passed) {
    console.log('📝 Alternative API:');
    console.log('   1. Verify the API key is correct');
    console.log('   2. Check if the endpoint is accessible');
    console.log('   3. Try testing with curl or Postman\n');
  }

  if (passedTests > 0) {
    const workingTest = results.find(r => r.passed);
    console.log('✅ WORKING API DETECTED:');
    console.log(`   Use: ${workingTest.name}`);
    console.log(`   URL: ${workingTest.url}`);
    console.log('   Update your app to use this API endpoint.\n');
  }

  console.log('🔧 Next steps:');
  console.log('   1. If tests pass: Deploy to iOS/Android and test');
  console.log('   2. If tests fail: Check API keys and network');
  console.log('   3. Monitor console logs in the app for errors');
  console.log('   4. Use fallback prices if API is unavailable\n');

  console.log('✅ Test completed!\n');
}

runAllTests().catch(error => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});
