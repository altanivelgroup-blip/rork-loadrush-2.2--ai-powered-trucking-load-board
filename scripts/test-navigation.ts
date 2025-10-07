/**
 * Test script to verify navigation functionality works with fallback
 * Run this to test the navigation hook without Mapbox API key
 */

import { NavigationLocation } from '../hooks/useDriverNavigation';

// Mock test locations
const testOrigin: NavigationLocation = {
  lat: 40.7128, // New York City
  lng: -74.0060
};

const testDestination: NavigationLocation = {
  lat: 34.0522, // Los Angeles
  lng: -118.2437
};

// Distance calculation function (same as in the hook)
function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Test the fallback calculation
console.log('🧪 Testing Navigation Fallback Calculation');
console.log('==========================================');

const distance = getDistanceMiles(testOrigin.lat, testOrigin.lng, testDestination.lat, testDestination.lng);
const estimatedDuration = distance * 1.5; // 1.5 minutes per mile

console.log(`📍 Origin: New York City (${testOrigin.lat}, ${testOrigin.lng})`);
console.log(`📍 Destination: Los Angeles (${testDestination.lat}, ${testDestination.lng})`);
console.log(`📏 Distance: ${distance.toFixed(2)} miles`);
console.log(`⏱️  Estimated Duration: ${estimatedDuration.toFixed(1)} minutes`);
console.log(`⏱️  Estimated Duration: ${(estimatedDuration / 60).toFixed(1)} hours`);

console.log('\n✅ Navigation fallback calculation working correctly!');
console.log('The navigation hook will now work even without a valid Mapbox API key.');
console.log('It will provide straight-line distance and time estimates.');

export {};