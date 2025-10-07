import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminLoads, AdminLoadFilter } from '@/hooks/useAdminLoads';
import { useDeleteLoad } from '@/hooks/useDeleteLoad';
import { useUpdateLoadStatus } from '@/hooks/useUpdateLoadStatus';
import { Load, LoadStatus } from '@/types';
import {
  Search,
  Filter,
  Trash2,
  Edit3,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Truck,
  Package,
  X,
  Check,
} from 'lucide-react-native';

export default function AdminLoadsPage() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<AdminLoadFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [newStatus, setNewStatus] = useState<LoadStatus>('posted');

  const { loads, metrics, loading, error } = useAdminLoads(statusFilter, searchQuery);
  const { deleteLoad, loading: deleteLoading } = useDeleteLoad();
  const { updateStatus, loading: updateLoading } = useUpdateLoadStatus();

  const sortedLoads = React.useMemo(() => {
    const sorted = [...loads];
    if (sortBy === 'newest') {
      return sorted.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    } else if (sortBy === 'oldest') {
      return sorted.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
    } else if (sortBy === 'highest') {
      return sorted.sort((a, b) => b.rate - a.rate);
    }
    return sorted;
  }, [loads, sortBy]);

  const handleDeleteLoad = (loadId: string) => {
    Alert.alert(
      'Delete Load',
      'Are you sure you want to permanently delete this load? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteLoad(loadId);
            if (success) {
              Alert.alert('Success', 'Load deleted successfully');
            } else {
              Alert.alert('Error', 'Failed to delete load');
            }
          },
        },
      ]
    );
  };

  const handleEditLoad = (load: Load) => {
    setSelectedLoad(load);
    setNewStatus(load.status);
    setEditModalVisible(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedLoad) return;

    const success = await updateStatus(selectedLoad.id, newStatus);
    if (success) {
      Alert.alert('Success', 'Load status updated successfully');
      setEditModalVisible(false);
      setSelectedLoad(null);
    } else {
      Alert.alert('Error', 'Failed to update load status');
    }
  };

  const getStatusColor = (status: LoadStatus) => {
    switch (status) {
      case 'posted':
        return '#3B82F6';
      case 'matched':
        return '#8B5CF6';
      case 'in_transit':
        return '#F59E0B';
      case 'delivered':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: LoadStatus) => {
    switch (status) {
      case 'posted':
        return 'Posted';
      case 'matched':
        return 'Matched';
      case 'in_transit':
        return 'Active';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (user?.role !== 'admin') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unauthorized Access</Text>
          <Text style={styles.errorText}>
            You do not have permission to access this page.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Admin Loads Management</Text>
        <Text style={styles.headerSubtitle}>
          Manage all loads across the platform
        </Text>
      </View>

      <View style={styles.metricsBar}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{metrics.totalLoads}</Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: '#3B82F6' }]}>
            {metrics.totalPending}
          </Text>
          <Text style={styles.metricLabel}>Pending</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
            {metrics.totalActive}
          </Text>
          <Text style={styles.metricLabel}>Active</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: '#10B981' }]}>
            {metrics.totalDelivered}
          </Text>
          <Text style={styles.metricLabel}>Delivered</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, shipper, driver, or city..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterButtons}
        >
          {(['all', 'pending', 'matched', 'active', 'delivered', 'cancelled'] as AdminLoadFilter[]).map(
            (filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  statusFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => setStatusFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === filter && styles.filterButtonTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        <View style={styles.sortContainer}>
          <Filter size={16} color="#6B7280" />
          <TouchableOpacity
            onPress={() => {
              if (sortBy === 'newest') setSortBy('oldest');
              else if (sortBy === 'oldest') setSortBy('highest');
              else setSortBy('newest');
            }}
          >
            <Text style={styles.sortText}>
              {sortBy === 'newest'
                ? 'Newest First'
                : sortBy === 'oldest'
                ? 'Oldest First'
                : 'Highest Rate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F66F5" />
          <Text style={styles.loadingText}>Loading loads...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Loads</Text>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      ) : sortedLoads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Loads Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'No loads available in the system'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.loadsContainer,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {sortedLoads.map((load) => (
            <View key={load.id} style={styles.loadCard}>
              <View style={styles.loadHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(load.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(load.status) },
                    ]}
                  >
                    {getStatusLabel(load.status)}
                  </Text>
                </View>
                <View style={styles.rateBadge}>
                  <DollarSign size={16} color="#10B981" />
                  <Text style={styles.rateText}>${load.rate.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                  <MapPin size={18} color="#3B82F6" />
                  <View style={styles.routeInfo}>
                    <Text style={styles.cityText}>{load.pickup?.city || 'N/A'}</Text>
                    <Text style={styles.stateText}>{load.pickup?.state || ''}</Text>
                  </View>
                </View>
                <View style={styles.routeArrow}>
                  <View style={styles.arrowLine} />
                  <Truck size={16} color="#6B7280" />
                </View>
                <View style={styles.routePoint}>
                  <MapPin size={18} color="#EF4444" />
                  <View style={styles.routeInfo}>
                    <Text style={styles.cityText}>{load.dropoff?.city || 'N/A'}</Text>
                    <Text style={styles.stateText}>{load.dropoff?.state || ''}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <User size={14} color="#6B7280" />
                  <Text style={styles.detailLabel}>Shipper:</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {load.shipperName || load.shipperId.slice(0, 8)}
                  </Text>
                </View>
                {load.matchedDriverId && (
                  <View style={styles.detailItem}>
                    <Truck size={14} color="#6B7280" />
                    <Text style={styles.detailLabel}>Driver:</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {load.matchedDriverName || load.matchedDriverId.slice(0, 8)}
                    </Text>
                  </View>
                )}
                <View style={styles.detailItem}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.detailLabel}>Created:</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {formatDate(load.createdAt)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Package size={14} color="#6B7280" />
                  <Text style={styles.detailLabel}>Distance:</Text>
                  <Text style={styles.detailValue}>{load.distance} mi</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditLoad(load)}
                  disabled={updateLoading}
                >
                  <Edit3 size={16} color="#3B82F6" />
                  <Text style={styles.editButtonText}>Edit Status</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteLoad(load.id)}
                  disabled={deleteLoading}
                >
                  <Trash2 size={16} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Load Status</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedLoad && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLoadInfo}>
                  {selectedLoad.pickup?.city || 'N/A'} → {selectedLoad.dropoff?.city || 'N/A'}
                </Text>
                <Text style={styles.modalLabel}>Select New Status:</Text>
                <View style={styles.statusOptions}>
                  {(['posted', 'matched', 'in_transit', 'delivered', 'cancelled'] as LoadStatus[]).map(
                    (status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusOption,
                          newStatus === status && styles.statusOptionActive,
                          {
                            borderColor: getStatusColor(status),
                          },
                        ]}
                        onPress={() => setNewStatus(status)}
                      >
                        {newStatus === status && (
                          <Check size={16} color={getStatusColor(status)} />
                        )}
                        <Text
                          style={[
                            styles.statusOptionText,
                            newStatus === status && {
                              color: getStatusColor(status),
                              fontWeight: '600' as const,
                            },
                          ]}
                        >
                          {getStatusLabel(status)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleUpdateStatus}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Update Status</Text>
                )}
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  metricsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButtons: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#2F66F5',
    borderColor: '#2F66F5',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2F66F5',
  },
  scrollView: {
    flex: 1,
  },
  loadsContainer: {
    padding: 20,
    gap: 16,
  },
  loadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rateText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeInfo: {
    flex: 1,
  },
  cityText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
  },
  stateText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  routeArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowLine: {
    width: 24,
    height: 2,
    backgroundColor: '#D1D5DB',
  },
  detailsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600' as const,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalLoadInfo: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 12,
  },
  statusOptions: {
    gap: 10,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#F9FAFB',
  },
  statusOptionActive: {
    backgroundColor: '#FFFFFF',
  },
  statusOptionText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2F66F5',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
