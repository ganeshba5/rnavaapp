import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { UserProfile, UserRole } from '@/types';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminUsersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { allUsers, addUser, updateUser, deleteUser, userProfile } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'US',
    role: 'Pet Owner',
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: 'US',
      role: 'Pet Owner',
    });
    setPassword('');
    setConfirmPassword('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        // Update existing user (password optional)
        if (password && password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return;
        }
        await updateUser(editingId, formData);
        if (password) {
          // Note: Password update would require additional backend support
          Alert.alert('Success', 'User updated successfully. Note: Password update requires separate functionality.');
        } else {
          Alert.alert('Success', 'User updated successfully');
        }
      } else {
        // Create new user (password required)
        if (!password || password.length < 6) {
          Alert.alert('Error', 'Password must be at least 6 characters');
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return;
        }
        await addUser(formData as Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>, password);
        Alert.alert('Success', 'User created successfully');
      }
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save user');
    }
  };

  const handleEdit = (user: UserProfile) => {
    setFormData(user);
    setEditingId(user.id);
    setIsAdding(true);
    setPassword('');
    setConfirmPassword('');
  };

  const handleDelete = (id: string) => {
    if (userProfile?.id === id) {
      Alert.alert('Error', 'Cannot delete your own account');
      return;
    }
    Alert.alert('Delete User', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(id);
            Alert.alert('Success', 'User deleted successfully');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete user');
          }
        },
      },
    ]);
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    secureTextEntry = false,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    secureTextEntry?: boolean;
  }) => (
    <ThemedView style={styles.inputContainer}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.icon}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </ThemedView>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.title, { color: colors.primary }]}>
          Users Management
        </ThemedText>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setIsAdding(true);
          }}
          style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <IconSymbol name="plus" size={20} color="#fff" />
          <ThemedText style={styles.addButtonText}>Add</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {isAdding && (
        <ThemedView style={[styles.formContainer, { borderColor: colors.icon }]}>
          <ThemedText type="subtitle" style={styles.formTitle}>
            {editingId ? 'Edit User' : 'Add User'}
          </ThemedText>

          <InputField
            label="First Name *"
            value={formData.firstName || ''}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            placeholder="First name"
          />

          <InputField
            label="Last Name *"
            value={formData.lastName || ''}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            placeholder="Last name"
          />

          <InputField
            label="Email *"
            value={formData.email || ''}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Email address"
            keyboardType="email-address"
          />

          <InputField
            label="Phone *"
            value={formData.phone || ''}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Country *</ThemedText>
            <View style={styles.roleButtons}>
              {(['US', 'India'] as const).map((country) => (
                <TouchableOpacity
                  key={country}
                  style={[
                    styles.roleButton,
                    { borderColor: colors.icon },
                    formData.country === country && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFormData({ ...formData, country })}>
                  <ThemedText
                    style={[
                      styles.roleButtonText,
                      formData.country === country && { color: '#fff' },
                    ]}>
                    {country}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Role *</ThemedText>
            <View style={styles.roleButtons}>
              {(['Pet Owner', 'Admin', 'Vet', 'Dog Walker'] as UserRole[]).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleButton,
                    { borderColor: colors.icon },
                    formData.role === role && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFormData({ ...formData, role })}>
                  <ThemedText
                    style={[
                      styles.roleButtonText,
                      formData.role === role && { color: '#fff' },
                    ]}>
                    {role}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          {!editingId && (
            <>
              <InputField
                label="Password *"
                value={password}
                onChangeText={setPassword}
                placeholder="Password (min 6 characters)"
                secureTextEntry
              />

              <InputField
                label="Confirm Password *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                secureTextEntry
              />
            </>
          )}

          {editingId && (
            <>
              <InputField
                label="New Password (optional)"
                value={password}
                onChangeText={setPassword}
                placeholder="Leave empty to keep current password"
                secureTextEntry
              />

              {password && (
                <InputField
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  secureTextEntry
                />
              )}
            </>
          )}

          <View style={styles.formActions}>
            <TouchableOpacity
              onPress={resetForm}
              style={[styles.cancelButton, { borderColor: colors.icon }]}>
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.saveButtonText}>Save</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      )}

      <ThemedView style={styles.content}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          All Users ({allUsers.length})
        </ThemedText>
        <FlatList
          data={allUsers}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={[styles.userCard, { borderColor: colors.icon }]}>
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.userName} numberOfLines={1}>
                    {item.firstName} {item.lastName}
                  </ThemedText>
                  <ThemedText style={styles.userSummary} numberOfLines={1}>
                    {item.role} • {item.email}
                  </ThemedText>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconButton}>
                    <IconSymbol name="pencil" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  {userProfile?.id !== item.id && (
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconButton}>
                      <IconSymbol name="trash" size={18} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>No users found</ThemedText>
          }
        />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    ...(Platform.OS === 'web' && {
      paddingTop: 20,
    }),
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    margin: 20,
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
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
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  roleButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  userCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    marginBottom: 4,
  },
  userSummary: {
    fontSize: 13,
    color: '#6B7280',
  },
  userActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 20,
  },
});


