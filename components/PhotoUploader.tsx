import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Camera, CheckCircle } from 'lucide-react-native';
import { useImageUpload } from '@/hooks/useImageUpload';
import Colors from '@/constants/colors';

interface PhotoUploaderProps {
  userId: string;
  role: 'driver' | 'shipper';
  onUploaded?: (url: string) => void;
  currentPhotoUrl?: string;
}

function PhotoUploaderInner({
  userId,
  role,
  onUploaded,
  currentPhotoUrl,
}: PhotoUploaderProps) {
  const {
    pickImage,
    uploadImage,
    uploading,
    progress,
    error,
    saved,
    reset,
  } = useImageUpload();

  const [previewUri, setPreviewUri] = useState<string | null>(currentPhotoUrl || null);

  useEffect(() => {
    if (currentPhotoUrl) {
      setPreviewUri(currentPhotoUrl);
    }
  }, [currentPhotoUrl]);

  const handleSelectAndUpload = useCallback(async () => {
    try {
      console.log(`[PhotoUploader] Starting photo selection for ${role}/${userId}`);
      
      const uri = await pickImage();
      if (!uri) {
        console.log('[PhotoUploader] No image selected');
        return;
      }

      setPreviewUri(uri);

      console.log('[PhotoUploader] Starting upload...');
      const result = await uploadImage(uri, userId, role);
      
      if (result) {
        console.log('[PhotoUploader] Upload successful:', result.downloadURL);
        setPreviewUri(result.downloadURL);
        onUploaded?.(result.downloadURL);
      }
    } catch (err) {
      console.error('[PhotoUploader] Error:', err);
      Alert.alert(
        'Upload Failed',
        'Failed to upload photo. Please try again.',
        [{ text: 'OK', onPress: reset }]
      );
    }
  }, [pickImage, uploadImage, userId, role, onUploaded, reset]);

  useEffect(() => {
    if (error) {
      console.warn('[PhotoUploader] Upload error:', error.message);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.uploadCard}
        onPress={handleSelectAndUpload}
        disabled={uploading}
        activeOpacity={0.7}
      >
        {previewUri && !uploading ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: previewUri }}
              style={styles.image}
              resizeMode="cover"
            />
            {saved && (
              <View style={styles.savedOverlay}>
                <View style={styles.savedBadge}>
                  <CheckCircle size={24} color="#fff" />
                  <Text style={styles.savedText}>Saved!</Text>
                </View>
              </View>
            )}
          </View>
        ) : uploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            {progress && (
              <Text style={styles.progressText}>{progress.percentage}%</Text>
            )}
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <View style={styles.iconCircle}>
              <Camera size={32} color={Colors.light.textSecondary} />
            </View>
            <Text style={styles.placeholderText}>Tap to upload photo</Text>
            <Text style={styles.placeholderSubtext}>16:9 aspect ratio recommended</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default React.memo(PhotoUploaderInner);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  uploadCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: Colors.light.cardBackground,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  savedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.success,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  savedText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  uploadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.textSecondary,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
