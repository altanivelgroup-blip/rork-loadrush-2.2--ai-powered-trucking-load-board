import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import Colors from '@/constants/colors';
import { Truck, Package, Shield } from 'lucide-react-native';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signUp, loading, error, clearError, adminBypass } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState<string>('driver@loadrush.com');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('driver');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickAccessLoading, setQuickAccessLoading] = useState<'driver' | 'shipper' | null>(null);
  
  const handleLogoLongPress = () => {
    try {
      console.log('🔐 Admin long-press detected — navigating to admin dashboard');
      adminBypass();
      router.replace('/(admin)/dashboard');
    } catch (e) {
      console.error('Admin long-press navigation error', e);
      Alert.alert('Error', 'Unable to open admin dashboard.');
    }
  };

  const handleQuickAccessDriver = async () => {
    if (isSubmitting || quickAccessLoading) {
      console.log('⚠️ Quick Access: Already submitting, ignoring click');
      return;
    }
    
    setIsSubmitting(true);
    setQuickAccessLoading('driver');
    clearError();
    
    try {
      console.log('🚚 Quick Access: Starting driver sign-in...');
      console.log('🚚 Quick Access: Email: driver@loadrush.co');
      console.log('🚚 Quick Access: Password: loadrush123');
      
      const result = await signIn('driver@loadrush.co', 'loadrush123');
      
      console.log('✅ Quick Access: Driver sign-in successful!', result);
      console.log('✅ Quick Access: User role:', result?.role);
      console.log('✅ Quick Access: User ID:', result?.id);
      console.log('✅ Quick Access: Navigation will be handled by _layout.tsx');
      
    } catch (error: any) {
      console.error('🔥 Quick Access Driver error:', error);
      console.error('🔥 Error details:', {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack
      });
      
      let errorMessage = error?.message || 'Failed to sign in as driver';
      
      if (errorMessage.includes('user-not-found') || errorMessage.includes('Invalid email')) {
        errorMessage = 'Driver account (driver@loadrush.co) not found in Firebase.\n\nPlease create this account in Firebase Console first.';
      } else if (errorMessage.includes('wrong-password') || errorMessage.includes('invalid-credential')) {
        errorMessage = 'Invalid password for driver@loadrush.co.\n\nExpected password: loadrush123';
      }
      
      Alert.alert(
        'Quick Access Error', 
        errorMessage,
        [{ text: 'OK' }]
      );
      setIsSubmitting(false);
      setQuickAccessLoading(null);
    }
  };

  const handleQuickAccessShipper = async () => {
    if (isSubmitting || quickAccessLoading) {
      console.log('⚠️ Quick Access: Already submitting, ignoring click');
      return;
    }
    
    setIsSubmitting(true);
    setQuickAccessLoading('shipper');
    clearError();
    
    try {
      console.log('📦 Quick Access: Starting shipper sign-in...');
      console.log('📦 Quick Access: Email: shipper@loadrush.co');
      console.log('📦 Quick Access: Password: loadrush123');
      
      const result = await signIn('shipper@loadrush.co', 'loadrush123');
      
      console.log('✅ Quick Access: Shipper sign-in successful!', result);
      console.log('✅ Quick Access: User role:', result?.role);
      console.log('✅ Quick Access: User ID:', result?.id);
      console.log('✅ Quick Access: Navigation will be handled by _layout.tsx');
      
    } catch (error: any) {
      console.error('🔥 Quick Access Shipper error:', error);
      console.error('🔥 Error details:', {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack
      });
      
      let errorMessage = error?.message || 'Failed to sign in as shipper';
      
      if (errorMessage.includes('user-not-found') || errorMessage.includes('Invalid email')) {
        errorMessage = 'Shipper account (shipper@loadrush.co) not found in Firebase.\n\nPlease create this account in Firebase Console first.';
      } else if (errorMessage.includes('wrong-password') || errorMessage.includes('invalid-credential')) {
        errorMessage = 'Invalid password for shipper@loadrush.co.\n\nExpected password: loadrush123';
      }
      
      Alert.alert(
        'Quick Access Error', 
        errorMessage,
        [{ text: 'OK' }]
      );
      setIsSubmitting(false);
      setQuickAccessLoading(null);
    }
  };

  const handleSubmit = async () => {
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    clearError();
    setIsSubmitting(true);
    try {
      console.log('🔐 Starting authentication...', { email: normalizedEmail, isSignUp });
      if (isSignUp) {
        const result = await signUp(normalizedEmail, password, selectedRole);
        console.log('✅ Sign up successful:', result);
      } else {
        const result = await signIn(normalizedEmail, password);
        console.log('✅ Sign in successful:', result);
      }
    } catch (error: any) {
      console.error('🔥 Firebase Auth error:', error);
      const errorMessage = error?.message || error?.toString() || 'Authentication failed';
      Alert.alert(
        'Authentication Error',
        errorMessage + '\n\nPlease check your credentials and try again.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const roleOptions: { role: UserRole; icon: any; label: string; description: string }[] = [
    {
      role: 'driver',
      icon: Truck,
      label: 'Driver',
      description: 'Find loads and manage routes',
    },
    {
      role: 'shipper',
      icon: Package,
      label: 'Shipper',
      description: 'Post loads and find carriers',
    },
    {
      role: 'admin',
      icon: Shield,
      label: 'Admin',
      description: 'Manage platform and users',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onLongPress={handleLogoLongPress}
          delayLongPress={Platform.OS === 'web' ? 300 : 500}
          android_disableSound
          testID="admin-long-press"
          style={({ pressed }) => [styles.logoPressable, pressed ? styles.logoPressed : null]}
        >
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/gcn87eukb5wumku9s7os3' }}
            style={styles.logo}
          />
        </Pressable>
      </View>


      <View style={styles.formContainer}>
        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>

        {isSignUp && (
          <View style={styles.roleSelector}>
            <Text style={styles.label}>Select Your Role</Text>
            <View style={styles.roleOptions}>
              {roleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedRole === option.role;
                return (
                  <TouchableOpacity
                    key={option.role}
                    style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                    onPress={() => setSelectedRole(option.role)}
                  >
                    <Icon
                      size={32}
                      color={isSelected ? Colors.light.primary : Colors.light.textSecondary}
                    />
                    <Text style={[styles.roleLabel, isSelected && styles.roleLabelSelected]}>
                      {option.label}
                    </Text>
                    <Text style={styles.roleDescription}>{option.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={Colors.light.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={Colors.light.textSecondary}
            secureTextEntry
            textContentType="password"
            autoComplete="password"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          testID="auth-submit"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchButton} onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchButtonText}>
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>

        {!isSignUp && (
          <View style={styles.quickAccessContainer}>
            <Text style={styles.quickAccessTitle}>Quick Access (Testing)</Text>
            <View style={styles.quickAccessButtons}>
              <TouchableOpacity
                style={[
                  styles.quickAccessButton, 
                  styles.quickAccessDriver,
                  (isSubmitting || quickAccessLoading) && styles.quickAccessButtonDisabled
                ]}
                onPress={handleQuickAccessDriver}
                disabled={isSubmitting || quickAccessLoading !== null}
              >
                {quickAccessLoading === 'driver' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Truck size={20} color="#FFFFFF" />
                )}
                <Text style={styles.quickAccessButtonText}>
                  {quickAccessLoading === 'driver' ? 'Signing in...' : 'Driver'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.quickAccessButton, 
                  styles.quickAccessShipper,
                  (isSubmitting || quickAccessLoading) && styles.quickAccessButtonDisabled
                ]}
                onPress={handleQuickAccessShipper}
                disabled={isSubmitting || quickAccessLoading !== null}
              >
                {quickAccessLoading === 'shipper' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Package size={20} color="#FFFFFF" />
                )}
                <Text style={styles.quickAccessButtonText}>
                  {quickAccessLoading === 'shipper' ? 'Signing in...' : 'Shipper'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  contentContainer: { padding: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoPressable: {
    borderRadius: 20,
  },
  logoPressed: {
    opacity: 0.85,
  },
  logo: {
    width: 170,
    height: 170,
    alignSelf: 'center',
    resizeMode: 'contain' as const,
    opacity: 0.98,
  },
  formContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 24,
  },
  roleSelector: { marginBottom: 24 },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  roleOptions: { flexDirection: 'row', gap: 12 },
  roleCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  roleCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: '#EEF2FF',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 8,
  },
  roleLabelSelected: { color: Colors.light.primary },
  roleDescription: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  inputContainer: { marginBottom: 20 },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  switchButton: { marginTop: 16, alignItems: 'center' },
  switchButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  quickAccessContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  quickAccessTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
  },
  quickAccessButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAccessButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  quickAccessDriver: {
    backgroundColor: '#10B981',
  },
  quickAccessShipper: {
    backgroundColor: '#F59E0B',
  },
  quickAccessButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  quickAccessButtonDisabled: {
    opacity: 0.6,
  },
});
