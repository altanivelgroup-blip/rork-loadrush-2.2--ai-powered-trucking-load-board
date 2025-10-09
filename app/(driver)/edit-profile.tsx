import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { db } from '@/config/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  User, 
  Building2, 
  Truck, 
  Container, 
  FileText,
  Save,
  Sparkles,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  Image as ImageIcon
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PhotoUploader from '@/components/PhotoUploader';

type TabKey = 'personal' | 'business' | 'truck' | 'trailer' | 'photos' | 'documents';

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  yearsExperience: string;
}

interface BusinessInfo {
  companyName: string;
  dotNumber: string;
  mcNumber: string;
  insuranceProvider: string;
  policyExpiration: string;
  isUnder26k: boolean;
}

interface TruckInfo {
  truckType: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  licensePlate: string;
  fuelTankSize: string;
  averageMpg: string;
  fuelType: 'diesel' | 'gasoline';
  currentOdometer: string;
  photos: { uri: string; type: string }[];
}

interface TrailerInfo {
  trailerType: string;
  length: string;
  capacity: string;
  vin: string;
  licensePlate: string;
  photos: { uri: string; type: string }[];
}

type DocumentStatus = 'pending' | 'approved' | 'rejected';

interface DocumentItem {
  id: string;
  name: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  uploadedDate?: string;
  status: DocumentStatus;
}

interface DocumentInfo {
  driversLicense: DocumentItem;
  truckRegistration: DocumentItem;
  trailerRegistration: DocumentItem;
  insuranceCertificate: DocumentItem;
  businessLicense: DocumentItem;
}

type PhotoStatus = 'pending' | 'approved' | 'rejected';

interface PhotoItem {
  id: string;
  name: string;
  uri?: string;
  fileType?: string;
  fileSize?: string;
  uploadedDate?: string;
  status: PhotoStatus;
}

