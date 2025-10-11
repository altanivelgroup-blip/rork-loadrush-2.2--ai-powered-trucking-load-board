import { FUEL_API_URL, FUEL_API_KEY } from '@env';

console.log('🚀 ========================================');
console.log('🚀 FUEL API INTEGRATION TEST');
console.log('🚀 ========================================\n');

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('📋 Test 1: Environment Variables Check');
  console.log('----------------------------------------');
  
  const envTest: TestResult = {
    name: 'Environment Variables',
    passed: false,
    message: '',
  };

  console.log('FUEL_API_URL:', FUEL_API_URL);
  console.log('FUEL_API_KEY present:', !!FUEL_API_KEY);
  console.log('FUEL_API_KEY length:', FUEL_API_KEY?.length || 0);
  console.log('FUEL_API_KEY value:', FUEL_API_KEY);

  if (!FUEL_API_URL || !FUEL_API_KEY) {
    envTest.message = '❌ Missing environment variables';
    console.error('❌ FAILED: Missing environment variables\n');
  } else if (FUEL_API_KEY === '[YOUR_ACTUAL_API_KEY]') {
    envTest.message = '⚠️ API key is placeholder - needs real key';
    console.warn('⚠️ WARNING: API key is placeholder\n');
  } else {
    envTest.passed = true;
    envTest.message = '✅ Environment variables configured';
    console.log('✅ PASSED: Environment variables configured\n');
  }
  results.push(envTest);

  console.log('📋 Test 2: Direct API Call (react-native-dotenv)');
  console.log('----------------------------------------');
  
  const directApiTest: TestResult = {
    name: 'Direct API Call',
    passed: false,
    message: '',
  };

  try {
    console.log('Making request to:', FUEL_API_URL);
    console.log('With Authorization: Bearer', FUEL_API_KEY?.substring(0, 20) + '...');

    const response = await fetch(FUEL_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FUEL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    if (!response.ok) {
      const errorText = await response.text();
      directApiTest.message = `❌ API returned ${response.status}: ${errorText.substring(0, 200)}`;
      console.error('❌ FAILED:', directApiTest.message);
      console.error('Full error response:', errorText);
    } else {
      const data = await response.json();
      console.log('Response data keys:', Object.keys(data));
      console.log('Full response:', JSON.stringify(data, null, 2));

      directApiTest.passed = true;
      directApiTest.message = '✅ API call successful';
      directApiTest.data = data;
      console.log('✅ PASSED: API call successful\n');
    }
  } catch (error) {
    directApiTest.message = `❌ Fetch error: ${error instanceof Error ? error.message : String(error)}`;
    console.error('❌ FAILED:', directApiTest.message);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
  }
  results.push(directApiTest);

  console.log('📋 Test 3: Alternative API (EXPO_PUBLIC_FUEL_API)');
  console.log('----------------------------------------');
  
  const altApiTest: TestResult = {
    name: 'Alternative API',
    passed: false,
    message: '',
  };

  const ALT_API_URL = process.env.EXPO_PUBLIC_FUEL_API || 'https://api.fuelpricestracker.com/fuel-costs';
  const ALT_API_KEY = process.env.EXPO_PUBLIC_FUEL_KEY || '10482|0Vh5MCrSC1OphlOuderbaNyQQWhTI7lpnpjpghTU';

  try {
    console.log('Making request to:', ALT_API_URL);
    console.log('With Authorization: Bearer', ALT_API_KEY?.substring(0, 20) + '...');

    const response = await fetch(ALT_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ALT_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      altApiTest.message = `❌ API returned ${response.status}: ${errorText.substring(0, 200)}`;
      console.error('❌ FAILED:', altApiTest.message);
    } else {
      const data = await response.json();
      console.log('Response data keys:', Object.keys(data));
      console.log('Full response:', JSON.stringify(data, null, 2));

      altApiTest.passed = true;
      altApiTest.message = '✅ Alternative API call successful';
      altApiTest.data = data;
      console.log('✅ PASSED: Alternative API call successful\n');
    }
  } catch (error) {
    altApiTest.message = `❌ Fetch error: ${error instanceof Error ? error.message : String(error)}`;
    console.error('❌ FAILED:', altApiTest.message);
  }
  results.push(altApiTest);

  console.log('📋 Test 4: Data Structure Validation');
  console.log('----------------------------------------');
  
  const dataTest: TestResult = {
    name: 'Data Structure',
    passed: false,
    message: '',
  };

  const successfulData = directApiTest.data || altApiTest.data;

  if (!successfulData) {
    dataTest.message = '❌ No data to validate';
    console.error('❌ FAILED: No data to validate\n');
  } else {
    console.log('Validating data structure...');
    console.log('Data keys:', Object.keys(successfulData));

    const hasResult = 'result' in successfulData;
    const hasData = 'data' in successfulData;
    const hasPrices = 'prices' in successfulData;
    const hasDiesel = 'diesel' in successfulData;
    const hasGasoline = 'gasoline' in successfulData;

    console.log('Has "result" key:', hasResult);
    console.log('Has "data" key:', hasData);
    console.log('Has "prices" key:', hasPrices);
    console.log('Has "diesel" key:', hasDiesel);
    console.log('Has "gasoline" key:', hasGasoline);

    if (hasResult || hasData || hasPrices || hasDiesel || hasGasoline) {
      dataTest.passed = true;
      dataTest.message = '✅ Data structure is valid';
      console.log('✅ PASSED: Data structure is valid\n');
    } else {
      dataTest.message = '⚠️ Unexpected data structure';
      console.warn('⚠️ WARNING: Unexpected data structure\n');
    }
  }
  results.push(dataTest);

  console.log('\n🚀 ========================================');
  console.log('🚀 TEST SUMMARY');
  console.log('🚀 ========================================\n');

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.data) {
      console.log(`   Data sample:`, JSON.stringify(result.data).substring(0, 100) + '...');
    }
    console.log('');
  });

  console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Fuel API integration is working correctly.');
  } else if (passedTests > 0) {
    console.log('⚠️ SOME TESTS FAILED. Check the logs above for details.');
  } else {
    console.log('❌ ALL TESTS FAILED. Fuel API integration needs attention.');
  }

  console.log('\n🚀 ========================================');
  console.log('🚀 RECOMMENDATIONS');
  console.log('🚀 ========================================\n');

  if (!envTest.passed) {
    console.log('1. Check your .env file has FUEL_API_URL and FUEL_API_KEY');
    console.log('2. Restart the Expo dev server after changing .env');
    console.log('3. Clear cache: npx expo start --clear');
  }

  if (!directApiTest.passed && !altApiTest.passed) {
    console.log('1. Verify your API key is valid');
    console.log('2. Check if the API endpoint is correct');
    console.log('3. Test the API with curl or Postman');
    console.log('4. Check network connectivity');
  }

  if (!dataTest.passed && (directApiTest.passed || altApiTest.passed)) {
    console.log('1. Update fuelService.ts to handle the actual data structure');
    console.log('2. Check the API documentation for response format');
  }

  console.log('\n✅ Test completed!\n');
}

runTests().catch(error => {
  console.error('💥 Test runner crashed:', error);
  if (error instanceof Error) {
    console.error('Stack:', error.stack);
  }
});
