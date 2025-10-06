import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wrench, ChevronDown, Mic, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';
import { useRorkAgent, createRorkTool } from '@rork/toolkit-sdk';
import { z } from 'zod';

type ServiceType = 
  | 'truck_stop'
  | 'repair_shop'
  | 'tire_service'
  | 'fuel_station'
  | 'rest_area'
  | 'weigh_station'
  | 'parking'
  | 'emergency';

type ServiceLocation = {
  id: string;
  name: string;
  type: ServiceType;
  address: string;
  distance: number;
  phone?: string;
  hours?: string;
  rating?: number;
  latitude: number;
  longitude: number;
};

export default function ServiceFinderScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusMiles] = useState(100);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [nearbyServices, setNearbyServices] = useState<ServiceLocation[]>([]);
  const [showQuickOptions, setShowQuickOptions] = useState(false);

  const quickServiceOptions = [
    { label: 'Truck Stop', type: 'truck_stop' as ServiceType },
    { label: 'Repair Shop', type: 'repair_shop' as ServiceType },
    { label: 'Tire Service', type: 'tire_service' as ServiceType },
    { label: 'Fuel Station', type: 'fuel_station' as ServiceType },
    { label: 'Rest Area', type: 'rest_area' as ServiceType },
    { label: 'Emergency', type: 'emergency' as ServiceType },
  ];

  const { messages, sendMessage } = useRorkAgent({
    tools: {
      findNearbyServices: createRorkTool({
        description: 'Find nearby truck services based on location and service type',
        zodSchema: z.object({
          serviceType: z.enum([
            'truck_stop',
            'repair_shop',
            'tire_service',
            'fuel_station',
            'rest_area',
            'weigh_station',
            'parking',
            'emergency',
          ]).describe('Type of service to find'),
          radius: z.number().describe('Search radius in miles'),
          latitude: z.number().describe('Current latitude'),
          longitude: z.number().describe('Current longitude'),
        }),
        execute: async (input) => {
          console.log('Finding services:', input);
          const mockServices = generateMockServices(
            input.serviceType,
            input.latitude,
            input.longitude,
            input.radius
          );
          setNearbyServices(mockServices);
          return `Found ${mockServices.length} services nearby`;
        },
      }),
    },
  });

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoadingLocation(true);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);
      console.log('Current location:', currentLocation.coords);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get current location. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to find nearby truck services.'
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  }, [getCurrentLocation]);

  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  const generateMockServices = (
    type: ServiceType,
    lat: number,
    lon: number,
    radius: number
  ): ServiceLocation[] => {
    const serviceNames: Record<ServiceType, string[]> = {
      truck_stop: ['Pilot Flying J', 'Love\'s Travel Stop', 'TA Petro', 'Speedway'],
      repair_shop: ['Truck Pro', 'Ryder Maintenance', 'Penske Truck Service', 'Rush Truck Centers'],
      tire_service: ['Goodyear Commercial', 'Michelin Truck Tire', 'Bridgestone Service', 'Continental Tire'],
      fuel_station: ['Shell Fuel', 'BP Truck Fuel', 'Chevron Diesel', 'Exxon Commercial'],
      rest_area: ['State Rest Area', 'Highway Rest Stop', 'Truck Parking Area', 'Travel Plaza'],
      weigh_station: ['DOT Weigh Station', 'State Inspection', 'Commercial Vehicle Check'],
      parking: ['Truck Parking Lot', 'Overnight Parking', 'Secure Truck Lot', 'Rest Area Parking'],
      emergency: ['24/7 Roadside', 'Emergency Towing', 'Mobile Repair', 'Emergency Service'],
    };

    const names = serviceNames[type] || ['Service Location'];
    const count = Math.min(5, Math.floor(Math.random() * 8) + 3);
    
    return Array.from({ length: count }, (_, i) => {
      const randomLat = lat + (Math.random() - 0.5) * (radius / 69);
      const randomLon = lon + (Math.random() - 0.5) * (radius / 54.6);
      const distance = Math.random() * radius;
      
      return {
        id: `${type}-${i}`,
        name: names[i % names.length],
        type,
        address: `${Math.floor(Math.random() * 9999)} Highway ${Math.floor(Math.random() * 99)}`,
        distance: parseFloat(distance.toFixed(1)),
        phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        hours: '24/7',
        rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
        latitude: randomLat,
        longitude: randomLon,
      };
    }).sort((a, b) => a.distance - b.distance);
  };

  const handleQuickService = (type: ServiceType) => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services first.');
      return;
    }

    const serviceLabels: Record<ServiceType, string> = {
      truck_stop: 'truck stops',
      repair_shop: 'repair shops',
      tire_service: 'tire services',
      fuel_station: 'fuel stations',
      rest_area: 'rest areas',
      weigh_station: 'weigh stations',
      parking: 'parking areas',
      emergency: 'emergency services',
    };

    const query = `Find ${serviceLabels[type]} within ${radiusMiles} miles of my location`;
    setSearchQuery(query);
    handleAISearch(query);
  };

  const handleAISearch = async (query?: string) => {
    const searchText = query || searchQuery;
    
    if (!searchText.trim()) {
      Alert.alert('Search Required', 'Please describe the service you need.');
      return;
    }

    if (!location) {
      Alert.alert('Location Required', 'Please enable location services first.');
      return;
    }

    const message = `${searchText}. My current location is latitude ${location.coords.latitude}, longitude ${location.coords.longitude}. Search within ${radiusMiles} miles.`;
    
    await sendMessage(message);
  };

  const handleFindServices = () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services first.');
      return;
    }

    const mockServices = generateMockServices(
      'truck_stop',
      location.coords.latitude,
      location.coords.longitude,
      radiusMiles
    );
    setNearbyServices(mockServices);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Service Finder', headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Wrench size={24} color={Colors.light.primary} />
            <Text style={styles.headerTitle}>Service Finder</Text>
          </View>
          <TouchableOpacity style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.quickOptionsButton}
          onPress={() => setShowQuickOptions(!showQuickOptions)}
        >
          <Text style={styles.quickOptionsText}>Quick Service Options</Text>
          <ChevronDown size={20} color="#fff" />
        </TouchableOpacity>

        {showQuickOptions && (
          <View style={styles.quickOptionsContainer}>
            {quickServiceOptions.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={styles.quickOptionButton}
                onPress={() => handleQuickService(option.type)}
              >
                <Text style={styles.quickOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.radiusContainer}>
          <MapPin size={16} color={Colors.light.primary} />
          <Text style={styles.radiusText}>Use {radiusMiles}mi</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Describe service (e.g., 'Trailer brake repair')"
            placeholderTextColor={Colors.light.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            multiline
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.findButton}
            onPress={handleFindServices}
          >
            <Text style={styles.findButtonText}>Find</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => handleAISearch()}
          >
            <Text style={styles.aiButtonText}>AI</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.speakButton}
          onPress={() => Alert.alert('Voice Search', 'Voice search coming soon!')}
        >
          <Mic size={20} color="#fff" />
          <Text style={styles.speakButtonText}>Speak query</Text>
        </TouchableOpacity>

        <View style={styles.aiSearchInfo}>
          <Text style={styles.aiSearchTitle}>Search truck services with AI</Text>
          <Text style={styles.aiSearchDescription}>
            Describe what you need and where. We will fetch nearby options.
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoadingLocation && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        )}

        {!locationPermission && !isLoadingLocation && (
          <View style={styles.permissionContainer}>
            <MapPin size={48} color={Colors.light.textSecondary} />
            <Text style={styles.permissionTitle}>Location Access Required</Text>
            <Text style={styles.permissionText}>
              Enable location services to find nearby truck services and emergency assistance.
            </Text>
            <TouchableOpacity
              style={styles.enableButton}
              onPress={requestLocationPermission}
            >
              <Text style={styles.enableButtonText}>Enable Location</Text>
            </TouchableOpacity>
          </View>
        )}

        {messages.length > 0 && (
          <View style={styles.messagesContainer}>
            <Text style={styles.messagesTitle}>AI Search Results</Text>
            {messages.map((m) => (
              <View key={m.id} style={styles.messageCard}>
                <Text style={styles.messageRole}>{m.role === 'user' ? 'You' : 'AI Assistant'}</Text>
                {m.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Text key={`${m.id}-${i}`} style={styles.messageText}>
                          {part.text}
                        </Text>
                      );
                    case 'tool':
                      const toolName = part.toolName;
                      switch (part.state) {
                        case 'input-streaming':
                        case 'input-available':
                          return (
                            <View key={`${m.id}-${i}`} style={styles.toolCard}>
                              <ActivityIndicator size="small" color={Colors.light.primary} />
                              <Text style={styles.toolText}>Searching for {toolName}...</Text>
                            </View>
                          );
                        case 'output-available':
                          return (
                            <View key={`${m.id}-${i}`} style={styles.toolCard}>
                              <Text style={styles.toolText}>
                                ✓ {String(part.output)}
                              </Text>
                            </View>
                          );
                        case 'output-error':
                          return (
                            <View key={`${m.id}-${i}`} style={styles.toolCard}>
                              <Text style={styles.errorText}>Error: {part.errorText}</Text>
                            </View>
                          );
                      }
                  }
                })}
              </View>
            ))}
          </View>
        )}

        {nearbyServices.length > 0 && (
          <View style={styles.servicesContainer}>
            <Text style={styles.servicesTitle}>
              Nearby Services ({nearbyServices.length})
            </Text>
            {nearbyServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => {
                  Alert.alert(
                    service.name,
                    `${service.address}\n${service.phone}\n${service.hours}\nRating: ${service.rating}/5.0`,
                    [
                      { text: 'Call', onPress: () => console.log('Call:', service.phone) },
                      { text: 'Navigate', onPress: () => console.log('Navigate to:', service.name) },
                      { text: 'Close', style: 'cancel' },
                    ]
                  );
                }}
              >
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDistance}>{service.distance} mi</Text>
                </View>
                <Text style={styles.serviceAddress}>{service.address}</Text>
                <View style={styles.serviceFooter}>
                  <Text style={styles.serviceHours}>{service.hours}</Text>
                  {service.rating && (
                    <Text style={styles.serviceRating}>⭐ {service.rating}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {location && nearbyServices.length === 0 && messages.length === 0 && !isLoadingLocation && (
          <View style={styles.emptyContainer}>
            <Wrench size={64} color={Colors.light.textSecondary} />
            <Text style={styles.emptyTitle}>Find Truck Services</Text>
            <Text style={styles.emptyText}>
              Use Quick Service Options or describe what you need using AI search.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  signOutText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  quickOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C42',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
    gap: 8,
  },
  quickOptionsText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  quickOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  quickOptionButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  quickOptionText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginBottom: 8,
  },
  radiusText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  searchContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  searchInput: {
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  findButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  findButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  aiButton: {
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  speakButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  aiSearchInfo: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
  },
  aiSearchTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  aiSearchDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  permissionContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  enableButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 8,
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  messagesContainer: {
    padding: 16,
  },
  messagesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  messageCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  messageRole: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.primary,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  toolText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
  },
  servicesContainer: {
    padding: 16,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    flex: 1,
  },
  serviceDistance: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  serviceAddress: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceHours: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  serviceRating: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
