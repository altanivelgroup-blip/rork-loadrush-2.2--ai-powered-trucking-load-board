import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Calendar,
  Package,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileText,
  Image as ImageIcon,
  Send,
} from 'lucide-react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Colors from '@/constants/colors';
import { db } from '@/config/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface Step {
  key: 'details' | 'locations' | 'schedule' | 'rate' | 'review';
  title: string;
}

const steps: Step[] = [
  { key: 'details', title: 'Load Details' },
  { key: 'locations', title: 'Pickup & Delivery' },
  { key: 'schedule', title: 'Schedule' },
  { key: 'rate', title: 'Rate & Payment' },
  { key: 'review', title: 'Contact & Review' },
];

export default function PostSingleLoadWizard() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(0);

  // Step 1: Details
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('');

  // Step 2: Locations
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [dimensions, setDimensions] = useState<string>('');

  // Step 3: Schedule
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('America/Phoenix');

  // Step 4: Rate
  const [rateType, setRateType] = useState<'flat' | 'perMile'>('flat');
  const [rateAmount, setRateAmount] = useState<string>('');
  const [specialReq, setSpecialReq] = useState<string>('');

  // Step 5: Review
  const [contact, setContact] = useState<string>('');

  const [inlinePickerTarget, setInlinePickerTarget] = useState<'pickup' | 'delivery' | null>(null);
  const [inlinePickerValue, setInlinePickerValue] = useState<Date>(new Date());

  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return '';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  }, []);

  const openNativeDatePicker = useCallback((target: 'pickup' | 'delivery') => {
    const current = target === 'pickup' ? (pickupDate ?? new Date()) : (deliveryDate ?? new Date());

    if (Platform.OS === 'android' && DateTimePickerAndroid?.open) {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate: new Date(),
        onChange: (_event, selectedDate) => {
          if (!selectedDate) return;
          if (target === 'pickup') setPickupDate(selectedDate);
          else setDeliveryDate(selectedDate);
        },
      });
      return;
    }

    setInlinePickerTarget(target);
    setInlinePickerValue(current);
  }, [pickupDate, deliveryDate]);

  const onInlineDateChange = useCallback((d: Date | undefined) => {
    if (!inlinePickerTarget || !d) return;
    if (inlinePickerTarget === 'pickup') setPickupDate(d);
    if (inlinePickerTarget === 'delivery') setDeliveryDate(d);
    setInlinePickerTarget(null);
  }, [inlinePickerTarget]);

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

  // ✅ Validation now runs only on button press, not while typing
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: calculateExpiresAt(deliveryDate),
      } as const;

      console.log('[Post Load Wizard] Submitting load', payload);
      const ref = await addDoc(collection(db, 'loads'), payload as any);
      console.log('Created load id =', ref.id);
      router.back();
    } catch (e) {
      console.error('Submit failed', e);
    } finally {
      setLoading(false);
    }
  }, [title, description, vehicleType, pickupLocation, deliveryLocation, weight, dimensions, pickupDate, deliveryDate, deliveryTime, timezone, rateType, rateAmount, specialReq, router, formatDate]);

  const renderStepIndicator = (
    <View style={styles.stepper}>
      {steps.map((s, i) => (
        <View key={s.key} style={styles.stepDotWrap}>
          <View style={[styles.stepDot, i <= stepIndex ? styles.stepDotActive : undefined]} />
          {i < steps.length - 1 && <View style={[styles.stepLine, i < stepIndex ? styles.stepLineActive : undefined]} />}
        </View>
      ))}
    </View>
  );

  const Section = ({ title: t, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t}</Text>
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Post Load' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Post Load - Step {stepIndex + 1}</Text>
        <View>{renderStepIndicator}</View>

        {/* ---- Step 1: Details ---- */}
        {steps[stepIndex].key === 'details' && (
          <>
            <Section title="Bulk Upload (CSV)">
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
            </Section>

            <Section title="Load Details">
              <Text style={styles.label}>Load Title *</Text>
              <TextInput
                testID="title"
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Furniture delivery - Dallas to Houston"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Description *</Text>
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

              <Text style={[styles.label, { marginTop: 12 }]}>Vehicle Type Required</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {['Cargo Van','Box Truck','Car Hauler','Flatbed','Reefer'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    testID={`veh-${t}`}
                    style={[styles.pill, vehicleType === t && styles.pillActive]}
                    onPress={() => setVehicleType(t)}
                    activeOpacity={0.7}
                  >
                    <Package size={16} color={vehicleType === t ? '#fff' : '#1f2a69'} />
                    <Text style={[styles.pillText, vehicleType === t && styles.pillTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Section>
          </>
        )}

        {/* ---- Step 2: Locations ---- */}
        {steps[stepIndex].key === 'locations' && (
          <Section title="Pickup & Delivery">
            <Text style={styles.label}>Pickup Location *</Text>
            <TextInput testID="pickup" style={styles.input} value={pickupLocation} onChangeText={setPickupLocation} placeholder="City, State ZIP" placeholderTextColor="#9CA3AF" />

            <Text style={[styles.label, { marginTop: 12 }]}>Delivery Location *</Text>
            <TextInput testID="delivery" style={styles.input} value={deliveryLocation} onChangeText={setDeliveryLocation} placeholder="City, State ZIP" placeholderTextColor="#9CA3AF" />

            <Text style={[styles.label, { marginTop: 12 }]}>Weight</Text>
            <TextInput testID="weight" style={styles.input} value={weight} onChangeText={setWeight} placeholder="7000" placeholderTextColor="#9CA3AF" keyboardType="numeric" />

            <Text style={[styles.label, { marginTop: 12 }]}>Dimensions (L x W x H)</Text>
            <TextInput testID="dimensions" style={styles.input} value={dimensions} onChangeText={setDimensions} placeholder="6 x 36ft" placeholderTextColor="#9CA3AF" />
          </Section>
        )}

        {/* ---- Step 3: Schedule ---- */}
        {steps[stepIndex].key === 'schedule' && (
          <Section title="Schedule">
            <Text style={styles.label}>Pickup Date</Text>
            <TouchableOpacity testID="pickup-date" style={styles.dateInput} onPress={() => openNativeDatePicker('pickup')} activeOpacity={0.7}>
              <Calendar size={18} color="#6b7280" />
              <Text style={pickupDate ? styles.dateText : styles.datePlaceholder}>{formatDate(pickupDate) || 'Select date'}</Text>
            </TouchableOpacity>
            {inlinePickerTarget === 'pickup' && (
              <View style={{ marginTop: 8 }}>
                <DateTimePicker
                  testID="inline-pickup-date-picker"
                  value={inlinePickerValue}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={(_e, d) => onInlineDateChange(d ?? undefined)}
                />
              </View>
            )}

            <Text style={[styles.label, { marginTop: 12 }]}>Delivery Date</Text>
            <TouchableOpacity testID="delivery-date" style={styles.dateInput} onPress={() => openNativeDatePicker('delivery')} activeOpacity={0.7}>
              <Calendar size={18} color="#6b7280" />
              <Text style={deliveryDate ? styles.dateText : styles.datePlaceholder}>{formatDate(deliveryDate) || 'Select date'}</Text>
            </TouchableOpacity>
            {inlinePickerTarget === 'delivery' && (
              <View style={{ marginTop: 8 }}>
                <DateTimePicker
                  testID="inline-delivery-date-picker"
                  value={inlinePickerValue}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={(_e, d) => onInlineDateChange(d ?? undefined)}
                />
              </View>
            )}

            <Text style={[styles.label, { marginTop: 12 }]}>Delivery Time (HH:MM)</Text>
            <TextInput testID="delivery-time" style={styles.input} value={deliveryTime} onChangeText={setDeliveryTime} placeholder="17:00" placeholderTextColor="#9CA3AF" />

            <Text style={[styles.label, { marginTop: 12 }]}>Delivery Timezone</Text>
            <TextInput testID="timezone" style={styles.input} value={timezone} onChangeText={setTimezone} placeholder="America/Phoenix" placeholderTextColor="#9CA3AF" />

            <View style={styles.notice}>
              <FileText size={16} color="#6b7280" />
              <Text style={styles.noticeText}>Load will expire 7 days after delivery date</Text>
            </View>
          </Section>
        )}

        {/* ---- Step 4: Rate ---- */}
        {steps[stepIndex].key === 'rate' && (
          <Section title="Rate & Payment">
            <Text style={styles.label}>Rate Amount *</Text>
            <View style={styles.inputRow}>
              <DollarSign size={18} color="#6b7280" />
              <TextInput
                testID="rate"
                style={[styles.input, { flex: 1 }]}
                value={rateAmount}
                onChangeText={setRateAmount}
                placeholder="1350"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>Rate Type</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity testID="rate-flat" style={[styles.toggleBtn, rateType === 'flat' && styles.toggleBtnActive]} onPress={() => setRateType('flat')}>
                <Text style={[styles.toggleBtnText, rateType === 'flat' && styles.toggleBtnTextActive]}>Flat Rate</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="rate-mile" style={[styles.toggleBtn, rateType === 'perMile' && styles.toggleBtnActive]} onPress={() => setRateType('perMile')}>
                <Text style={[styles.toggleBtnText, rateType === 'perMile' && styles.toggleBtnTextActive]}>Per Mile</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>Special Requirements</Text>
            <TextInput testID="special-req" style={[styles.input, styles.textArea]} value={specialReq} onChangeText={setSpecialReq} placeholder="Any special requirements" placeholderTextColor="#9CA3AF" multiline numberOfLines={3} textAlignVertical="top" />
          </Section>
        )}

        {/* ---- Step 5: Review ---- */}
        {steps[stepIndex].key === 'review' && (
          <Section title="Contact & Review">
            <Text style={styles.label}>Contact Information</Text>
            <TextInput testID="contact" style={styles.input} value={contact} onChangeText={setContact} placeholder="Phone number or email for carriers" placeholderTextColor="#9CA3AF" />

            <Text style={[styles.label, { marginTop: 16 }]}>Photos</Text>
            <View style={styles.photosBox}>
              <TouchableOpacity testID="add-photos" style={styles.primaryBtn} activeOpacity={0.8}>
                <ImageIcon size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Add Photos</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Load Summary</Text>
              <View style={{ gap: 6 }}>
                <Text style={styles.summaryRow}>Title: {title || '-'}</Text>
                <Text style={styles.summaryRow}>Route: {pickupLocation || '—'} → {deliveryLocation || '—'}</Text>
                <Text style={styles.summaryRow}>Vehicle: {vehicleType ? vehicleType.toUpperCase().replace(' ', '-') : '—'}</Text>
                <Text style={styles.summaryRow}>Rate: ${rateAmount || '0'} ({rateType === 'flat' ? 'flat' : 'per mile'})</Text>
              </View>
            </View>
          </Section>
        )}

        {/* ---- Footer ---- */}
        <View style={styles.footer}>
          <TouchableOpacity testID="prev" style={[styles.footerBtn, styles.prevBtn]} onPress={prev} disabled={stepIndex === 0}>
            <ChevronLeft size={18} color={stepIndex === 0 ? '#9CA3AF' : '#1f2a69'} />
            <Text style={[styles.footerBtnText, stepIndex === 0 && { color: '#9CA3AF' }]}>Previous</Text>
          </TouchableOpacity>

          {stepIndex < steps.length - 1 ? (
            <TouchableOpacity testID="next" style={[styles.footerBtn, styles.nextBtn]} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next</Text>
              <ChevronRight size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity testID="submit" style={[styles.footerBtn, styles.nextBtn, loading && styles.nextBtnDisabled]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <>
                <Send size={18} color="#fff" />
                <Text style={styles.nextBtnText}>Post Load</Text>
              </>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  stepDotWrap: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E5E7EB' },
  stepDotActive: { backgroundColor: Colors.light.primary },
  stepLine: { width: 28, height: 3, backgroundColor: '#E5E7EB', marginHorizontal: 6, borderRadius: 2 },
  stepLineActive: { backgroundColor: Colors.light.primary },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1a1a1a', borderWidth: 1, borderColor: '#E5E7EB' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  inlineActions: { flexDirection: 'row', gap: 10, alignSelf: 'center' },
  primaryBtn: { flexDirection: 'row', gap: 8, backgroundColor: Colors.light.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  outlineBtn: { flexDirection: 'row', gap: 8, backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.light.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { color: Colors.light.primary, fontSize: 15, fontWeight: '700' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#1f2a69', backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 10 },
  pillActive: { backgroundColor: '#1f2a69', borderColor: '#1f2a69' },
  pillText: { fontSize: 14, fontWeight: '700', color: '#1f2a69' },
  pillTextActive: { color: '#fff' },
  dateInput: { backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 15, color: '#1a1a1a' },
  datePlaceholder: { fontSize: 15, color: '#9CA3AF' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  toggleBtnActive: { backgroundColor: '#EFF6FF', borderColor: Colors.light.primary },
  toggleBtnText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  toggleBtnTextActive: { color: '#1f2a69' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FEF3C7', marginTop: 12 },
  noticeText: { fontSize: 13, color: '#92400E' },
  photosBox: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center' },
  summaryBox: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  summaryRow: { fontSize: 14, color: '#374151' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 8 },
  footerBtn: { flex: 1, borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  prevBtn: { backgroundColor: '#E5E7EB' },
  footerBtnText: { fontSize: 16, fontWeight: '600', color: '#1f2a69' },
  nextBtn: { backgroundColor: '#1f2a69' },
  nextBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  nextBtnDisabled: { opacity: 0.5 },
});