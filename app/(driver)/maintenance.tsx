import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { 
  Truck, 
  Wrench, 
  Search, 
  Plus,
  AlertCircle,
  Clock,
  Calendar,
  DollarSign,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  Trash2
} from 'lucide-react-native';

type VehicleStatus = 'Active' | 'Maintenance' | 'Inactive';
type MaintenanceStatus = 'Overdue' | 'Due Soon' | 'Scheduled' | 'Completed';
type MaintenancePriority = 'High' | 'Medium' | 'Low';
type MaintenanceCategory = 'Engine' | 'Brakes' | 'Tires' | 'Electrical' | 'Inspection' | 'Oil Change' | 'Transmission' | 'Suspension';

interface Vehicle {
  id: string;
  name: string;
  type: 'Truck' | 'Trailer';
  make: string;
  model: string;
  year: number;
  vin: string;
  status: VehicleStatus;
  mileage?: number;
}

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  serviceType: string;
  category: MaintenanceCategory;
  dueDate: string;
  dueMileage?: number;
  lastServiceDate?: string;
  lastServiceMileage?: number;
  cost: number;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  notes?: string;
}

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    name: 'Truck #1',
    type: 'Truck',
    make: 'Freightliner',
    model: 'Cascadia',
    year: 2021,
    vin: '1FUJGHDV8MLBR1234',
    status: 'Active',
    mileage: 145230
  },
  {
    id: 'v2',
    name: 'Truck #2',
    type: 'Truck',
    make: 'Kenworth',
    model: 'T680',
    year: 2020,
    vin: '1XKYDP9X0LJ123456',
    status: 'Active',
    mileage: 198450
  },
  {
    id: 'v3',
    name: 'Trailer #1',
    type: 'Trailer',
    make: 'Great Dane',
    model: 'Everest',
    year: 2019,
    vin: '1GRAA06289S123456',
    status: 'Active'
  },
  {
    id: 'v4',
    name: 'Trailer #2',
    type: 'Trailer',
    make: 'Utility',
    model: '3000R',
    year: 2022,
    vin: '1UYVS25338M123456',
    status: 'Maintenance'
  }
];

const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: 'm1',
    vehicleId: 'v1',
    vehicleName: 'Truck #1',
    serviceType: 'Oil Change',
    category: 'Oil Change',
    dueDate: '2025-09-15',
    dueMileage: 150000,
    lastServiceDate: '2025-06-15',
    lastServiceMileage: 140000,
    cost: 250,
    priority: 'High',
    status: 'Overdue'
  },
  {
    id: 'm2',
    vehicleId: 'v1',
    vehicleName: 'Truck #1',
    serviceType: 'Brake Inspection',
    category: 'Brakes',
    dueDate: '2025-10-10',
    dueMileage: 155000,
    lastServiceDate: '2025-04-10',
    lastServiceMileage: 135000,
    cost: 450,
    priority: 'High',
    status: 'Due Soon'
  },
  {
    id: 'm3',
    vehicleId: 'v2',
    vehicleName: 'Truck #2',
    serviceType: 'Tire Rotation',
    category: 'Tires',
    dueDate: '2025-10-20',
    dueMileage: 205000,
    lastServiceDate: '2025-07-20',
    lastServiceMileage: 195000,
    cost: 180,
    priority: 'Medium',
    status: 'Scheduled'
  },
  {
    id: 'm4',
    vehicleId: 'v2',
    vehicleName: 'Truck #2',
    serviceType: 'DOT Inspection',
    category: 'Inspection',
    dueDate: '2025-11-01',
    cost: 350,
    priority: 'High',
    status: 'Scheduled'
  },
  {
    id: 'm5',
    vehicleId: 'v3',
    vehicleName: 'Trailer #1',
    serviceType: 'Brake Service',
    category: 'Brakes',
    dueDate: '2025-09-25',
    lastServiceDate: '2025-03-25',
    cost: 600,
    priority: 'High',
    status: 'Overdue'
  },
  {
    id: 'm6',
    vehicleId: 'v4',
    vehicleName: 'Trailer #2',
    serviceType: 'Electrical System Check',
    category: 'Electrical',
    dueDate: '2025-10-05',
    lastServiceDate: '2025-08-05',
    cost: 200,
    priority: 'Medium',
    status: 'Due Soon'
  },
  {
    id: 'm7',
    vehicleId: 'v1',
    vehicleName: 'Truck #1',
    serviceType: 'Transmission Service',
    category: 'Transmission',
    dueDate: '2025-12-15',
    dueMileage: 160000,
    lastServiceDate: '2024-12-15',
    lastServiceMileage: 120000,
    cost: 850,
    priority: 'Medium',
    status: 'Scheduled'
  },
  {
    id: 'm8',
    vehicleId: 'v2',
    vehicleName: 'Truck #2',
    serviceType: 'Engine Diagnostics',
    category: 'Engine',
    dueDate: '2025-08-30',
    cost: 300,
    priority: 'High',
    status: 'Completed'
  }
];

