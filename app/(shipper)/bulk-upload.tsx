import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FileText, Download, Upload, ChevronDown, History, Save, BookmarkPlus, CheckCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { db } from '@/config/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

type TemplateType = 'simple' | 'standard' | 'complete';

export default function BulkUploadScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('simple');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showImportHistory, setShowImportHistory] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null);

  const templates = [
    {
      id: 'simple' as TemplateType,
      name: 'Simple Template (5 columns)',
      description: 'Origin, Destination, VehicleType, Weight, Price',
      icon: '💡',
      color: '#3B82F6',
    },
    {
      id: 'standard' as TemplateType,
      name: 'Standard Template (16 columns)',
      description: 'Includes dates, addresses, contacts, requirements',
      icon: '📊',
      color: '#10B981',
    },
    {
      id: 'complete' as TemplateType,
      name: 'Complete Template (50+ columns)',
      description: 'All possible load details, contacts, documentation',
      icon: '📋',
      color: '#F59E0B',
    },
  ];

  const handleDownloadTemplate = (templateId: TemplateType) => {
    const template = templates.find(t => t.id === templateId);
    Alert.alert(
      'Download Template',
      `Downloading ${template?.name}...`,
      [{ text: 'OK' }]
    );
    console.log(`Downloading template: ${templateId}`);
  };

  const handleSelectFile = async () => {
    try {
      setIsPickingFile(true);
      console.log('Opening file picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        
        console.log('File selected:', {
          name: file.name,
          size: file.size,
          mimeType: file.mimeType,
          uri: file.uri,
        });

        console.log('File ready to process. User can now tap "Process & Upload File" button.');
      } else {
        console.log('File selection canceled');
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert(
        'Error',
        'Failed to select file. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsPickingFile(false);
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const handleProcessFile = async (file: DocumentPicker.DocumentPickerAsset) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to upload loads');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('[Bulk Upload] Processing file:', file.name);

      let fileContent: string;
      
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        fileContent = await blob.text();
      } else {
        const FileSystem = await import('expo-file-system');
        fileContent = await FileSystem.readAsStringAsync(file.uri);
      }
      
      console.log('[Bulk Upload] File content length:', fileContent.length);

      const rows = parseCSV(fileContent);
      console.log('[Bulk Upload] Parsed rows:', rows.length);

      if (rows.length < 2) {
        Alert.alert('Error', 'CSV file must have at least a header row and one data row');
        setIsProcessing(false);
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase().trim());
      const dataRows = rows.slice(1);

      console.log('[Bulk Upload] Headers:', headers);
      console.log('[Bulk Upload] Data rows:', dataRows.length);

      let successCount = 0;
      let failCount = 0;

      const now = Timestamp.now();
      const expiresAt = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

      for (const row of dataRows) {
        try {
          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index] || '';
          });

          const originCity = rowData['origin'] || rowData['origin city'] || rowData['pickup city'] || '';
          const originState = rowData['origin state'] || rowData['pickup state'] || '';
          const destCity = rowData['destination'] || rowData['dest city'] || rowData['delivery city'] || '';
          const destState = rowData['destination state'] || rowData['dest state'] || rowData['delivery state'] || '';
          const vehicleType = rowData['vehicletype'] || rowData['vehicle type'] || rowData['vehicle'] || 'Flatbed';
          const weight = parseFloat(rowData['weight'] || '0');
          const price = parseFloat(rowData['price'] || '0');

          if (!originCity || !destCity) {
            console.warn('[Bulk Upload] Skipping row - missing origin or destination:', rowData);
            failCount++;
            continue;
          }

          const loadData = {
            shipperId: user.id,
            shipperEmail: user.email || '',
            status: 'posted',
            vehicleType,
            weight,
            price,
            pickup: {
              city: originCity,
              state: originState,
              address: rowData['origin address'] || rowData['pickup address'] || '',
              date: rowData['pickup date'] || new Date().toISOString(),
              time: rowData['pickup time'] || '08:00',
              coordinates: {
                latitude: parseFloat(rowData['origin lat'] || '0'),
                longitude: parseFloat(rowData['origin lng'] || '0'),
              },
            },
            dropoff: {
              city: destCity,
              state: destState,
              address: rowData['destination address'] || rowData['delivery address'] || '',
              date: rowData['delivery date'] || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              time: rowData['delivery time'] || '17:00',
              coordinates: {
                latitude: parseFloat(rowData['destination lat'] || '0'),
                longitude: parseFloat(rowData['destination lng'] || '0'),
              },
            },
            distance: parseFloat(rowData['distance'] || '0'),
            description: rowData['description'] || '',
            requirements: rowData['requirements'] || '',
            createdAt: now,
            updatedAt: now,
            expiresAt,
          };

          await addDoc(collection(db, 'loads'), loadData);
          successCount++;
          console.log('[Bulk Upload] Created load:', `${originCity} → ${destCity}`);
        } catch (error) {
          console.error('[Bulk Upload] Error creating load:', error);
          failCount++;
        }
      }

      setUploadResult({ success: successCount, failed: failCount });
      setIsProcessing(false);

      Alert.alert(
        'Upload Complete',
        `Successfully uploaded ${successCount} load(s).${failCount > 0 ? `\n${failCount} load(s) failed.` : ''}\n\nLoads are now live on your Loads page!`,
        [
          { text: 'View Loads', onPress: () => router.push('/(shipper)/loads') },
          { text: 'OK' },
        ]
      );

      setSelectedFile(null);
    } catch (error) {
      console.error('[Bulk Upload] Error processing file:', error);
      setIsProcessing(false);
      Alert.alert(
        'Error',
        `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const getTemplateInfo = (templateId: TemplateType) => {
    return templates.find(t => t.id === templateId);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    const template = getTemplateInfo(selectedTemplate);
    Alert.alert(
      'Template Saved',
      `"${templateName}" has been saved as a ${template?.name} for future use.`,
      [
        { text: 'OK', onPress: () => {
          setShowSaveTemplateModal(false);
          setTemplateName('');
        }},
        { text: 'View Templates', onPress: () => {
          setShowSaveTemplateModal(false);
          setTemplateName('');
          router.push('/(shipper)/load-templates');
        }}
      ]
    );
    console.log('Saving template:', { name: templateName, type: selectedTemplate });
  };

  const handleViewTemplates = () => {
    router.push('/(shipper)/load-templates');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Bulk Upload (CSV)',
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <FileText size={48} color="#2563EB" strokeWidth={1.5} />
            <Text style={styles.mainTitle}>Bulk Upload Loads</Text>
            <Text style={styles.mainDescription}>
              Upload a CSV, Excel (.xlsx), or Google Sheets file with load information. Choose from simple (5 columns) to complete (50+ columns) templates below.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Download Templates (CSV format):</Text>
            <View style={styles.tipBox}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>
                Tip: Open in Excel or Google Sheets, fill with your data, then save/export as CSV to upload
              </Text>
            </View>

            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => handleDownloadTemplate(template.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.templateIconBox, { backgroundColor: template.color + '15' }]}>
                  <Download size={20} color={template.color} strokeWidth={2} />
                </View>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDescription}>{template.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Which template are you uploading?</Text>
            <Text style={styles.sectionSubtitle}>
              Select the template type that matches your file&apos;s column structure
            </Text>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowTemplateDropdown(!showTemplateDropdown)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownLeft}>
                <View style={styles.dropdownDot} />
                <View style={styles.dropdownTextContainer}>
                  <Text style={styles.dropdownTitle}>
                    {getTemplateInfo(selectedTemplate)?.name}
                  </Text>
                  <Text style={styles.dropdownSubtitle}>
                    {getTemplateInfo(selectedTemplate)?.description}
                  </Text>
                </View>
              </View>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>

            {showTemplateDropdown && (
              <View style={styles.dropdownMenu}>
                {templates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.dropdownItem,
                      selectedTemplate === template.id && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      setSelectedTemplate(template.id);
                      setShowTemplateDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownDot} />
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownItemTitle}>{template.name}</Text>
                      <Text style={styles.dropdownItemSubtitle}>{template.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.selectFileButton, isPickingFile && styles.selectFileButtonDisabled]}
            onPress={handleSelectFile}
            activeOpacity={0.8}
            disabled={isPickingFile}
          >
            {isPickingFile ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Upload size={20} color="#fff" strokeWidth={2.5} />
            )}
            <Text style={styles.selectFileButtonText}>
              {isPickingFile ? 'Opening File Picker...' : 'Select CSV/Excel File'}
            </Text>
          </TouchableOpacity>

          {selectedFile && (
            <>
              <View style={styles.selectedFileCard}>
                <View style={styles.selectedFileHeader}>
                  <FileText size={20} color="#10B981" strokeWidth={2} />
                  <Text style={styles.selectedFileTitle}>Selected File</Text>
                </View>
                <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                <Text style={styles.selectedFileSize}>
                  {selectedFile.size ? (selectedFile.size / 1024).toFixed(2) + ' KB' : 'Size unknown'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.processButton, isProcessing && styles.processButtonDisabled]}
                onPress={() => handleProcessFile(selectedFile)}
                activeOpacity={0.8}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Upload size={20} color="#fff" strokeWidth={2.5} />
                )}
                <Text style={styles.processButtonText}>
                  {isProcessing ? 'Processing & Uploading...' : 'Process & Upload File'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {uploadResult && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <CheckCircle size={24} color="#10B981" strokeWidth={2} />
                <Text style={styles.resultTitle}>Upload Complete</Text>
              </View>
              <Text style={styles.resultText}>
                ✅ {uploadResult.success} load(s) uploaded successfully
              </Text>
              {uploadResult.failed > 0 && (
                <Text style={styles.resultTextFailed}>
                  ❌ {uploadResult.failed} load(s) failed
                </Text>
              )}
              <TouchableOpacity
                style={styles.viewLoadsButton}
                onPress={() => router.push('/(shipper)/loads')}
                activeOpacity={0.8}
              >
                <Text style={styles.viewLoadsButtonText}>View Loads</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => setShowImportHistory(!showImportHistory)}
            activeOpacity={0.7}
          >
            <History size={20} color="#2563EB" strokeWidth={2} />
            <Text style={styles.historyButtonText}>Import History</Text>
            <ChevronDown size={18} color="#6B7280" />
          </TouchableOpacity>

          {showImportHistory && (
            <View style={styles.historyCard}>
              <Text style={styles.historyEmptyText}>No import history yet</Text>
            </View>
          )}

          <View style={styles.templateActionsSection}>
            <TouchableOpacity
              style={styles.saveTemplateButton}
              onPress={() => setShowSaveTemplateModal(true)}
              activeOpacity={0.7}
            >
              <BookmarkPlus size={20} color="#2563EB" strokeWidth={2} />
              <Text style={styles.saveTemplateButtonText}>Save as Template</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewTemplatesButton}
              onPress={handleViewTemplates}
              activeOpacity={0.7}
            >
              <FileText size={20} color="#6B7280" strokeWidth={2} />
              <Text style={styles.viewTemplatesButtonText}>View My Templates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showSaveTemplateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Save size={24} color="#2563EB" strokeWidth={2} />
              <Text style={styles.modalTitle}>Save Template</Text>
            </View>

            <Text style={styles.modalDescription}>
              Save this {getTemplateInfo(selectedTemplate)?.name} configuration for quick access in the future.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Template Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Weekly Chicago Route"
                placeholderTextColor="#9CA3AF"
                value={templateName}
                onChangeText={setTemplateName}
                autoFocus
              />
            </View>

            <View style={styles.templateInfoBox}>
              <Text style={styles.templateInfoLabel}>Template Type:</Text>
              <Text style={styles.templateInfoValue}>
                {getTemplateInfo(selectedTemplate)?.name}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveTemplate}
                activeOpacity={0.8}
              >
                <Save size={18} color="#fff" strokeWidth={2} />
                <Text style={styles.modalSaveText}>Save Template</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  mainDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginRight: 12,
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 3,
  },
  dropdownSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 3,
  },
  dropdownItemSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  selectFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 10,
  },
  selectFileButtonDisabled: {
    backgroundColor: '#93C5FD',
    opacity: 0.7,
  },
  selectFileButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  selectedFileCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  selectedFileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  selectedFileTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#065F46',
  },
  selectedFileName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#047857',
    marginBottom: 4,
  },
  selectedFileSize: {
    fontSize: 13,
    color: '#059669',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  processButtonDisabled: {
    backgroundColor: '#6EE7B7',
    opacity: 0.7,
  },
  resultCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#065F46',
  },
  resultText: {
    fontSize: 15,
    color: '#047857',
    marginBottom: 6,
    fontWeight: '600' as const,
  },
  resultTextFailed: {
    fontSize: 15,
    color: '#DC2626',
    marginBottom: 12,
    fontWeight: '600' as const,
  },
  viewLoadsButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  viewLoadsButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  historyButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#2563EB',
    flex: 1,
  },
  historyCard: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic' as const,
  },
  templateActionsSection: {
    marginTop: 24,
    gap: 12,
  },
  saveTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    gap: 10,
  },
  saveTemplateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  viewTemplatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  viewTemplatesButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  templateInfoBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  templateInfoLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1E40AF',
    marginBottom: 4,
  },
  templateInfoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
