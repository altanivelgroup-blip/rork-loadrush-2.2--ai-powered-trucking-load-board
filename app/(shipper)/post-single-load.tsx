import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar, MapPin, Package, DollarSign, FileText, Save, ChevronLeft, ChevronRight, X, Truck } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface LoadFormData {
  pickupCity: string;
  pickupState: string;
  pickupDate: string;
  dropoffCity: string;
  dropoffState: string;
  dropoffDate: string;
  equipmentType: string;
  weight: string;
  rate: string;
  notes: string;
}

export default function PostSingleLoadScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoadFormData>({
    pickupCity: '',
    pickupState: '',
    pickupDate: '',
    dropoffCity: '',
    dropoffState: '',
    dropoffDate: '',
    equipmentType: '',
    weight: '',
    rate: '',
    notes: '',
  });

  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [calendarType, setCalendarType] = useState<'pickup' | 'delivery'>('pickup');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const equipmentTypes = [
    { id: 'cargo-van', label: 'Cargo Van' },
    { id: 'box-truck', label: 'Box Truck' },
    { id: 'car-hauler', label: 'Car Hauler' },
    { id: 'flatbed', label: 'Flatbed' },
    { id: 'reefer', label: 'Reefer' },
  ];

  const updateField = (field: keyof LoadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openCalendar = (type: 'pickup' | 'delivery') => {
    setCalendarType(type);
    setShowCalendar(true);
  };

  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleUseDate = () => {
    const formattedDate = formatDate(selectedDate);
    if (calendarType === 'pickup') {
      updateField('pickupDate', formattedDate);
    } else {
      updateField('dropoffDate', formattedDate);
    }
    setShowCalendar(false);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSaveDraft = () => {
    console.log('Saving draft:', formData);
    Alert.alert('Success', 'Load draft saved successfully!');
  };

  const handlePostLoad = () => {
    if (!formData.pickupCity || !formData.dropoffCity || !formData.rate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    console.log('Posting load:', formData);
    Alert.alert('Success', 'Load posted successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Pickup Location</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Chicago"
                  placeholderTextColor="#9ca3af"
                  value={formData.pickupCity}
                  onChangeText={(text) => updateField('pickupCity', text)}
                />
              </View>
              <View style={styles.inputContainerSmall}>
                <Text style={styles.label}>State *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="IL"
                  placeholderTextColor="#9ca3af"
                  value={formData.pickupState}
                  onChangeText={(text) => updateField('pickupState', text)}
                  maxLength={2}
                />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Pickup Date *</Text>
              <TouchableOpacity
                style={styles.inputWithIcon}
                onPress={() => openCalendar('pickup')}
                activeOpacity={0.7}
              >
                <Calendar size={18} color="#6b7280" />
                <Text style={[styles.inputWithIconText, !formData.pickupDate && styles.placeholderText]}>
                  {formData.pickupDate || 'MM/DD/YYYY'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={Colors.light.success} />
              <Text style={styles.sectionTitle}>Delivery Location</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Atlanta"
                  placeholderTextColor="#9ca3af"
                  value={formData.dropoffCity}
                  onChangeText={(text) => updateField('dropoffCity', text)}
                />
              </View>
              <View style={styles.inputContainerSmall}>
                <Text style={styles.label}>State *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="GA"
                  placeholderTextColor="#9ca3af"
                  value={formData.dropoffState}
                  onChangeText={(text) => updateField('dropoffState', text)}
                  maxLength={2}
                />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Delivery Date *</Text>
              <TouchableOpacity
                style={styles.inputWithIcon}
                onPress={() => openCalendar('delivery')}
                activeOpacity={0.7}
              >
                <Calendar size={18} color="#6b7280" />
                <Text style={[styles.inputWithIconText, !formData.dropoffDate && styles.placeholderText]}>
                  {formData.dropoffDate || 'MM/DD/YYYY'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={20} color={Colors.light.accent} />
              <Text style={styles.sectionTitle}>Load Details</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vehicle Type Required</Text>
              <View style={styles.equipmentGrid}>
                {equipmentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.equipmentButton,
                      formData.equipmentType === type.id && styles.equipmentButtonSelected
                    ]}
                    onPress={() => updateField('equipmentType', type.id)}
                    activeOpacity={0.7}
                  >
                    <Truck
                      size={16}
                      color={formData.equipmentType === type.id ? '#fff' : Colors.light.primary}
                    />
                    <Text style={[
                      styles.equipmentButtonText,
                      formData.equipmentType === type.id && styles.equipmentButtonTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                placeholder="45000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={formData.weight}
                onChangeText={(text) => updateField('weight', text)}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <DollarSign size={20} color={Colors.light.success} />
              <Text style={styles.sectionTitle}>Rate</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Rate (USD) *</Text>
              <View style={styles.inputWithIcon}>
                <DollarSign size={18} color="#6b7280" />
                <TextInput
                  style={styles.inputWithIconText}
                  placeholder="2500"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={formData.rate}
                  onChangeText={(text) => updateField('rate', text)}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={Colors.light.textSecondary} />
              <Text style={styles.sectionTitle}>Additional Notes</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any special instructions or requirements..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.notes}
                onChangeText={(text) => updateField('notes', text)}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSaveDraft}
              activeOpacity={0.8}
            >
              <Save size={20} color={Colors.light.primary} />
              <Text style={styles.secondaryButtonText}>Save Draft</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePostLoad}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Post Load</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
                <ChevronLeft size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.monthYearText}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
                <ChevronRight size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCalendar(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.dayNamesContainer}>
              {dayNames.map((day) => (
                <Text key={day} style={styles.dayName}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysContainer}>
              {getDaysInMonth(currentMonth).map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !day && styles.emptyDayCell,
                    day && isSameDay(day, selectedDate) && styles.selectedDayCell,
                  ]}
                  onPress={() => day && handleDateSelect(day)}
                  disabled={!day}
                  activeOpacity={0.7}
                >
                  {day && (
                    <Text
                      style={[
                        styles.dayText,
                        isSameDay(day, selectedDate) && styles.selectedDayText,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.calendarFooter}>
              <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.useDateButton} onPress={handleUseDate}>
                <Text style={styles.useDateButtonText}>Use this date</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectedDateDisplay}>
              <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  inputContainerSmall: {
    width: 80,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  inputWithIconText: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
    paddingVertical: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  emptyDayCell: {
    backgroundColor: 'transparent',
  },
  selectedDayCell: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  calendarFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  todayButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  useDateButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useDateButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  selectedDateDisplay: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  equipmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  equipmentButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  equipmentButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  equipmentButtonTextSelected: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
