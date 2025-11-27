import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { validateActivationCode } from '@/utils/giftCodes';

const STORAGE_KEYS = {
  LAST_EMAIL: '@ava_last_email',
  LAST_PASSWORD: '@ava_last_password',
};

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signup } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // Validation
    if (!firstName || !lastName) {
      Alert.alert('Error', 'Please enter both first and last name');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!activationCode) {
      Alert.alert('Error', 'Please enter an activation code');
      return;
    }

    // Validate activation code
    const activationCodeInfo = validateActivationCode(activationCode);
    if (!activationCodeInfo.valid) {
      Alert.alert('Invalid Activation Code', activationCodeInfo.description || 'Please enter a valid activation code to sign up.');
      return;
    }

    setLoading(true);
    try {
      const result = await signup(email, password, firstName, lastName, activationCode);
      if (result.success) {
        // Save credentials for next time
        try {
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email);
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_PASSWORD, password);
        } catch (error) {
          console.error('Error saving credentials:', error);
        }
        // User is automatically logged in after signup
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Signup error details:', error);
      Alert.alert(
        'Signup Error',
        error?.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    router.replace('/login');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={Platform.OS !== 'web'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.content}>
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={[styles.title, { color: colors.tint }]}>
              Sign Up
            </ThemedText>
            <ThemedText style={styles.subtitle}>Create your AVA account</ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>First Name</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
                placeholder="Enter your first name"
                placeholderTextColor={colors.icon}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Last Name</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
                placeholder="Enter your last name"
                placeholderTextColor={colors.icon}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
                placeholder="Enter your email"
                placeholderTextColor={colors.icon}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
                placeholder="Enter your password (min 6 characters)"
                placeholderTextColor={colors.icon}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
                editable={!loading}
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Confirm Password</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
                placeholder="Confirm your password"
                placeholderTextColor={colors.icon}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password-new"
                editable={!loading}
              />
            </ThemedView>

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Activation Code *</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
                placeholder="Enter activation code"
                placeholderTextColor={colors.icon}
                value={activationCode}
                onChangeText={setActivationCode}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <ThemedText style={styles.helperText}>
                A valid activation code is required to sign up
              </ThemedText>
            </ThemedView>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colors.tint,
                  opacity: loading ? 0.6 : 1,
                },
                Platform.OS === 'web' && styles.webButton,
              ]}
              onPress={handleSignup}
              disabled={loading}
              {...(Platform.OS === 'web' && !loading && { 'data-web-hover': true })}>
              <ThemedText style={styles.buttonText}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.switchText}>
              Already have an account?{' '}
              <ThemedText
                style={[styles.linkText, { color: colors.tint }]}
                onPress={handleSwitchToLogin}>
                Login
              </ThemedText>
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
    fontStyle: 'italic',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 48,
    width: '100%',
  },
  webButton: {
    // Web-specific styles applied via inline style
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  switchText: {
    marginTop: 20,
    fontSize: 14,
    textAlign: 'center',
  },
  linkText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

