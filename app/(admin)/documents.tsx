import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react-native';

export default function AdminDocuments() {
  const insets = useSafeAreaInsets();

  const pendingDocs = [
    { id: '1', user: 'John Smith', type: 'CDL License', date: '2025-10-01', status: 'pending' },
    { id: '2', user: 'Swift Logistics', type: 'Insurance Certificate', date: '2025-10-01', status: 'pending' },
    { id: '3', user: 'Mike Johnson', type: 'Vehicle Registration', date: '2025-09-30', status: 'pending' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Document Review</Text>
        <Text style={styles.subtitle}>Verify compliance documents</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Clock size={24} color={Colors.light.accent} />
            <Text style={styles.statValue}>23</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle size={24} color={Colors.light.success} />
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <XCircle size={24} color={Colors.light.danger} />
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Review</Text>
          {pendingDocs.map((doc) => (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docIcon}>
                <FileText size={24} color={Colors.light.primary} />
              </View>
              <View style={styles.docContent}>
                <Text style={styles.docUser}>{doc.user}</Text>
                <Text style={styles.docType}>{doc.type}</Text>
                <Text style={styles.docDate}>Submitted {doc.date}</Text>
              </View>
              <View style={styles.docActions}>
                <TouchableOpacity style={styles.approveButton}>
                  <CheckCircle size={20} color={Colors.light.success} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectButton}>
                  <XCircle size={20} color={Colors.light.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  docCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docContent: {
    flex: 1,
  },
  docUser: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  docType: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  docDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  docActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.danger + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
