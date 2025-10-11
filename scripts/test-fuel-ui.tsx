import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFuelPrices } from '@/hooks/useFuelPrices';
import { fetchFuelPrices } from '@/services/fuelService';
import Colors from '@/constants/colors';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react-native';

export default function FuelUITest() {
  const [directFetchResult, setDirectFetchResult] = useState<any>(null);
  const [directFetchLoading, setDirectFetchLoading] = useState(false);
  const [directFetchError, setDirectFetchError] = useState<string | null>(null);

  const dieselHook = useFuelPrices('diesel');
  const gasolineHook = useFuelPrices('gasoline');

  const testDirectFetch = async () => {
    setDirectFetchLoading(true);
    setDirectFetchError(null);
    try {
      console.log('🧪 Testing direct fetch from fuelService...');
      const result = await fetchFuelPrices();
      console.log('🧪 Direct fetch result:', result);
      setDirectFetchResult(result);
    } catch (error) {
      console.error('🧪 Direct fetch error:', error);
      setDirectFetchError(error instanceof Error ? error.message : String(error));
    } finally {
      setDirectFetchLoading(false);
    }
  };

  useEffect(() => {
    testDirectFetch();
  }, []);

  const TestSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const TestResult = ({ label, value, status }: { label: string; value: any; status: 'pass' | 'fail' | 'warn' }) => {
    const icon = status === 'pass' ? <CheckCircle size={16} color="#22C55E" /> : 
                 status === 'fail' ? <XCircle size={16} color="#EF4444" /> :
                 <AlertCircle size={16} color="#F59E0B" />;
    
    return (
      <View style={styles.testRow}>
        {icon}
        <Text style={styles.testLabel}>{label}:</Text>
        <Text style={[styles.testValue, { color: status === 'pass' ? '#22C55E' : status === 'fail' ? '#EF4444' : '#F59E0B' }]}>
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🧪 Fuel API Integration Test</Text>
      <Text style={styles.subtitle}>Testing all fuel price fetching methods</Text>

      <TestSection title="1. Direct Service Call (fuelService.ts)">
        {directFetchLoading ? (
          <ActivityIndicator size="small" color={Colors.light.primary} />
        ) : directFetchError ? (
          <TestResult label="Status" value={directFetchError} status="fail" />
        ) : directFetchResult ? (
          <>
            <TestResult 
              label="Status" 
              value="Success" 
              status={Array.isArray(directFetchResult) && directFetchResult.length > 0 ? 'pass' : 'warn'} 
            />
            <TestResult 
              label="Data Type" 
              value={Array.isArray(directFetchResult) ? 'Array' : typeof directFetchResult} 
              status="pass" 
            />
            <TestResult 
              label="Records" 
              value={Array.isArray(directFetchResult) ? directFetchResult.length : 'N/A'} 
              status={Array.isArray(directFetchResult) && directFetchResult.length > 0 ? 'pass' : 'fail'} 
            />
            {Array.isArray(directFetchResult) && directFetchResult.length > 0 && (
              <View style={styles.dataPreview}>
                <Text style={styles.dataPreviewTitle}>Sample Data:</Text>
                <Text style={styles.dataPreviewText}>
                  {JSON.stringify(directFetchResult[0], null, 2)}
                </Text>
              </View>
            )}
          </>
        ) : (
          <TestResult label="Status" value="No data" status="fail" />
        )}
        <TouchableOpacity style={styles.retryButton} onPress={testDirectFetch}>
          <RefreshCw size={16} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </TestSection>

      <TestSection title="2. tRPC Hook - Diesel">
        <TestResult 
          label="Loading" 
          value={dieselHook.loading ? 'Yes' : 'No'} 
          status={dieselHook.loading ? 'warn' : 'pass'} 
        />
        <TestResult 
          label="Error" 
          value={dieselHook.error || 'None'} 
          status={dieselHook.error ? 'fail' : 'pass'} 
        />
        <TestResult 
          label="Price" 
          value={dieselHook.price !== null ? `$${dieselHook.price}` : 'null'} 
          status={dieselHook.price !== null && dieselHook.price > 0 ? 'pass' : 'fail'} 
        />
        <TestResult 
          label="Last Fetch" 
          value={dieselHook.lastFetch ? dieselHook.lastFetch.toLocaleString() : 'Never'} 
          status={dieselHook.lastFetch ? 'pass' : 'warn'} 
        />
        <TouchableOpacity style={styles.retryButton} onPress={() => dieselHook.refetch()}>
          <RefreshCw size={16} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Refetch</Text>
        </TouchableOpacity>
      </TestSection>

      <TestSection title="3. tRPC Hook - Gasoline">
        <TestResult 
          label="Loading" 
          value={gasolineHook.loading ? 'Yes' : 'No'} 
          status={gasolineHook.loading ? 'warn' : 'pass'} 
        />
        <TestResult 
          label="Error" 
          value={gasolineHook.error || 'None'} 
          status={gasolineHook.error ? 'fail' : 'pass'} 
        />
        <TestResult 
          label="Price" 
          value={gasolineHook.price !== null ? `$${gasolineHook.price}` : 'null'} 
          status={gasolineHook.price !== null && gasolineHook.price > 0 ? 'pass' : 'fail'} 
        />
        <TestResult 
          label="Last Fetch" 
          value={gasolineHook.lastFetch ? gasolineHook.lastFetch.toLocaleString() : 'Never'} 
          status={gasolineHook.lastFetch ? 'pass' : 'warn'} 
        />
        <TouchableOpacity style={styles.retryButton} onPress={() => gasolineHook.refetch()}>
          <RefreshCw size={16} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Refetch</Text>
        </TouchableOpacity>
      </TestSection>

      <TestSection title="4. Environment Check">
        <TestResult 
          label="FUEL_API_URL" 
          value={process.env.EXPO_PUBLIC_FUEL_API ? 'Set' : 'Missing'} 
          status={process.env.EXPO_PUBLIC_FUEL_API ? 'pass' : 'fail'} 
        />
        <TestResult 
          label="FUEL_API_KEY" 
          value={process.env.EXPO_PUBLIC_FUEL_KEY ? 'Set' : 'Missing'} 
          status={process.env.EXPO_PUBLIC_FUEL_KEY ? 'pass' : 'fail'} 
        />
      </TestSection>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>📊 Test Summary</Text>
        <Text style={styles.summaryText}>
          {dieselHook.price && gasolineHook.price && directFetchResult
            ? '✅ All systems operational'
            : dieselHook.price || gasolineHook.price || directFetchResult
            ? '⚠️ Partial functionality'
            : '❌ Integration not working'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
  },
  section: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  testLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.text,
  },
  testValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  dataPreview: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  dataPreviewTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  dataPreviewText: {
    fontSize: 11,
    fontFamily: 'monospace' as const,
    color: Colors.light.textSecondary,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  summary: {
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
});
