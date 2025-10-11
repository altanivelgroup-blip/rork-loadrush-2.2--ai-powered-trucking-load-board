import { fetchFuelPrices, fetchFuelPricesByLocation, getAverageFuelPrice } from './fuelService';

export async function testFuelService() {
  console.log('\n🚀 ========== FUEL SERVICE TEST START ==========\n');

  console.log('📋 Test 1: Fetch all fuel prices');
  const allPrices = await fetchFuelPrices();
  
  if (allPrices) {
    console.log('✅ Test 1 PASSED: Received', allPrices.length, 'fuel price records');
  } else {
    console.log('❌ Test 1 FAILED: No data received');
  }

  console.log('\n📋 Test 2: Fetch fuel prices by location');
  const locationPrices = await fetchFuelPricesByLocation('California', 'Los Angeles');
  
  if (locationPrices) {
    console.log('✅ Test 2 PASSED: Received', locationPrices.length, 'records for California/Los Angeles');
  } else {
    console.log('⚠️ Test 2: No location-specific data (may be expected)');
  }

  console.log('\n📋 Test 3: Calculate average fuel price');
  const avgPrice = await getAverageFuelPrice('diesel');
  
  if (avgPrice) {
    console.log('✅ Test 3 PASSED: Average diesel price is $' + avgPrice);
  } else {
    console.log('⚠️ Test 3: Could not calculate average (may be expected)');
  }

  console.log('\n🏁 ========== FUEL SERVICE TEST END ==========\n');
  
  return {
    allPricesCount: allPrices?.length ?? 0,
    locationPricesCount: locationPrices?.length ?? 0,
    averagePrice: avgPrice,
    success: !!allPrices,
  };
}

export function initFuelServiceTest() {
  if (__DEV__) {
    setTimeout(() => {
      testFuelService().catch(error => {
        console.error('❌ Fuel service test failed:', error);
      });
    }, 3000);
  }
}
