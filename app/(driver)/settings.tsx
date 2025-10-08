import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Stack, useRouter } from 'expo-router';
import { 
  ChevronLeft,
  Bell,
  Mail,
  MessageSquare,
  Moon,
  Volume2,
  MapPin,
  Info,
  Shield,
  FileText,
  BookOpen,
  Trash2,
  RefreshCw,
  WifiOff,
  Download,
  Upload,
  CreditCard,
  HelpCircle,
  FileCheck,
  Phone,
  Eye,
  RotateCcw
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const handleExportData = async () => {
    try {
      console.log('Starting data export...');
      
      const driverData = {
        exportDate: new Date().toISOString(),
        profile: {
          name: 'John Doe',
          email: 'driver@example.com',
          phone: '+1 (555) 123-4567',
          licenseNumber: 'DL123456789',
        },
        loads: [
          { id: '1', pickup: 'Los Angeles, CA', delivery: 'Phoenix, AZ', date: '2024-01-15', amount: 2500 },
          { id: '2', pickup: 'Phoenix, AZ', delivery: 'Dallas, TX', date: '2024-01-18', amount: 3200 },
        ],
        earnings: {
          totalEarnings: 45000,
          currentMonth: 5700,
          lastMonth: 4800,
        },
        expenses: [
          { date: '2024-01-10', category: 'Fuel', amount: 450 },
          { date: '2024-01-15', category: 'Maintenance', amount: 320 },
        ],
        vehicles: [
          { type: 'Truck', make: 'Ram', model: '3500 Dually', year: 2020, mileage: 125000 },
        ],
      };

      const jsonData = JSON.stringify(driverData, null, 2);
      const fileName = `driver_data_${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Your data has been exported successfully!');
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonData);
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Success', `Data exported to: ${fileUri}`);
        }
      }
      
      console.log('Data export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const handleImportData = async () => {
    try {
      console.log('Starting data import...');
      
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event: any) => {
              try {
                const importedData = JSON.parse(event.target.result);
                console.log('Imported data:', importedData);
                Alert.alert(
                  'Success',
                  'Your data has been imported successfully!\n\nImported:\n' +
                  `- Profile data\n` +
                  `- ${importedData.loads?.length || 0} loads\n` +
                  `- Earnings history\n` +
                  `- ${importedData.expenses?.length || 0} expenses\n` +
                  `- ${importedData.vehicles?.length || 0} vehicles`
                );
              } catch (error) {
                console.error('Parse error:', error);
                Alert.alert('Error', 'Invalid file format. Please select a valid JSON file.');
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          console.log('Import cancelled');
          return;
        }

        const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const importedData = JSON.parse(fileContent);
        
        console.log('Imported data:', importedData);
        Alert.alert(
          'Success',
          'Your data has been imported successfully!\n\nImported:\n' +
          `- Profile data\n` +
          `- ${importedData.loads?.length || 0} loads\n` +
          `- Earnings history\n` +
          `- ${importedData.expenses?.length || 0} expenses\n` +
          `- ${importedData.vehicles?.length || 0} vehicles`
        );
      }
      
      console.log('Data import completed successfully');
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import data. Please ensure the file is valid.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Settings',
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
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <Bell size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Push Notifications</Text>
                  <Text style={styles.settingSubtitle}>Receive notifications on your device</Text>
                </View>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <Mail size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Email Notifications</Text>
                  <Text style={styles.settingSubtitle}>Receive notifications via email</Text>
                </View>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <MessageSquare size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>SMS Notifications</Text>
                  <Text style={styles.settingSubtitle}>Receive notifications via text message</Text>
                </View>
              </View>
              <Switch
                value={smsNotifications}
                onValueChange={setSmsNotifications}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Appearance & Sound Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance & Sound</Text>
          
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#E0E7FF' }]}>
                  <Moon size={20} color="#6366F1" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Dark Mode</Text>
                  <Text style={styles.settingSubtitle}>Use dark theme throughout the app</Text>
                </View>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <Volume2 size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Sound Effects</Text>
                  <Text style={styles.settingSubtitle}>Play sounds for app interactions</Text>
                </View>
              </View>
              <Switch
                value={soundEffects}
                onValueChange={setSoundEffects}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Privacy & Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Location</Text>
          
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <MapPin size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Location Services</Text>
                  <Text style={styles.settingSubtitle}>Allow app to access your location</Text>
                </View>
              </View>
              <Switch
                value={locationServices}
                onValueChange={setLocationServices}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.settingItemButton}
              onPress={() => router.push('/(driver)/how-we-use-data')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <Info size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>How We Use Your Data</Text>
                  <Text style={styles.settingSubtitle}>Plain-language explanations for permissions</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.settingItemButton}
              onPress={() => router.push('/(driver)/privacy')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#E0E7FF' }]}>
                  <Shield size={20} color="#6366F1" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Privacy & Security</Text>
                  <Text style={styles.settingSubtitle}>Manage your privacy preferences</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.settingItemButton}
              onPress={() => router.push('/(driver)/privacy')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <FileText size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Privacy Policy</Text>
                  <Text style={styles.settingSubtitle}>How we collect and use your data</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.settingItemButton}
              onPress={() => router.push('/(driver)/terms-of-service')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <BookOpen size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Terms of Service</Text>
                  <Text style={styles.settingSubtitle}>Your rights and obligations</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItemButton}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <Trash2 size={20} color="#EF4444" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: '#EF4444' }]}>Delete Account</Text>
                  <Text style={styles.settingSubtitle}>Permanently delete your account</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <RefreshCw size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Auto Sync</Text>
                  <Text style={styles.settingSubtitle}>Automatically sync data when connected</Text>
                </View>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#E0E7FF' }]}>
                  <WifiOff size={20} color="#6366F1" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Offline Mode</Text>
                  <Text style={styles.settingSubtitle}>Enable offline functionality</Text>
                </View>
              </View>
              <Switch
                value={offlineMode}
                onValueChange={setOfflineMode}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItemButton}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <Trash2 size={20} color="#EF4444" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Clear Cache</Text>
                  <Text style={styles.settingSubtitle}>Free up storage space</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.settingItemButton}
              onPress={handleExportData}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <Download size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Export Data</Text>
                  <Text style={styles.settingSubtitle}>Download your data</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.settingItemButton}
              onPress={handleImportData}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <Upload size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Import Data</Text>
                  <Text style={styles.settingSubtitle}>Upload and restore your data</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Billing & Payments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing & Payments</Text>
          
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItemButton}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <CreditCard size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Payment Methods</Text>
                  <Text style={styles.settingSubtitle}>Manage cards, bank accounts, and services</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingItemButton}
              onPress={() => router.push('/(driver)/help-support')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <HelpCircle size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Help & Support</Text>
                  <Text style={styles.settingSubtitle}>FAQs, docs, and contact options</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItemButton}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <FileCheck size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Logs</Text>
                  <Text style={styles.settingSubtitle}>Inspect, export, and clear logs</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItemButton}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <Phone size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Contact Support</Text>
                  <Text style={styles.settingSubtitle}>Get direct help from our team</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItemButton}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <Eye size={20} color="#3B82F6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Show Onboarding</Text>
                  <Text style={styles.settingSubtitle}>Open the in-app screenshot screen</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Advanced Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItemButton}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <RotateCcw size={20} color="#EF4444" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: '#EF4444' }]}>Reset Settings</Text>
                  <Text style={styles.settingSubtitle}>Reset all settings to default</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerText}>Changes are saved automatically</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    padding: 8,
    marginLeft: 4,
  },

  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 68,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});
