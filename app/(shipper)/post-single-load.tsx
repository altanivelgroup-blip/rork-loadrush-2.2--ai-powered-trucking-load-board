import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MapPin, Package, DollarSign, FileText, Save, Send } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { db } from '@/config/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function PostSingleLoadScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupState, setPickupState] = useState('');
  const [pickupZip, setPickupZip] = useState('');
  const [pickupDate, setPickupDate] = useState('');

  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffCity, setDropoffCity] = useState('');
  const [dropoffState, setDropoffState] = useState('');
  const [dropoffZip, setDropoffZip] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const [loadType, setLoadType] = useState('');
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const calculateExpiresAt = (deliveryDateStr?: string): Timestamp => {
    let expirationDate: Date;

    if (deliveryDateStr && deliveryDateStr.trim() !== '') {
      try {
        const parsedDeliveryDate = new Date(deliveryDateStr);
        if (!isNaN(parsedDeliveryDate.getTime())) {
          expirationDate = new Date(parsedDeliveryDate);
          expirationDate.setDate(expirationDate.getDate() + 7);
        } else {
          expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 7);
        }
      } catch (error) {
        expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);
      }
    } else {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
    }

    return Timestamp.fromDate(expirationDate);
  };

  const handlePostLoad = async (status: 'Available' | 'Draft' = 'Available') => {
    if (!pickupAddress || !dropoffAddress || !loadType || !weight || !price) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const shipperId = user ? user.uid : 'TEST_SHIPPER';

      const expiresAt = calculateExpiresAt(deliveryDate);

      const loadData = {
        pickupAddress,
        pickupCity: pickupCity || 'Unknown',
        pickupState: pickupState || 'Unknown',
        pickupZip: pickupZip || '',
        pickupDate: pickupDate || new Date().toISOString(),
        dropoffAddress,
        dropoffCity: dropoffCity || 'Unknown',
        dropoffState: dropoffState || 'Unknown',
        dropoffZip: dropoffZip || '',
        deliveryDate: deliveryDate || '',
        loadType,
        weight: Number(weight),
        price: Number(price),
        rate: Number(price),
        notes: notes || '',
        status,
        shipperId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt,
        pickup: {
          address: pickupAddress,
          city: pickupCity || 'Unknown',
          state: pickupState || 'Unknown',
          zip: pickupZip || '',
          date: pickupDate || new Date().toISOString(),
        },
        dropoff: {
          address: dropoffAddress,
          city: dropoffCity || 'Unknown',
          state: dropoffState || 'Unknown',
          zip: dropoffZip || '',
          date: deliveryDate || '',
        },
        cargo: {
          type: loadType,
          weight: Number(weight),
        },
      };

      console.log('[Post Load] Creating load with data:', {
        ...loadData,
        expiresAt: expiresAt.toDate().toISOString(),
      });

      const docRef = await addDoc(collection(db, 'loads'), loadData);

      console.log('✅ Load posted successfully!');
      console.log('📄 Document ID:', docRef.id);
      console.log('📅 Expires At:', expiresAt.toDate().toISOString());
      console.log('🗓️ Expiration Date:', expiresAt.toDate().toLocaleDateString());

      Alert.alert(
        'Success',
        status === 'Available'
          ? `Load posted successfully!\n\nExpires: ${expiresAt.toDate().toLocaleDateString()}`
          : 'Draft saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setPickupAddress('');
              setPickupCity('');
              setPickupState('');
              setPickupZip('');
              setPickupDate('');
              setDropoffAddress('');
              setDropoffCity('');
              setDropoffState('');
              setDropoffZip('');
              setDeliveryDate('');
              setLoadType('');
              setWeight('');
              setPrice('');
              setNotes('');
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error posting load:', error);
      Alert.alert('Error', 'Failed to post load. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Post Single Load',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600' as const,
            color: '#1a1a1a',
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={Colors.light.primary} />
            <Text style={styles.sectionTitle}>Pickup Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pickup address"
              placeholderTextColor="#9ca3af"
              value={pickupAddress}
              onChangeText={setPickupAddress}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#9ca3af"
                value={pickupCity}
                onChangeText={setPickupCity}
              />
            </View>
            <View style={[styles.inputGroup, { width: 80 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="ST"
                placeholderTextColor="#9ca3af"
                value={pickupState}
                onChangeText={setPickupState}
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput
                style={styles.input}
                placeholder="ZIP"
                placeholderTextColor="#9ca3af"
                value={pickupZip}
                onChangeText={setPickupZip}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Pickup Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                value={pickupDate}
                onChangeText={setPickupDate}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={Colors.light.success} />
            <Text style={styles.sectionTitle}>Dropoff Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dropoff Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter dropoff address"
              placeholderTextColor="#9ca3af"
              value={dropoffAddress}
              onChangeText={setDropoffAddress}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#9ca3af"
                value={dropoffCity}
                onChangeText={setDropoffCity}
              />
            </View>
            <View style={[styles.inputGroup, { width: 80 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="ST"
                placeholderTextColor="#9ca3af"
                value={dropoffState}
                onChangeText={setDropoffState}
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput
                style={styles.input}
                placeholder="ZIP"
                placeholderTextColor="#9ca3af"
                value={dropoffZip}
                onChangeText={setDropoffZip}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Delivery Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                value={deliveryDate}
                onChangeText={setDeliveryDate}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color={Colors.light.accent} />
            <Text style={styles.sectionTitle}>Load Details</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Load Type *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Dry Van, Flatbed, Reefer"
              placeholderTextColor="#9ca3af"
              value={loadType}
              onChangeText={setLoadType}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Weight (lbs) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Weight"
                placeholderTextColor="#9ca3af"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Price ($) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Price"
                placeholderTextColor="#9ca3af"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes or requirements"
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.expirationInfo}>
          <FileText size={16} color="#6b7280" />
          <Text style={styles.expirationText}>
            Load will expire 7 days after delivery date (or 7 days from now if no delivery date)
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.draftButton]}
            onPress={() => handlePostLoad('Draft')}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#6b7280" />
            ) : (
              <>
                <Save size={20} color="#6b7280" />
                <Text style={styles.draftButtonText}>Save Draft</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.postButton]}
            onPress={() => handlePostLoad('Available')}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Send size={20} color="#fff" />
                <Text style={styles.postButtonText}>Post Load</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  expirationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  expirationText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  draftButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  draftButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  postButton: {
    backgroundColor: Colors.light.primary,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
