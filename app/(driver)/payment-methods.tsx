import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CreditCard, Lightbulb, Fuel, FileText, Bitcoin } from 'lucide-react-native';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
}

interface PaymentService {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      name: 'Chase Business Checking',
      description: 'Account ending in 8901',
      isDefault: true,
    },
    {
      id: '2',
      name: 'Comdata Fleet Card',
      description: 'Fleet card ending in 5678',
      isDefault: false,
    },
  ]);

  const [paymentServices, setPaymentServices] = useState<PaymentService[]>([
    {
      id: 'auto-pay',
      icon: <CreditCard size={24} color="#4285F4" />,
      title: 'Auto Pay',
      description: 'Automatically charge your default method on renewal',
      enabled: true,
    },
    {
      id: 'quick-pay',
      icon: <Lightbulb size={24} color="#4285F4" />,
      title: 'Quick Pay',
      description: 'Get paid within 24 hours\nFee: 2.5%',
      enabled: true,
    },
    {
      id: 'fuel-advance',
      icon: <Fuel size={24} color="#4285F4" />,
      title: 'Fuel Advance',
      description: 'Get fuel money upfront\nFee: 3%',
      enabled: true,
    },
    {
      id: 'invoice-factoring',
      icon: <FileText size={24} color="#4285F4" />,
      title: 'Invoice Factoring',
      description: 'Sell invoices for immediate cash\nFee: 2.5%',
      enabled: false,
    },
    {
      id: 'cryptocurrency',
      icon: <Bitcoin size={24} color="#4285F4" />,
      title: 'Cryptocurrency',
      description: 'Accept Bitcoin and other crypto\nFee: 1%',
      enabled: false,
    },
  ]);

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isDeleteMode) setIsDeleteMode(false);
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    if (isEditMode) setIsEditMode(false);
  };

  const setAsDefault = (id: string) => {
    setPaymentMethods(prev =>
      prev.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  const deletePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== id));
  };

  const toggleService = (id: string) => {
    setPaymentServices(prev =>
      prev.map(service =>
        service.id === id ? { ...service, enabled: !service.enabled } : service
      )
    );
  };

  const handleAddPayment = () => {
    console.log('[PaymentMethods] Add payment method');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={handleAddPayment} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.actionButton, isEditMode && styles.actionButtonActive]}
            onPress={toggleEditMode}
          >
            <Text style={[styles.actionButtonText, isEditMode && styles.actionButtonTextActive]}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButtonDelete, isDeleteMode && styles.actionButtonDeleteActive]}
            onPress={toggleDeleteMode}
          >
            <Text style={[styles.actionButtonDeleteText, isDeleteMode && styles.actionButtonDeleteTextActive]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>

        {paymentMethods.map(method => (
          <View key={method.id} style={styles.paymentCard}>
            <View style={styles.paymentCardHeader}>
              <View style={styles.paymentIconContainer}>
                <CreditCard size={24} color="#4285F4" />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>{method.name}</Text>
                <Text style={styles.paymentDescription}>{method.description}</Text>
              </View>
              {method.isDefault && (
                <View style={styles.checkmarkContainer}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </View>

            <View style={styles.paymentActions}>
              {!method.isDefault && (
                <TouchableOpacity
                  style={styles.defaultButton}
                  onPress={() => setAsDefault(method.id)}
                >
                  <Text style={styles.defaultButtonText}>Set as Default</Text>
                </TouchableOpacity>
              )}
              {isEditMode && (
                <TouchableOpacity style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
              {isDeleteMode && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deletePaymentMethod(method.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Payment Services</Text>
          <Text style={styles.sectionSubtitle}>
            Enable additional payment features to get paid faster
          </Text>

          {paymentServices.map(service => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceIcon}>{service.icon}</View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </View>
              <Switch
                value={service.enabled}
                onValueChange={() => toggleService(service.id)}
                trackColor={{ false: '#D1D5DB', true: '#34D399' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          ))}
        </View>

        <View style={styles.planCard}>
          <View style={styles.planInfo}>
            <Text style={styles.planTitle}>Basic</Text>
            <Text style={styles.planPrice}>Free</Text>
            <Text style={styles.planDetails}>Auto Pay: ON • Next charge: Nov 2, 2025</Text>
          </View>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>Current Plan</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  topActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonActive: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  actionButtonDelete: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonDeleteActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  actionButtonDeleteText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  actionButtonDeleteTextActive: {
    color: '#EF4444',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  defaultButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  defaultButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#4B5563',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  servicesSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4B5563',
    marginBottom: 4,
  },
  planDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  planBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#4285F4',
  },
});
