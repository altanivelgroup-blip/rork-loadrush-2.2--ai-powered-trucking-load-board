import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import Colors from '@/constants/colors';
import { Truck, Package } from 'lucide-react-native';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, loading, quickTestLogin, error, clearError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('driver');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    clearError();
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email, password, selectedRole);
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      console.error('🔥 Firebase Auth error:', error);
      Alert.alert('Authentication Error', error.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    console.log('Quick test login as:', role);
    quickTestLogin(role);
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
        <Text style={styles.logo}>LoadRush 2.2</Text>
        <Text style={styles.tagline}>Professional Load Board Platform</Text>
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
            keyboardType="email-address"
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
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.switchButtonText}>
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>

        {/* Quick Testing Access */}
        <View style={styles.testingSection}>
          <Text style={styles.testingLabel}>Quick Testing Access</Text>
          <View style={styles.testingTabs}>
            <TouchableOpacity
              style={styles.testingTab}
              onPress={() => handleQuickLogin('driver')}
              disabled={isSubmitting}
            >
              <Truck size={28} color={Colors.light.primary} strokeWidth={2.5} />
              <Text style={styles.testingTabLabel}>Driver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testingTab}
              onPress={() => handleQuickLogin('shipper')}
              disabled={isSubmitting}
            >
              <Package size={28} color={Colors.light.primary} strokeWidth={2.5} />
              <Text style={styles.testingTabLabel}>Shipper</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: 20,
  },
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
  logo: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.light.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: Colors.light.textSecondary,
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
  roleSelector: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
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
  roleLabelSelected: {
    color: Colors.light.primary,
  },
  roleDescription: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  testingSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  testingLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  testingTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  testingTab: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testingTabLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.light.primary,
    marginTop: 8,
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
});