interface PhotoInfo {
  truckFront: PhotoItem;
  truckSide: PhotoItem;
  trailerFront: PhotoItem;
  trailerSide: PhotoItem;
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

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const driverId = user?.id || 'test-driver-id';

  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [isSaving, setIsSaving] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: 'John Smith',
    email: user?.email || 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, Dallas, TX 75201',
    yearsExperience: '8',
  });

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    companyName: 'Smith Trucking LLC',
    dotNumber: '1234567',
    mcNumber: 'MC-987654',
    insuranceProvider: 'Progressive Commercial',
    policyExpiration: '2025-12-31',
    isUnder26k: false,
  });

  const [truckInfo, setTruckInfo] = useState<TruckInfo>({
    truckType: 'Hotshot Pickup',
    make: 'Ram',
    model: '3500 Dually',
    year: '2020',
    vin: '3C63RRJL5MG123456',
    licensePlate: 'TX-ABC1234',
    fuelTankSize: '52',
    averageMpg: '12.5',
    fuelType: 'diesel',
    currentOdometer: '125000',
    photos: [],
  });

  const [trailerInfo, setTrailerInfo] = useState<TrailerInfo>({
    trailerType: 'Car Hauler',
    length: '40',
    capacity: '20000',
    vin: '1T9BE4828Y1234567',
    licensePlate: 'TX-TRL5678',
    photos: [],
  });

  const [documentInfo, setDocumentInfo] = useState<DocumentInfo>({
    driversLicense: {
      id: 'drivers-license',
      name: "Driver's License / CDL",
      fileName: 'drivers_license.pdf',
      fileType: 'PDF',
      fileSize: '2.4 MB',
      uploadedDate: '2025-01-15',
      status: 'approved',
    },
    truckRegistration: {
      id: 'truck-registration',
      name: 'Truck Registration',
      fileName: 'truck_registration.pdf',
      fileType: 'PDF',
      fileSize: '1.8 MB',
      uploadedDate: '2025-01-10',
      status: 'approved',
    },
    trailerRegistration: {
      id: 'trailer-registration',
      name: 'Trailer Registration',
      fileName: 'trailer_registration.jpg',
      fileType: 'JPG',
      fileSize: '3.2 MB',
      uploadedDate: '2025-01-12',
      status: 'pending',
    },
    insuranceCertificate: {
      id: 'insurance-certificate',
      name: 'Insurance Certificate',
      fileName: 'insurance_cert.pdf',
      fileType: 'PDF',
      fileSize: '1.5 MB',
      uploadedDate: '2025-01-08',
      status: 'approved',
    },
    businessLicense: {
      id: 'business-license',
      name: 'Business License / Operating Authority',
      status: 'pending',
    },
  });

  const [photoInfo, setPhotoInfo] = useState<PhotoInfo>({
    truckFront: {
      id: 'truck-front',
      name: 'Truck - Front View',
      uri: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800',
      fileType: 'JPG',
      fileSize: '4.2 MB',
      uploadedDate: '2025-01-20',
      status: 'approved',
    },
    truckSide: {
      id: 'truck-side',
      name: 'Truck - Side View',
      uri: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800',
      fileType: 'JPG',
      fileSize: '3.8 MB',
      uploadedDate: '2025-01-20',
      status: 'approved',
    },
    trailerFront: {
      id: 'trailer-front',
      name: 'Trailer - Front View',
      status: 'pending',
    },
    trailerSide: {
      id: 'trailer-side',
      name: 'Trailer - Side View',
      uri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
      fileType: 'JPG',
      fileSize: '3.5 MB',
      uploadedDate: '2025-01-21',
      status: 'pending',
    },
  });

  const tabs = useMemo(() => [
    { key: 'personal' as TabKey, label: 'Personal', icon: User },
    { key: 'business' as TabKey, label: 'Business', icon: Building2 },
    { key: 'truck' as TabKey, label: 'Truck', icon: Truck },
    { key: 'trailer' as TabKey, label: 'Trailer', icon: Container },
    { key: 'photos' as TabKey, label: 'Photos', icon: Camera },
    { key: 'documents' as TabKey, label: 'Documents', icon: FileText },
  ], []);

  const handleTruckPhotoUploaded = useCallback((url: string) => {
    console.log('[EditProfile] Truck photo uploaded:', url);
    const photo = {
      uri: url,
      type: 'image/jpeg',
    };
    setTruckInfo(prev => ({
      ...prev,
      photos: [...prev.photos, photo],
    }));
  }, []);

  const handleTrailerPhotoUploaded = useCallback((url: string) => {
    console.log('[EditProfile] Trailer photo uploaded:', url);
    const photo = {
      uri: url,
      type: 'image/jpeg',
    };
    setTrailerInfo(prev => ({
      ...prev,
      photos: [...prev.photos, photo],
    }));
  }, []);

  const handleSave = useCallback(async () => {
    console.log('[EditProfile] Saving profile data for driverId:', driverId);
    setIsSaving(true);

    try {
      const profileData = {
        driverId,
        personal: personalInfo,
        business: businessInfo,
        truck: truckInfo,
        trailer: trailerInfo,
        photos: photoInfo,
        documents: documentInfo,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(`driver_profile_${driverId}`, JSON.stringify(profileData));
      
      if (user?.id) {
        console.log('[EditProfile] Updating Firestore for driver:', user.id);
        
        const photoUrl = truckInfo.photos.length > 0 ? truckInfo.photos[0].uri : undefined;
        
        const truckData: Record<string, any> = {};
        if (truckInfo.make) truckData['truckInfo.make'] = truckInfo.make;
        if (truckInfo.model) truckData['truckInfo.model'] = truckInfo.model;
        if (truckInfo.year) truckData['truckInfo.year'] = parseInt(truckInfo.year) || 0;
        if (truckInfo.vin) truckData['truckInfo.vin'] = truckInfo.vin;
        if (truckInfo.licensePlate) truckData['truckInfo.licensePlate'] = truckInfo.licensePlate;
        if (truckInfo.fuelTankSize) truckData['truckInfo.fuelTankSize'] = parseInt(truckInfo.fuelTankSize) || 0;
        if (truckInfo.averageMpg) truckData['truckInfo.mpg'] = parseFloat(truckInfo.averageMpg) || 0;
        if (truckInfo.currentOdometer) truckData['truckInfo.odometer'] = parseInt(truckInfo.currentOdometer) || 0;
        if (truckInfo.fuelType) truckData['truckInfo.fuelType'] = truckInfo.fuelType;
        if (photoUrl !== undefined) truckData['truckInfo.photoUrl'] = photoUrl;
        truckData['truckInfo.updatedAt'] = serverTimestamp();
        
        const collectionName = user.role === 'driver' ? 'driver_test' : 'drivers';
        const docId = user.id === 'DRIVER_TEST_001' ? 'DRIVER_TEST_001' : user.id;
        
        console.log(`[EditProfile] Updating ${collectionName}/${docId}`);
        
        try {
          await updateDoc(doc(db, collectionName, docId), truckData);
          console.log('[EditProfile] ✅ Firestore update successful');
        } catch (firestoreError: any) {
          console.error('[EditProfile] Firestore update failed:', firestoreError.message);
          console.log('[EditProfile] ⚠️ Continuing with local storage only');
        }
      }
      
      console.log('[EditProfile] Profile saved successfully');
      Alert.alert('✅ Success', 'Profile saved successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('[EditProfile] Save error:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [driverId, personalInfo, businessInfo, truckInfo, trailerInfo, photoInfo, documentInfo, router, user]);

  const renderPersonalTab = useCallback(() => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      <Text style={styles.sectionSubtitle}>Basic information about you</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={personalInfo.fullName}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, fullName: text }))}
          placeholder="Enter your full name"
          testID="input-fullName"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={personalInfo.email}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, email: text }))}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          testID="input-email"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone *</Text>
        <TextInput
          style={styles.input}
          value={personalInfo.phone}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, phone: text }))}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          testID="input-phone"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Address (Optional)</Text>
        <TextInput
          style={styles.input}
          value={personalInfo.address}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, address: text }))}
          placeholder="Enter your address"
          testID="input-address"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Years of Experience *</Text>
        <TextInput
          style={styles.input}
          value={personalInfo.yearsExperience}
          onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, yearsExperience: text }))}
          placeholder="Enter years of experience"
          keyboardType="numeric"
          testID="input-yearsExperience"
        />
      </View>
    </View>
  ), [personalInfo]);

  const renderBusinessTab = useCallback(() => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Business Information</Text>
      <Text style={styles.sectionSubtitle}>Company and regulatory details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Company Name / Owner-Operator *</Text>
        <TextInput
          style={styles.input}
          value={businessInfo.companyName}
          onChangeText={(text) => setBusinessInfo(prev => ({ ...prev, companyName: text }))}
          placeholder="Enter company name"
          testID="input-companyName"
        />
      </View>

      <View style={styles.toggleGroup}>
        <View style={styles.toggleLabelContainer}>
          <Text style={styles.label}>Operating under 26,000 lbs?</Text>
          <Text style={styles.toggleSubtext}>DOT number not required</Text>
        </View>
        <Switch
          value={businessInfo.isUnder26k}
          onValueChange={(value) => setBusinessInfo(prev => ({ ...prev, isUnder26k: value }))}
          trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
          thumbColor={businessInfo.isUnder26k ? '#3B82F6' : '#F3F4F6'}
          testID="switch-isUnder26k"
        />
      </View>

      {!businessInfo.isUnder26k && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DOT Number</Text>
          <TextInput
            style={styles.input}
            value={businessInfo.dotNumber}
            onChangeText={(text) => setBusinessInfo(prev => ({ ...prev, dotNumber: text }))}
            placeholder="Enter DOT number"
            keyboardType="numeric"
            testID="input-dotNumber"
          />
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>MC Number (Optional)</Text>
        <TextInput
          style={styles.input}
          value={businessInfo.mcNumber}
          onChangeText={(text) => setBusinessInfo(prev => ({ ...prev, mcNumber: text }))}
          placeholder="Enter MC number"
          testID="input-mcNumber"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Insurance Provider *</Text>
        <TextInput
          style={styles.input}
          value={businessInfo.insuranceProvider}
          onChangeText={(text) => setBusinessInfo(prev => ({ ...prev, insuranceProvider: text }))}
          placeholder="Enter insurance provider"
          testID="input-insuranceProvider"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Policy Expiration Date *</Text>
        <TextInput
          style={styles.input}
          value={businessInfo.policyExpiration}
          onChangeText={(text) => setBusinessInfo(prev => ({ ...prev, policyExpiration: text }))}
          placeholder="YYYY-MM-DD"
          testID="input-policyExpiration"
        />
      </View>
    </View>
  ), [businessInfo]);

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
          <Text style={[styles.label, styles.analyticsLabel]}>Fuel Type *</Text>
          <View style={styles.fuelTypeContainer}>
            <TouchableOpacity
              style={[
                styles.fuelTypePill,
                truckInfo.fuelType === 'diesel' && styles.fuelTypePillActive
              ]}
              onPress={() => setTruckInfo(prev => ({ ...prev, fuelType: 'diesel' }))}
              testID="fuel-type-diesel"
            >
              <Text style={styles.fuelTypeEmoji}>💧</Text>
              <Text style={[
                styles.fuelTypeText,
                truckInfo.fuelType === 'diesel' && styles.fuelTypeTextActive
              ]}>
                Diesel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.fuelTypePill,
                truckInfo.fuelType === 'gasoline' && styles.fuelTypePillActive
              ]}
              onPress={() => setTruckInfo(prev => ({ ...prev, fuelType: 'gasoline' }))}
              testID="fuel-type-gasoline"
            >
              <Text style={styles.fuelTypeEmoji}>⛽</Text>
              <Text style={[
                styles.fuelTypeText,
                truckInfo.fuelType === 'gasoline' && styles.fuelTypeTextActive
              ]}>
                Gasoline
              </Text>
            </TouchableOpacity>
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

      <View style={styles.photoUploaderSection}>
        <Text style={styles.photoUploaderLabel}>Upload Truck Photo</Text>
        <PhotoUploader
          userId={driverId}
          role="driver"
          onUploaded={handleTruckPhotoUploaded}
          currentPhotoUrl={truckInfo.photos.length > 0 ? truckInfo.photos[0].uri : undefined}
        />
      </View>

      {truckInfo.photos.length > 0 && (
        <View style={styles.photosSection}>
          <Text style={styles.photosSectionTitle}>Uploaded Truck Photos ({truckInfo.photos.length})</Text>
          {truckInfo.photos.map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <ImageIcon size={16} color="#6B7280" />
              <Text style={styles.photoItemText}>Truck Photo {index + 1}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  ), [truckInfo, handleTruckPhotoUploaded, driverId]);

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
        <Text style={styles.infoBoxText}>
          Capacity data is used for intelligent load matching to find the best loads for your trailer.
        </Text>
      </View>

      <View style={styles.photoUploaderSection}>
        <Text style={styles.photoUploaderLabel}>Upload Trailer Photo</Text>
        <PhotoUploader
          userId={driverId}
          role="driver"
          onUploaded={handleTrailerPhotoUploaded}
          currentPhotoUrl={trailerInfo.photos.length > 0 ? trailerInfo.photos[0].uri : undefined}
        />
      </View>

      {trailerInfo.photos.length > 0 && (
        <View style={styles.photosSection}>
          <Text style={styles.photosSectionTitle}>Uploaded Trailer Photos ({trailerInfo.photos.length})</Text>
          {trailerInfo.photos.map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <ImageIcon size={16} color="#6B7280" />
              <Text style={styles.photoItemText}>Trailer Photo {index + 1}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  ), [trailerInfo, handleTrailerPhotoUploaded, driverId]);

  const handlePhotoUpload = useCallback((photoKey: keyof PhotoInfo) => {
    console.log(`[EditProfile] Upload photo: ${photoKey}`);
    Alert.alert(
      'Upload Photo',
      `Select ${photoInfo[photoKey].name}\n\nMax file size: 10MB\nSupported formats: JPG, PNG`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Take Photo', 
          onPress: () => {
            console.log(`[EditProfile] Camera for ${photoKey}`);
            const newDate = new Date().toISOString().split('T')[0];
            setPhotoInfo(prev => ({
              ...prev,
              [photoKey]: {
                ...prev[photoKey],
                uri: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800',
                fileType: 'JPG',
                fileSize: '3.8 MB',
                uploadedDate: newDate,
                status: 'pending' as PhotoStatus,
              }
            }));
            Alert.alert('Success', 'Photo uploaded successfully! Pending admin review.');
          }
        },
        { 
          text: 'Choose from Gallery', 
          onPress: () => {
            console.log(`[EditProfile] Gallery picker for ${photoKey}`);
            const newDate = new Date().toISOString().split('T')[0];
            setPhotoInfo(prev => ({
              ...prev,
              [photoKey]: {
                ...prev[photoKey],
                uri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
                fileType: 'JPG',
                fileSize: '4.1 MB',
                uploadedDate: newDate,
                status: 'pending' as PhotoStatus,
              }
            }));
            Alert.alert('Success', 'Photo uploaded successfully! Pending admin review.');
          }
        },
      ]
    );
  }, [photoInfo]);

  const handleDocumentUpload = useCallback((docKey: keyof DocumentInfo) => {
    console.log(`[EditProfile] Upload document: ${docKey}`);
    Alert.alert(
      'Upload Document',
      `Select ${documentInfo[docKey].name}\n\nMax file size: 10MB\nSupported formats: PDF, JPG, PNG`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Choose File', 
          onPress: () => {
            console.log(`[EditProfile] File picker for ${docKey}`);
            const newDate = new Date().toISOString().split('T')[0];
            setDocumentInfo(prev => ({
              ...prev,
              [docKey]: {
                ...prev[docKey],
                fileName: `${docKey}_${Date.now()}.pdf`,
                fileType: 'PDF',
                fileSize: '2.1 MB',
                uploadedDate: newDate,
                status: 'pending' as DocumentStatus,
              }
            }));
            Alert.alert('Success', 'Document uploaded successfully! Pending admin review.');
          }
        },
      ]
    );
  }, [documentInfo]);

  const getStatusIcon = useCallback((status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={18} color="#10B981" />;
      case 'rejected':
        return <XCircle size={18} color="#EF4444" />;
      case 'pending':
      default:
        return <Clock size={18} color="#F59E0B" />;
    }
  }, []);

  const getStatusColor = useCallback((status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return { bg: '#ECFDF5', border: '#10B981', text: '#10B981' };
      case 'rejected':
        return { bg: '#FEF2F2', border: '#EF4444', text: '#EF4444' };
      case 'pending':
      default:
        return { bg: '#FFFBEB', border: '#F59E0B', text: '#F59E0B' };
    }
  }, []);

  const getStatusText = useCallback((status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending';
    }
  }, []);

  const renderDocumentCard = useCallback((docKey: keyof DocumentInfo) => {
    const doc = documentInfo[docKey];
    const statusColors = getStatusColor(doc.status);

    return (
      <View key={doc.id} style={styles.documentCard} testID={`doc-card-${doc.id}`}>
        <View style={styles.documentHeader}>
          <View style={styles.documentIconContainer}>
            <FileText size={24} color="#3B82F6" />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>{doc.name}</Text>
            {doc.fileName && (
              <Text style={styles.documentFileName}>{doc.fileName}</Text>
            )}
          </View>
        </View>

        {doc.fileName ? (
          <View style={styles.documentDetails}>
            <View style={styles.documentMetaRow}>
              <View style={styles.documentMeta}>
                <Text style={styles.documentMetaLabel}>Type:</Text>
                <Text style={styles.documentMetaValue}>{doc.fileType}</Text>
              </View>
              <View style={styles.documentMeta}>
                <Text style={styles.documentMetaLabel}>Size:</Text>
                <Text style={styles.documentMetaValue}>{doc.fileSize}</Text>
              </View>
              <View style={styles.documentMeta}>
                <Text style={styles.documentMetaLabel}>Uploaded:</Text>
                <Text style={styles.documentMetaValue}>
                  {doc.uploadedDate ? new Date(doc.uploadedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noDocumentContainer}>
            <Text style={styles.noDocumentText}>No document uploaded</Text>
          </View>
        )}

        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
          {getStatusIcon(doc.status)}
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {getStatusText(doc.status)}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.uploadDocButton}
          onPress={() => handleDocumentUpload(docKey)}
          testID={`upload-${doc.id}`}
        >
          <Upload size={18} color="#3B82F6" />
          <Text style={styles.uploadDocButtonText}>
            {doc.fileName ? 'Replace Document' : 'Upload Document'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [documentInfo, getStatusColor, getStatusIcon, getStatusText, handleDocumentUpload]);

  const renderPhotoCard = useCallback((photoKey: keyof PhotoInfo) => {
    const photo = photoInfo[photoKey];
    const statusColors = getStatusColor(photo.status);

    return (
      <View key={photo.id} style={styles.photoCard} testID={`photo-card-${photo.id}`}>
        {photo.uri ? (
          <View style={styles.photoPreviewContainer}>
            <View style={styles.photoPreview}>
              <View style={styles.photoImagePlaceholder}>
                <ImageIcon size={40} color="#9CA3AF" />
              </View>
            </View>
            <View style={[styles.photoStatusOverlay, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
              {getStatusIcon(photo.status)}
              <Text style={[styles.photoStatusText, { color: statusColors.text }]}>
                {getStatusText(photo.status)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Camera size={48} color="#D1D5DB" />
            <Text style={styles.photoPlaceholderText}>No photo uploaded</Text>
          </View>
        )}

        <View style={styles.photoInfo}>
          <Text style={styles.photoTitle}>{photo.name}</Text>
          {photo.uri && (
            <View style={styles.photoMeta}>
              <Text style={styles.photoMetaText}>{photo.fileType} • {photo.fileSize}</Text>
              <Text style={styles.photoMetaText}>
                {photo.uploadedDate ? new Date(photo.uploadedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.uploadPhotoButton}
          onPress={() => handlePhotoUpload(photoKey)}
          testID={`upload-photo-${photo.id}`}
        >
          <Camera size={18} color="#3B82F6" />
          <Text style={styles.uploadPhotoButtonText}>
            {photo.uri ? 'Replace Photo' : 'Upload Photo'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [photoInfo, getStatusColor, getStatusIcon, getStatusText, handlePhotoUpload]);

  const renderPhotosTab = useCallback(() => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Vehicle Photos</Text>
      <Text style={styles.sectionSubtitle}>Upload photos of your truck and trailer</Text>

      <View style={styles.photoSection}>
        <View style={styles.photoSectionHeader}>
          <Truck size={20} color="#3B82F6" />
          <Text style={styles.photoSectionTitle}>Truck Photos</Text>
        </View>
        <View style={styles.photoGrid}>
          {renderPhotoCard('truckFront')}
          {renderPhotoCard('truckSide')}
        </View>
      </View>

      <View style={styles.photoSection}>
        <View style={styles.photoSectionHeader}>
          <Container size={20} color="#3B82F6" />
          <Text style={styles.photoSectionTitle}>Trailer Photos</Text>
        </View>
        <View style={styles.photoGrid}>
          {renderPhotoCard('trailerFront')}
          {renderPhotoCard('trailerSide')}
        </View>
      </View>

      <View style={styles.infoBox}>
        <Camera size={16} color="#3B82F6" />
        <View style={styles.infoBoxContent}>
          <Text style={styles.infoBoxTitle}>Photo Guidelines</Text>
          <Text style={styles.infoBoxText}>
            • Take photos in good lighting{"\n"}
            • Show full vehicle in frame{"\n"}
            • Ensure license plates are visible{"\n"}
            • Max file size: 10MB{"\n"}
            • Supported formats: JPG, PNG
          </Text>
        </View>
      </View>
    </View>
  ), [renderPhotoCard]);

  const renderDocumentsTab = useCallback(() => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Compliance Documents</Text>
      <Text style={styles.sectionSubtitle}>Upload and manage required documents</Text>

      <View style={styles.documentsContainer}>
        {renderDocumentCard('driversLicense')}
        {renderDocumentCard('truckRegistration')}
        {renderDocumentCard('trailerRegistration')}
        {renderDocumentCard('insuranceCertificate')}
        {renderDocumentCard('businessLicense')}
      </View>

      <View style={styles.infoBox}>
        <FileText size={16} color="#3B82F6" />
        <View style={styles.infoBoxContent}>
          <Text style={styles.infoBoxTitle}>Document Requirements</Text>
          <Text style={styles.infoBoxText}>
            • Max file size: 10MB{"\n"}
            • Supported formats: PDF, JPG, PNG{"\n"}
            • Documents are securely stored{"\n"}
            • Admin review typically takes 24-48 hours
          </Text>
        </View>
      </View>
    </View>
  ), [renderDocumentCard]);

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalTab();
      case 'business':
        return renderBusinessTab();
      case 'truck':
        return renderTruckTab();
      case 'trailer':
        return renderTrailerTab();
      case 'photos':
        return renderPhotosTab();
      case 'documents':
        return renderDocumentsTab();
      default:
        return null;
    }
  }, [activeTab, renderPersonalTab, renderBusinessTab, renderTruckTab, renderTrailerTab, renderPhotosTab, renderDocumentsTab]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Profile',
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
          <Save size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Profile'}
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
  toggleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleLabelContainer: {
    flex: 1,
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
  documentsContainer: {
    gap: 16,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  documentFileName: {
    fontSize: 13,
    color: '#6B7280',
  },
  documentDetails: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  documentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  documentMeta: {
    flex: 1,
  },
  documentMetaLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  documentMetaValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
  },
  noDocumentContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  noDocumentText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic' as const,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  uploadDocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
  },
  uploadDocButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
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
  photoSection: {
    gap: 12,
  },
  photoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  photoSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  photoGrid: {
    gap: 12,
  },
  photoCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#F9FAFB',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  photoStatusOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  photoStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic' as const,
  },
  photoInfo: {
    padding: 12,
    gap: 4,
  },
  photoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  photoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  uploadPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
  },
  uploadPhotoButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  addPhotoButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addPhotoButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  progressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressBarComplete: {
    backgroundColor: '#10B981',
  },
  photosSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photosSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  photoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoItemText: {
    fontSize: 13,
    color: '#4B5563',
  },
  photoUploaderSection: {
    gap: 8,
  },
  photoUploaderLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
  },
  fuelTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  fuelTypePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  fuelTypePillActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  fuelTypeEmoji: {
    fontSize: 20,
  },
  fuelTypeText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  fuelTypeTextActive: {
    color: '#10B981',
  },
});
