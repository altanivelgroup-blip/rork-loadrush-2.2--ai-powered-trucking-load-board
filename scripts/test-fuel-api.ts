/**
 * Test script for CollectAPI Fuel Feed Connection
 * Run with: bun run scripts/test-fuel-api.ts
 */

async function testFuelAPI() {
  console.log('🔄 Testing CollectAPI Fuel Feed Connection...\n');

  try {
    const response = await fetch('https://api.collectapi.com/gasPrice/allUsaPrice', {
      method: 'GET',
      headers: {
        'authorization': 'apikey 3h76TGQbMdx0Tsny6kjteC:1Yfg3B0w4EkadHza3kUGH6',
        'content-type': 'application/json',
      },
    });

    console.log('📡 Response Status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('\n✅ Connection Successful!\n');
    console.log('📊 Full Response:', JSON.stringify(data, null, 2));

    if (data.result && Array.isArray(data.result)) {
      console.log('\n🔍 Sample State Data:');
      const sampleState = data.result[0];
      if (sampleState) {
        console.log(`\nState: ${sampleState.state || 'N/A'}`);
        console.log(`Gasoline: $${sampleState.gasoline || 'N/A'}`);
        console.log(`Midgrade: $${sampleState.midGrade || 'N/A'}`);
        console.log(`Premium: $${sampleState.premium || 'N/A'}`);
        console.log(`Diesel: $${sampleState.diesel || 'N/A'}`);
      }
      console.log(`\n📈 Total States: ${data.result.length}`);
    }

  } catch (error) {
    console.error('❌ Error testing fuel API:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
  }
}

testFuelAPI();
