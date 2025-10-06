import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Package, TrendingUp, Eye, PlusCircle, Upload, FileText } from 'lucide-react-native';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ icon, title, description, onPress }) => {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionIconContainer}>
        {icon}
      </View>
      <View style={styles.actionTextContainer}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function PostLoadsScreen() {
  const router = useRouter();
  const [stats] = useState({
    activeLoads: 12,
    totalPosted: 45,
    views: 31,
  });

  const handlePostSingleLoad = () => {
    router.push('/(shipper)/post-single-load');
  };

  const handleBulkUpload = () => {
    router.push('/(shipper)/bulk-upload');
  };

  const handleLoadTemplates = () => {
    router.push('/(shipper)/load-templates');
  };

  const handleQuickPostLoad = () => {
    router.push('/(shipper)/post-single-load');
  };

  const handleQuickBulkUpload = () => {
    router.push('/(shipper)/bulk-upload');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Post & Manage Loads',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: '700' as const,
            color: '#1a1a1a',
          },

        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>Create new postings and manage existing ones</Text>

          <View style={styles.statsContainer}>
            <StatCard
              icon={<Package size={24} color="#3b82f6" />}
              value={stats.activeLoads.toString()}
              label="Active Loads"
              color="#3b82f6"
            />
            <StatCard
              icon={<TrendingUp size={24} color="#10b981" />}
              value={stats.totalPosted.toString()}
              label="Total Posted"
              color="#10b981"
            />
            <StatCard
              icon={<Eye size={24} color="#f59e0b" />}
              value={stats.views.toString()}
              label="Views"
              color="#f59e0b"
            />
          </View>

          <View style={styles.actionsSection}>
            <ActionCard
              icon={<PlusCircle size={28} color="#3b82f6" />}
              title="Post Single Load"
              description="Create a new load posting with details"
              onPress={handlePostSingleLoad}
            />

<ActionCard
              icon={<FileText size={28} color="#3b82f6" />}
              title="Load Templates"
              description="Save and reuse common load configurations"
              onPress={handleLoadTemplates}
            />
          </View>


        </View>
      </ScrollView>
    </SafeAreaView>
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
  },

  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionsSection: {
    gap: 16,
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },

});
