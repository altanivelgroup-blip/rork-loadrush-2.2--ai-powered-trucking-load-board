import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  Zap, 
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';

type PlanId = 'plan_basic' | 'plan_pro' | 'plan_fleet';

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  icon: typeof Crown;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'plan_basic',
    name: 'Basic Driver',
    price: 29.99,
    icon: Crown,
    iconColor: '#6B7280',
    bgColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    features: [
      '1 Driver Profile',
      'Unlimited Load Searches',
      'Save Favorite Routes',
      'Basic Live Analytics (MPG + Fuel Cost)',
      'Standard Support',
    ],
  },
  {
    id: 'plan_pro',
    name: 'Pro Driver',
    price: 59.99,
    icon: Zap,
    iconColor: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#3B82F6',
    popular: true,
    features: [
      'All Basic features',
      'Priority Load Matching',
      'Advanced Live Analytics (Net After Fuel, $/Mile, Route Heatmaps)',
      'Maintenance Tracker (Truck + Trailer)',
      'SMS/Push Load Alerts',
      'Early Access to New Features',
      'Priority Support',
    ],
  },
  {
    id: 'plan_fleet',
    name: 'Fleet Plan',
    price: 99.99,
    icon: Users,
    iconColor: '#8B5CF6',
    bgColor: '#F5F3FF',
    borderColor: '#8B5CF6',
    features: [
      'All Pro features',
      'Up to 10 Drivers',
      'Fleet-Wide Dashboard & Analytics',
      'Centralized Billing & Admin Controls',
      'Bulk CSV Uploads for Loads & Vehicles',
      'Dedicated Account Support',
    ],
  },
];

const comparisonFeatures = [
  { feature: 'Driver Profiles', basic: '1', pro: '1', fleet: 'Up to 10' },
  { feature: 'Load Searches', basic: 'Unlimited', pro: 'Unlimited', fleet: 'Unlimited' },
  { feature: 'Save Favorite Routes', basic: true, pro: true, fleet: true },
  { feature: 'Basic Analytics', basic: true, pro: true, fleet: true },
  { feature: 'Priority Load Matching', basic: false, pro: true, fleet: true },
  { feature: 'Advanced Analytics', basic: false, pro: true, fleet: true },
  { feature: 'Maintenance Tracker', basic: false, pro: true, fleet: true },
  { feature: 'SMS/Push Alerts', basic: false, pro: true, fleet: true },
  { feature: 'Early Access Features', basic: false, pro: true, fleet: true },
  { feature: 'Fleet Dashboard', basic: false, pro: false, fleet: true },
  { feature: 'Bulk CSV Uploads', basic: false, pro: false, fleet: true },
  { feature: 'Support Level', basic: 'Standard', pro: 'Priority', fleet: 'Dedicated' },
];

function MembershipScreenInner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showComparison, setShowComparison] = useState<boolean>(false);

  const onBack = useCallback(() => {
    console.log('[Membership] back pressed');
    router.back();
  }, [router]);

  const onSelectPlan = useCallback((planId: PlanId, planName: string) => {
    console.log(`[Membership] selected plan: ${planId}`);
    Alert.alert(
      'Select Plan',
      `You selected ${planName}. This will connect to Stripe checkout with plan ID: ${planId}`,
      [{ text: 'OK' }]
    );
  }, []);

  const toggleComparison = useCallback(() => {
    setShowComparison((prev) => !prev);
  }, []);

  const renderCheckmark = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check size={18} color="#10B981" />
      ) : (
        <View style={styles.crossmark}>
          <Text style={styles.crossmarkText}>—</Text>
        </View>
      );
    }
    return <Text style={styles.comparisonValue}>{value}</Text>;
  };

  return (
    <View style={styles.container} testID="membershipContainer">
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          testID="backButton"
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        testID="membershipScroll"
      >
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Choose Your Plan</Text>
          <Text style={styles.introSubtitle}>
            Introductory pricing for the first 6 months. Cancel anytime.
          </Text>
        </View>

        {plans.map((plan) => {
          const IconComponent = plan.icon;
          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                { borderColor: plan.borderColor, backgroundColor: plan.bgColor },
                plan.popular && styles.planCardPopular,
              ]}
              testID={`plan-${plan.id}`}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={[styles.planIconContainer, { backgroundColor: '#fff' }]}>
                  <IconComponent size={28} color={plan.iconColor} />
                </View>
                <View style={styles.planHeaderText}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>${plan.price}</Text>
                    <Text style={styles.planPeriod}>/month</Text>
                  </View>
                </View>
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Check size={16} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  plan.popular && styles.selectButtonPopular,
                ]}
                onPress={() => onSelectPlan(plan.id, plan.name)}
                accessibilityRole="button"
                testID={`select-${plan.id}`}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    plan.popular && styles.selectButtonTextPopular,
                  ]}
                >
                  Select Plan
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.comparisonToggle}
          onPress={toggleComparison}
          accessibilityRole="button"
          testID="comparisonToggle"
        >
          <Text style={styles.comparisonToggleText}>
            Would you like to compare memberships?
          </Text>
          {showComparison ? (
            <ChevronUp size={20} color="#3B82F6" />
          ) : (
            <ChevronDown size={20} color="#3B82F6" />
          )}
        </TouchableOpacity>

        {showComparison && (
          <View style={styles.comparisonTable} testID="comparisonTable">
            <View style={styles.comparisonHeader}>
              <View style={styles.comparisonFeatureColumn}>
                <Text style={styles.comparisonHeaderText}>Feature</Text>
              </View>
              <View style={styles.comparisonPlanColumn}>
                <Text style={styles.comparisonHeaderText}>Basic</Text>
              </View>
              <View style={styles.comparisonPlanColumn}>
                <Text style={styles.comparisonHeaderText}>Pro</Text>
              </View>
              <View style={styles.comparisonPlanColumn}>
                <Text style={styles.comparisonHeaderText}>Fleet</Text>
              </View>
            </View>

            {comparisonFeatures.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.comparisonRow,
                  index % 2 === 0 && styles.comparisonRowEven,
                ]}
              >
                <View style={styles.comparisonFeatureColumn}>
                  <Text style={styles.comparisonFeatureText}>{item.feature}</Text>
                </View>
                <View style={styles.comparisonPlanColumn}>
                  {renderCheckmark(item.basic)}
                </View>
                <View style={styles.comparisonPlanColumn}>
                  {renderCheckmark(item.pro)}
                </View>
                <View style={styles.comparisonPlanColumn}>
                  {renderCheckmark(item.fleet)}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            💡 Introductory pricing valid for the first 6 months. Prices subject to change after
            promotional period. Cancel anytime with no penalties.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const MembershipScreen = React.memo(MembershipScreenInner);
export default MembershipScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  introSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  planCardPopular: {
    borderWidth: 3,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  popularBadgeText: {
    backgroundColor: '#3B82F6',
    color: '#fff',
    fontSize: 11,
    fontWeight: '700' as const,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  planIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planHeaderText: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  planPeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  selectButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectButtonPopular: {
    backgroundColor: '#3B82F6',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  selectButtonTextPopular: {
    color: '#fff',
  },
  comparisonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  comparisonToggleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#3B82F6',
    marginRight: 8,
  },
  comparisonTable: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  comparisonRowEven: {
    backgroundColor: '#FAFAFA',
  },
  comparisonFeatureColumn: {
    flex: 2,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  comparisonPlanColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonHeaderText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  comparisonFeatureText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  comparisonValue: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  crossmark: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossmarkText: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  disclaimerSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
});
