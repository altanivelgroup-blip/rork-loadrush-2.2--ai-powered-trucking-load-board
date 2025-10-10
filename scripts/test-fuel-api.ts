export async function fetchFuelPrices(fuelType = 'diesel', state = 'California') {  // Default to full state name from doc
  try {
    const apiUrl = process.env.EXPO_PUBLIC_FUEL_API;
    const apiKey = process.env.EXPO_PUBLIC_FUEL_KEY;

    console.log('[DEBUG] Starting fetchFuelPrices');
    console.log('[DEBUG] API URL:', apiUrl);
    console.log('[DEBUG] API Key (first 10 + last 5 chars):', apiKey?.substring(0, 10) + '...' + apiKey?.slice(-5));
    console.log('[DEBUG] Params - fuelType:', fuelType, 'state:', state);

    if (!apiUrl || !apiKey) throw new Error('Missing Fuel API config in .env');

    console.log('[DEBUG] User UID:', auth.currentUser?.uid);

    // Optional Firestore pull (for dynamic state/fuelType)
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      fuelType = userData.fuelType || fuelType;
      state = userData.state || state;  // e.g., 'California' from your driver doc
      console.log('[DEBUG] User data loaded - fuelType:', fuelType, 'state:', state);
    } else {
      console.log('[DEBUG] No user doc found - using defaults');
    }

    // Note: API doesn't seem to use query params from doc; it's a simple GET. If needed, add ?fuel_type=${fuelType}
    const fullUrl = apiUrl;  // Or `${apiUrl}?fuel_type=${fuelType}` if API supports it
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

    // Parse the array to find matching state (e.g., for 'California')
    if (data.success && Array.isArray(data.result)) {
      const stateData = data.result.find(item => item.name === state);
      if (stateData) {
        console.log('[DEBUG] Found state data:', stateData);
        return {
          diesel: stateData.diesel,
          gasoline: stateData.gasoline,
          // Add more if needed
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