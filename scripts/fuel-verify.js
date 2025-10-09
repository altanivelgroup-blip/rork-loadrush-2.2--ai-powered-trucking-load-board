const FUEL_API_URL = 'https://api.fuelpricestracker.com/fuel-costs';
const FUEL_API_KEY = '10482|0Vh5MCrSC1OphlOuderbaNyQQWhTI7lpnpjpghTU';

async function verifyFuelConnection() {
  console.log('\n🔍 Verifying Fuel API Connection...\n');
  console.log('📍 Endpoint:', FUEL_API_URL);
  console.log('🔑 API Key:', FUEL_API_KEY.substring(0, 10) + '...');
  console.log('\n---\n');

  try {
    const testUrl = `${FUEL_API_URL}?fuel_type=diesel`;
    console.log('📡 Fetching:', testUrl);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FUEL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log(`\n📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      console.log('\n❌ FAILED: API returned error status');
      return;
    }

    const data = await response.json();
    console.log('\n✅ SUCCESS — API Connected\n');
    console.log('📦 Full Response:', JSON.stringify(data, null, 2));

    if (Array.isArray(data)) {
      console.log('\n📍 First Two Entries:');
      data.slice(0, 2).forEach((entry) => {
        const state = entry.state || entry.location || 'Unknown';
        const price = entry.diesel || entry.price || 'N/A';
        console.log(`   ${state} — $${price} Diesel`);
      });
    } else if (data.price) {
      console.log(`\n💰 Price: $${data.price}/gal`);
    } else if (data.average) {
      console.log(`\n💰 Average: $${data.average}/gal`);
    }

    console.log('\n✅ 200 OK — Connection verified');
  } catch (err) {
    console.error('\n❌ FAILED:', err.message || err);
  }
}

verifyFuelConnection();
