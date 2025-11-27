import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/context/AppContext';

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { changePassword } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing information', 'Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Weak password', 'New password must be at least 8 characters long.');
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert('No change detected', 'New password must be different from your current password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password updated', 'Your password has been changed successfully.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Change password error:', error);
      Alert.alert('Unable to change password', error?.message || 'Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <IconSymbol name="chevron.left" size={22} color={colors.text} />
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>

        <ThemedText type="title" style={[styles.title, { color: colors.primary }]}>
          Change Password
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Update your password to keep your account secure.
        </ThemedText>
        <TouchableOpacity
          onPress={() => router.push('/forgot-password')}
          style={styles.forgotLink}
          accessibilityRole="button"
          accessibilityLabel="Forgot password">
          <ThemedText style={[styles.forgotText, { color: colors.primary }]}>
            Forgot password?
          </ThemedText>
        </TouchableOpacity>

        <ThemedView style={styles.card}>
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
          />
          <PasswordField
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
          />
          <PasswordField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: isSubmitting ? `${colors.primary}80` : colors.primary },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            <ThemedText style={styles.submitText}>
              {isSubmitting ? 'Saving...' : 'Save Password'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return (
    <View style={styles.field}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={`${colors.icon}AA`}
        secureTextEntry
        style={[styles.fieldInput, { borderColor: colors.icon, color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  forgotLink: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    gap: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

