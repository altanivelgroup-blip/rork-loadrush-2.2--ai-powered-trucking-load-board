import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Fuel, RefreshCw, AlertCircle, MapPin, Clock } from 'lucide-react-native';
import { useFuelPrices } from '@/hooks/useFuelPrices';
import Colors from '@/constants/colors';

interface FuelPriceCardProps {
  fuelType: 'diesel' | 'gasoline';
  driverState?: string;
}

const FuelPriceCard = React.memo<FuelPriceCardProps>(({ fuelType, driverState }) => {
  const { price: fuelPrice, loading, error, lastFetch, refetch } = useFuelPrices(fuelType);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [rotateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleRefresh = useCallback(() => {
    if (cooldownSeconds > 0) return;

    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => rotateAnim.setValue(0));

    refetch();
    setCooldownSeconds(30);
  }, [cooldownSeconds, refetch, rotateAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatLastUpdate = useCallback((date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${diffHours}h ago`;
  }, []);

  const lastUpdateText = useMemo(
    () => (lastFetch ? formatLastUpdate(lastFetch) : null),
    [lastFetch, formatLastUpdate]
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Fuel size={20} color={Colors.light.accent} />
          <Text style={styles.title}>
            {fuelType === 'diesel' ? '💧' : '⛽'} Current Fuel Price (Auto-Updated)
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={cooldownSeconds > 0}
          style={[styles.refreshButton, cooldownSeconds > 0 && styles.refreshButtonDisabled]}
        >
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <RefreshCw size={18} color={cooldownSeconds > 0 ? Colors.light.textSecondary : Colors.light.accent} />
          </Animated.View>
          {cooldownSeconds > 0 && <Text style={styles.cooldownText}>{cooldownSeconds}s</Text>}
        </TouchableOpacity>
      </View>

      {loading && fuelPrice === null ? (
        <View style={styles.shimmerContainer}>
          <View style={styles.shimmerBar} />
          <Text style={styles.shimmerText}>Fetching live prices...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color={Colors.light.danger} />
          <Text style={styles.errorText}>No fuel data found for your region.</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : fuelPrice !== null && fuelPrice !== undefined ? (
        <>
          <Text style={styles.priceValue}>${fuelPrice.toFixed(2)}</Text>
          <Text style={styles.priceSubtext}>
            per gallon • {fuelType === 'diesel' ? 'Diesel' : 'Gasoline'}
          </Text>
          {driverState && (
            <View style={styles.locationContainer}>
              <MapPin size={14} color={Colors.light.textSecondary} />
              <Text style={styles.locationText}>{driverState}</Text>
            </View>
          )}
          {lastUpdateText && (
            <View style={styles.timestampContainer}>
              <Clock size={12} color={Colors.light.textSecondary} />
              <Text style={styles.timestampText}>Updated {lastUpdateText}</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color={Colors.light.danger} />
          <Text style={styles.errorText}>No fuel data available.</Text>
        </View>
      )}
    </View>
  );
});

FuelPriceCard.displayName = 'FuelPriceCard';

export default FuelPriceCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e4e4e4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.accent + '10',
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  cooldownText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  shimmerContainer: {
    paddingVertical: 16,
  },
  shimmerBar: {
    height: 8,
    backgroundColor: '#e4e4e4',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  shimmerText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.accent,
    marginBottom: 4,
  },
  priceSubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e4',
  },
  locationText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600' as const,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  timestampText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    flexWrap: 'wrap',
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.danger,
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.danger + '10',
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.danger,
  },
});
