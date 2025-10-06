import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { ChevronLeft, Zap, Eye, Shield, Lock, Key, FileText, Fingerprint, Activity } from 'lucide-react-native';

export default function AdvancedSecurity() {
  const insets = useSafeAreaInsets();
  const [isEnabled, setIsEnabled] = useState(false);

  const statistics = [
    {
      icon: Zap,
      value: '$1.1B+',
      label: 'Cargo Theft Cost',
      sublabel: 'annual losses across US trucking (2024 est.)',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: Eye,
      value: '+18%',
      label: 'Phishing Growth',
      sublabel: 'YoY in logistics-focused scams',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: FileText,
      value: '1 in 20',
      label: 'Doc Fraud Attempts',
      sublabel: 'loads see altered BOL/COI attempts',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: Shield,
      value: '100%',
      label: 'Verified Partners',
      sublabel: 'KYB/KYC vetting Required',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
  ];

  const securityFeatures = [
    {
      icon: Shield,
      title: 'End-to-End Secure Workspace',
      description: 'Encrypted at rest and in transit. Sensitive load details protected by modern TLS and key management.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: Lock,
      title: 'Role-Based Access Control',
      description: 'Granular permissions for shippers, dispatchers, and admins. Prevent overexposure of rates and documents.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: Key,
      title: 'Two-Factor Authentication',
      description: 'Add a second step at sign-in to block unauthorized access, even if a password leaks.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: FileText,
      title: 'Trusted Document Vault',
      description: 'COI, BOL, W-9, safety docs kept in a tamper-evident vault with versioning and watermarking.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: Fingerprint,
      title: 'Fraud & Impersonation Signals',
      description: 'Behavioral flags for spoofed emails, sudden banking changes, and mismatched MC/SCAC metadata.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: Activity,
      title: 'Audit Trails & Alerts',
      description: 'Every sensitive action is logged. Get alerts for risky changes like pay-to updates or modified addresses.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
  ];

  const handleEnableSecurity = () => {
    Alert.alert(
      'Enable Advanced Security',
      'This will activate all security features including two-factor authentication, document vault, and fraud detection.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Enable',
          onPress: () => {
            setIsEnabled(true);
            Alert.alert('Success', 'Advanced Security has been enabled for your account.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advanced Security</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Protect Every Load, Every Step</Text>
          <Text style={styles.heroDescription}>
            Security built for modern trucking: stop fraud, safeguard documents, and control access with precision.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {statistics.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.iconBg }]}>
                  <Icon size={20} color={stat.iconColor} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statSublabel}>{stat.sublabel}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Keep You Safe</Text>
          
          <View style={styles.featuresGrid}>
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View key={index} style={styles.featureCard}>
                  <View style={[styles.featureIconContainer, { backgroundColor: feature.iconBg }]}>
                    <Icon size={20} color={feature.iconColor} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.whySection}>
          <Text style={styles.whySectionTitle}>Why It Matters In Trucking</Text>
          <Text style={styles.whyText}>
            The industry faces rising identity fraud, fictitious pickups, and document tampering. 
            Bad actors target busy ops teams with spoofed emails and urgency tactics. Our security stack 
            reduces exposure by enforcing identity checks, automating verification, and tightening who 
            sees what—without slowing your workflow.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.enableButton, isEnabled && styles.enableButtonActive]}
          onPress={handleEnableSecurity}
          activeOpacity={0.8}
          disabled={isEnabled}
        >
          <Text style={styles.enableButtonText}>
            {isEnabled ? 'Advanced Security Enabled' : 'Enable Advanced Security'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
    textAlign: 'center',
  },

  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  heroSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  heroDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  statSublabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  whySection: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  whySectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  whyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  enableButton: {
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
  enableButtonActive: {
    backgroundColor: '#10B981',
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
