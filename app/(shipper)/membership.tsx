import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  Zap, 
  Building2,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import Colors from '@/constants/colors';

type PlanId = 'plan_basic' | 'plan_pro' | 'plan_enterprise';

interface Plan {
  id: PlanId;
  name: string;
  price: string;
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
    name: 'Basic',
    price: '$49.99',
    icon: Crown,
    iconColor: '#6B7280',
    bgColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    features: [
      '15 loads/month',
      'Standard listing',
      'Basic analytics (views, bids, status)',
      'CSV template (5-column)',
      'Email notifications',
      'Email support',
    ],
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    price: '$99.99',
    icon: Zap,
    iconColor: '#3B82F6',
    bgColor: '#EFF6FF',
    borderColor: '#3B82F6',
    popular: true,
    features: [
      '75 loads/month',
      'Priority listing placement',
      'Advanced analytics dashboard ($/mile, completion, response time)',
      'CSV template (16-column)',
      'AI auto-fill assist',
      'Email + SMS notifications',
      'Export reports (CSV, PDF)',
      'Chat + email support',
    ],
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    price: 'Custom',
    icon: Building2,
    iconColor: '#8B5CF6',
    bgColor: '#F5F3FF',
    borderColor: '#8B5CF6',
    features: [
      'Unlimited loads',
      'Featured listing placement',
      'Full analytics suite (driver performance, ROI, expenses)',
      'CSV template (50-column)',
      'Backhaul AI suggestions',
      'API integrations (Google Sheets, ERP, TMS)',
      'Email + SMS + in-app chat notifications',
      'Dedicated account manager + 24/7 support',
      'Custom invoicing and billing',
    ],
  },
];

const comparisonFeatures = [
  { feature: 'Posting Limit', basic: '15/month', pro: '75/month', enterprise: 'Unlimited' },
  { feature: 'Listing Type', basic: 'Standard', pro: 'Priority', enterprise: 'Featured' },
  { feature: 'Basic Analytics', basic: true, pro: true, enterprise: true },
  { feature: 'Advanced Analytics', basic: false, pro: true, enterprise: true },
  { feature: 'Full Analytics Suite', basic: false, pro: false, enterprise: true },
  { feature: 'CSV Template', basic: '5-column', pro: '16-column', enterprise: '50-column' },
  { feature: 'AI Auto-fill Assist', basic: false, pro: true, enterprise: true },
  { feature: 'Backhaul AI', basic: false, pro: false, enterprise: true },
  { feature: 'Email Notifications', basic: true, pro: true, enterprise: true },
  { feature: 'SMS Notifications', basic: false, pro: true, enterprise: true },
  { feature: 'In-app Chat', basic: false, pro: false, enterprise: true },
  { feature: 'Export Reports', basic: false, pro: true, enterprise: true },
  { feature: 'API Integrations', basic: false, pro: false, enterprise: true },
  { feature: 'Support Level', basic: 'Email', pro: 'Chat + Email', enterprise: 'Dedicated 24/7' },
  { feature: 'Custom Billing', basic: false, pro: false, enterprise: true },
];

function ShipperMembershipScreenInner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showComparison, setShowComparison] = useState<boolean>(false);

  const onBack = useCallback(() => {
    console.log('[Shipper Membership] back pressed');
    router.back();
  }, [router]);

  const onSelectPlan = useCallback((planId: PlanId, planName: string) => {
    console.log(`[Shipper Membership] selected plan: ${planId}`);
    if (planId === 'plan_enterprise') {
      Alert.alert(
        'Enterprise Plan',
        'Contact our sales team for custom pricing and features tailored to your business needs.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Select Plan',
        `You selected ${planName}. This will connect to Stripe checkout with plan ID: ${planId}`,
        [{ text: 'OK' }]
      );
    }
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
    <View style={styles.container} testID="shipperMembershipContainer">
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          testID="backButton"
        >
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        testID="shipperMembershipScroll"
      >
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Choose Your Plan</Text>
          <Text style={styles.introSubtitle}>
            Scale your shipping operations with the right plan for your business.
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
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    {plan.id !== 'plan_enterprise' && (
                      <Text style={styles.planPeriod}>/month</Text>
                    )}
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
                  {plan.id === 'plan_enterprise' ? 'Contact Sales' : 'Select Plan'}
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
            Compare Plans
          </Text>
          {showComparison ? (
            <ChevronUp size={20} color={Colors.light.primary} />
          ) : (
            <ChevronDown size={20} color={Colors.light.primary} />
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
                <Text style={styles.comparisonHeaderText}>Enterprise</Text>
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
                  {renderCheckmark(item.enterprise)}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            💡 All plans include secure payment processing and data encryption. Upgrade or downgrade anytime. Enterprise plans include custom SLAs and dedicated support.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const ShipperMembershipScreen = React.memo(ShipperMembershipScreenInner);
export default ShipperMembershipScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
    color: Colors.light.text,
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
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  planCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: Colors.light.primary,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  planHeaderText: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  planPeriod: {
    fontSize: 14,
    color: Colors.light.textSecondary,
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
    color: Colors.light.text,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  selectButton: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectButtonPopular: {
    backgroundColor: Colors.light.primary,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  selectButtonTextPopular: {
    color: '#fff',
  },
  comparisonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  comparisonToggleText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.primary,
    marginRight: 8,
  },
  comparisonTable: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.border,
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
    color: Colors.light.text,
  },
  comparisonFeatureText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  comparisonValue: {
    fontSize: 12,
    color: Colors.light.textSecondary,
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
