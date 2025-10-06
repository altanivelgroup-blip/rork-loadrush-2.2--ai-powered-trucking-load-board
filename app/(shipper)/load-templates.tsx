import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FileText, Plus, Trash2, Edit3, Copy, MapPin, Package } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface LoadTemplate {
  id: string;
  name: string;
  pickupCity: string;
  pickupState: string;
  dropoffCity: string;
  dropoffState: string;
  equipmentType: string;
  weight: string;
  rate: string;
  notes: string;
  usageCount: number;
}

export default function LoadTemplatesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<LoadTemplate[]>([
    {
      id: '1',
      name: 'Chicago to Atlanta Route',
      pickupCity: 'Chicago',
      pickupState: 'IL',
      dropoffCity: 'Atlanta',
      dropoffState: 'GA',
      equipmentType: 'Reefer',
      weight: '45000',
      rate: '2500',
      notes: 'Temperature controlled required',
      usageCount: 12,
    },
    {
      id: '2',
      name: 'LA to Phoenix Flatbed',
      pickupCity: 'Los Angeles',
      pickupState: 'CA',
      dropoffCity: 'Phoenix',
      dropoffState: 'AZ',
      equipmentType: 'Flatbed',
      weight: '40000',
      rate: '1800',
      notes: 'Tarps required',
      usageCount: 8,
    },
    {
      id: '3',
      name: 'Dallas to Houston Express',
      pickupCity: 'Dallas',
      pickupState: 'TX',
      dropoffCity: 'Houston',
      dropoffState: 'TX',
      equipmentType: 'Dry Van',
      weight: '35000',
      rate: '800',
      notes: 'Same day delivery',
      usageCount: 15,
    },
  ]);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.pickupCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.dropoffCity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUseTemplate = (template: LoadTemplate) => {
    Alert.alert(
      'Use Template',
      `Do you want to create a new load using "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Template',
          onPress: () => {
            console.log('Using template:', template);
            router.push('/(shipper)/post-single-load');
          },
        },
      ]
    );
  };

  const handleEditTemplate = (template: LoadTemplate) => {
    Alert.alert('Edit Template', `Editing "${template.name}"`);
    console.log('Editing template:', template);
  };

  const handleDuplicateTemplate = (template: LoadTemplate) => {
    const newTemplate: LoadTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      usageCount: 0,
    };
    setTemplates([...templates, newTemplate]);
    Alert.alert('Success', 'Template duplicated successfully');
  };

  const handleDeleteTemplate = (templateId: string) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setTemplates(templates.filter(t => t.id !== templateId));
          },
        },
      ]
    );
  };

  const handleCreateNew = () => {
    Alert.alert(
      'Create Template',
      'You can create a new template by posting a load and saving it as a template.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Post Load', onPress: () => router.push('/(shipper)/post-single-load') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Load Templates',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600' as const,
            color: '#1a1a1a',
          },
        }}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            Save and reuse common load configurations
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateNew}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.createButtonText}>New Template</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredTemplates.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No templates found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first template to get started'}
              </Text>
            </View>
          ) : (
            <View style={styles.templatesList}>
              {filteredTemplates.map((template) => (
                <View key={template.id} style={styles.templateCard}>
                  <View style={styles.templateHeader}>
                    <View style={styles.templateTitleRow}>
                      <FileText size={20} color={Colors.light.primary} />
                      <Text style={styles.templateName}>{template.name}</Text>
                    </View>
                    <View style={styles.usageCountBadge}>
                      <Text style={styles.usageCountText}>
                        Used {template.usageCount}x
                      </Text>
                    </View>
                  </View>

                  <View style={styles.templateDetails}>
                    <View style={styles.routeContainer}>
                      <View style={styles.locationRow}>
                        <MapPin size={16} color={Colors.light.primary} />
                        <Text style={styles.locationText}>
                          {template.pickupCity}, {template.pickupState}
                        </Text>
                      </View>
                      <View style={styles.routeArrow}>
                        <Text style={styles.routeArrowText}>→</Text>
                      </View>
                      <View style={styles.locationRow}>
                        <MapPin size={16} color={Colors.light.success} />
                        <Text style={styles.locationText}>
                          {template.dropoffCity}, {template.dropoffState}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailsRow}>
                      <View style={styles.detailItem}>
                        <Package size={14} color="#6b7280" />
                        <Text style={styles.detailText}>{template.equipmentType}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailText}>{template.weight} lbs</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.rateText}>${template.rate}</Text>
                      </View>
                    </View>

                    {template.notes && (
                      <Text style={styles.notesText} numberOfLines={2}>
                        {template.notes}
                      </Text>
                    )}
                  </View>

                  <View style={styles.templateActions}>
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={() => handleUseTemplate(template)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.primaryActionText}>Use Template</Text>
                    </TouchableOpacity>

                    <View style={styles.secondaryActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleEditTemplate(template)}
                        activeOpacity={0.7}
                      >
                        <Edit3 size={18} color={Colors.light.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleDuplicateTemplate(template)}
                        activeOpacity={0.7}
                      >
                        <Copy size={18} color={Colors.light.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleDeleteTemplate(template.id)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={18} color={Colors.light.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  templatesList: {
    gap: 16,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    flex: 1,
  },
  usageCountBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  usageCountText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  templateDetails: {
    gap: 12,
    marginBottom: 16,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
  },
  routeArrow: {
    paddingHorizontal: 4,
  },
  routeArrowText: {
    fontSize: 18,
    color: '#9ca3af',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6b7280',
  },
  rateText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.success,
  },
  notesText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic' as const,
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
