/**
 * Fuel API Connection Verification
 * Tests the exact configuration from .env
 */

const FUEL_API_URL = 'https://api.fuelpricestracker.com/fuel-costs';
const FUEL_API_KEY = '10482|0Vh5MCrSC1OphlOuderbaNyQQWhTI7lpnpjpghTU';

async function verifyConnection() {
  console.log('\n🔍 Verifying Fuel API Connection\n');
  console.log('Endpoint:', FUEL_API_URL);
  console.log('API Key:', FUEL_API_KEY.substring(0, 10) + '...\n');

  const testUrl = `${FUEL_API_URL}?fuel_type=diesel`;

  try {
    console.log('📡 Fetching:', testUrl);
    console.log('Headers:');
    console.log('  Authorization: Bearer [API_KEY]');
    console.log('  Content-Type: application/json\n');

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FUEL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log(`📊 Response: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText.substring(0, 300));
      console.log('\n❌ FAILED - API returned error status\n');
      return;
    }

    const data = await response.json();
    
    console.log('✅ SUCCESS - Connection Verified\n');
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));

    // Parse and display price entries
    if (Array.isArray(data)) {
      console.log('\n📍 First Two Price Entries:');
      data.slice(0, 2).forEach((entry, i) => {
        const state = entry.state || entry.location || entry.region || 'Unknown';
        const price = entry.diesel || entry.price || 'N/A';
        console.log(`   ${i + 1}. ${state} — $${price} Diesel`);
      });
      console.log(`\n✅ 200 OK — ${data[0]?.state || 'State'} $${data[0]?.diesel || data[0]?.price || 'N/A'} Diesel, ${data[1]?.state || 'State'} $${data[1]?.diesel || data[1]?.price || 'N/A'} Diesel`);
    } else if (data.price) {
      console.log(`\n💰 Diesel Price: $${data.price}/gal`);
      console.log(`\n✅ 200 OK — National Average $${data.price} Diesel`);
    } else if (data.average) {
      console.log(`\n💰 Average Price: $${data.average}/gal`);
      console.log(`\n✅ 200 OK — National Average $${data.average} Diesel`);
    } else {
      console.log('\n⚠️ Unexpected data format');
      console.log('Available fields:', Object.keys(data).join(', '));
    }

    console.log('\n✅ Connection is working correctly\n');

  } catch (err) {
    console.log('\n❌ FAILED:', err.message);
    console.log('\nPossible causes:');
    console.log('  • Network connectivity issue');
    console.log('  • CORS restriction');
    console.log('  • API service is down');
    console.log('  • Invalid API key\n');
  }
}

verifyConnection();
