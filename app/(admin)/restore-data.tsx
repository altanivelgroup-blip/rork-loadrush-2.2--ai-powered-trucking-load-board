import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { db } from '@/config/firebase';
import { collection, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';

interface TestDriver {
  driverId: string;
  name: string;
  status: 'pickup' | 'in_transit' | 'accomplished' | 'breakdown';
  location: { lat: number; lng: number };
  currentLoad?: string | null;
  pickupLocation?: { latitude: number; longitude: number };
  dropoffLocation?: { latitude: number; longitude: number };
  eta?: number;
  distanceRemaining?: number;
  phone?: string;
  email?: string;
  truckInfo?: { make: string; model: string; year: number };
}

interface TestLoad {
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  loadType: string;
  vehicleCount: number;
  price: number;
  rate: number;
  status: 'Available' | 'posted' | 'matched' | 'in_transit' | 'delivered' | 'cancelled';
  assignedDriverId: string | null;
  matchedDriverId: string | null;
  shipperId: string;
  notes: string;
  pickup: { address: string; city: string; state: string; zip: string; date: string };
  dropoff: { address: string; city: string; state: string; zip: string; date: string };
  cargo: { type: string; weight: number; description?: string };
  distance: number;
  ratePerMile: number;
}

function useSeedData() {
  const drivers: TestDriver[] = useMemo(() => [
    { driverId: 'DRV-001', name: 'Jake Miller', status: 'in_transit', location: { lat: 32.7767, lng: -96.7970 }, currentLoad: 'LOAD-001', pickupLocation: { latitude: 32.7767, longitude: -96.7970 }, dropoffLocation: { latitude: 29.7604, longitude: -95.3698 }, eta: 45.2, distanceRemaining: 32.5, phone: '(555) 101-0001', email: 'jake.miller@loadrush.com', truckInfo: { make: 'Freightliner', model: 'Cascadia', year: 2022 } },
    { driverId: 'DRV-002', name: 'Sarah Lopez', status: 'pickup', location: { lat: 29.7604, lng: -95.3698 }, currentLoad: 'LOAD-002', pickupLocation: { latitude: 29.7604, longitude: -95.3698 }, dropoffLocation: { latitude: 34.0522, longitude: -118.2437 }, eta: 12.8, distanceRemaining: 8.3, phone: '(555) 102-0002', email: 'sarah.lopez@loadrush.com', truckInfo: { make: 'Kenworth', model: 'T680', year: 2021 } },
    { driverId: 'DRV-003', name: 'Tony Reed', status: 'accomplished', location: { lat: 34.0522, lng: -118.2437 }, phone: '(555) 103-0003', email: 'tony.reed@loadrush.com', truckInfo: { make: 'Peterbilt', model: '579', year: 2023 } },
    { driverId: 'DRV-004', name: 'John Davis', status: 'in_transit', location: { lat: 33.4484, lng: -112.0740 }, currentLoad: 'LOAD-004', pickupLocation: { latitude: 33.4484, longitude: -112.0740 }, dropoffLocation: { latitude: 41.8781, longitude: -87.6298 }, eta: 120.5, distanceRemaining: 95.7, phone: '(555) 104-0004', email: 'john.davis@loadrush.com', truckInfo: { make: 'Volvo', model: 'VNL', year: 2022 } },
    { driverId: 'DRV-005', name: 'Rachel Carter', status: 'breakdown', location: { lat: 41.8781, lng: -87.6298 }, currentLoad: 'LOAD-005', pickupLocation: { latitude: 41.8781, longitude: -87.6298 }, dropoffLocation: { latitude: 33.7490, longitude: -84.3880 }, eta: 0, distanceRemaining: 58.2, phone: '(555) 105-0005', email: 'rachel.carter@loadrush.com', truckInfo: { make: 'Mack', model: 'Anthem', year: 2021 } },
    { driverId: 'DRV-006', name: 'Mike Johnson', status: 'in_transit', location: { lat: 33.7490, lng: -84.3880 }, currentLoad: 'LOAD-006', pickupLocation: { latitude: 33.7490, longitude: -84.3880 }, dropoffLocation: { latitude: 25.7617, longitude: -80.1918 }, eta: 78.3, distanceRemaining: 62.1, phone: '(555) 106-0006', email: 'mike.johnson@loadrush.com', truckInfo: { make: 'International', model: 'LT', year: 2022 } },
    { driverId: 'DRV-007', name: 'Emily Chen', status: 'in_transit', location: { lat: 25.7617, lng: -80.1918 }, currentLoad: 'LOAD-007', pickupLocation: { latitude: 25.7617, longitude: -80.1918 }, dropoffLocation: { latitude: 28.5383, longitude: -81.3792 }, eta: 34.5, distanceRemaining: 28.9, phone: '(555) 107-0007', email: 'emily.chen@loadrush.com', truckInfo: { make: 'Freightliner', model: 'Cascadia', year: 2023 } },
    { driverId: 'DRV-008', name: 'David Martinez', status: 'pickup', location: { lat: 28.5383, lng: -81.3792 }, currentLoad: 'LOAD-008', pickupLocation: { latitude: 28.5383, longitude: -81.3792 }, dropoffLocation: { latitude: 47.6062, longitude: -122.3321 }, eta: 15.2, distanceRemaining: 10.5, phone: '(555) 108-0008', email: 'david.martinez@loadrush.com', truckInfo: { make: 'Kenworth', model: 'W900', year: 2021 } },
    { driverId: 'DRV-009', name: 'Lisa Anderson', status: 'accomplished', location: { lat: 47.6062, lng: -122.3321 }, phone: '(555) 109-0009', email: 'lisa.anderson@loadrush.com', truckInfo: { make: 'Peterbilt', model: '389', year: 2022 } },
    { driverId: 'DRV-010', name: 'Robert Taylor', status: 'in_transit', location: { lat: 45.5152, lng: -122.6784 }, currentLoad: 'LOAD-010', pickupLocation: { latitude: 45.5152, longitude: -122.6784 }, dropoffLocation: { latitude: 39.7392, longitude: -104.9903 }, eta: 92.7, distanceRemaining: 78.4, phone: '(555) 110-0010', email: 'robert.taylor@loadrush.com', truckInfo: { make: 'Volvo', model: 'VNL 860', year: 2023 } },
    { driverId: 'DRV-011', name: 'Jennifer White', status: 'pickup', location: { lat: 39.7392, lng: -104.9903 }, currentLoad: 'LOAD-011', pickupLocation: { latitude: 39.7392, longitude: -104.9903 }, dropoffLocation: { latitude: 36.1699, longitude: -115.1398 }, eta: 18.9, distanceRemaining: 12.3, phone: '(555) 111-0011', email: 'jennifer.white@loadrush.com', truckInfo: { make: 'Mack', model: 'Pinnacle', year: 2021 } },
    { driverId: 'DRV-012', name: 'Chris Brown', status: 'in_transit', location: { lat: 36.1699, lng: -115.1398 }, currentLoad: 'LOAD-012', pickupLocation: { latitude: 36.1699, longitude: -115.1398 }, dropoffLocation: { latitude: 37.7749, longitude: -122.4194 }, eta: 56.8, distanceRemaining: 45.2, phone: '(555) 112-0012', email: 'chris.brown@loadrush.com', truckInfo: { make: 'International', model: 'ProStar', year: 2022 } },
    { driverId: 'DRV-013', name: 'Amanda Wilson', status: 'accomplished', location: { lat: 37.7749, lng: -122.4194 }, phone: '(555) 113-0013', email: 'amanda.wilson@loadrush.com', truckInfo: { make: 'Freightliner', model: 'Coronado', year: 2021 } },
    { driverId: 'DRV-014', name: 'Kevin Garcia', status: 'in_transit', location: { lat: 40.7128, lng: -74.0060 }, currentLoad: 'LOAD-014', pickupLocation: { latitude: 40.7128, longitude: -74.0060 }, dropoffLocation: { latitude: 42.3601, longitude: -71.0589 }, eta: 28.4, distanceRemaining: 22.1, phone: '(555) 114-0014', email: 'kevin.garcia@loadrush.com', truckInfo: { make: 'Kenworth', model: 'T800', year: 2023 } },
    { driverId: 'DRV-015', name: 'Michelle Lee', status: 'breakdown', location: { lat: 42.3601, lng: -71.0589 }, currentLoad: 'LOAD-015', pickupLocation: { latitude: 42.3601, longitude: -71.0589 }, dropoffLocation: { latitude: 39.9526, longitude: -75.1652 }, eta: 0, distanceRemaining: 35.8, phone: '(555) 115-0015', email: 'michelle.lee@loadrush.com', truckInfo: { make: 'Peterbilt', model: '567', year: 2022 } },
  ], []);

  const loads: TestLoad[] = useMemo(() => [
    {
      pickupAddress: '1200 Main St, Dallas, TX 75201', pickupLatitude: 32.7767, pickupLongitude: -96.7970,
      dropoffAddress: '5000 Westheimer Rd, Houston, TX 77056', dropoffLatitude: 29.7604, dropoffLongitude: -95.3698,
      loadType: 'Electronics', vehicleCount: 2, price: 850, rate: 850, status: 'in_transit', assignedDriverId: 'DRV-001', matchedDriverId: 'DRV-001', shipperId: 'SHIPPER-001',
      notes: 'Fragile electronics - handle with care',
      pickup: { address: '1200 Main St, Dallas, TX 75201', city: 'Dallas', state: 'TX', zip: '75201', date: new Date().toISOString() },
      dropoff: { address: '5000 Westheimer Rd, Houston, TX 77056', city: 'Houston', state: 'TX', zip: '77056', date: new Date(Date.now() + 86400000).toISOString() },
      cargo: { type: 'Electronics', weight: 5000, description: 'Consumer electronics - temperature controlled' },
      distance: 240, ratePerMile: 3.54,
    },
    {
      pickupAddress: '3000 Travis St, Houston, TX 77002', pickupLatitude: 29.7604, pickupLongitude: -95.3698,
      dropoffAddress: '1000 Wilshire Blvd, Los Angeles, CA 90017', dropoffLatitude: 34.0522, dropoffLongitude: -118.2437,
      loadType: 'Auto Parts', vehicleCount: 3, price: 3200, rate: 3200, status: 'matched', assignedDriverId: 'DRV-002', matchedDriverId: 'DRV-002', shipperId: 'SHIPPER-002',
      notes: 'Automotive components - fragile items',
      pickup: { address: '3000 Travis St, Houston, TX 77002', city: 'Houston', state: 'TX', zip: '77002', date: new Date().toISOString() },
      dropoff: { address: '1000 Wilshire Blvd, Los Angeles, CA 90017', city: 'Los Angeles', state: 'CA', zip: '90017', date: new Date(Date.now() + 172800000).toISOString() },
      cargo: { type: 'Auto Parts', weight: 8000, description: 'Engine components and transmission parts' },
      distance: 1545, ratePerMile: 2.07,
    },
    {
      pickupAddress: '500 S Grand Ave, Los Angeles, CA 90071', pickupLatitude: 34.0522, pickupLongitude: -118.2437,
      dropoffAddress: '2000 E Camelback Rd, Phoenix, AZ 85016', dropoffLatitude: 33.4484, dropoffLongitude: -112.0740,
      loadType: 'Furniture', vehicleCount: 1, price: 950, rate: 950, status: 'Available', assignedDriverId: null, matchedDriverId: null, shipperId: 'SHIPPER-001',
      notes: 'Office furniture - standard delivery',
      pickup: { address: '500 S Grand Ave, Los Angeles, CA 90071', city: 'Los Angeles', state: 'CA', zip: '90071', date: new Date(Date.now() + 86400000).toISOString() },
      dropoff: { address: '2000 E Camelback Rd, Phoenix, AZ 85016', city: 'Phoenix', state: 'AZ', zip: '85016', date: new Date(Date.now() + 172800000).toISOString() },
      cargo: { type: 'Furniture', weight: 6000, description: 'Office desks and chairs' },
      distance: 373, ratePerMile: 2.55,
    },
    {
      pickupAddress: '1500 N Central Ave, Phoenix, AZ 85004', pickupLatitude: 33.4484, pickupLongitude: -112.0740,
      dropoffAddress: '233 S Wacker Dr, Chicago, IL 60606', dropoffLatitude: 41.8781, dropoffLongitude: -87.6298,
      loadType: 'Industrial Equipment', vehicleCount: 4, price: 4200, rate: 4200, status: 'in_transit', assignedDriverId: 'DRV-004', matchedDriverId: 'DRV-004', shipperId: 'SHIPPER-003',
      notes: 'Heavy machinery - requires special handling',
      pickup: { address: '1500 N Central Ave, Phoenix, AZ 85004', city: 'Phoenix', state: 'AZ', zip: '85004', date: new Date(Date.now() - 43200000).toISOString() },
      dropoff: { address: '233 S Wacker Dr, Chicago, IL 60606', city: 'Chicago', state: 'IL', zip: '60606', date: new Date(Date.now() + 129600000).toISOString() },
      cargo: { type: 'Industrial Equipment', weight: 12000, description: 'Manufacturing equipment and tools' },
      distance: 1745, ratePerMile: 2.41,
    },
    {
      pickupAddress: '350 E Cermak Rd, Chicago, IL 60616', pickupLatitude: 41.8781, pickupLongitude: -87.6298,
      dropoffAddress: '265 Peachtree St NE, Atlanta, GA 30303', dropoffLatitude: 33.7490, dropoffLongitude: -84.3880,
      loadType: 'Food Products', vehicleCount: 2, price: 1850, rate: 1850, status: 'in_transit', assignedDriverId: 'DRV-005', matchedDriverId: 'DRV-005', shipperId: 'SHIPPER-002',
      notes: 'Refrigerated goods - maintain temperature',
      pickup: { address: '350 E Cermak Rd, Chicago, IL 60616', city: 'Chicago', state: 'IL', zip: '60616', date: new Date(Date.now() - 86400000).toISOString() },
      dropoff: { address: '265 Peachtree St NE, Atlanta, GA 30303', city: 'Atlanta', state: 'GA', zip: '30303', date: new Date(Date.now() + 43200000).toISOString() },
      cargo: { type: 'Food Products', weight: 7500, description: 'Frozen foods - maintain 0°F' },
      distance: 715, ratePerMile: 2.59,
    },
    {
      pickupAddress: '180 Peachtree St NW, Atlanta, GA 30303', pickupLatitude: 33.7490, pickupLongitude: -84.3880,
      dropoffAddress: '200 Biscayne Blvd, Miami, FL 33131', dropoffLatitude: 25.7617, dropoffLongitude: -80.1918,
      loadType: 'Textiles', vehicleCount: 2, price: 1450, rate: 1450, status: 'in_transit', assignedDriverId: 'DRV-006', matchedDriverId: 'DRV-006', shipperId: 'SHIPPER-001',
      notes: 'Clothing and fabrics - keep dry',
      pickup: { address: '180 Peachtree St NW, Atlanta, GA 30303', city: 'Atlanta', state: 'GA', zip: '30303', date: new Date(Date.now() - 43200000).toISOString() },
      dropoff: { address: '200 Biscayne Blvd, Miami, FL 33131', city: 'Miami', state: 'FL', zip: '33131', date: new Date(Date.now() + 86400000).toISOString() },
      cargo: { type: 'Textiles', weight: 5500, description: 'Clothing and fabric materials' },
      distance: 663, ratePerMile: 2.19,
    },
    {
      pickupAddress: '100 SE 2nd St, Miami, FL 33131', pickupLatitude: 25.7617, pickupLongitude: -80.1918,
      dropoffAddress: '400 W Church St, Orlando, FL 32801', dropoffLatitude: 28.5383, dropoffLongitude: -81.3792,
      loadType: 'Medical Supplies', vehicleCount: 1, price: 650, rate: 650, status: 'in_transit', assignedDriverId: 'DRV-007', matchedDriverId: 'DRV-007', shipperId: 'SHIPPER-003',
      notes: 'Medical equipment - priority delivery',
      pickup: { address: '100 SE 2nd St, Miami, FL 33131', city: 'Miami', state: 'FL', zip: '33131', date: new Date(Date.now() - 21600000).toISOString() },
      dropoff: { address: '400 W Church St, Orlando, FL 32801', city: 'Orlando', state: 'FL', zip: '32801', date: new Date(Date.now() + 64800000).toISOString() },
      cargo: { type: 'Medical Supplies', weight: 3000, description: 'Hospital equipment and supplies' },
      distance: 235, ratePerMile: 2.77,
    },
    {
      pickupAddress: '125 E Orange Ave, Orlando, FL 32801', pickupLatitude: 28.5383, pickupLongitude: -81.3792,
      dropoffAddress: '1301 2nd Ave, Seattle, WA 98101', dropoffLatitude: 47.6062, dropoffLongitude: -122.3321,
      loadType: 'Electronics', vehicleCount: 3, price: 5200, rate: 5200, status: 'matched', assignedDriverId: 'DRV-008', matchedDriverId: 'DRV-008', shipperId: 'SHIPPER-002',
      notes: 'High-value electronics - secure transport',
      pickup: { address: '125 E Orange Ave, Orlando, FL 32801', city: 'Orlando', state: 'FL', zip: '32801', date: new Date(Date.now() + 43200000).toISOString() },
      dropoff: { address: '1301 2nd Ave, Seattle, WA 98101', city: 'Seattle', state: 'WA', zip: '98101', date: new Date(Date.now() + 345600000).toISOString() },
      cargo: { type: 'Electronics', weight: 9000, description: 'Computer servers and networking equipment' },
      distance: 3085, ratePerMile: 1.69,
    },
    {
      pickupAddress: '1000 4th Ave, Seattle, WA 98104', pickupLatitude: 47.6062, pickupLongitude: -122.3321,
      dropoffAddress: '1120 SW 5th Ave, Portland, OR 97204', dropoffLatitude: 45.5152, dropoffLongitude: -122.6784,
      loadType: 'Paper Products', vehicleCount: 2, price: 450, rate: 450, status: 'delivered', assignedDriverId: 'DRV-009', matchedDriverId: 'DRV-009', shipperId: 'SHIPPER-001',
      notes: 'Standard delivery - completed',
      pickup: { address: '1000 4th Ave, Seattle, WA 98104', city: 'Seattle', state: 'WA', zip: '98104', date: new Date(Date.now() - 172800000).toISOString() },
      dropoff: { address: '1120 SW 5th Ave, Portland, OR 97204', city: 'Portland', state: 'OR', zip: '97204', date: new Date(Date.now() - 86400000).toISOString() },
      cargo: { type: 'Paper Products', weight: 6500, description: 'Office paper and supplies' },
      distance: 173, ratePerMile: 2.60,
    },
    {
      pickupAddress: '700 SW 5th Ave, Portland, OR 97204', pickupLatitude: 45.5152, pickupLongitude: -122.6784,
      dropoffAddress: '1600 Broadway, Denver, CO 80202', dropoffLatitude: 39.7392, dropoffLongitude: -104.9903,
      loadType: 'Construction Materials', vehicleCount: 4, price: 2850, rate: 2850, status: 'in_transit', assignedDriverId: 'DRV-010', matchedDriverId: 'DRV-010', shipperId: 'SHIPPER-003',
      notes: 'Heavy construction materials',
      pickup: { address: '700 SW 5th Ave, Portland, OR 97204', city: 'Portland', state: 'OR', zip: '97204', date: new Date(Date.now() - 64800000).toISOString() },
      dropoff: { address: '1600 Broadway, Denver, CO 80202', city: 'Denver', state: 'CO', zip: '80202', date: new Date(Date.now() + 108000000).toISOString() },
      cargo: { type: 'Construction Materials', weight: 15000, description: 'Steel beams and concrete materials' },
      distance: 1235, ratePerMile: 2.31,
    },
    {
      pickupAddress: '1801 California St, Denver, CO 80202', pickupLatitude: 39.7392, pickupLongitude: -104.9903,
      dropoffAddress: '3799 S Las Vegas Blvd, Las Vegas, NV 89109', dropoffLatitude: 36.1699, dropoffLongitude: -115.1398,
      loadType: 'Gaming Equipment', vehicleCount: 2, price: 1650, rate: 1650, status: 'matched', assignedDriverId: 'DRV-011', matchedDriverId: 'DRV-011', shipperId: 'SHIPPER-002',
      notes: 'Casino equipment - high value',
      pickup: { address: '1801 California St, Denver, CO 80202', city: 'Denver', state: 'CO', zip: '80202', date: new Date(Date.now() + 21600000).toISOString() },
      dropoff: { address: '3799 S Las Vegas Blvd, Las Vegas, NV 89109', city: 'Las Vegas', state: 'NV', zip: '89109', date: new Date(Date.now() + 194400000).toISOString() },
      cargo: { type: 'Gaming Equipment', weight: 7000, description: 'Slot machines and gaming tables' },
      distance: 768, ratePerMile: 2.15,
    },
    {
      pickupAddress: '3600 S Las Vegas Blvd, Las Vegas, NV 89109', pickupLatitude: 36.1699, pickupLongitude: -115.1398,
      dropoffAddress: '1 Market St, San Francisco, CA 94105', dropoffLatitude: 37.7749, dropoffLongitude: -122.4194,
      loadType: 'Technology Equipment', vehicleCount: 3, price: 1950, rate: 1950, status: 'in_transit', assignedDriverId: 'DRV-012', matchedDriverId: 'DRV-012', shipperId: 'SHIPPER-001',
      notes: 'Tech equipment - fragile',
      pickup: { address: '3600 S Las Vegas Blvd, Las Vegas, NV 89109', city: 'Las Vegas', state: 'NV', zip: '89109', date: new Date(Date.now() - 43200000).toISOString() },
      dropoff: { address: '1 Market St, San Francisco, CA 94105', city: 'San Francisco', state: 'CA', zip: '94105', date: new Date(Date.now() + 86400000).toISOString() },
      cargo: { type: 'Technology Equipment', weight: 8500, description: 'Servers and networking hardware' },
      distance: 569, ratePerMile: 3.43,
    },
    {
      pickupAddress: '100 California St, San Francisco, CA 94111', pickupLatitude: 37.7749, pickupLongitude: -122.4194,
      dropoffAddress: '350 5th Ave, New York, NY 10118', dropoffLatitude: 40.7128, dropoffLongitude: -74.0060,
      loadType: 'Fashion Goods', vehicleCount: 2, price: 6200, rate: 6200, status: 'Available', assignedDriverId: null, matchedDriverId: null, shipperId: 'SHIPPER-003',
      notes: 'High-end fashion - temperature controlled',
      pickup: { address: '100 California St, San Francisco, CA 94111', city: 'San Francisco', state: 'CA', zip: '94111', date: new Date(Date.now() + 86400000).toISOString() },
      dropoff: { address: '350 5th Ave, New York, NY 10118', city: 'New York', state: 'NY', zip: '10118', date: new Date(Date.now() + 432000000).toISOString() },
      cargo: { type: 'Fashion Goods', weight: 4500, description: 'Designer clothing and accessories' },
      distance: 2908, ratePerMile: 2.13,
    },
    {
      pickupAddress: '11 Times Square, New York, NY 10036', pickupLatitude: 40.7128, pickupLongitude: -74.0060,
      dropoffAddress: '1 Boston Pl, Boston, MA 02108', dropoffLatitude: 42.3601, dropoffLongitude: -71.0589,
      loadType: 'Pharmaceuticals', vehicleCount: 1, price: 850, rate: 850, status: 'in_transit', assignedDriverId: 'DRV-014', matchedDriverId: 'DRV-014', shipperId: 'SHIPPER-002',
      notes: 'Medical supplies - priority',
      pickup: { address: '11 Times Square, New York, NY 10036', city: 'New York', state: 'NY', zip: '10036', date: new Date(Date.now() - 21600000).toISOString() },
      dropoff: { address: '1 Boston Pl, Boston, MA 02108', city: 'Boston', state: 'MA', zip: '02108', date: new Date(Date.now() + 64800000).toISOString() },
      cargo: { type: 'Pharmaceuticals', weight: 2500, description: 'Temperature-sensitive medications' },
      distance: 215, ratePerMile: 3.95,
    },
    {
      pickupAddress: '100 Federal St, Boston, MA 02110', pickupLatitude: 42.3601, pickupLongitude: -71.0589,
      dropoffAddress: '1500 Market St, Philadelphia, PA 19102', dropoffLatitude: 39.9526, dropoffLongitude: -75.1652,
      loadType: 'Books and Media', vehicleCount: 2, price: 950, rate: 950, status: 'in_transit', assignedDriverId: 'DRV-015', matchedDriverId: 'DRV-015', shipperId: 'SHIPPER-001',
      notes: 'Books and educational materials',
      pickup: { address: '100 Federal St, Boston, MA 02110', city: 'Boston', state: 'MA', zip: '02110', date: new Date(Date.now() - 43200000).toISOString() },
      dropoff: { address: '1500 Market St, Philadelphia, PA 19102', city: 'Philadelphia', state: 'PA', zip: '19102', date: new Date(Date.now() + 43200000).toISOString() },
      cargo: { type: 'Books and Media', weight: 5000, description: 'Educational books and materials' },
      distance: 306, ratePerMile: 3.10,
    },
  ], []);

  return { drivers, loads };
}

export default function RestoreDataScreen() {
  const { drivers, loads } = useSeedData();
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const restoreAsync = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setResult(null);
    setErrorText(null);

    try {
      console.log('[Restore] Starting restore across platform...');
      const driversCol = collection(db, 'drivers');
      const loadsCol = collection(db, 'loads');

      let writeCount = 0;

      for (const d of drivers) {
        const ref = doc(driversCol, d.driverId);
        const payload = {
          ...d,
          active: d.status !== 'accomplished' && d.status !== 'breakdown',
          lastUpdate: serverTimestamp(),
          updatedAt: serverTimestamp(),
        } as Record<string, unknown>;
        await setDoc(ref, payload, { merge: true });
        writeCount++;
        console.log(`[Restore] Upserted driver ${d.driverId}`);
      }

      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 30);
      const expiresAt: Timestamp = Timestamp.fromDate(expiration);

      for (let i = 0; i < loads.length; i++) {
        const l = loads[i];
        const loadId = `LR-SEED-${(i + 1).toString().padStart(3, '0')}`;
        const ref = doc(loadsCol, loadId);
        const payload = {
          ...l,
          id: loadId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          expiresAt,
          // Provide normalized status alongside any legacy value so all UIs see it
          statusNormalized: normalizeStatus(l.status),
        } as Record<string, unknown>;
        await setDoc(ref, payload, { merge: true });
        writeCount++;
        console.log(`[Restore] Upserted load ${loadId} (${l.pickup.city} → ${l.dropoff.city})`);
      }

      const summary = `Restore complete. Upserted ${writeCount} docs. Drivers: ${drivers.length}, Loads: ${loads.length}.`;
      console.log('[Restore]', summary);
      setResult(summary);
      if (Platform.OS !== 'web') Alert.alert('Restore Complete', summary);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.error('[Restore] Failed:', e);
      setErrorText(msg);
      if (Platform.OS !== 'web') Alert.alert('Restore Failed', msg);
    } finally {
      setIsRunning(false);
    }
  }, [drivers, loads, isRunning]);

  return (
    <ScrollView contentContainerStyle={styles.container} testID="restore-screen">
      <Stack.Screen options={{ title: 'Restore Platform Data' }} />
      <Text style={styles.title} testID="restore-title">Restore Loads & Drivers</Text>
      <Text style={styles.subtitle} testID="restore-subtitle">This safely re-adds test drivers and loads without deleting existing data.</Text>

      <View style={styles.card} testID="restore-stats">
        <Text style={styles.cardTitle}>Plan</Text>
        <Text style={styles.cardText}>Drivers to upsert: {drivers.length}</Text>
        <Text style={styles.cardText}>Loads to upsert: {loads.length}</Text>
        <Text style={styles.cardHint}>Expires in 30 days. Timestamps set on write.</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isRunning ? styles.buttonDisabled : undefined]}
        onPress={restoreAsync}
        disabled={isRunning}
        testID="restore-button"
      >
        {isRunning ? (
          <>
            <ActivityIndicator color="#fff" />
            <Text style={styles.buttonText}> Restoring...</Text>
          </>
        ) : (
          <Text style={styles.buttonText}>Restore Now</Text>
        )}
      </TouchableOpacity>

      {result ? (
        <View style={styles.result} testID="restore-result">
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}

      {errorText ? (
        <View style={styles.error} testID="restore-error">
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function normalizeStatus(status: TestLoad['status']) {
  if (status === 'Available') return 'posted';
  return status;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, alignItems: 'stretch', justifyContent: 'flex-start', backgroundColor: '#0B0C10' },
  title: { fontSize: 22, fontWeight: '700' as const, color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#C5C6C7', marginBottom: 20 },
  card: { backgroundColor: '#12141A', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1F2937', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600' as const, color: '#E5E7EB', marginBottom: 8 },
  cardText: { fontSize: 14, color: '#D1D5DB', marginBottom: 4 },
  cardHint: { fontSize: 12, color: '#9CA3AF' },
  button: { backgroundColor: '#2563EB', paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 12, flexDirection: 'row' as const },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' as const },
  result: { marginTop: 16, padding: 12, backgroundColor: '#052E16', borderColor: '#065F46', borderWidth: 1, borderRadius: 10 },
  resultText: { color: '#A7F3D0', fontSize: 14 },
  error: { marginTop: 16, padding: 12, backgroundColor: '#3F1D1D', borderColor: '#7F1D1D', borderWidth: 1, borderRadius: 10 },
  errorText: { color: '#FCA5A5', fontSize: 14 },
});
