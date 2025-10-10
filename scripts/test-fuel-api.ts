export async function fetchFuelPrices(fuelType = 'diesel', state = 'CA') {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_FUEL_API;
    const apiKey = process.env.EXPO_PUBLIC_FUEL_KEY;

    console.log('[DEBUG] Starting fetchFuelPrices');
    console.log('[DEBUG] API URL:', apiUrl);
    console.log('[DEBUG] API Key (first 10 chars):', apiKey?.substring(0, 10));
    console.log('[DEBUG] Params - fuelType:', fuelType, 'state:', state);

    if (!apiUrl || !apiKey) throw new Error('Missing Fuel API config in .env');

    console.log('[DEBUG] User UID:', auth.currentUser?.uid);

    // Optional Firestore pull
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      fuelType = userData.fuelType || fuelType;
      state = userData.state || state;
      console.log('[DEBUG] User data loaded - fuelType:', fuelType, 'state:', state);
    } else {
      console.log('[DEBUG] No user doc found - using defaults');
    }

    const fullUrl = `${apiUrl}?fuel_type=${fuelType}&state=${state}`;
    console.log('[DEBUG] Full request URL:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('[DEBUG] Response status:', response.status, response.statusText);
    console.log('[DEBUG] Response headers:', response.headers.get('content-type'));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[DEBUG] Error response text:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[DEBUG] Parsed data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('[DEBUG] Fuel API error:', error.message, error.stack);
    return { diesel: 3.89, gasoline: 3.49 };  // Fallback
  }
}
