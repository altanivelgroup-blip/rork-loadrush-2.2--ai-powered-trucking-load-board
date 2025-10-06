import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, Upload, Camera, CheckCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

type DocumentData = {
  companyName: string;
  mcNumber: string;
  dotNumber: string;
  insuranceCarrier: string;
  policyNumber: string;
  vehicleInfo: string;
  trailerInfo: string;
  certified: boolean;
  documents: { name: string; uri: string; type: string }[];
  photos: { uri: string; type: string }[];
};

function DocumentsScreenInner() {
  const router = useRouter();
  const [formData, setFormData] = useState<DocumentData>({
    companyName: 'ACME Logistics LLC',
    mcNumber: 'MC012345',
    dotNumber: 'DOT0123456',
    insuranceCarrier: 'Progressive Commercial',
    policyNumber: 'POL-12345678',
    vehicleInfo: 'Year Make Model VIN',
    trailerInfo: 'Year Make Model VIN',
    certified: false,
    documents: [],
    photos: [],
  });

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);

  const updateField = useCallback((field: keyof DocumentData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const simulateUpload = useCallback(async () => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadComplete(false);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(i);
    }

    setIsUploading(false);
    setUploadComplete(true);

    setTimeout(() => {
      setUploadComplete(false);
      setUploadProgress(0);
    }, 2000);
  }, []);

  const handleAddDocuments = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        await simulateUpload();
        
        const newDocs = result.assets.map(asset => ({
          name: asset.name,
          uri: asset.uri,
          type: asset.mimeType || 'application/pdf',
        }));
        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, ...newDocs],
        }));
        console.log('[Documents] Added documents:', newDocs.length);
      }
    } catch (error) {
      console.error('[Documents] Error picking documents:', error);
      Alert.alert('Error', 'Failed to pick documents');
      setIsUploading(false);
    }
  }, [simulateUpload]);

  const handleAddPhoto = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await simulateUpload();
        
        const photo = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
        };
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, photo],
        }));
        console.log('[Documents] Added photo');
      }
    } catch (error) {
      console.error('[Documents] Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      setIsUploading(false);
    }
  }, [simulateUpload]);

  const handleSubmit = useCallback(() => {
    console.log('[Documents] Submit pressed');
    
    if (!formData.certified) {
      Alert.alert('Certification Required', 'Please certify that documents are accurate before submitting');
      return;
    }

    if (!formData.companyName || !formData.mcNumber || !formData.dotNumber || 
        !formData.insuranceCarrier || !formData.policyNumber) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Success',
      'Documents submitted for verification. You will be notified once reviewed.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }, [formData, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Documents & Verification',
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#1F2937" />
            </TouchableOpacity>
          ),

        }}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <ShieldCheck size={24} color="#3B82F6" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Provide your company and{'\n'}insurance details</Text>
            <Text style={styles.headerSubtitle}>
              Upload proof (CDL, insurance COI, registration).{'\n'}
              We&apos;ll verify so you can register and accept loads.
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Company Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.companyName}
            onChangeText={(text) => updateField('companyName', text)}
            placeholder="Enter company name"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>MC # *</Text>
          <TextInput
            style={styles.input}
            value={formData.mcNumber}
            onChangeText={(text) => updateField('mcNumber', text)}
            placeholder="Enter MC number"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>DOT # *</Text>
          <TextInput
            style={styles.input}
            value={formData.dotNumber}
            onChangeText={(text) => updateField('dotNumber', text)}
            placeholder="Enter DOT number"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Insurance Carrier *</Text>
          <TextInput
            style={styles.input}
            value={formData.insuranceCarrier}
            onChangeText={(text) => updateField('insuranceCarrier', text)}
            placeholder="Enter insurance carrier"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Policy Number *</Text>
          <TextInput
            style={styles.input}
            value={formData.policyNumber}
            onChangeText={(text) => updateField('policyNumber', text)}
            placeholder="Enter policy number"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Vehicle Information *</Text>
          <TextInput
            style={styles.input}
            value={formData.vehicleInfo}
            onChangeText={(text) => updateField('vehicleInfo', text)}
            placeholder="Year Make Model VIN"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Trailer Information</Text>
          <TextInput
            style={styles.input}
            value={formData.trailerInfo}
            onChangeText={(text) => updateField('trailerInfo', text)}
            placeholder="Year Make Model VIN"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.addButton, isUploading && styles.buttonDisabled]}
            onPress={handleAddDocuments}
            activeOpacity={0.7}
            disabled={isUploading}
          >
            <Upload size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.addPhotoButton, isUploading && styles.buttonDisabled]}
            onPress={handleAddPhoto}
            activeOpacity={0.7}
            disabled={isUploading}
          >
            <Camera size={18} color="#3B82F6" />
            <Text style={styles.addPhotoButtonText}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        {(isUploading || uploadComplete) && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              {isUploading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <CheckCircle size={20} color="#10B981" />
              )}
              <Text style={styles.progressText}>
                {isUploading ? 'Uploading...' : 'Upload Complete!'}
              </Text>
              <Text style={styles.progressPercentage}>{uploadProgress}%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${uploadProgress}%` },
                  uploadComplete && styles.progressBarComplete
                ]} 
              />
            </View>
          </View>
        )}

        {formData.documents.length > 0 && (
          <View style={styles.filesSection}>
            <Text style={styles.filesSectionTitle}>Uploaded Documents ({formData.documents.length})</Text>
            {formData.documents.map((doc, index) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileName} numberOfLines={1}>{doc.name}</Text>
              </View>
            ))}
          </View>
        )}

        {formData.photos.length > 0 && (
          <View style={styles.filesSection}>
            <Text style={styles.filesSectionTitle}>Uploaded Photos ({formData.photos.length})</Text>
            {formData.photos.map((photo, index) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileName}>Photo {index + 1}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => updateField('certified', !formData.certified)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, formData.certified && styles.checkboxChecked]}>
            {formData.certified && <View style={styles.checkboxInner} />}
          </View>
          <Text style={styles.checkboxLabel}>
            I certify documents are accurate and authorize verification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.submitButton, !formData.certified && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!formData.certified}
          activeOpacity={0.7}
        >
          <ShieldCheck size={20} color="#fff" />
          <Text style={styles.submitButtonText}>Submit for Verification</Text>
        </TouchableOpacity>

        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>
            Tip: Clear photos of COI front page, CDL front/back, and current registration help speed verification.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const DocumentsScreen = React.memo(DocumentsScreenInner);
export default DocumentsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },

  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  addPhotoButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  addPhotoButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  filesSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filesSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  fileItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 13,
    color: '#4B5563',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  tipContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  tipText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  progressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressBarComplete: {
    backgroundColor: '#10B981',
  },
});
