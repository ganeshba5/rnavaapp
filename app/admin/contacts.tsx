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
  Switch,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Contact } from '@/types';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminContactsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { contacts, addContact, updateContact, deleteContact } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Contact>>({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    isEmergency: false,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      isEmergency: false,
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
      updateContact(editingId, formData);
      Alert.alert('Success', 'Contact updated successfully');
    } else {
      addContact(formData as Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>);
      Alert.alert('Success', 'Contact added successfully');
    }
    resetForm();
  };

  const handleEdit = (contact: Contact) => {
    setFormData(contact);
    setEditingId(contact.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Contact', 'Are you sure you want to delete this contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteContact(id);
          Alert.alert('Success', 'Contact deleted successfully');
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

  const emergencyContacts = contacts.filter((c) => c.isEmergency);
  const regularContacts = contacts.filter((c) => !c.isEmergency);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.title, { color: colors.primary }]}>
          Contacts
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
            {editingId ? 'Edit Contact' : 'Add Contact'}
          </ThemedText>

          <InputField
            label="Name *"
            value={formData.name || ''}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Contact name"
          />

          <InputField
            label="Relationship"
            value={formData.relationship || ''}
            onChangeText={(text) => setFormData({ ...formData, relationship: text })}
            placeholder="e.g., Spouse, Friend, Neighbor"
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

          <ThemedView style={styles.inputContainer}>
            <View style={styles.switchRow}>
              <ThemedText style={styles.label}>Emergency Contact</ThemedText>
              <Switch
                value={formData.isEmergency ?? false}
                onValueChange={(value) => setFormData({ ...formData, isEmergency: value })}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </ThemedView>

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
        {emergencyContacts.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Emergency Contacts ({emergencyContacts.length})
            </ThemedText>
            <FlatList
              data={emergencyContacts}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[styles.contactCard, { borderColor: '#F44336', borderWidth: 2 }]}> 
                  <View style={styles.contactHeader}>
                    <View style={styles.contactHeaderLeft}>
                      <View style={styles.contactNameRow}>
                        <ThemedText type="defaultSemiBold" style={styles.contactName} numberOfLines={1}>
                          {item.name}
                        </ThemedText>
                        <View style={styles.emergencyBadge}>
                          <ThemedText style={styles.emergencyBadgeText}>EMERGENCY</ThemedText>
                        </View>
                      </View>
                      <ThemedText style={styles.contactSummary} numberOfLines={1}>
                        {item.phone || item.email || 'No contact info'}
                      </ThemedText>
                    </View>
                    <View style={styles.contactActions}>
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
          </View>
        )}

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            All Contacts ({contacts.length})
          </ThemedText>

          {contacts.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <IconSymbol name="person.2.fill" size={48} color={colors.icon} />
              <ThemedText style={styles.emptyText}>No contacts yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>Tap &quot;Add&quot; to create your first contact</ThemedText>
            </ThemedView>
          ) : (
            <FlatList
              data={regularContacts}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[styles.contactCard, { borderColor: colors.icon }]}> 
                  <View style={styles.contactHeader}>
                    <View style={styles.contactHeaderLeft}>
                      <ThemedText type="defaultSemiBold" style={styles.contactName} numberOfLines={1}>
                        {item.name}
                      </ThemedText>
                      <ThemedText style={styles.contactSummary} numberOfLines={1}>
                        {item.phone || item.email || 'No contact info'}
                      </ThemedText>
                    </View>
                    <View style={styles.contactActions}>
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
        </View>
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
    fontSize: 28,
    fontWeight: 'bold',
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
  section: {
    marginBottom: 24,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  contactCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contactHeaderLeft: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C', // Dark text for good contrast on white
  },
  contactSummary: {
    fontSize: 14,
    color: '#6B7280',
  },
  emergencyBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emergencyBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contactRelationship: {
    fontSize: 14,
    color: '#6B7280', // Medium gray for better contrast
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  contactDetails: {
    gap: 8,
  },
  contactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactDetailText: {
    fontSize: 14,
    flex: 1,
    color: '#11181C', // Dark text for good contrast on white
  },
  contactNotes: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  contactNotesText: {
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


