import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { DriverStatus } from '@/hooks/useCommandCenterDrivers';

interface NativeMapViewProps {
  drivers: Array<{
    id: string;
    name: string;
    status: DriverStatus;
    location: {
      latitude: number;
      longitude: number;
    };
  }>;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  selectedDriver: string | null;
  onDriverPress: (driverId: string) => void;
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

export default function NativeMapView({
  drivers,
  initialRegion,
  onDriverPress,
}: NativeMapViewProps) {
  return (
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
          onPress={() => onDriverPress(driver.id)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
