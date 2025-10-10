import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Package,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileText,
  Send,
  MapPin,
  X,
  Trash2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { db, storage } from '@/config/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Step {
  key: 'details' | 'locations' | 'schedule' | 'rate' | 'review';
  title: string;
  number: number;
}

const steps: Step[] = [
  { key: 'details', title: 'Load Details', number: 1 },
  { key: 'locations', title: 'Pickup & Delivery', number: 2 },
  { key: 'schedule', title: 'Schedule', number: 3 },
  { key: 'rate', title: 'Rate & Payment', number: 4 },
  { key: 'review', title: 'Contact & Review', number: 5 },
];

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function PostSingleLoadWizard() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('');

  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [dimensions, setDimensions] = useState<string>('');

  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('America/Phoenix');

  const [rateType, setRateType] = useState<'flat' | 'perMile'>('flat');
  const [rateAmount, setRateAmount] = useState<string>('');
  const [specialReq, setSpecialReq] = useState<string>('');

  const [contact, setContact] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState<boolean>(false);

  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [calendarTarget, setCalendarTarget] = useState<'pickup' | 'delivery' | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDateInModal, setSelectedDateInModal] = useState<Date | null>(null);

  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }, []);

  const openCalendarModal = useCallback((target: 'pickup' | 'delivery') => {
    setCalendarTarget(target);
    const currentDate = target === 'pickup' ? pickupDate : deliveryDate;
    setSelectedDateInModal(currentDate || new Date());
    setCalendarMonth(currentDate || new Date());
    setShowCalendar(true);
  }, [pickupDate, deliveryDate]);

  const confirmDate = useCallback(() => {
    if (!selectedDateInModal || !calendarTarget) return;
    if (calendarTarget === 'pickup') {
      setPickupDate(selectedDateInModal);
    } else {
      setDeliveryDate(selectedDateInModal);
    }
    setShowCalendar(false);
    setCalendarTarget(null);
  }, [selectedDateInModal, calendarTarget]);

  const getDaysInMonth = useCallback((year: number, month: number): CalendarDay[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({
        date: prevMonthDate,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDate = new Date(year, month + 1, i);
      days.push({
        date: nextMonthDate,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const selectToday = useCallback(() => {
    setSelectedDateInModal(new Date());
    setCalendarMonth(new Date());
  }, []);

  const uriToBlob = (uri: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function () {
        reject(new Error('Failed to convert URI to blob'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  };

  const pickImages = useCallback(async () => {
    try {
      console.log('[Photo Upload] Requesting permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.log('[Photo Upload] Permission denied');
        Alert.alert('Permission Required', 'Please grant photo library access to upload images.');
        return;
      }

      console.log('[Photo Upload] Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 20 - photos.length,
      });

      if (result.canceled) {
        console.log('[Photo Upload] User canceled selection');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        console.log(`[Photo Upload] Selected ${result.assets.length} images`);
        setUploadingPhotos(true);
        const newPhotoUrls: string[] = [];

        for (let i = 0; i < result.assets.length; i++) {
          const asset = result.assets[i];
          try {
            console.log(`[Photo Upload] Uploading image ${i + 1}/${result.assets.length}`);
            const uri = asset.uri;
            const auth = getAuth();
            const userId = auth.currentUser?.uid ?? 'anonymous';
            const filename = `uploads/shipper/${userId}/loads/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const storageRef = ref(storage, filename);

            console.log('[Photo Upload] Converting URI to blob:', uri);
            const blob = await uriToBlob(uri);
            console.log('[Photo Upload] Blob created, size:', blob.size);

            console.log('[Photo Upload] Uploading to Firebase Storage...');
            const uploadResult = await uploadBytes(storageRef, blob);
            console.log('[Photo Upload] Upload result:', uploadResult.metadata.fullPath);
            
            console.log('[Photo Upload] Getting download URL...');
            const downloadURL = await getDownloadURL(storageRef);
            newPhotoUrls.push(downloadURL);
            console.log('[Photo Upload] Uploaded successfully:', downloadURL);
          } catch (uploadError) {
            console.error('[Photo Upload] Error uploading image:', uploadError);
            console.error('[Photo Upload] Error details:', JSON.stringify(uploadError, null, 2));
          }
        }

        console.log(`[Photo Upload] All uploads complete. ${newPhotoUrls.length} successful.`);
        setPhotos((prev) => [...prev, ...newPhotoUrls]);
        setUploadingPhotos(false);
        
        if (newPhotoUrls.length > 0) {
          Alert.alert('Success', `${newPhotoUrls.length} photo(s) uploaded successfully!`);
        } else {
          Alert.alert('Error', 'No photos were uploaded successfully. Please check console logs.');
        }
      }
    } catch (error) {
      console.error('[Photo Upload] Error in pickImages:', error);
      console.error('[Photo Upload] Error stack:', error instanceof Error ? error.stack : 'No stack');
      setUploadingPhotos(false);
      Alert.alert('Error', `Failed to upload photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [photos.length]);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, []);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const calculateExpiresAt = (baseDate: Date | null): Timestamp => {
    const base = baseDate ?? new Date();
    const exp = new Date(base);
    exp.setDate(exp.getDate() + 7);
    return Timestamp.fromDate(exp);
  };

  const handleNext = useCallback(() => {
    const key = steps[stepIndex].key;
    let valid = true;

    switch (key) {
      case 'details':
        valid = title.trim().length > 0 && description.trim().length > 0;
        break;
      case 'locations':
        valid = pickupLocation.trim().length > 0 && deliveryLocation.trim().length > 0;
        break;
      case 'schedule':
        valid = !!pickupDate && !!deliveryDate;
        break;
      case 'rate':
        valid = rateAmount.trim().length > 0;
        break;
      case 'review':
        valid = contact.trim().length > 0;
        break;
    }

    if (valid) next();
    else Alert.alert('Missing Info', 'Please fill in all required fields before continuing.');
  }, [stepIndex, title, description, pickupLocation, deliveryLocation, pickupDate, deliveryDate, rateAmount, contact, next]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid ?? 'TEST_SHIPPER';

      const payload = {
        title,
        description,
        vehicleType,
        pickupLocation,
        deliveryLocation,
        weight: weight ? Number(weight) : undefined,
        dimensions,
        pickupDate: pickupDate ? pickupDate.toISOString() : '',
        deliveryDate: deliveryDate ? deliveryDate.toISOString() : '',
        deliveryLocalDate: formatDate(deliveryDate),
        deliveryTime,
        timezone,
        rateType,
        price: Number(rateAmount || '0'),
        notes: specialReq,
        status: 'Available',
        shipperId: uid,
        photos: photos,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: calculateExpiresAt(deliveryDate),
      } as const;

      console.log('[Post Load Wizard] Submitting load', payload);
      const ref = await addDoc(collection(db, 'loads'), payload as any);
      console.log('Created load id =', ref.id);
      Alert.alert('Success', 'Load posted successfully!');
      router.back();
    } catch (e) {
      console.error('Submit failed', e);
      Alert.alert('Error', 'Failed to post load. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [title, description, vehicleType, pickupLocation, deliveryLocation, weight, dimensions, pickupDate, deliveryDate, deliveryTime, timezone, rateType, rateAmount, specialReq, photos, router, formatDate]);

  const renderStepIndicator = (
    <View style={styles.stepper}>
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <View style={[styles.stepCircle, i <= stepIndex && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, i <= stepIndex && styles.stepNumberActive]}>{s.number}</Text>
          </View>
          {i < steps.length - 1 && <View style={[styles.stepLine, i < stepIndex && styles.stepLineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );

  const calendarDays = getDaysInMonth(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Post Load',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ChevronLeft size={24} color="#1a1a1a" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => Alert.alert('Sign Out', 'Sign out functionality')}>
              <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '600', marginRight: 16 }}>Sign Out</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Post Load</Text>
        <View>{renderStepIndicator}</View>

        {steps[stepIndex].key === 'details' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Bulk Upload (CSV)</Text>
              <Text style={styles.cardSubtitle}>Upload a CSV to post multiple loads at once. Use the template for correct columns.</Text>
              <View style={styles.inlineActions}>
                <TouchableOpacity testID="uploadCsv" style={styles.primaryBtn} activeOpacity={0.8}>
                  <Upload size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Upload CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="downloadTemplate" style={styles.outlineBtn} activeOpacity={0.8}>
                  <FileText size={18} color={Colors.light.primary} />
                  <Text style={styles.outlineBtnText}>Template</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Load Details</Text>
              <Text style={styles.label}>Load Title *</Text>
              <TextInput
                testID="title"
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Furniture delivery - Dallas to Houston"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Description *</Text>
              <TextInput
                testID="description"
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the cargo, special handling requirements, etc."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Vehicle Type Required</Text>
              <View style={styles.vehicleGrid}>
                {['Cargo Van', 'Box Truck', 'Car Hauler', 'Flatbed', 'Reefer'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    testID={`veh-${t}`}
                    style={[styles.vehicleOption, vehicleType === t && styles.vehicleOptionActive]}
                    onPress={() => setVehicleType(t)}
                    activeOpacity={0.7}
                  >
                    <Package size={16} color={vehicleType === t ? '#fff' : Colors.light.primary} />
                    <Text style={[styles.vehicleOptionText, vehicleType === t && styles.vehicleOptionTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {steps[stepIndex].key === 'locations' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pickup & Delivery</Text>
            <Text style={styles.label}>Pickup Location *</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={18} color="#6B7280" />
              <TextInput
                testID="pickup"
                style={[styles.input, { flex: 1, borderWidth: 0, paddingLeft: 8 }]}
                value={pickupLocation}
                onChangeText={setPickupLocation}
                placeholder="Las Vegas 89014"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Delivery Location *</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={18} color="#6B7280" />
              <TextInput
                testID="delivery"
                style={[styles.input, { flex: 1, borderWidth: 0, paddingLeft: 8 }]}
                value={deliveryLocation}
                onChangeText={setDeliveryLocation}
                placeholder="San Antonio 85001"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Weight</Text>
            <View style={styles.inputWithIcon}>
              <Package size={18} color="#6B7280" />
              <TextInput
                testID="weight"
                style={[styles.input, { flex: 1, borderWidth: 0, paddingLeft: 8 }]}
                value={weight}
                onChangeText={setWeight}
                placeholder="7000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Dimensions (L x W x H)</Text>
            <TextInput
              testID="dimensions"
              style={styles.input}
              value={dimensions}
              onChangeText={setDimensions}
              placeholder="6 x 36ft"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        {steps[stepIndex].key === 'schedule' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Schedule</Text>

            <Text style={styles.label}>Pickup Date</Text>
            <TouchableOpacity
              testID="pickup-date"
              style={styles.dateInput}
              onPress={() => openCalendarModal('pickup')}
              activeOpacity={0.7}
            >
              <Text style={pickupDate ? styles.dateText : styles.datePlaceholder}>
                {formatDate(pickupDate) || 'Oct 7, 2025'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: 16 }]}>Delivery Date</Text>
            <TouchableOpacity
              testID="delivery-date"
              style={styles.dateInput}
              onPress={() => openCalendarModal('delivery')}
              activeOpacity={0.7}
            >
              <Text style={deliveryDate ? styles.dateText : styles.datePlaceholder}>
                {formatDate(deliveryDate) || 'Oct 8, 2025'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: 16 }]}>Delivery Timezone</Text>
            <TextInput
              testID="timezone"
              style={styles.input}
              value={timezone}
              onChangeText={setTimezone}
              placeholder="America/Phoenix"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Delivery Local Date/Time</Text>
            <TextInput
              testID="delivery-local"
              style={styles.input}
              value={deliveryDate ? `${deliveryDate.toISOString().split('T')[0]}T${deliveryTime || '17:00'}` : ''}
              editable={false}
              placeholder="2025-10-08T17:00"
              placeholderTextColor="#9CA3AF"
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  testID="delivery-date-manual"
                  style={styles.input}
                  value={deliveryDate ? deliveryDate.toISOString().split('T')[0] : ''}
                  editable={false}
                  placeholder="Oct 8, 2025"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Time (HH:MM)</Text>
                <TextInput
                  testID="delivery-time"
                  style={styles.input}
                  value={deliveryTime}
                  onChangeText={setDeliveryTime}
                  placeholder="17:00"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>
        )}

        {steps[stepIndex].key === 'rate' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rate & Payment</Text>

            <Text style={styles.label}>Rate Amount *</Text>
            <View style={styles.inputWithIcon}>
              <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: '600' }}>$</Text>
              <TextInput
                testID="rate"
                style={[styles.input, { flex: 1, borderWidth: 0, paddingLeft: 8 }]}
                value={rateAmount}
                onChangeText={setRateAmount}
                placeholder="1350"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Rate Type</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                testID="rate-flat"
                style={[styles.toggleBtn, rateType === 'flat' && styles.toggleBtnActive]}
                onPress={() => setRateType('flat')}
              >
                <Text style={[styles.toggleBtnText, rateType === 'flat' && styles.toggleBtnTextActive]}>Flat Rate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="rate-mile"
                style={[styles.toggleBtn, rateType === 'perMile' && styles.toggleBtnActive]}
                onPress={() => setRateType('perMile')}
              >
                <Text style={[styles.toggleBtnText, rateType === 'perMile' && styles.toggleBtnTextActive]}>Per Mile</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Special Requirements</Text>
            <TextInput
              testID="special-req"
              style={[styles.input, styles.textArea]}
              value={specialReq}
              onChangeText={setSpecialReq}
              placeholder="Car hauler"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}

        {steps[stepIndex].key === 'review' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contact & Review</Text>

            <Text style={styles.label}>Contact Information</Text>
            <TextInput
              testID="contact"
              style={styles.input}
              value={contact}
              onChangeText={setContact}
              placeholder="Phone number or email for carriers to contact"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Photos</Text>
            <Text style={styles.photoHint}>Photos ready: {photos.length} (showing up to 12)</Text>
            <Text style={styles.photoCount}>{photos.length}/20</Text>
            
            {photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoPreviewContainer}>
                {photos.slice(0, 12).map((photoUrl, index) => (
                  <View key={index} style={styles.photoPreviewWrapper}>
                    <Image source={{ uri: photoUrl }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      onPress={() => removePhoto(index)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            
            <TouchableOpacity
              testID="add-photos"
              style={[styles.primaryBtn, uploadingPhotos && styles.primaryBtnDisabled]}
              onPress={pickImages}
              disabled={uploadingPhotos || photos.length >= 20}
              activeOpacity={0.8}
            >
              {uploadingPhotos ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Upload size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>
                    {photos.length >= 20 ? 'Max Photos Reached' : 'Add Photos'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Load Summary</Text>
              <View style={{ gap: 8 }}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Title:</Text>
                  <Text style={styles.summaryValue}>{title || 'cacbsdcbJ'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Route:</Text>
                  <Text style={styles.summaryValue}>{pickupLocation || 'savszv'} → {deliveryLocation || 'vvz'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Vehicle:</Text>
                  <Text style={styles.summaryValue}>{vehicleType ? vehicleType.toUpperCase().replace(' ', '-') : 'CARGO-VAN'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Rate:</Text>
                  <Text style={styles.summaryValue}>${rateAmount || '1350'} ({rateType === 'flat' ? 'flat' : 'per mile'})</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            testID="prev"
            style={[styles.footerBtn, styles.prevBtn]}
            onPress={prev}
            disabled={stepIndex === 0}
          >
            <Text style={[styles.footerBtnText, stepIndex === 0 && { color: '#9CA3AF' }]}>Previous</Text>
          </TouchableOpacity>

          {stepIndex < steps.length - 1 ? (
            <TouchableOpacity testID="next" style={[styles.footerBtn, styles.nextBtn]} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              testID="submit"
              style={[styles.footerBtn, styles.nextBtn, loading && styles.nextBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Send size={18} color="#fff" />
                  <Text style={styles.nextBtnText}>Enter Contact Info</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNavBtn}>
                <ChevronLeft size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthYear}>
                {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavBtn}>
                <ChevronRight size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.calendarCloseBtn}>
                <X size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarDayNames}>
              {dayNames.map((day) => (
                <Text key={day} style={styles.calendarDayName}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const isSelected =
                  selectedDateInModal &&
                  day.date.getDate() === selectedDateInModal.getDate() &&
                  day.date.getMonth() === selectedDateInModal.getMonth() &&
                  day.date.getFullYear() === selectedDateInModal.getFullYear();

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      !day.isCurrentMonth && styles.calendarDayInactive,
                      isSelected && styles.calendarDaySelected,
                    ]}
                    onPress={() => setSelectedDateInModal(day.date)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        !day.isCurrentMonth && styles.calendarDayTextInactive,
                        isSelected && styles.calendarDayTextSelected,
                      ]}
                    >
                      {day.date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarFooter}>
              <TouchableOpacity style={styles.calendarTodayBtn} onPress={selectToday}>
                <Text style={styles.calendarTodayBtnText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarConfirmBtn} onPress={confirmDate}>
                <Text style={styles.calendarConfirmBtnText}>Use this date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: 16 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: Colors.light.primary },
  stepNumber: { fontSize: 16, fontWeight: '700', color: '#fff' },
  stepNumberActive: { color: '#fff' },
  stepLine: { width: 40, height: 3, backgroundColor: '#D1D5DB', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: Colors.light.primary },
  card: {
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
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: 8 },
  cardSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  inlineActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  outlineBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  outlineBtnText: { color: Colors.light.primary, fontSize: 15, fontWeight: '700' },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    width: '48%',
  },
  vehicleOptionActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  vehicleOptionText: { fontSize: 14, fontWeight: '700', color: Colors.light.primary },
  vehicleOptionTextActive: { color: '#fff' },
  dateInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: { fontSize: 15, color: '#1a1a1a', fontWeight: '500' },
  datePlaceholder: { fontSize: 15, color: '#9CA3AF' },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toggleBtnActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  toggleBtnText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  toggleBtnTextActive: { color: '#fff' },
  photoHint: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  photoCount: { fontSize: 13, color: '#6B7280', marginBottom: 12, textAlign: 'right' },
  summaryBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  summaryValue: { fontSize: 14, color: '#1a1a1a', fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 8 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 8 },
  footerBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  prevBtn: { backgroundColor: '#D1D5DB' },
  footerBtnText: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  nextBtn: { backgroundColor: Colors.light.primary },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  nextBtnDisabled: { opacity: 0.5 },
  primaryBtnDisabled: { opacity: 0.5 },
  photoPreviewContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    marginTop: 8,
  },
  photoPreviewWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModal: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%', maxWidth: 400 },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarNavBtn: { padding: 8 },
  calendarMonthYear: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', flex: 1, textAlign: 'center' },
  calendarCloseBtn: { padding: 8 },
  calendarDayNames: { flexDirection: 'row', marginBottom: 12 },
  calendarDayName: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#6B7280' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  calendarDayInactive: { opacity: 0.3 },
  calendarDaySelected: { backgroundColor: Colors.light.primary },
  calendarDayText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  calendarDayTextInactive: { color: '#9CA3AF' },
  calendarDayTextSelected: { color: '#fff' },
  calendarFooter: { flexDirection: 'row', gap: 12, marginTop: 20 },
  calendarTodayBtn: {
    flex: 1,
    backgroundColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTodayBtnText: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  calendarConfirmBtn: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarConfirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
