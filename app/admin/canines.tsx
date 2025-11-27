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
import { CanineProfile } from '@/types';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminCaninesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { canines, allUsers, addCanine, updateCanine, deleteCanine } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CanineProfile>>({
    userId: '',
    name: '',
    breed: '',
    dateOfBirth: '',
    gender: 'Unknown',
    weight: undefined,
    weightUnit: 'lbs',
    color: '',
    microchipNumber: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      userId: '',
      name: '',
      breed: '',
      dateOfBirth: '',
      gender: 'Unknown',
      weight: undefined,
      weightUnit: 'lbs',
      color: '',
      microchipNumber: '',
      notes: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.userId) {
      Alert.alert('Error', 'Please fill in name and select owner');
      return;
    }

    try {
      if (editingId) {
        await updateCanine(editingId, formData);
        Alert.alert('Success', 'Canine profile updated successfully');
      } else {
        await addCanine(formData as Omit<CanineProfile, 'id' | 'createdAt' | 'updatedAt'>);
        Alert.alert('Success', 'Canine profile created successfully');
      }
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save canine profile');
    }
  };

  const handleEdit = (canine: CanineProfile) => {
    setFormData(canine);
    setEditingId(canine.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Canine', 'Are you sure you want to delete this canine profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCanine(id);
            Alert.alert('Success', 'Canine profile deleted successfully');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete canine profile');
          }
        },
      },
    ]);
  };

  const getUserName = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
    multiline?: boolean;
  }) => (
    <ThemedView style={styles.inputContainer}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: colors.icon, color: colors.text }, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.icon}
        keyboardType={keyboardType}
        multiline={multiline}
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
          Canine Profiles
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
            {editingId ? 'Edit Canine Profile' : 'Add Canine Profile'}
          </ThemedText>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Owner *</ThemedText>
            <View style={styles.selectContainer}>
              {allUsers.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.selectOption,
                    { borderColor: colors.icon },
                    formData.userId === user.id && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFormData({ ...formData, userId: user.id })}>
                  <ThemedText
                    style={[
                      styles.selectOptionText,
                      formData.userId === user.id && { color: '#fff' },
                    ]}>
                    {user.firstName} {user.lastName} ({user.email})
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          <InputField
            label="Name *"
            value={formData.name || ''}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Canine name"
          />

          <InputField
            label="Breed"
            value={formData.breed || ''}
            onChangeText={(text) => setFormData({ ...formData, breed: text })}
            placeholder="Breed"
          />

          <InputField
            label="Date of Birth"
            value={formData.dateOfBirth || ''}
            onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
            placeholder="YYYY-MM-DD"
          />

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Gender</ThemedText>
            <View style={styles.roleButtons}>
              {(['Male', 'Female', 'Unknown'] as const).map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.roleButton,
                    { borderColor: colors.icon },
                    formData.gender === gender && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFormData({ ...formData, gender })}>
                  <ThemedText
                    style={[
                      styles.roleButtonText,
                      formData.gender === gender && { color: '#fff' },
                    ]}>
                    {gender}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          <InputField
            label="Weight"
            value={formData.weight?.toString() || ''}
            onChangeText={(text) => setFormData({ ...formData, weight: text ? parseFloat(text) : undefined })}
            placeholder="Weight"
            keyboardType="numeric"
          />

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Weight Unit</ThemedText>
            <View style={styles.roleButtons}>
              {(['kg', 'lbs'] as const).map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.roleButton,
                    { borderColor: colors.icon },
                    formData.weightUnit === unit && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFormData({ ...formData, weightUnit: unit })}>
                  <ThemedText
                    style={[
                      styles.roleButtonText,
                      formData.weightUnit === unit && { color: '#fff' },
                    ]}>
                    {unit}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          <InputField
            label="Color"
            value={formData.color || ''}
            onChangeText={(text) => setFormData({ ...formData, color: text })}
            placeholder="Color"
          />

          <InputField
            label="Microchip Number"
            value={formData.microchipNumber || ''}
            onChangeText={(text) => setFormData({ ...formData, microchipNumber: text })}
            placeholder="Microchip number"
          />

          <InputField
            label="Notes"
            value={formData.notes || ''}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Additional notes"
            multiline
          />

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
          All Canine Profiles ({canines.length})
        </ThemedText>
        <FlatList
          data={canines}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={[styles.itemCard, { borderColor: colors.icon }]}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </ThemedText>
                  <ThemedText style={styles.itemSummary} numberOfLines={1}>
                    {['Owner: ' + getUserName(item.userId), item.breed, item.gender]
                      .filter(Boolean)
                      .join(' • ')}
                  </ThemedText>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconButton}>
                    <IconSymbol name="pencil" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconButton}>
                    <IconSymbol name="trash" size={18} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<ThemedText style={styles.emptyText}>No canine profiles found</ThemedText>}
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    gap: 8,
  },
  selectOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#F5F5F5',
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  roleButton: {
    flex: 1,
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
  itemCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    marginBottom: 4,
  },
  itemSummary: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemActions: {
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


