import { FUEL_API_URL, FUEL_API_KEY } from '@env';

export interface FuelPrice {
  state?: string;
  city?: string;
  fuelType?: string;
  price?: number;
  station?: string;
  date?: string;
  [key: string]: any;
}

export interface FuelApiResponse {
  result?: FuelPrice[];
  data?: FuelPrice[];
  prices?: FuelPrice[];
  [key: string]: any;
}

export async function fetchFuelPrices(): Promise<FuelPrice[] | null> {
  try {
    console.log('🔥 [FuelService] Starting fuel price fetch from ZYLA API');
    console.log('🔥 [FuelService] API URL:', FUEL_API_URL);
    console.log('🔥 [FuelService] API Key present:', !!FUEL_API_KEY);

    if (!FUEL_API_URL || !FUEL_API_KEY) {
      console.error('❌ [FuelService] Missing API credentials in .env file');
      return null;
    }

    if (FUEL_API_KEY === '[YOUR_ACTUAL_API_KEY]') {
      console.warn('⚠️ [FuelService] API key not configured - using placeholder');
      return null;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const response = await fetch(FUEL_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FUEL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('📡 [FuelService] Response status:', response.status);
    console.log('📡 [FuelService] Response OK:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [FuelService] API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 500),
      });
      return null;
    }

    const jsonData: FuelApiResponse = await response.json();
    console.log('✅ [FuelService] Raw API response keys:', Object.keys(jsonData));

    const fuelData = jsonData.result || jsonData.data || jsonData.prices || [];
    
    if (Array.isArray(fuelData) && fuelData.length > 0) {
      console.log('✅ [FuelService] Fuel data fetched successfully');
      console.log('✅ [FuelService] Total records:', fuelData.length);
      console.log('✅ [FuelService] Sample data:', JSON.stringify(fuelData.slice(0, 3), null, 2));
      return fuelData;
    } else {
      console.warn('⚠️ [FuelService] No fuel data in response');
      console.log('⚠️ [FuelService] Full response:', JSON.stringify(jsonData).substring(0, 500));
      return null;
    }

  } catch (error) {
    console.error('❌ [FuelService] Fetch error:', error);
    if (error instanceof Error) {
      console.error('❌ [FuelService] Error message:', error.message);
      console.error('❌ [FuelService] Error stack:', error.stack);
    }
    return null;
  }
}

export async function fetchFuelPricesByLocation(
  state?: string,
  city?: string
): Promise<FuelPrice[] | null> {
  const allPrices = await fetchFuelPrices();
  
  if (!allPrices) {
    return null;
  }

  let filtered = allPrices;

  if (state) {
    filtered = filtered.filter(
      price => price.state?.toLowerCase() === state.toLowerCase()
    );
    console.log(`🔍 [FuelService] Filtered by state "${state}":`, filtered.length, 'results');
  }

  if (city) {
    filtered = filtered.filter(
      price => price.city?.toLowerCase() === city.toLowerCase()
    );
    console.log(`🔍 [FuelService] Filtered by city "${city}":`, filtered.length, 'results');
  }

  return filtered.length > 0 ? filtered : null;
}

export async function getAverageFuelPrice(
  fuelType?: string
): Promise<number | null> {
  const allPrices = await fetchFuelPrices();
  
  if (!allPrices || allPrices.length === 0) {
    return null;
  }

  let filtered = allPrices;

  if (fuelType) {
    filtered = filtered.filter(
      price => price.fuelType?.toLowerCase() === fuelType.toLowerCase()
    );
  }

  const validPrices = filtered
    .map(p => p.price)
    .filter((price): price is number => typeof price === 'number' && price > 0);

  if (validPrices.length === 0) {
    return null;
  }

  const average = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
  console.log(`📊 [FuelService] Average ${fuelType || 'all'} price: $${average.toFixed(2)}`);
  
  return parseFloat(average.toFixed(2));
}
