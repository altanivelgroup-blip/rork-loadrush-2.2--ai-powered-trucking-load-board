import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Truck, 
  Container, 
  Sparkles,
  Plus
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TabKey = 'truck' | 'trailer';

interface TruckInfo {
  truckType: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  licensePlate: string;
  fuelTankSize: string;
  averageMpg: string;
  currentOdometer: string;
}

interface TrailerInfo {
  trailerType: string;
  length: string;
  capacity: string;
  vin: string;
  licensePlate: string;
}

const TRUCK_TYPES = [
  'Box Truck',
  'Cargo Van',
  'Hotshot Pickup',
  'Sprinter Van',
  'Straight Truck',

  'Other'
];

const TRAILER_TYPES = [
  'Car Hauler',
  'Flatbed',
  'Enclosed',
  'Gooseneck',
  'Lowboy',
  'Step Deck',
  'Dry Van',
  'Reefer',
  'Other'
];

export default function AddVehicleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const driverId = user?.id || 'test-driver-id';

  const [activeTab, setActiveTab] = useState<TabKey>('truck');
  const [isSaving, setIsSaving] = useState(false);

  const [truckInfo, setTruckInfo] = useState<TruckInfo>({
    truckType: 'Box Truck',
    make: '',
    model: '',
    year: '',
    vin: '',
    licensePlate: '',
    fuelTankSize: '',
    averageMpg: '',
    currentOdometer: '',
  });

  const [trailerInfo, setTrailerInfo] = useState<TrailerInfo>({
    trailerType: 'Flatbed',
    length: '',
    capacity: '',
    vin: '',
    licensePlate: '',
  });

  const tabs = useMemo(() => [
    { key: 'truck' as TabKey, label: 'Truck', icon: Truck },
    { key: 'trailer' as TabKey, label: 'Trailer', icon: Container },
  ], []);

  const handleSave = useCallback(async () => {
    console.log('[AddVehicle] Saving vehicle data for driverId:', driverId);
    setIsSaving(true);

    try {
      const existingVehiclesStr = await AsyncStorage.getItem(`driver_vehicles_${driverId}`);
      const existingVehicles = existingVehiclesStr ? JSON.parse(existingVehiclesStr) : [];

      const newVehicle = {
        id: `vehicle_${Date.now()}`,
        driverId,
        truck: truckInfo,
        trailer: trailerInfo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedVehicles = [...existingVehicles, newVehicle];
      await AsyncStorage.setItem(`driver_vehicles_${driverId}`, JSON.stringify(updatedVehicles));
      
      console.log('[AddVehicle] Vehicle saved successfully');
      Alert.alert('Success', 'Vehicle added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('[AddVehicle] Save error:', error);
      Alert.alert('Error', 'Failed to save vehicle. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [driverId, truckInfo, trailerInfo, router]);

  const renderTruckTab = useCallback(() => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Truck Information</Text>
          <Text style={styles.sectionSubtitle}>Vehicle details and analytics data</Text>
        </View>
        <View style={styles.analyticsIndicator}>
          <Sparkles size={14} color="#10B981" />
          <Text style={styles.analyticsText}>Analytics</Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Truck Type *</Text>
        <View style={styles.chipContainer}>
          {TRUCK_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.chip,
                truckInfo.truckType === type && styles.chipActive
              ]}
              onPress={() => setTruckInfo(prev => ({ ...prev, truckType: type }))}
              testID={`chip-truckType-${type}`}
            >
              <Text style={[
                styles.chipText,
                truckInfo.truckType === type && styles.chipTextActive
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.label}>Make *</Text>
          <TextInput
            style={styles.input}
            value={truckInfo.make}
            onChangeText={(text) => setTruckInfo(prev => ({ ...prev, make: text }))}
            placeholder="e.g., Ram"
            testID="input-truckMake"
          />
        </View>
        <View style={styles.spacer} />
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.label}>Model *</Text>
          <TextInput
            style={styles.input}
            value={truckInfo.model}
            onChangeText={(text) => setTruckInfo(prev => ({ ...prev, model: text }))}
            placeholder="e.g., M2 106"
            testID="input-truckModel"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Year *</Text>
        <TextInput
          style={styles.input}
          value={truckInfo.year}
          onChangeText={(text) => setTruckInfo(prev => ({ ...prev, year: text }))}
          placeholder="e.g., 2020"
          keyboardType="numeric"
          testID="input-truckYear"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>VIN *</Text>
        <TextInput
          style={styles.input}
          value={truckInfo.vin}
          onChangeText={(text) => setTruckInfo(prev => ({ ...prev, vin: text }))}
          placeholder="Enter VIN"
          autoCapitalize="characters"
          testID="input-truckVin"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>License Plate *</Text>
        <TextInput
          style={styles.input}
          value={truckInfo.licensePlate}
          onChangeText={(text) => setTruckInfo(prev => ({ ...prev, licensePlate: text }))}
          placeholder="Enter license plate"
          autoCapitalize="characters"
          testID="input-truckLicensePlate"
        />
      </View>

      <View style={styles.analyticsSection}>
        <View style={styles.analyticsBadge}>
          <Sparkles size={12} color="#10B981" />
          <Text style={styles.analyticsBadgeText}>Connected to Live Analytics</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={[styles.label, styles.analyticsLabel]}>Fuel Tank Size (gal) *</Text>
            <TextInput
              style={[styles.input, styles.analyticsInput]}
              value={truckInfo.fuelTankSize}
              onChangeText={(text) => setTruckInfo(prev => ({ ...prev, fuelTankSize: text }))}
              placeholder="e.g., 100"
              keyboardType="numeric"
              testID="input-fuelTankSize"
            />
          </View>
          <View style={styles.spacer} />
          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={[styles.label, styles.analyticsLabel]}>Average MPG *</Text>
            <TextInput
              style={[styles.input, styles.analyticsInput]}
              value={truckInfo.averageMpg}
              onChangeText={(text) => setTruckInfo(prev => ({ ...prev, averageMpg: text }))}
              placeholder="e.g., 8.5"
              keyboardType="decimal-pad"
              testID="input-averageMpg"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, styles.analyticsLabel]}>Current Odometer *</Text>
          <TextInput
            style={[styles.input, styles.analyticsInput]}
            value={truckInfo.currentOdometer}
            onChangeText={(text) => setTruckInfo(prev => ({ ...prev, currentOdometer: text }))}
            placeholder="e.g., 125000"
            keyboardType="numeric"
            testID="input-currentOdometer"
          />
        </View>
      </View>

      <View style={styles.infoBox}>
        <Sparkles size={16} color="#10B981" />
        <View style={styles.infoBoxContent}>
          <Text style={styles.infoBoxTitle}>Fleet Tracking</Text>
          <Text style={styles.infoBoxText}>
            This vehicle will be added to your fleet. All analytics data will be tracked separately for each vehicle.
          </Text>
        </View>
      </View>
    </View>
  ), [truckInfo]);

  const renderTrailerTab = useCallback(() => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Trailer Information</Text>
          <Text style={styles.sectionSubtitle}>Trailer specs for load matching</Text>
        </View>
        <View style={styles.analyticsIndicator}>
          <Sparkles size={14} color="#3B82F6" />
          <Text style={[styles.analyticsText, { color: '#3B82F6' }]}>Load Matching</Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Trailer Type *</Text>
        <View style={styles.chipContainer}>
          {TRAILER_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.chip,
                trailerInfo.trailerType === type && styles.chipActive
              ]}
              onPress={() => setTrailerInfo(prev => ({ ...prev, trailerType: type }))}
              testID={`chip-trailerType-${type}`}
            >
              <Text style={[
                styles.chipText,
                trailerInfo.trailerType === type && styles.chipTextActive
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.label}>Length (ft) *</Text>
          <TextInput
            style={styles.input}
            value={trailerInfo.length}
            onChangeText={(text) => setTrailerInfo(prev => ({ ...prev, length: text }))}
            placeholder="e.g., 48"
            keyboardType="numeric"
            testID="input-trailerLength"
          />
        </View>
        <View style={styles.spacer} />
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={[styles.label, styles.analyticsLabel]}>Capacity (lbs) *</Text>
          <TextInput
            style={[styles.input, styles.analyticsInput]}
            value={trailerInfo.capacity}
            onChangeText={(text) => setTrailerInfo(prev => ({ ...prev, capacity: text }))}
            placeholder="e.g., 48000"
            keyboardType="numeric"
            testID="input-trailerCapacity"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>VIN *</Text>
        <TextInput
          style={styles.input}
          value={trailerInfo.vin}
          onChangeText={(text) => setTrailerInfo(prev => ({ ...prev, vin: text }))}
          placeholder="Enter trailer VIN"
          autoCapitalize="characters"
          testID="input-trailerVin"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>License Plate *</Text>
        <TextInput
          style={styles.input}
          value={trailerInfo.licensePlate}
          onChangeText={(text) => setTrailerInfo(prev => ({ ...prev, licensePlate: text }))}
          placeholder="Enter license plate"
          autoCapitalize="characters"
          testID="input-trailerLicensePlate"
        />
      </View>

      <View style={styles.infoBox}>
        <Sparkles size={16} color="#3B82F6" />
        <View style={styles.infoBoxContent}>
          <Text style={styles.infoBoxTitle}>Load Matching</Text>
          <Text style={styles.infoBoxText}>
            Capacity data is used for intelligent load matching to find the best loads for your trailer.
          </Text>
        </View>
      </View>
    </View>
  ), [trailerInfo]);

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'truck':
        return renderTruckTab();
      case 'trailer':
        return renderTrailerTab();
      default:
        return null;
    }
  }, [activeTab, renderTruckTab, renderTrailerTab]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Add Vehicle',
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1F2937',
          headerShadowVisible: false,
        }} 
      />

      <View style={styles.tabBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                testID={`tab-${tab.key}`}
              >
                <Icon size={18} color={isActive ? '#3B82F6' : '#9CA3AF'} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
          testID="button-save"
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Adding...' : 'Add Vehicle'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tabContent: {
    gap: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  analyticsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  analyticsText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
  },
  analyticsLabel: {
    color: '#10B981',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  analyticsInput: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#3B82F6',
  },
  analyticsSection: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  analyticsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  analyticsBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 10,
    padding: 12,
  },
  infoBoxContent: {
    flex: 1,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
