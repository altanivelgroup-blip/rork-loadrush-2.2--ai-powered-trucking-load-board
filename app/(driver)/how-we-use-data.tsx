import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function HowWeUseDataScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How We Use Your Data</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version: v1.0</Text>
          <Text style={styles.effectiveDate}>Effective Date: January 1, 2025</Text>
        </View>

        <View style={styles.introSection}>
          <Text style={styles.introText}>
            At LoadRush, we believe in being transparent about how your data is used. Here's a plain-language overview:
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To Run the App</Text>
          <Text style={styles.paragraph}>
            We use your profile info (name, vehicle, MPG) so the system works correctly.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To Match Loads</Text>
          <Text style={styles.paragraph}>
            Shippers see only what's needed to book you (like truck type, location, and availability).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To Process Payments</Text>
          <Text style={styles.paragraph}>
            We securely share payment details with our payment provider to pay you and handle memberships.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To Improve Your Experience</Text>
          <Text style={styles.paragraph}>
            We use analytics (like MPG and route data) to show you live fuel costs, performance stats, and other tools that save you money.
          </Text>
        </View>

        <View style={styles.highlightSection}>
          <Text style={styles.highlightTitle}>What We Don't Do</Text>
          <View style={styles.bulletContainer}>
            <View style={styles.bulletPoint}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                We never sell your personal information.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                We don't share unnecessary details with shippers or third parties.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            If you ever want to see, change, or delete your data, go to Settings → Privacy & Location.
          </Text>
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
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },

  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  versionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  effectiveDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  introSection: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  introText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  highlightSection: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#92400E',
    marginBottom: 12,
  },
  bulletContainer: {
    marginTop: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 9,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#78350F',
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  footer: {
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
});