export default function MaintenanceScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(INITIAL_MAINTENANCE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus | 'All'>('All');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('All');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | null>(null);

  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({
    name: '',
    type: 'Truck',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    status: 'Active',
    mileage: 0
  });

  const [maintenanceForm, setMaintenanceForm] = useState<Partial<MaintenanceRecord>>({
    vehicleId: '',
    vehicleName: '',
    serviceType: '',
    category: 'Oil Change',
    dueDate: '',
    dueMileage: undefined,
    lastServiceDate: '',
    lastServiceMileage: undefined,
    cost: 0,
    priority: 'Medium',
    status: 'Scheduled',
    notes: ''
  });

  const stats = useMemo(() => {
    const overdue = maintenanceRecords.filter(m => m.status === 'Overdue').length;
    const dueSoon = maintenanceRecords.filter(m => m.status === 'Due Soon').length;
    const scheduled = maintenanceRecords.filter(m => m.status === 'Scheduled').length;
    const totalCost = maintenanceRecords.reduce((sum, m) => sum + m.cost, 0);
    return { overdue, dueSoon, scheduled, totalCost };
  }, [maintenanceRecords]);

  const filteredMaintenance = useMemo(() => {
    return maintenanceRecords.filter(record => {
      const matchesSearch = record.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.vehicleName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === 'All' || record.status === selectedStatus;
      const matchesVehicle = selectedVehicle === 'All' || record.vehicleId === selectedVehicle;
      return matchesSearch && matchesStatus && matchesVehicle;
    });
  }, [searchQuery, selectedStatus, selectedVehicle, maintenanceRecords]);

  const openVehicleModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setVehicleForm(vehicle);
    } else {
      setEditingVehicle(null);
      setVehicleForm({
        name: '',
        type: 'Truck',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
        status: 'Active',
        mileage: 0
      });
    }
    setShowVehicleModal(true);
  };

  const openMaintenanceModal = (maintenance?: MaintenanceRecord) => {
    if (maintenance) {
      setEditingMaintenance(maintenance);
      setMaintenanceForm(maintenance);
    } else {
      setEditingMaintenance(null);
      setMaintenanceForm({
        vehicleId: vehicles[0]?.id || '',
        vehicleName: vehicles[0]?.name || '',
        serviceType: '',
        category: 'Oil Change',
        dueDate: '',
        dueMileage: undefined,
        lastServiceDate: '',
        lastServiceMileage: undefined,
        cost: 0,
        priority: 'Medium',
        status: 'Scheduled',
        notes: ''
      });
    }
    setShowMaintenanceModal(true);
  };

  const saveVehicle = () => {
    if (!vehicleForm.name || !vehicleForm.make || !vehicleForm.model || !vehicleForm.vin) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (editingVehicle) {
      setVehicles(vehicles.map(v => v.id === editingVehicle.id ? { ...vehicleForm, id: v.id } as Vehicle : v));
    } else {
      const newVehicle: Vehicle = {
        ...vehicleForm,
        id: `v${Date.now()}`
      } as Vehicle;
      setVehicles([...vehicles, newVehicle]);
    }
    setShowVehicleModal(false);
  };

  const deleteVehicle = (vehicleId: string) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle? All associated maintenance records will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setVehicles(vehicles.filter(v => v.id !== vehicleId));
            setMaintenanceRecords(maintenanceRecords.filter(m => m.vehicleId !== vehicleId));
          }
        }
      ]
    );
  };

  const saveMaintenance = () => {
    if (!maintenanceForm.vehicleId || !maintenanceForm.serviceType || !maintenanceForm.dueDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const vehicle = vehicles.find(v => v.id === maintenanceForm.vehicleId);
    if (!vehicle) {
      Alert.alert('Error', 'Selected vehicle not found');
      return;
    }

    if (editingMaintenance) {
      setMaintenanceRecords(maintenanceRecords.map(m => 
        m.id === editingMaintenance.id 
          ? { ...maintenanceForm, id: m.id, vehicleName: vehicle.name } as MaintenanceRecord 
          : m
      ));
    } else {
      const newMaintenance: MaintenanceRecord = {
        ...maintenanceForm,
        id: `m${Date.now()}`,
        vehicleName: vehicle.name
      } as MaintenanceRecord;
      setMaintenanceRecords([...maintenanceRecords, newMaintenance]);
    }
    setShowMaintenanceModal(false);
  };

  const deleteMaintenance = (maintenanceId: string) => {
    Alert.alert(
      'Delete Maintenance Record',
      'Are you sure you want to delete this maintenance record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMaintenanceRecords(maintenanceRecords.filter(m => m.id !== maintenanceId));
          }
        }
      ]
    );
  };

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case 'Overdue': return '#EF4444';
      case 'Due Soon': return '#F59E0B';
      case 'Scheduled': return '#3B82F6';
      case 'Completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: MaintenancePriority) => {
    switch (priority) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category: MaintenanceCategory) => {
    switch (category) {
      case 'Engine': return <Wrench size={16} color="#6B7280" />;
      case 'Brakes': return <AlertCircle size={16} color="#6B7280" />;
      case 'Tires': return <Truck size={16} color="#6B7280" />;
      default: return <Wrench size={16} color="#6B7280" />;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Equipment & Maintenance',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1F2937',
          headerShadowVisible: false
        }} 
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <AlertTriangle size={20} color="#EF4444" />
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.overdue}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Clock size={20} color="#F59E0B" />
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.dueSoon}</Text>
            <Text style={styles.statLabel}>Due Soon</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
            <Calendar size={20} color="#3B82F6" />
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.scheduled}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <DollarSign size={20} color="#10B981" />
            <Text style={[styles.statValue, { color: '#10B981' }]}>${stats.totalCost.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Cost</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search maintenance..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, selectedStatus === 'All' && styles.filterChipActive]}
              onPress={() => setSelectedStatus('All')}
            >
              <Text style={[styles.filterChipText, selectedStatus === 'All' && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, selectedStatus === 'Overdue' && styles.filterChipActive]}
              onPress={() => setSelectedStatus('Overdue')}
            >
              <Text style={[styles.filterChipText, selectedStatus === 'Overdue' && styles.filterChipTextActive]}>Overdue</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, selectedStatus === 'Due Soon' && styles.filterChipActive]}
              onPress={() => setSelectedStatus('Due Soon')}
            >
              <Text style={[styles.filterChipText, selectedStatus === 'Due Soon' && styles.filterChipTextActive]}>Due Soon</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, selectedStatus === 'Scheduled' && styles.filterChipActive]}
              onPress={() => setSelectedStatus('Scheduled')}
            >
              <Text style={[styles.filterChipText, selectedStatus === 'Scheduled' && styles.filterChipTextActive]}>Scheduled</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, selectedStatus === 'Completed' && styles.filterChipActive]}
              onPress={() => setSelectedStatus('Completed')}
            >
              <Text style={[styles.filterChipText, selectedStatus === 'Completed' && styles.filterChipTextActive]}>Completed</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.vehiclesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vehicles</Text>
            <TouchableOpacity onPress={() => openVehicleModal()}>
              <Plus size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehiclesScroll}>
            <TouchableOpacity 
              style={[styles.vehicleCard, selectedVehicle === 'All' && styles.vehicleCardActive]}
              onPress={() => setSelectedVehicle('All')}
            >
              <Truck size={24} color={selectedVehicle === 'All' ? '#3B82F6' : '#6B7280'} />
              <Text style={[styles.vehicleName, selectedVehicle === 'All' && styles.vehicleNameActive]}>All Vehicles</Text>
            </TouchableOpacity>
            {vehicles.map(vehicle => (
              <TouchableOpacity 
                key={vehicle.id}
                style={[styles.vehicleCard, selectedVehicle === vehicle.id && styles.vehicleCardActive]}
                onPress={() => setSelectedVehicle(vehicle.id)}
                onLongPress={() => openVehicleModal(vehicle)}
              >
                <Truck size={24} color={selectedVehicle === vehicle.id ? '#3B82F6' : '#6B7280'} />
                <Text style={[styles.vehicleName, selectedVehicle === vehicle.id && styles.vehicleNameActive]}>{vehicle.name}</Text>
                <Text style={styles.vehicleDetails}>{vehicle.make} {vehicle.model}</Text>
                {vehicle.mileage && (
                  <Text style={styles.vehicleMileage}>{vehicle.mileage.toLocaleString()} mi</Text>
                )}
                <View style={[styles.vehicleStatusBadge, { backgroundColor: vehicle.status === 'Active' ? '#D1FAE5' : '#FEE2E2' }]}>
                  <Text style={[styles.vehicleStatusText, { color: vehicle.status === 'Active' ? '#10B981' : '#EF4444' }]}>
                    {vehicle.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.maintenanceSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Maintenance Schedule</Text>
            <Text style={styles.sectionCount}>{filteredMaintenance.length} items</Text>
          </View>

          {filteredMaintenance.map(record => (
            <TouchableOpacity 
              key={record.id} 
              style={styles.maintenanceCard}
              onPress={() => openMaintenanceModal(record)}
            >
              <View style={styles.maintenanceHeader}>
                <View style={styles.maintenanceHeaderLeft}>
                  {getCategoryIcon(record.category)}
                  <Text style={styles.maintenanceTitle}>{record.serviceType}</Text>
                </View>
                <View style={styles.maintenanceActions}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(record.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(record.priority) }]}>
                      {record.priority}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteMaintenance(record.id)} style={styles.deleteButton}>
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.maintenanceBody}>
                <View style={styles.maintenanceRow}>
                  <Truck size={14} color="#6B7280" />
                  <Text style={styles.maintenanceText}>{record.vehicleName}</Text>
                </View>
                <View style={styles.maintenanceRow}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.maintenanceText}>Due: {record.dueDate}</Text>
                </View>
                {record.dueMileage && (
                  <View style={styles.maintenanceRow}>
                    <AlertCircle size={14} color="#6B7280" />
                    <Text style={styles.maintenanceText}>Due at: {record.dueMileage.toLocaleString()} mi</Text>
                  </View>
                )}
                {record.lastServiceDate && (
                  <View style={styles.maintenanceRow}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.maintenanceText}>Last: {record.lastServiceDate}</Text>
                  </View>
                )}
                <View style={styles.maintenanceRow}>
                  <DollarSign size={14} color="#6B7280" />
                  <Text style={styles.maintenanceText}>Cost: ${record.cost.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.maintenanceFooter}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) + '20' }]}>
                  {record.status === 'Completed' ? (
                    <CheckCircle2 size={14} color={getStatusColor(record.status)} />
                  ) : (
                    <AlertCircle size={14} color={getStatusColor(record.status)} />
                  )}
                  <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                    {record.status}
                  </Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => openMaintenanceModal()}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showVehicleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Vehicle Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={vehicleForm.name}
                  onChangeText={(text) => setVehicleForm({ ...vehicleForm, name: text })}
                  placeholder="e.g., Truck #1"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type *</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[styles.typeButton, vehicleForm.type === 'Truck' && styles.typeButtonActive]}
                    onPress={() => setVehicleForm({ ...vehicleForm, type: 'Truck' })}
                  >
                    <Text style={[styles.typeButtonText, vehicleForm.type === 'Truck' && styles.typeButtonTextActive]}>Truck</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, vehicleForm.type === 'Trailer' && styles.typeButtonActive]}
                    onPress={() => setVehicleForm({ ...vehicleForm, type: 'Trailer' })}
                  >
                    <Text style={[styles.typeButtonText, vehicleForm.type === 'Trailer' && styles.typeButtonTextActive]}>Trailer</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Make *</Text>
                <TextInput
                  style={styles.formInput}
                  value={vehicleForm.make}
                  onChangeText={(text) => setVehicleForm({ ...vehicleForm, make: text })}
                  placeholder="e.g., Freightliner"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Model *</Text>
                <TextInput
                  style={styles.formInput}
                  value={vehicleForm.model}
                  onChangeText={(text) => setVehicleForm({ ...vehicleForm, model: text })}
                  placeholder="e.g., Cascadia"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Year *</Text>
                <TextInput
                  style={styles.formInput}
                  value={vehicleForm.year?.toString()}
                  onChangeText={(text) => setVehicleForm({ ...vehicleForm, year: parseInt(text) || new Date().getFullYear() })}
                  placeholder="2024"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>VIN *</Text>
                <TextInput
                  style={styles.formInput}
                  value={vehicleForm.vin}
                  onChangeText={(text) => setVehicleForm({ ...vehicleForm, vin: text })}
                  placeholder="Vehicle Identification Number"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Mileage</Text>
                <TextInput
                  style={styles.formInput}
                  value={vehicleForm.mileage?.toString()}
                  onChangeText={(text) => setVehicleForm({ ...vehicleForm, mileage: parseInt(text) || 0 })}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status *</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[styles.statusButton, vehicleForm.status === 'Active' && styles.statusButtonActive]}
                    onPress={() => setVehicleForm({ ...vehicleForm, status: 'Active' })}
                  >
                    <Text style={[styles.statusButtonText, vehicleForm.status === 'Active' && styles.statusButtonTextActive]}>Active</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, vehicleForm.status === 'Maintenance' && styles.statusButtonActive]}
                    onPress={() => setVehicleForm({ ...vehicleForm, status: 'Maintenance' })}
                  >
                    <Text style={[styles.statusButtonText, vehicleForm.status === 'Maintenance' && styles.statusButtonTextActive]}>Maintenance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, vehicleForm.status === 'Inactive' && styles.statusButtonActive]}
                    onPress={() => setVehicleForm({ ...vehicleForm, status: 'Inactive' })}
                  >
                    <Text style={[styles.statusButtonText, vehicleForm.status === 'Inactive' && styles.statusButtonTextActive]}>Inactive</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {editingVehicle && (
                <TouchableOpacity 
                  style={styles.deleteVehicleButton}
                  onPress={() => {
                    setShowVehicleModal(false);
                    deleteVehicle(editingVehicle.id);
                  }}
                >
                  <Trash2 size={18} color="#fff" />
                  <Text style={styles.deleteVehicleButtonText}>Delete Vehicle</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowVehicleModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveVehicle}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMaintenanceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMaintenanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingMaintenance ? 'Edit Maintenance' : 'Add Maintenance'}</Text>
              <TouchableOpacity onPress={() => setShowMaintenanceModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Vehicle *</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {vehicles.map(vehicle => (
                      <TouchableOpacity
                        key={vehicle.id}
                        style={[
                          styles.vehiclePickerItem,
                          maintenanceForm.vehicleId === vehicle.id && styles.vehiclePickerItemActive
                        ]}
                        onPress={() => setMaintenanceForm({ ...maintenanceForm, vehicleId: vehicle.id, vehicleName: vehicle.name })}
                      >
                        <Text style={[
                          styles.vehiclePickerText,
                          maintenanceForm.vehicleId === vehicle.id && styles.vehiclePickerTextActive
                        ]}>
                          {vehicle.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Service Type *</Text>
                <TextInput
                  style={styles.formInput}
                  value={maintenanceForm.serviceType}
                  onChangeText={(text) => setMaintenanceForm({ ...maintenanceForm, serviceType: text })}
                  placeholder="e.g., Oil Change"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {(['Oil Change', 'Brakes', 'Tires', 'Engine', 'Transmission', 'Electrical', 'Inspection', 'Suspension'] as MaintenanceCategory[]).map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        maintenanceForm.category === cat && styles.categoryChipActive
                      ]}
                      onPress={() => setMaintenanceForm({ ...maintenanceForm, category: cat })}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        maintenanceForm.category === cat && styles.categoryChipTextActive
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Due Date * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.formInput}
                  value={maintenanceForm.dueDate}
                  onChangeText={(text) => setMaintenanceForm({ ...maintenanceForm, dueDate: text })}
                  placeholder="2025-12-31"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Due Mileage</Text>
                <TextInput
                  style={styles.formInput}
                  value={maintenanceForm.dueMileage?.toString()}
                  onChangeText={(text) => setMaintenanceForm({ ...maintenanceForm, dueMileage: text ? parseInt(text) : undefined })}
                  placeholder="150000"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Last Service Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.formInput}
                  value={maintenanceForm.lastServiceDate}
                  onChangeText={(text) => setMaintenanceForm({ ...maintenanceForm, lastServiceDate: text })}
                  placeholder="2025-06-15"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Last Service Mileage</Text>
                <TextInput
                  style={styles.formInput}
                  value={maintenanceForm.lastServiceMileage?.toString()}
                  onChangeText={(text) => setMaintenanceForm({ ...maintenanceForm, lastServiceMileage: text ? parseInt(text) : undefined })}
                  placeholder="140000"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Cost *</Text>
                <TextInput
                  style={styles.formInput}
                  value={maintenanceForm.cost?.toString()}
                  onChangeText={(text) => setMaintenanceForm({ ...maintenanceForm, cost: parseInt(text) || 0 })}
                  placeholder="250"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority *</Text>
                <View style={styles.priorityButtons}>
                  <TouchableOpacity
                    style={[styles.priorityButton, maintenanceForm.priority === 'Low' && styles.priorityButtonLow]}
                    onPress={() => setMaintenanceForm({ ...maintenanceForm, priority: 'Low' })}
                  >
                    <Text style={[styles.priorityButtonText, maintenanceForm.priority === 'Low' && styles.priorityButtonTextActive]}>Low</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.priorityButton, maintenanceForm.priority === 'Medium' && styles.priorityButtonMedium]}
                    onPress={() => setMaintenanceForm({ ...maintenanceForm, priority: 'Medium' })}
                  >
                    <Text style={[styles.priorityButtonText, maintenanceForm.priority === 'Medium' && styles.priorityButtonTextActive]}>Medium</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.priorityButton, maintenanceForm.priority === 'High' && styles.priorityButtonHigh]}
                    onPress={() => setMaintenanceForm({ ...maintenanceForm, priority: 'High' })}
                  >
                    <Text style={[styles.priorityButtonText, maintenanceForm.priority === 'High' && styles.priorityButtonTextActive]}>High</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status *</Text>
                <View style={styles.maintenanceStatusButtons}>
                  {(['Scheduled', 'Due Soon', 'Overdue', 'Completed'] as MaintenanceStatus[]).map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.maintenanceStatusButton,
                        maintenanceForm.status === status && styles.maintenanceStatusButtonActive
                      ]}
                      onPress={() => setMaintenanceForm({ ...maintenanceForm, status })}
                    >
                      <Text style={[
                        styles.maintenanceStatusButtonText,
                        maintenanceForm.status === status && styles.maintenanceStatusButtonTextActive
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={maintenanceForm.notes}
                  onChangeText={(text) => setMaintenanceForm({ ...maintenanceForm, notes: text })}
                  placeholder="Additional notes..."
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowMaintenanceModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveMaintenance}>
                <Text style={styles.saveButtonText}>Save</Text>
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
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  vehiclesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600' as const,
  },
  vehiclesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  vehicleCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  vehicleCardActive: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginTop: 4,
  },
  vehicleNameActive: {
    color: '#3B82F6',
  },
  vehicleDetails: {
    fontSize: 11,
    color: '#6B7280',
  },
  vehicleMileage: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600' as const,
  },
  vehicleStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  vehicleStatusText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  maintenanceSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  maintenanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  maintenanceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  maintenanceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  maintenanceTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1F2937',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  deleteButton: {
    padding: 4,
  },
  maintenanceBody: {
    gap: 8,
    marginBottom: 12,
  },
  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  maintenanceText: {
    fontSize: 13,
    color: '#6B7280',
  },
  maintenanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  deleteVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  deleteVehicleButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  pickerContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 8,
  },
  vehiclePickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vehiclePickerItemActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  vehiclePickerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  vehiclePickerTextActive: {
    color: '#fff',
  },
  categoryScroll: {
    maxHeight: 50,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  priorityButtonLow: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  priorityButtonMedium: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  priorityButtonHigh: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  priorityButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  maintenanceStatusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  maintenanceStatusButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  maintenanceStatusButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  maintenanceStatusButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  maintenanceStatusButtonTextActive: {
    color: '#fff',
  },
});
