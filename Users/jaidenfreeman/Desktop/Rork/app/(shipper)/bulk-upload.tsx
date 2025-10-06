import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react-native';

interface UploadedFile {
  name: string;
  size: number;
  uri: string;
  mimeType: string;
}

interface ProcessedLoad {
  origin: string;
  destination: string;
  equipmentType: string;
  rate: string;
  status: 'success' | 'error';
  error?: string;
}

export default function BulkUploadScreen() {
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedLoads, setProcessedLoads] = useState<ProcessedLoad[]>([]);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);

  const handleSelectFile = async () => {
    try {
      console.log('Opening document picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/comma-separated-values',
        ],
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('User cancelled file selection');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('File selected:', file);

        const uploadedFile: UploadedFile = {
          name: file.name,
          size: file.size || 0,
          uri: file.uri,
          mimeType: file.mimeType || 'text/csv',
        };

        setSelectedFile(uploadedFile);
        setUploadComplete(false);
        setProcessedLoads([]);
        
        Alert.alert(
          'File Selected',
          `${file.name} (${formatFileSize(file.size || 0)})`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert(
        'Error',
        'Failed to select file. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select a CSV or Excel file first.');
      return;
    }

    setIsProcessing(true);
    console.log('Processing file:', selectedFile);

    try {
      const fileContent = await readFileContent(selectedFile.uri);
      console.log('File content length:', fileContent.length);

      const loads = parseCSV(fileContent);
      console.log('Parsed loads:', loads.length);

      setProcessedLoads(loads);
      setUploadComplete(true);

      Alert.alert(
        'Upload Complete',
        `Successfully processed ${loads.filter(l => l.status === 'success').length} loads`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error processing file:', error);
      Alert.alert(
        'Processing Error',
        'Failed to process the file. Please check the format and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileContent = async (uri: string): Promise<string> => {
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        return await response.text();
      } else {
        const response = await fetch(uri);
        return await response.text();
      }
    } catch (error) {
      console.error('Error reading file:', error);
      throw new Error('Failed to read file content');
    }
  };

  const parseCSV = (content: string): ProcessedLoad[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const loads: ProcessedLoad[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));

      if (columns.length >= 4) {
        loads.push({
          origin: columns[0] || 'Unknown',
          destination: columns[1] || 'Unknown',
          equipmentType: columns[2] || 'Dry Van',
          rate: columns[3] || '$0',
          status: 'success',
        });
      } else {
        loads.push({
          origin: columns[0] || 'Unknown',
          destination: columns[1] || 'Unknown',
          equipmentType: 'Invalid',
          rate: '$0',
          status: 'error',
          error: 'Incomplete data',
        });
      }
    }

    return loads;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownloadTemplate = () => {
    Alert.alert(
      'Download Template',
      'Template format:\nOrigin, Destination, Equipment Type, Rate\n\nExample:\nLos Angeles CA, Dallas TX, Dry Van, $2500',
      [{ text: 'OK' }]
    );
  };

  const handleReset = () => {
    setSelectedFile(null);
    setProcessedLoads([]);
    setUploadComplete(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Bulk Upload Loads',
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
          <Text style={styles.subtitle}>Upload multiple loads via CSV or Excel file</Text>

          <TouchableOpacity
            style={styles.templateButton}
            onPress={handleDownloadTemplate}
            activeOpacity={0.7}
          >
            <Download size={20} color="#2563EB" />
            <Text style={styles.templateButtonText}>Download CSV Template</Text>
          </TouchableOpacity>

          <View style={styles.uploadSection}>
            <View style={styles.uploadIconContainer}>
              <Upload size={48} color="#2563EB" />
            </View>
            <Text style={styles.uploadTitle}>Upload Your File</Text>
            <Text style={styles.uploadDescription}>
              Select a CSV or Excel file containing your load data
            </Text>

            <TouchableOpacity
              style={styles.selectButton}
              onPress={handleSelectFile}
              activeOpacity={0.7}
            >
              <FileText size={20} color="#fff" />
              <Text style={styles.selectButtonText}>Select CSV/Excel File</Text>
            </TouchableOpacity>

            {selectedFile && (
              <View style={styles.fileInfo}>
                <View style={styles.fileInfoHeader}>
                  <FileText size={24} color="#2563EB" />
                  <View style={styles.fileInfoText}>
                    <Text style={styles.fileName}>{selectedFile.name}</Text>
                    <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                  </View>
                  <CheckCircle size={24} color="#10b981" />
                </View>

                <TouchableOpacity
                  style={[
                    styles.processButton,
                    isProcessing && styles.processButtonDisabled,
                  ]}
                  onPress={handleProcessFile}
                  disabled={isProcessing}
                  activeOpacity={0.7}
                >
                  {isProcessing ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.processButtonText}>Processing...</Text>
                    </>
                  ) : (
                    <>
                      <Upload size={20} color="#fff" />
                      <Text style={styles.processButtonText}>Process & Upload</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {uploadComplete && processedLoads.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>Upload Results</Text>
              
              <View style={styles.resultsSummary}>
                <View style={styles.summaryItem}>
                  <CheckCircle size={20} color="#10b981" />
                  <Text style={styles.summaryText}>
                    {processedLoads.filter(l => l.status === 'success').length} Successful
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <AlertCircle size={20} color="#ef4444" />
                  <Text style={styles.summaryText}>
                    {processedLoads.filter(l => l.status === 'error').length} Failed
                  </Text>
                </View>
              </View>

              <View style={styles.loadsList}>
                {processedLoads.slice(0, 5).map((load, index) => (
                  <View
                    key={index}
                    style={[
                      styles.loadItem,
                      load.status === 'error' && styles.loadItemError,
                    ]}
                  >
                    <View style={styles.loadItemHeader}>
                      <Text style={styles.loadItemRoute}>
                        {load.origin} → {load.destination}
                      </Text>
                      {load.status === 'success' ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : (
                        <AlertCircle size={16} color="#ef4444" />
                      )}
                    </View>
                    <View style={styles.loadItemDetails}>
                      <Text style={styles.loadItemText}>{load.equipmentType}</Text>
                      <Text style={styles.loadItemText}>{load.rate}</Text>
                    </View>
                    {load.error && (
                      <Text style={styles.loadItemError}>{load.error}</Text>
                    )}
                  </View>
                ))}
                {processedLoads.length > 5 && (
                  <Text style={styles.moreLoadsText}>
                    +{processedLoads.length - 5} more loads
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
                activeOpacity={0.7}
              >
                <Text style={styles.resetButtonText}>Upload Another File</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>File Format Requirements</Text>
            <View style={styles.instructionsList}>
              <Text style={styles.instructionItem}>• CSV or Excel (.xlsx) format</Text>
              <Text style={styles.instructionItem}>
                • Columns: Origin, Destination, Equipment Type, Rate
              </Text>
              <Text style={styles.instructionItem}>• First row should be headers</Text>
              <Text style={styles.instructionItem}>• Maximum 1000 loads per file</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    gap: 8,
  },
  templateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  uploadSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  fileInfo: {
    width: '100%',
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fileInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  fileInfoText: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 13,
    color: '#6b7280',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  processButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  processButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  resultsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  loadsList: {
    gap: 12,
    marginBottom: 20,
  },
  loadItem: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loadItemError: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  loadItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadItemRoute: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    flex: 1,
  },
  loadItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loadItemText: {
    fontSize: 13,
    color: '#6b7280',
  },
  moreLoadsText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic' as const,
  },
  resetButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  instructionsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
