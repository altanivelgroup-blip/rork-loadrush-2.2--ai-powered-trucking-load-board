const FUEL_API_URL = process.env.EXPO_PUBLIC_FUEL_API!;
const FUEL_API_KEY = process.env.EXPO_PUBLIC_FUEL_KEY!;

async function verifyFuelConnection() {
  console.log('\n🔍 Verifying Fuel API Connection...\n');
  console.log('📍 Endpoint:', FUEL_API_URL);
  console.log('🔑 API Key:', FUEL_API_KEY ? `${FUEL_API_KEY.substring(0, 10)}...` : 'MISSING');
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
      return;
    }

    const data = await response.json();
    console.log('\n✅ SUCCESS — API Connected\n');
    console.log('📦 Full Response:', JSON.stringify(data, null, 2));

    if (Array.isArray(data)) {
      console.log('\n📍 First Two Entries:');
      data.slice(0, 2).forEach((entry: any) => {
        console.log(`   ${entry.state || entry.location || 'Unknown'} — $${entry.diesel || entry.price || 'N/A'} Diesel`);
      });
    } else if (data.price) {
      console.log(`\n💰 Price: $${data.price}/gal`);
    } else if (data.average) {
      console.log(`\n💰 Average: $${data.average}/gal`);
    }

    console.log('\n✅ 200 OK — Connection verified');
  } catch (err) {
    console.error('\n❌ FAILED:', err instanceof Error ? err.message : err);
  }
}

verifyFuelConnection();
