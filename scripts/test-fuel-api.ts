// src/api/fuelApi.ts
import { db, auth } from '../config/firebase';  // Adjust path to your firebase.ts
import { doc, getDoc } from 'firebase/firestore';

export async function fetchFuelPrices(fuelType = 'diesel', state = 'CA') {  // Defaults for testing (e.g., California for western states)
  try {
    const apiUrl = process.env.EXPO_PUBLIC_FUEL_API;
    const apiKey = process.env.EXPO_PUBLIC_FUEL_KEY;

    if (!apiUrl || !apiKey) throw new Error('Missing Fuel API config in .env');

    console.log('User UID:', auth.currentUser?.uid);
    console.log('Fetching from:', apiUrl);

    // Optional: Get user data from Firestore (e.g., fuelType, state) using real UID
    const userRef = doc(db, 'users', auth.currentUser.uid);  // Assumes 'users' collection
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      fuelType = userData.fuelType || fuelType;  // e.g., 'diesel' from your driver doc
      state = userData.state || state;  // e.g., 'California'
      console.log('User fuelType:', fuelType, 'State:', state);
    } else {
      console.log('User doc not found - using defaults');
    }

    // Build the full URL with params (adjust based on API docs; assuming it supports fuel_type and state)
    const fullUrl = `${apiUrl}?fuel_type=${fuelType}&state=${state}`;
    console.log('Full request URL:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,  // From your script - adjust if it's not Bearer (e.g., 'apikey ${apiKey}')
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Fuel API success:', JSON.stringify(data, null, 2));  // Log full response for debug
    return data;
  } catch (error) {
    console.error('Fuel API error:', error.message, error.stack);
    return { diesel: 3.89, gasoline: 3.49 };  // Your fallback prices
  }
}
