import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { RadioTower, MapPin } from 'lucide-react-native';
import { useCommandCenterDrivers, DriverStatus } from '@/hooks/useCommandCenterDrivers';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isSmallScreen = width < 768;

export default function CommandCenter() {
  const { drivers, isLoading, error } = useCommandCenterDrivers();
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const initialRegion = {
    latitude: 39.8283,
    longitude: -98.5795,
    latitudeDelta: 25,
    longitudeDelta: 25,
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Command Center' }} />
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading Command Center...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Command Center' }} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <RadioTower size={24} color="#1E3A8A" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>LoadRush Command Center</Text>
            <Text style={styles.headerSubtitle}>
              Monitor drivers, loads, and operational flow in real-time
            </Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>System Stable</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.sidebar, isSmallScreen && styles.sidebarSmall]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Active Drivers</Text>
            <View style={styles.driverCount}>
              <Text style={styles.driverCountText}>{drivers.length}</Text>
            </View>
          </View>

          <View style={styles.legendContainer}>
            <LegendItem status="pickup" label="Pickup" />
            <LegendItem status="in-transit" label="In Transit" />
            <LegendItem status="accomplished" label="Accomplished" />
            <LegendItem status="breakdown" label="Breakdown" />
          </View>

          <ScrollView
            style={styles.driverList}
            showsVerticalScrollIndicator={false}
          >
            {drivers.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                isSelected={selectedDriver === driver.id}
                onPress={() => setSelectedDriver(driver.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.mapContainer}>
          {isWeb ? (
            <View style={styles.webMapPlaceholder}>
              <MapPin size={48} color="#9CA3AF" />
              <Text style={styles.webMapText}>
                Map view is optimized for mobile devices
              </Text>
              <Text style={styles.webMapSubtext}>
                {drivers.length} drivers active across the U.S.
              </Text>
            </View>
          ) : (
            <MapView
              style={styles.map}
              initialRegion={initialRegion}
              provider={PROVIDER_GOOGLE}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
            >
              {drivers.map((driver) => (
                <Marker
                  key={driver.id}
                  coordinate={driver.location}
                  title={driver.name}
                  description={`Status: ${driver.status}`}
                  pinColor={getStatusColor(driver.status)}
                  onPress={() => setSelectedDriver(driver.id)}
                />
              ))}
            </MapView>
          )}
        </View>
      </View>
    </View>
  );
}

interface DriverCardProps {
  driver: {
    id: string;
    driverId: string;
    name: string;
    status: DriverStatus;
    currentLoad?: string;
  };
  isSelected: boolean;
  onPress: () => void;
}

function DriverCard({ driver, isSelected, onPress }: DriverCardProps) {
  return (
    <View
      style={[styles.driverCard, isSelected && styles.driverCardSelected]}
      onTouchEnd={onPress}
    >
      <View style={styles.driverCardHeader}>
        <View style={styles.driverInfo}>
          <Text style={styles.driverNumber}>{driver.driverId}</Text>
          <Text style={styles.driverName}>{driver.name}</Text>
        </View>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(driver.status) },
          ]}
        />
      </View>
      {driver.currentLoad && (
        <Text style={styles.currentLoad}>Load: {driver.currentLoad}</Text>
      )}
      <Text style={styles.statusLabel}>{getStatusLabel(driver.status)}</Text>
    </View>
  );
}

interface LegendItemProps {
  status: DriverStatus;
  label: string;
}

function LegendItem({ status, label }: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          { backgroundColor: getStatusColor(status) },
        ]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function getStatusColor(status: DriverStatus): string {
  switch (status) {
    case 'pickup':
      return '#22C55E';
    case 'in-transit':
      return '#F59E0B';
    case 'accomplished':
      return '#8B5CF6';
    case 'breakdown':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

function getStatusLabel(status: DriverStatus): string {
  switch (status) {
    case 'pickup':
      return 'Ready for Pickup';
    case 'in-transit':
      return 'In Transit';
    case 'accomplished':
      return 'Mission Accomplished';
    case 'breakdown':
      return 'Breakdown / Delay';
    default:
      return 'Unknown';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E3A8A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#059669',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: isSmallScreen ? '100%' : '30%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  sidebarSmall: {
    width: '35%',
    minWidth: 280,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  driverCount: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  driverCountText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  driverList: {
    flex: 1,
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  driverCardSelected: {
    borderColor: '#1E3A8A',
    backgroundColor: '#F0F4FF',
  },
  driverCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  driverInfo: {
    flex: 1,
  },
  driverNumber: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 2,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#111827',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  currentLoad: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 32,
  },
  webMapText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
    textAlign: 'center',
  },
  webMapSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
