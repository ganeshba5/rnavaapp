import { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const STORAGE_KEYS = {
  LAST_EMAIL: '@ava_last_email',
  LAST_PASSWORD: '@ava_last_password',
};

const HERO_IMAGE = require('../assets/images/login-hero.png');

export default function LoginScreen() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const heroHeight = Math.max(Dimensions.get('window').height * 0.55, 360);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Load saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.LAST_EMAIL);
        const savedPassword = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PASSWORD);
        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    };
    loadSavedCredentials();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        // Save credentials for next time
        try {
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email);
          await AsyncStorage.setItem(STORAGE_KEYS.LAST_PASSWORD, password);
        } catch (error) {
          console.error('Error saving credentials:', error);
        }
        router.replace('/(tabs)');
      } else {
        Alert.alert(
          'Login Failed',
          'Invalid email or password. Please check your credentials and try again.'
        );
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      Alert.alert(
        'Login Error',
        error?.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToSignup = () => {
    router.push('/signup');
  };

  const renderLanding = () => (
    <View style={styles.landingContainer}>
      <Image source={HERO_IMAGE} style={[styles.heroImage, { height: heroHeight }]} contentFit="cover" />

      <ThemedView style={styles.landingCard}>
        <ThemedText style={styles.landingEyebrow}>Pick Your Favorite Pet</ThemedText>
        <ThemedText style={styles.landingDescription}>
          Your ultimate companion for pet care track, manage, and nurture your furry friends effortlessly!
        </ThemedText>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setShowLoginForm(true)}
          accessibilityRole="button"
          accessibilityLabel="Open login form">
          <ThemedText style={styles.primaryButtonText}>Log in</ThemedText>
        </TouchableOpacity>
        <View style={styles.linkRow}>
          <ThemedText style={styles.linkText}>New user registration</ThemedText>
          {isSupabaseConfigured ? (
            <TouchableOpacity onPress={handleSwitchToSignup}>
              <ThemedText style={styles.linkAction}>Sign Up</ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedText style={styles.linkActionDisabled}>Sign Up</ThemedText>
          )}
        </View>
      </ThemedView>
    </View>
  );

  const renderLoginForm = () => (
    <KeyboardAvoidingView
      style={styles.formWrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={Platform.OS !== 'web'}>
      <ScrollView
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowLoginForm(false)}
              accessibilityRole="button"
              accessibilityLabel="Back to landing">
              <IconSymbol name="chevron.left" size={22} color={colors.text} />
              <ThemedText style={styles.backButtonLabel}>Back</ThemedText>
            </TouchableOpacity>
            <ThemedText type="title" style={styles.formTitle}>
              Welcome Back
            </ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={`${colors.tertiaryText}B0`}
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
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={`${colors.tertiaryText}B0`}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                editable={!loading}
              />
            </ThemedView>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  opacity: loading ? 0.6 : 1,
                },
                Platform.OS === 'web' && styles.webButton,
              ]}
              onPress={handleLogin}
              disabled={loading}
              {...(Platform.OS === 'web' && !loading && { 'data-web-hover': true })}>
              <ThemedText style={styles.actionButtonText}>
                {loading ? 'Logging in...' : 'Log in'}
              </ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.secondaryText}>
              {isSupabaseConfigured
                ? 'Don\'t have an account? Sign up below'
                : 'Test mode: john.doe@example.com / any password'}
            </ThemedText>

            {isSupabaseConfigured && (
              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSwitchToSignup}
                disabled={loading}>
                <ThemedText style={styles.signupButtonText}>Sign Up</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  if (!showLoginForm) {
    return renderLanding();
  }

  return renderLoginForm();
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    landingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'flex-end',
    },
    heroImage: {
      width: '100%',
      borderBottomLeftRadius: 36,
      borderBottomRightRadius: 36,
    },
    landingCard: {
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderBottomWidth: 0,
      marginTop: -24,
      paddingHorizontal: 28,
      paddingTop: 32,
      paddingBottom: 44,
      alignItems: 'center',
      gap: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 4,
    },
    landingEyebrow: {
      fontSize: 28,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.text,
    },
    landingDescription: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      color: colors.secondaryText,
    },
    primaryButton: {
      backgroundColor: colors.tint,
      paddingVertical: 18,
      paddingHorizontal: 48,
      borderRadius: 999,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primaryMuted,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 5,
    },
    primaryButtonText: {
      color: colors.inverseText,
      fontSize: 18,
      fontWeight: '600',
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    linkText: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    linkAction: {
      fontSize: 14,
      color: colors.tint,
      fontWeight: '600',
    },
    linkActionDisabled: {
      fontSize: 14,
      color: `${colors.secondaryText}80`,
      fontWeight: '600',
    },
    formWrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    formScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    formCard: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 30,
      borderWidth: 1.5,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
      elevation: 6,
    },
    formHeaderRow: {
      marginBottom: 24,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    backButtonLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    formTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
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
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      color: colors.text,
    },
    actionButton: {
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      minHeight: 48,
      width: '100%',
      backgroundColor: colors.tint,
      shadowColor: colors.primaryMuted,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.24,
      shadowRadius: 10,
      elevation: 4,
    },
    webButton: {
      // Web-specific styles applied via inline style
    },
    actionButtonText: {
      color: colors.inverseText,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    secondaryText: {
      marginTop: 20,
      fontSize: 12,
      opacity: 0.8,
      textAlign: 'center',
      fontStyle: 'italic',
      color: colors.secondaryText,
    },
    testButton: {
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
    },
    testButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    signupButton: {
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
      }),
      borderColor: colors.tint,
    },
    signupButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.tint,
    },
  });


