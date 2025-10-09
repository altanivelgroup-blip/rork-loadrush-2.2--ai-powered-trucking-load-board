import { useEffect, useState } from "react";
import * as Location from "expo-location";

export const useReverseGeocode = () => {
  const [state, setState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchState = async () => {
      try {
        setLoading(true);
        setError(null);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission denied");
          setLoading(false);
          return;
        }

        const { coords } = await Location.getCurrentPositionAsync({});
        console.log("📍 GPS Coordinates:", coords.latitude, coords.longitude);

        const url = `https://api.openrouteservice.org/geocode/reverse?api_key=${process.env.EXPO_PUBLIC_ORS_API}&point.lon=${coords.longitude}&point.lat=${coords.latitude}`;
        
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`ORS API error: ${res.status}`);
        }

        const data = await res.json();
        console.log("🗺️ Reverse Geocode Response:", JSON.stringify(data, null, 2));

        const admin =
          data.features?.[0]?.properties?.region ||
          data.features?.[0]?.properties?.state ||
          data.features?.[0]?.properties?.macroregion;

        if (admin) {
          console.log("✅ State detected:", admin);
          setState(admin);
        } else {
          console.warn("⚠️ State not found in response");
          setError("State not found");
        }
      } catch (err) {
        console.error("❌ Reverse Geocode Error:", err);
        setError(err instanceof Error ? err.message : "GPS lookup failed");
      } finally {
        setLoading(false);
      }
    };

    fetchState();
  }, []);

  return { state, error, loading };
};
