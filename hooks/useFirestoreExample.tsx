import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useFirestore } from './useFirestore';
import { useCollectionData } from './useCollectionData';
import { useDocumentData } from './useDocumentData';

interface Load {
  id: string;
  origin: string;
  destination: string;
  weight: number;
  status: string;
  createdAt: string;
}

export default function FirestoreExample() {
  const { loading, error, addDocument, updateDocument, deleteDocument } = useFirestore();
  const { data: loads, loading: loadsLoading } = useCollectionData<Load>('loads', {
    orderByField: { field: 'createdAt', direction: 'desc' },
    limitCount: 10,
  });

  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const { data: selectedLoad } = useDocumentData<Load>('loads', selectedLoadId);

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');

  const handleAddLoad = async () => {
    if (!origin || !destination || !weight) {
      console.log('[Example] Please fill all fields');
      return;
    }

    const newLoad = {
      origin,
      destination,
      weight: parseFloat(weight),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const docId = await addDocument<Load>('loads', newLoad);
    if (docId) {
      console.log('[Example] Load added successfully with ID:', docId);
      setOrigin('');
      setDestination('');
      setWeight('');
    }
  };

  const handleUpdateStatus = async (loadId: string, newStatus: string) => {
    const success = await updateDocument('loads', loadId, { status: newStatus });
    if (success) {
      console.log('[Example] Load status updated successfully');
    }
  };

  const handleDeleteLoad = async (loadId: string) => {
    const success = await deleteDocument('loads', loadId);
    if (success) {
      console.log('[Example] Load deleted successfully');
      if (selectedLoadId === loadId) {
        setSelectedLoadId(null);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firestore Integration Example</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add New Load</Text>
        <TextInput
          style={styles.input}
          placeholder="Origin"
          value={origin}
          onChangeText={setOrigin}
        />
        <TextInput
          style={styles.input}
          placeholder="Destination"
          value={destination}
          onChangeText={setDestination}
        />
        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAddLoad}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add Load</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error.message}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Loads (Real-time)</Text>
        {loadsLoading ? (
          <ActivityIndicator size="large" color="#0D1B3E" />
        ) : loads.length === 0 ? (
          <Text style={styles.emptyText}>No loads found. Add one above!</Text>
        ) : (
          loads.map((load) => (
            <View key={load.id} style={styles.loadCard}>
              <TouchableOpacity onPress={() => setSelectedLoadId(load.id)}>
                <Text style={styles.loadTitle}>
                  {load.origin} → {load.destination}
                </Text>
                <Text style={styles.loadDetail}>Weight: {load.weight} kg</Text>
                <Text style={styles.loadDetail}>Status: {load.status}</Text>
              </TouchableOpacity>
              <View style={styles.loadActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.updateButton]}
                  onPress={() =>
                    handleUpdateStatus(
                      load.id,
                      load.status === 'pending' ? 'in-transit' : 'delivered'
                    )
                  }
                >
                  <Text style={styles.actionButtonText}>Update Status</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteLoad(load.id)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {selectedLoad && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Load (Real-time Document)</Text>
          <View style={styles.selectedLoadCard}>
            <Text style={styles.selectedLoadTitle}>
              {selectedLoad.origin} → {selectedLoad.destination}
            </Text>
            <Text style={styles.selectedLoadDetail}>ID: {selectedLoad.id}</Text>
            <Text style={styles.selectedLoadDetail}>Weight: {selectedLoad.weight} kg</Text>
            <Text style={styles.selectedLoadDetail}>Status: {selectedLoad.status}</Text>
            <Text style={styles.selectedLoadDetail}>Created: {selectedLoad.createdAt}</Text>
          </View>
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>✅ Firestore Integration Active</Text>
        <Text style={styles.infoText}>• Real-time collection listener (loads)</Text>
        <Text style={styles.infoText}>• Real-time document listener (selected load)</Text>
        <Text style={styles.infoText}>• CRUD operations with error handling</Text>
        <Text style={styles.infoText}>• Console logging for all operations</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#0D1B3E',
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#0D1B3E',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0D1B3E',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center' as const,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center' as const,
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
  loadCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  loadTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0D1B3E',
    marginBottom: 4,
  },
  loadDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  loadActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center' as const,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  selectedLoadCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
  },
  selectedLoadTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0D1B3E',
    marginBottom: 8,
  },
  selectedLoadDetail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  infoSection: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2e7d32',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1b5e20',
    marginBottom: 4,
  },
});
