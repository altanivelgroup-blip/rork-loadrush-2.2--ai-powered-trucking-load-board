import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
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
  Wifi,
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
  const insets = useSafeAreaInsets();
  
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the cache? This will free up storage space.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Your data will be downloaded to your device.');
  };

  const handleImportData = () => {
    Alert.alert('Import Data', 'Select a file to upload and restore your data.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deletion', 'Please contact support to complete account deletion.');
          }
        }
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            setPushNotifications(true);
            setEmailNotifications(true);
            setSmsNotifications(false);
            setDarkMode(false);
            setSoundEffects(true);
            setLocationServices(true);
            setAutoSync(true);
            setOfflineMode(false);
            Alert.alert('Success', 'Settings reset to default');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Bell size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive notifications on your device</Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Mail size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>Receive notifications via email</Text>
              </View>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <MessageSquare size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>SMS Notifications</Text>
                <Text style={styles.settingDescription}>Receive notifications via text message</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance & Sound</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E9D5FF' }]}>
                <Moon size={20} color="#9333EA" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Use dark theme throughout the app</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Volume2 size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Sound Effects</Text>
                <Text style={styles.settingDescription}>Play sounds for app interactions</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Location</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <MapPin size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Location Services</Text>
                <Text style={styles.settingDescription}>Allow app to access your location</Text>
              </View>
            </View>
            <Switch
              value={locationServices}
              onValueChange={setLocationServices}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('How We Use Your Data', 'Plain-language explanations for permissions and data usage.')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Info size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>How We Use Your Data</Text>
                <Text style={styles.settingDescription}>Plain-language explanations for permissions</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('Privacy & Security', 'Manage your privacy preferences and security settings.')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E9D5FF' }]}>
                <Shield size={20} color="#9333EA" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Privacy & Security</Text>
                <Text style={styles.settingDescription}>Manage your privacy preferences</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('Privacy Policy', 'View our privacy policy and how we collect and use your data.')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <FileText size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
                <Text style={styles.settingDescription}>How we collect and use your data</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('Terms of Service', 'View our terms of service and user agreement.')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <BookOpen size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Terms of Service</Text>
                <Text style={styles.settingDescription}>Your rights and obligations</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleDeleteAccount}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Trash2 size={20} color="#EF4444" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Delete Account</Text>
                <Text style={styles.settingDescription}>Permanently delete your account</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <RefreshCw size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Auto Sync</Text>
                <Text style={styles.settingDescription}>Automatically sync data when connected</Text>
              </View>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E9D5FF' }]}>
                <Wifi size={20} color="#9333EA" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Offline Mode</Text>
                <Text style={styles.settingDescription}>Enable offline functionality</Text>
              </View>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleClearCache}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Trash2 size={20} color="#EF4444" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Clear Cache</Text>
                <Text style={styles.settingDescription}>Free up storage space</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleExportData}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Download size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Export Data</Text>
                <Text style={styles.settingDescription}>Download your data</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleImportData}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Upload size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Import Data</Text>
                <Text style={styles.settingDescription}>Upload and restore your data</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing & Payments</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('Payment Methods', 'Manage cards, bank accounts, and services')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <CreditCard size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Payment Methods</Text>
                <Text style={styles.settingDescription}>Manage cards, bank accounts, and services</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('Help & Support', 'FAQs, docs, and contact options')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <HelpCircle size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Help & Support</Text>
                <Text style={styles.settingDescription}>FAQs, docs, and contact options</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('Logs', 'Inspect, export, and clear logs')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <FileCheck size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Logs</Text>
                <Text style={styles.settingDescription}>Inspect, export, and clear logs</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('Contact Support', 'Get direct help from our team')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Phone size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Contact Support</Text>
                <Text style={styles.settingDescription}>Get direct help from our team</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => Alert.alert('Show Onboarding', 'Open the in-app screenshot screen')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Eye size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Show Onboarding</Text>
                <Text style={styles.settingDescription}>Open the in-app screenshot screen</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleResetSettings}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                <RotateCcw size={20} color="#EF4444" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Reset Settings</Text>
                <Text style={styles.settingDescription}>Reset all settings to default</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Changes are saved automatically</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
});
