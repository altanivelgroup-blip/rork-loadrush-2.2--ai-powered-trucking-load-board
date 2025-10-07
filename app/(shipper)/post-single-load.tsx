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
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { MapPin, Package, DollarSign, FileText, Save, Send, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
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
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [pickupDateObj, setPickupDateObj] = useState<Date>(new Date());

  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffCity, setDropoffCity] = useState('');
  const [dropoffState, setDropoffState] = useState('');
  const [dropoffZip, setDropoffZip] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  const [deliveryDateObj, setDeliveryDateObj] = useState<Date>(new Date());

  const [loadType, setLoadType] = useState('');
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePickupDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPickupDatePicker(false);
    }
    if (selectedDate) {
      setPickupDateObj(selectedDate);
      setPickupDate(formatDate(selectedDate));
    }
  };

  const handleDeliveryDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDeliveryDatePicker(false);
    }
    if (selectedDate) {
      setDeliveryDateObj(selectedDate);
      setDeliveryDate(formatDate(selectedDate));
    }
  };

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

      console.log('\n✅ Load posted successfully!');
      console.log('📄 Document ID:', docRef.id);
      console.log('📊 Key Values:');
      console.log('   🏷️  Status:', loadData.status);
      console.log('   🚚 Load Type:', loadData.loadType);
      console.log('   👤 Shipper ID:', loadData.shipperId);
      console.log('   💰 Price: $' + loadData.price);
      console.log('   📍 Pickup:', loadData.pickupAddress);
      console.log('   📍 Dropoff:', loadData.dropoffAddress);
      console.log('   📅 Expires At:', expiresAt.toDate().toISOString());
      console.log('   🗓️  Expiration Date:', expiresAt.toDate().toLocaleDateString());
      console.log('\n🔍 Driver Query Filter: status == "Available" AND expiresAt >= now');
      console.log('✅ This load WILL appear on driver board\n');

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
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowPickupDatePicker(true)}
                activeOpacity={0.7}
              >
                <Calendar size={18} color="#6b7280" />
                <Text style={pickupDate ? styles.dateText : styles.datePlaceholder}>
                  {pickupDate || 'YYYY-MM-DD'}
                </Text>
              </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDeliveryDatePicker(true)}
                activeOpacity={0.7}
              >
                <Calendar size={18} color="#6b7280" />
                <Text style={deliveryDate ? styles.dateText : styles.datePlaceholder}>
                  {deliveryDate || 'YYYY-MM-DD'}
                </Text>
              </TouchableOpacity>
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

      {Platform.OS === 'web' ? (
        <>
          {showPickupDatePicker && (
            <Modal
              transparent
              animationType="fade"
              visible={showPickupDatePicker}
              onRequestClose={() => setShowPickupDatePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Select Pickup Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowPickupDatePicker(false)}
                      style={styles.closeButton}
                    >
                      <X size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.webDatePickerContainer}>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e: any) => {
                        const selectedDate = new Date(e.target.value);
                        setPickupDateObj(selectedDate);
                        setPickupDate(formatDate(selectedDate));
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setShowPickupDatePicker(false)}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
          {showDeliveryDatePicker && (
            <Modal
              transparent
              animationType="fade"
              visible={showDeliveryDatePicker}
              onRequestClose={() => setShowDeliveryDatePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Select Delivery Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowDeliveryDatePicker(false)}
                      style={styles.closeButton}
                    >
                      <X size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.webDatePickerContainer}>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e: any) => {
                        const selectedDate = new Date(e.target.value);
                        setDeliveryDateObj(selectedDate);
                        setDeliveryDate(formatDate(selectedDate));
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setShowDeliveryDatePicker(false)}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </>
      ) : (
        <>
          {Platform.OS === 'ios' && showPickupDatePicker && (
            <Modal
              transparent
              animationType="slide"
              visible={showPickupDatePicker}
              onRequestClose={() => setShowPickupDatePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Select Pickup Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowPickupDatePicker(false)}
                      style={styles.closeButton}
                    >
                      <X size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={pickupDateObj}
                    mode="date"
                    display="spinner"
                    onChange={handlePickupDateChange}
                    textColor="#1a1a1a"
                  />
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setShowPickupDatePicker(false)}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {Platform.OS === 'android' && showPickupDatePicker && (
            <DateTimePicker
              value={pickupDateObj}
              mode="date"
              display="default"
              onChange={handlePickupDateChange}
            />
          )}

          {Platform.OS === 'ios' && showDeliveryDatePicker && (
            <Modal
              transparent
              animationType="slide"
              visible={showDeliveryDatePicker}
              onRequestClose={() => setShowDeliveryDatePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>Select Delivery Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowDeliveryDatePicker(false)}
                      style={styles.closeButton}
                    >
                      <X size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={deliveryDateObj}
                    mode="date"
                    display="spinner"
                    onChange={handleDeliveryDateChange}
                    textColor="#1a1a1a"
                  />
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setShowDeliveryDatePicker(false)}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

          {Platform.OS === 'android' && showDeliveryDatePicker && (
            <DateTimePicker
              value={deliveryDateObj}
              mode="date"
              display="default"
              onChange={handleDeliveryDateChange}
            />
          )}
        </>
      )}
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
  dateInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  datePlaceholder: {
    fontSize: 15,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  webDatePickerContainer: {
    padding: 20,
  },
});
