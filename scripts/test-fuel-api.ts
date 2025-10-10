export async function fetchFuelPrices(fuelType = 'diesel', state = 'California') {
  try {
    const apiUrl = 'https://zylalabs.com/api/7700/fuel+prices+tracker+api/12475/fuel+costs';  // Exact from doc (override .env for test)
    const apiKey = process.env.EXPO_PUBLIC_FUEL_KEY;

    console.log('[DEBUG] Starting fetchFuelPrices');
    console.log('[DEBUG] API URL:', apiUrl);
    console.log('[DEBUG] API Key (first 10 + last 5 chars):', apiKey?.substring(0, 10) + '...' + apiKey?.slice(-5));
    console.log('[DEBUG] Params - fuelType:', fuelType, 'state:', state);

    if (!apiUrl || !apiKey) throw new Error('Missing Fuel API config');

    // Skipping Firestore for this test to isolate issue
    console.log('[DEBUG] Skipping Firestore pull for test - using defaults');

    const fullUrl = apiUrl;  // No params, as per doc/curl
    console.log('[DEBUG] Full request URL:', fullUrl);

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    console.log('[DEBUG] Headers being sent:', JSON.stringify(headers, null, 2));

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: headers,
    });

    console.log('[DEBUG] Response status:', response.status, response.statusText);
    console.log('[DEBUG] Response headers:', response.headers.get('content-type'));

    const rawText = await response.text();
    console.log('[DEBUG] Raw response text:', rawText.substring(0, 300));

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${rawText}`);
    }

    let data;
    try {
      data = JSON.parse(rawText);
      console.log('[DEBUG] Parsed data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('[DEBUG] JSON parse error:', parseError.message);
      throw new Error('Invalid JSON response');
    }

    // Find matching state in array
    if (data.success && Array.isArray(data.result)) {
      const stateData = data.result.find(item => item.name === state);
      if (stateData) {
        console.log('[DEBUG] Found state data:', stateData);
        return {
          diesel: stateData.diesel,
          gasoline: stateData.gasoline,
          // Add more as needed
        };
      } else {
        console.log('[DEBUG] No matching state found for:', state);
        throw new Error('No data for requested state');
      }
    } else {
      console.log('[DEBUG] Unexpected response format');
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.error('[DEBUG] Fuel API error:', error.message, error.stack);
    return { diesel: 3.89, gasoline: 3.49 };  // Fallback
  }
}
If This Doesn't Work or You See Specific Errors
Test Outside the App: In your computer terminal, run this curl (copy-paste):
curl --location --request GET 'https://zylalabs.com/api/7700/fuel+prices+tracker+api/12475/fuel+costs' --header 'Authorization: Bearer 10482|0Vh5MCrSC1OphlOuderbaNyQQWhTI7lpnpjpghTU'
Share the output (should be JSON like your sample; if error, the key/URL is wrong).
iPad-Specific Fix: Add this to your app.json (under "ios"):
"ios": {
  "infoPlist": {
    "NSAppTransportSecurity": {
      "NSAllowsArbitraryLoads": true
    }
  }
}