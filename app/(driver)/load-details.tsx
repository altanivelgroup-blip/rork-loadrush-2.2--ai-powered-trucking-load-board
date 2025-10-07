import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, TrendingUp, MapPin, Clock, Navigation, CheckCircle, Camera, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { dummyLoads } from '@/mocks/dummyData';
import LoadCard from '@/components/LoadCard';

export default function LoadDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loadAccepted, setLoadAccepted] = useState(false);

  const load = dummyLoads.find((l) => l.id === id);

  if (!load) {
    return (
      <View style={styles.container}>
        <Text>Load not found</Text>
      </View>
    );
  }

  const handleAcceptLoad = () => {
    setLoadAccepted(true);
    console.log('Load accepted');
  };

  const handleNavigateToPickup = () => {
    console.log('Navigate to pickup');
    router.push({
      pathname: '/(driver)/navigation-screen',
      params: {
        destinationLat: 32.7767,
        destinationLng: -96.7970,
        destinationName: `${load.pickup.city}, ${load.pickup.state}`,
      },
    });
  };

  const handleConfirmPickup = () => {
    console.log('Confirm pickup with photos');
  };

  const handleBackhaul = () => {
    console.log('View backhaul options');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Load Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <LoadCard 
          load={load} 
          mode="expanded" 
          showAIScore={false}
          onPress={() => {}}
        />

        <View style={styles.routeCard}>
          <Text style={styles.routeCardTitle}>Route Details</Text>
          
          <View style={styles.locationRow}>
            <MapPin size={18} color="#10B981" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationValue}>{load.pickup.city}, {load.pickup.state}</Text>
              <View style={styles.dateTimeRow}>
                <Clock size={12} color="#6B7280" />
                <Text style={styles.dateTimeText}>{load.pickup.date} • {load.pickup.time}</Text>
              </View>
            </View>
          </View>

          <View style={styles.routeDivider} />

          <View style={styles.locationRow}>
            <MapPin size={18} color="#EF4444" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Delivery</Text>
              <Text style={styles.locationValue}>{load.dropoff.city}, {load.dropoff.state}</Text>
              <View style={styles.dateTimeRow}>
                <Clock size={12} color="#6B7280" />
                <Text style={styles.dateTimeText}>{load.dropoff.date} • {load.dropoff.time}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.cargoCard}>
          <Text style={styles.cargoTitle}>Cargo Details</Text>
          <View style={styles.cargoRow}>
            <Text style={styles.cargoLabel}>Type:</Text>
            <Text style={styles.cargoValue}>{load.cargo.type}</Text>
          </View>
          <View style={styles.cargoRow}>
            <Text style={styles.cargoLabel}>Weight:</Text>
            <Text style={styles.cargoValue}>{(load.cargo.weight / 1000).toFixed(1)}k lbs</Text>
          </View>
          <View style={styles.cargoRow}>
            <Text style={styles.cargoLabel}>Description:</Text>
            <Text style={styles.cargoValue}>{load.cargo.description}</Text>
          </View>
        </View>

        {load.aiScore && load.aiScore > 80 && (
          <TouchableOpacity style={styles.backhaulBanner} onPress={handleBackhaul}>
            <View style={styles.backhaulContent}>
              <TrendingUp size={20} color="#FFFFFF" />
              <View style={styles.backhaulTextContainer}>
                <Text style={styles.backhaulTitle}>Smart Backhaul Available</Text>
                <Text style={styles.backhaulSubtitle}>3 matches within 5 miles • Up to $950</Text>
              </View>
            </View>
            <ArrowRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {loadAccepted && (
          <View style={styles.acceptedSection}>
            <View style={styles.acceptedHeader}>
              <CheckCircle size={24} color="#10B981" />
              <Text style={styles.acceptedTitle}>Load Accepted!</Text>
            </View>

            <TouchableOpacity style={styles.navigationButton} onPress={handleNavigateToPickup}>
              <Navigation size={20} color="#FFFFFF" />
              <Text style={styles.navigationButtonText}>Navigate to Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmPickupButton} onPress={handleConfirmPickup}>
              <Camera size={20} color="#FFFFFF" />
              <Text style={styles.confirmPickupButtonText}>Confirm Pickup with Photos</Text>
            </TouchableOpacity>

            {load.aiScore && load.aiScore > 80 && (
              <TouchableOpacity style={styles.backhaulButton} onPress={handleBackhaul}>
                <TrendingUp size={18} color="#FF9500" />
                <Text style={styles.backhaulButtonText}>View Backhaul Options</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {!loadAccepted && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptLoad}>
            <Text style={styles.acceptButtonText}>Accept Load</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },

  routeCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  routeCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  routeDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 16,
  },
  cargoCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cargoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  cargoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cargoLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  cargoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
    textAlign: 'right',
  },
  backhaulBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF9500',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  backhaulContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backhaulTextContainer: {
    flex: 1,
  },
  backhaulTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  backhaulSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.95,
  },
  acceptedSection: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  acceptedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  acceptedTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  confirmPickupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  confirmPickupButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  backhaulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  backhaulButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FF9500',
  },
  footer: {
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  acceptButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
