import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { FileText, Upload, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '@/constants/colors';

type DocumentType = 'BOL' | 'Invoice' | 'Insurance' | 'Payment';

type DocumentStatus = 'Verified' | 'Pending' | 'Missing';

interface Document {
  id: string;
  name: string;
  type: DocumentType;
  uploadDate: string;
  status: DocumentStatus;
  size?: string;
}

export default function SecureDocumentsShipper() {
  const [selectedType, setSelectedType] = useState<DocumentType>('BOL');
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'BOL_2024_001.pdf',
      type: 'BOL',
      uploadDate: '2024-01-15',
      status: 'Verified',
      size: '2.4 MB',
    },
    {
      id: '2',
      name: 'Invoice_Jan_2024.pdf',
      type: 'Invoice',
      uploadDate: '2024-01-14',
      status: 'Pending',
      size: '1.8 MB',
    },
  ]);
  const [isUploading, setIsUploading] = useState(false);

  const documentTypes: DocumentType[] = ['BOL', 'Invoice', 'Insurance', 'Payment'];

  const handleUpload = async () => {
    try {
      setIsUploading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];
      
      setTimeout(() => {
        const newDoc: Document = {
          id: Date.now().toString(),
          name: file.name,
          type: selectedType,
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'Pending',
          size: file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'Unknown',
        };

        setDocuments([newDoc, ...documents]);
        setIsUploading(false);
        
        Alert.alert(
          'Upload Successful',
          `${file.name} has been uploaded successfully and is pending verification.`,
          [{ text: 'OK' }]
        );
      }, 1500);

    } catch (error) {
      setIsUploading(false);
      Alert.alert('Upload Failed', 'There was an error uploading your document. Please try again.');
      console.error('Document upload error:', error);
    }
  };

  const handleDelete = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${doc?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDocuments(documents.filter(d => d.id !== docId));
          },
        },
      ]
    );
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle size={18} color="#10B981" />;
      case 'Pending':
        return <Clock size={18} color="#F59E0B" />;
      case 'Missing':
        return <AlertCircle size={18} color="#EF4444" />;
    }
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'Verified':
        return '#10B981';
      case 'Pending':
        return '#F59E0B';
      case 'Missing':
        return '#EF4444';
    }
  };

  const filteredDocuments = documents.filter(doc => doc.type === selectedType);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Secure Documents',
          headerStyle: {
            backgroundColor: Colors.light.cardBackground,
          },
          headerTintColor: Colors.light.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Secure Document Manager</Text>
          <Text style={styles.subtitle}>
            Upload and manage your shipping and payment documents securely.
          </Text>
        </View>

        <View style={styles.typeSelector}>
          <Text style={styles.sectionLabel}>Document Type</Text>
          <View style={styles.typeButtons}>
            {documentTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  selectedType === type && styles.typeButtonActive,
                ]}
                onPress={() => setSelectedType(type)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    selectedType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={isUploading}
          activeOpacity={0.8}
        >
          <Upload size={20} color="#FFFFFF" />
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Text>
        </TouchableOpacity>

        <View style={styles.documentsSection}>
          <Text style={styles.sectionLabel}>
            {selectedType} Documents ({filteredDocuments.length})
          </Text>

          {filteredDocuments.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyStateTitle}>No documents uploaded yet</Text>
              <Text style={styles.emptyStateText}>
                Start by selecting a type and uploading your {selectedType} documents.
              </Text>
            </View>
          ) : (
            <View style={styles.documentsList}>
              {filteredDocuments.map((doc) => (
                <View key={doc.id} style={styles.documentCard}>
                  <View style={styles.documentIcon}>
                    <FileText size={24} color={Colors.light.primary} />
                  </View>

                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <View style={styles.documentMeta}>
                      <Text style={styles.documentDate}>
                        Uploaded: {new Date(doc.uploadDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                      {doc.size && (
                        <>
                          <Text style={styles.documentMetaSeparator}>•</Text>
                          <Text style={styles.documentSize}>{doc.size}</Text>
                        </>
                      )}
                    </View>
                    <View style={styles.statusContainer}>
                      {getStatusIcon(doc.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>
                        {doc.status}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(doc.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <AlertCircle size={20} color={Colors.light.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Document Security</Text>
            <Text style={styles.infoText}>
              All documents are encrypted and stored securely. Only you and authorized parties can access them.
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0A0A0A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  typeSelector: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  typeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  uploadButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  documentsSection: {
    marginBottom: 24,
  },
  emptyState: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  documentsList: {
    gap: 12,
  },
  documentCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  documentDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  documentMetaSeparator: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  documentSize: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
});
