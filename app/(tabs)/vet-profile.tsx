import { useEffect, useState } from 'react';
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
import { VetProfile } from '@/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router, useLocalSearchParams } from 'expo-router';

export default function VetProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { vets, addVet, updateVet, deleteVet } = useApp();
  const params = useLocalSearchParams<{ add?: string }>();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<VetProfile>>({
    name: '',
    clinicName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    specialization: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      clinicName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      specialization: '',
      notes: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    if (editingId) {
      updateVet(editingId, formData);
      Alert.alert('Success', 'Vet profile updated successfully');
    } else {
      addVet(formData as Omit<VetProfile, 'id' | 'createdAt' | 'updatedAt'>);
      Alert.alert('Success', 'Vet profile added successfully');
    }
    resetForm();
  };

  useEffect(() => {
    if (params.add === 'true') {
      setIsAdding(true);
    }
  }, [params.add]);

  const handleEdit = (vet: VetProfile) => {
    setFormData(vet);
    setEditingId(vet.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Vet', 'Are you sure you want to delete this vet profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteVet(id);
          Alert.alert('Success', 'Vet profile deleted successfully');
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
    multiline = false,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    multiline?: boolean;
  }) => (
    <ThemedView style={styles.inputContainer}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        style={[
          styles.input,
          { borderColor: colors.icon, color: colors.text },
          multiline && styles.textArea,
        ]}
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
          Vet Profiles
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
            {editingId ? 'Edit Vet Profile' : 'Add Vet Profile'}
          </ThemedText>

          <InputField
            label="Name *"
            value={formData.name || ''}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Dr. Name"
          />

          <InputField
            label="Clinic Name"
            value={formData.clinicName || ''}
            onChangeText={(text) => setFormData({ ...formData, clinicName: text })}
            placeholder="Clinic/Hospital name"
          />

          <InputField
            label="Phone *"
            value={formData.phone || ''}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />

          <InputField
            label="Email"
            value={formData.email || ''}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Email address"
            keyboardType="email-address"
          />

          <InputField
            label="Address"
            value={formData.address || ''}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Street address"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="City"
                value={formData.city || ''}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="City"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="State"
                value={formData.state || ''}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholder="State"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Zip Code"
                value={formData.zipCode || ''}
                onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                placeholder="Zip code"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <ThemedView style={styles.inputContainer}>
                <ThemedText style={styles.label}>Country</ThemedText>
                <View style={styles.countryButtons}>
                  {(['US', 'India'] as const).map((country) => (
                    <TouchableOpacity
                      key={country}
                      style={[
                        styles.countryButton,
                        formData.country === country && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setFormData({ ...formData, country })}>
                      <ThemedText
                        style={[
                          styles.countryButtonText,
                          formData.country === country && { color: '#fff' },
                        ]}>
                        {country}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ThemedView>
            </View>
          </View>

          <InputField
            label="Specialization"
            value={formData.specialization || ''}
            onChangeText={(text) => setFormData({ ...formData, specialization: text })}
            placeholder="e.g., Small Animal Medicine, Surgery"
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
          Veterinarians ({vets.length})
        </ThemedText>

        {vets.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="cross.case.fill" size={48} color={colors.icon} />
            <ThemedText style={styles.emptyText}>No vet profiles yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>Tap &quot;Add&quot; to create your first vet profile</ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={vets}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[styles.vetCard, { borderColor: colors.icon }]}> 
                <View style={styles.vetHeader}>
                  <View style={styles.vetHeaderLeft}>
                    <ThemedText type="defaultSemiBold" style={styles.vetName} numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                    <ThemedText style={styles.vetSummary} numberOfLines={1}>
                      {[item.clinicName, item.phone].filter(Boolean).join(' • ') || 'No clinic details'}
                    </ThemedText>
                  </View>
                  <View style={styles.vetActions}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconButton}>
                      <IconSymbol name="pencil" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconButton}>
                      <IconSymbol name="trash.fill" size={18} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        )}
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
    justifyContent: 'space-between',
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
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    margin: 20,
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  countryButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  countryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  countryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
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
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  vetCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  vetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vetHeaderLeft: {
    flex: 1,
  },
  vetName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#11181C',
  },
  vetSummary: {
    fontSize: 14,
    color: '#6B7280',
  },
  vetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  vetNotes: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  vetNotesText: {
    fontSize: 14,
    color: '#4B5563', // Darker gray for better readability
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280', // Medium gray for better contrast
    textAlign: 'center',
  },
});


