import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp, Mail, Phone, MessageCircle, FileText, Shield } from 'lucide-react-native';

type FAQItem = {
  question: string;
  answer: string;
};

const FAQ_DATA: FAQItem[] = [
  {
    question: 'How do I reset my password?',
    answer: 'Go to Settings → Privacy & Security → Update Password, enter your new password, and confirm.',
  },
  {
    question: 'How do I add or edit my truck/trailer?',
    answer: 'Open Profile → Add Vehicle to register a new truck or trailer. You can edit existing details anytime.',
  },
  {
    question: 'How do I track fuel costs and MPG?',
    answer: 'Enter your vehicle\'s MPG in Profile → Add Vehicle. The app will calculate fuel analytics automatically on your dashboard.',
  },
  {
    question: 'How do I upgrade my membership?',
    answer: 'Go to Profile → Membership and choose the plan (Basic, Pro, Fleet). Plans include free promo pricing for the first 6 months.',
  },
  {
    question: 'How do payouts work?',
    answer: 'All payouts are managed in Profile → Wallet. You can add payment methods in Profile → Payment Methods.',
  },
  {
    question: 'What happens if I delete my account?',
    answer: 'Deleting your account permanently removes your profile, vehicles, loads, and payment history. This action cannot be undone.',
  },
  {
    question: 'Who do I contact for support?',
    answer: 'Use the Help & Support screen → Contact Us to email or call LoadRush support.',
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@loadrush.com').catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:1-800-555-5623').catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const handleChatSupport = () => {
    Alert.alert('Chat Support', 'In-app chat support coming soon!');
  };

  const handleTermsOfService = () => {
    router.push('/(driver)/terms-of-service');
  };

  const handlePrivacyPolicy = () => {
    router.push('/(driver)/privacy');
  };

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqContainer}>
            {FAQ_DATA.map((item, index) => (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`FAQ: ${item.question}`}
                >
                  <Text style={styles.faqQuestionText}>{item.question}</Text>
                  {expandedIndex === index ? (
                    <ChevronUp size={20} color="#6B7280" />
                  ) : (
                    <ChevronDown size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
                {expandedIndex === index && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactContainer}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleEmailSupport}
              accessibilityRole="button"
              accessibilityLabel="Email Support"
            >
              <View style={[styles.contactIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Mail size={24} color="#3B82F6" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.contactSubtitle}>support@loadrush.com</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleCallSupport}
              accessibilityRole="button"
              accessibilityLabel="Call Support"
            >
              <View style={[styles.contactIconContainer, { backgroundColor: '#ECFDF5' }]}>
                <Phone size={24} color="#10B981" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Call Support</Text>
                <Text style={styles.contactSubtitle}>1-800-555-LOAD</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleChatSupport}
              accessibilityRole="button"
              accessibilityLabel="Chat Support"
            >
              <View style={[styles.contactIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <MessageCircle size={24} color="#F59E0B" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Chat Support</Text>
                <Text style={styles.contactSubtitle}>Coming soon</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.legalContainer}>
            <TouchableOpacity
              style={styles.legalButton}
              onPress={handleTermsOfService}
              accessibilityRole="button"
              accessibilityLabel="Terms of Service"
            >
              <View style={[styles.legalIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <FileText size={20} color="#3B82F6" />
              </View>
              <Text style={styles.legalText}>Terms of Service</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.legalButton}
              onPress={handlePrivacyPolicy}
              accessibilityRole="button"
              accessibilityLabel="Privacy Policy"
            >
              <View style={[styles.legalIconContainer, { backgroundColor: '#ECFDF5' }]}>
                <Shield size={20} color="#10B981" />
              </View>
              <Text style={styles.legalText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Our support team is available Monday-Friday, 8AM-6PM EST
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 16,
  },
  faqContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  contactContainer: {
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  legalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  legalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  legalText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  footer: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    textAlign: 'center',
  },
});
