import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useStorageUpload } from './useStorageUpload';
import { useStorageDownloadURL } from './useStorageDownloadURL';
import { useStorageDelete } from './useStorageDelete';

export default function StorageExample() {
  const { uploadFile, uploading, progress, error: uploadError } = useStorageUpload();
  const { url, loading: urlLoading, getURL } = useStorageDownloadURL();
  const { deleteFile, deleting, error: deleteError } = useStorageDelete();
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  const handleUpload = async () => {
    const sampleData = new Uint8Array([72, 101, 108, 108, 111]);
    const path = `test-files/sample-${Date.now()}.txt`;
    
    const result = await uploadFile(sampleData, path, (prog) => {
      console.log(`Upload progress: ${prog.progress.toFixed(2)}%`);
    });

    if (result) {
      setUploadedPath(result.fullPath);
      console.log('File uploaded:', result);
    }
  };

  const handleGetURL = async () => {
    if (uploadedPath) {
      await getURL(uploadedPath);
    }
  };

  const handleDelete = async () => {
    if (uploadedPath) {
      const success = await deleteFile(uploadedPath);
      if (success) {
        setUploadedPath(null);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Storage Example</Text>

      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={handleUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Upload Sample File</Text>
        )}
      </TouchableOpacity>

      {progress && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Progress: {progress.progress.toFixed(2)}%
          </Text>
          <Text style={styles.progressText}>
            {progress.bytesTransferred} / {progress.totalBytes} bytes
          </Text>
        </View>
      )}

      {uploadedPath && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Uploaded: {uploadedPath}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGetURL}
            disabled={urlLoading}
          >
            {urlLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Get Download URL</Text>
            )}
          </TouchableOpacity>

          {url && (
            <Text style={styles.urlText} numberOfLines={2}>
              URL: {url}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Delete File</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {(uploadError || deleteError) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Error: {uploadError?.message || deleteError?.message}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0D1B3E',
  },
  button: {
    backgroundColor: '#0D1B3E',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  urlText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 10,
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
});
