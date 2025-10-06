import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, TrendingUp, FileText, Zap, Users, Mic, FileCheck, MessageSquare, Workflow } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function AIToolsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [aiEnabled, setAiEnabled] = useState(false);

  const stats = [
    {
      icon: Clock,
      value: '25–45%',
      label: 'Ops Time Saved',
      description: 'drafting posts, docs, follow-ups',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: TrendingUp,
      value: '1.8–2.6x',
      label: 'Faster Tender → Book',
      description: 'respond quicker with AI assist',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: FileText,
      value: '60%+',
      label: 'Manual Entry Reduced',
      description: 'auto extract from BOL/COI/RC',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: Zap,
      value: '+10–18%',
      label: 'Forecast Accuracy',
      description: 'lane trends & seasonality',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
  ];

  const tools = [
    {
      icon: Zap,
      title: 'Listing Assistant',
      description: 'Turn rough details into polished posts with clear requirements, lane notes, and compliance flags.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: Users,
      title: 'Matchmaker',
      description: 'Recommends best-fit carriers by lane history, equipment, and on-time performance.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: Mic,
      title: 'Voice-to-Post',
      description: 'Speak a load or update and we generate structured fields and messages automatically.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: FileCheck,
      title: 'Smart Docs',
      description: 'Extracts key fields from BOL/COI, detects mismatches, and suggests corrections.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: MessageSquare,
      title: 'Reply Drafts',
      description: 'One-tap responses for common carrier questions, rate counters, and appointment changes.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: Workflow,
      title: 'Workflow Automations',
      description: 'Triggers alerts, status moves, and check calls based on context—no manual steps.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
  ];

  const handleEnableAI = () => {
    setAiEnabled(true);
    setTimeout(() => {
      router.push('/(driver)/dashboard');
    }, 500);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(driver)/dashboard')}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>AI-Powered Tools</Text>
        
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Work Smarter With AI</Text>
          <Text style={styles.heroDescription}>
            Built for trucking operations—cut busywork, move faster on tenders, and make better lane decisions.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.iconBg }]}>
                  <Icon size={20} color={stat.iconColor} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statDescription}>{stat.description}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You Get</Text>
          
          <View style={styles.toolsList}>
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <View key={index} style={styles.toolItem}>
                  <View style={[styles.toolIconContainer, { backgroundColor: tool.iconBg }]}>
                    <Icon size={20} color={tool.iconColor} />
                  </View>
                  <View style={styles.toolContent}>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolDescription}>{tool.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.whySection}>
          <Text style={styles.whySectionTitle}>Why It Matters In Trucking</Text>
          <Text style={styles.whyDescription}>
            Rates move hourly and ops is nonstop. AI closes the gap: faster listings mean earlier carrier interest, auto-extracted documents avoid rekeying errors, and trend guidance helps you price confidently for seasonality. Teams ship more with less manual overhead and fewer misses.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.enableButton, aiEnabled && styles.enableButtonActive]}
          onPress={handleEnableAI}
          activeOpacity={0.8}
        >
          <Text style={styles.enableButtonText}>
            {aiEnabled ? 'AI Tools Enabled ✓' : 'Enable AI Tools'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  signOutButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.light.danger,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.danger,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  heroSection: {
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 6,
  },
  statDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 20,
  },
  toolsList: {
    gap: 20,
  },
  toolItem: {
    flexDirection: 'row',
    gap: 14,
  },
  toolIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  whySection: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  whySectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  whyDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  enableButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  enableButtonActive: {
    backgroundColor: '#10B981',
  },
  enableButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
