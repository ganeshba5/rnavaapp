import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { Appointment, AppointmentStatus } from '@/types';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AppointmentsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { userProfile, canines, vets, appointments, addAppointment, updateAppointment, deleteAppointment } =
    useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Appointment>>({
    canineId: '',
    vetId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    title: '',
    type: '',
    status: 'Scheduled',
    notes: '',
  });

  // Filter appointments for current user's pets
  const userCanines = userProfile ? canines.filter((c) => c.userId === userProfile.id) : [];
  const userCanineIds = userCanines.map((c) => c.id);
  const filteredAppointments = userProfile?.role === 'Pet Owner'
    ? appointments.filter((a) => userCanineIds.includes(a.canineId))
    : appointments;

  const upcomingAppointments = filteredAppointments
    .filter((a) => a.status === 'Scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pastAppointments = filteredAppointments
    .filter((a) => a.status !== 'Scheduled')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const resetForm = () => {
    setFormData({
      canineId: '',
      vetId: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      title: '',
      type: '',
      status: 'Scheduled',
      notes: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.canineId || !formData.title || !formData.date) {
      Alert.alert('Error', 'Please fill in pet, title, and date');
      return;
    }

    if (editingId) {
      updateAppointment(editingId, formData);
      Alert.alert('Success', 'Appointment updated successfully');
    } else {
      addAppointment(formData as Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>);
      Alert.alert('Success', 'Appointment added successfully');
    }
    resetForm();
  };

  const handleEdit = (appointment: Appointment) => {
    setFormData({
      ...appointment,
      title: appointment.title || '',
    });
    setEditingId(appointment.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Appointment', 'Are you sure you want to delete this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAppointment(id);
          Alert.alert('Success', 'Appointment deleted successfully');
        },
      },
    ]);
  };

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    updateAppointment(id, { status });
    Alert.alert('Success', `Appointment marked as ${status}`);
  };

  const getCanineName = (canineId: string) => {
    return canines.find((c) => c.id === canineId)?.name || 'Unknown Pet';
  };

  const getVetName = (vetId?: string) => {
    if (!vetId) return 'Not specified';
    return vets.find((v) => v.id === vetId)?.name || 'Unknown Vet';
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'Scheduled':
        return '#4CAF50';
      case 'Completed':
        return '#2196F3';
      case 'Cancelled':
        return '#F44336';
      default:
        return colors.icon;
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => (
    <View key={appointment.id} style={[styles.appointmentCard, { borderColor: colors.icon }]}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentHeaderLeft}>
          <ThemedText type="defaultSemiBold" style={styles.appointmentType}>
            {appointment.title || 'Appointment'}
          </ThemedText>
          <ThemedText style={styles.appointmentPet}>Pet: {getCanineName(appointment.canineId)}</ThemedText>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusColor(appointment.status),
            },
          ]}>
          <ThemedText style={styles.statusText}>{appointment.status}</ThemedText>
        </View>
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.appointmentDetailRow}>
          <IconSymbol name="calendar" size={16} color={colors.icon} />
          <ThemedText style={styles.appointmentDetailText}>
            {new Date(appointment.date).toLocaleDateString()}
            {appointment.time && ` at ${appointment.time}`}
          </ThemedText>
        </View>
        <View style={styles.appointmentDetailRow}>
          <IconSymbol name="cross.case.fill" size={16} color={colors.icon} />
          <ThemedText style={styles.appointmentDetailText}>{getVetName(appointment.vetId)}</ThemedText>
        </View>
        {appointment.notes && (
          <View style={styles.appointmentNotes}>
            <ThemedText style={styles.appointmentNotesText}>{appointment.notes}</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.appointmentActions}>
        <View style={styles.actionButtons}>
          {appointment.status === 'Scheduled' && (
            <>
              <TouchableOpacity
                onPress={() => handleStatusChange(appointment.id, 'Completed')}
                style={[styles.statusButton, { backgroundColor: '#2196F3' }]}>
                <ThemedText style={styles.statusButtonText}>Mark Completed</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleStatusChange(appointment.id, 'Cancelled')}
                style={[styles.statusButton, { backgroundColor: '#F44336' }]}>
                <ThemedText style={styles.statusButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>
        <View style={styles.editDeleteButtons}>
          <TouchableOpacity onPress={() => handleEdit(appointment)} style={styles.iconButton}>
            <IconSymbol name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(appointment.id)} style={styles.iconButton}>
            <IconSymbol name="trash.fill" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={[styles.title, { color: colors.primary }]}>
          Appointments
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
            {editingId ? 'Edit Appointment' : 'Add Appointment'}
          </ThemedText>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Pet *</ThemedText>
            <View style={styles.petSelector}>
              {(userProfile?.role === 'Pet Owner' ? userCanines : canines).map((canine) => (
                <TouchableOpacity
                  key={canine.id}
                  style={[
                    styles.petButton,
                    formData.canineId === canine.id && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFormData({ ...formData, canineId: canine.id })}>
                  <ThemedText
                    style={[
                      styles.petButtonText,
                      formData.canineId === canine.id && { color: '#fff' },
                    ]}>
                    {canine.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Veterinarian</ThemedText>
            <View style={styles.vetSelector}>
              <TouchableOpacity
                style={[
                  styles.vetButton,
                  !formData.vetId && { backgroundColor: colors.primary },
                ]}
                onPress={() => setFormData({ ...formData, vetId: '' })}>
                <ThemedText
                  style={[
                    styles.vetButtonText,
                    !formData.vetId && { color: '#fff' },
                  ]}>
                  None
                </ThemedText>
              </TouchableOpacity>
              {vets.map((vet) => (
                <TouchableOpacity
                  key={vet.id}
                  style={[
                    styles.vetButton,
                    formData.vetId === vet.id && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFormData({ ...formData, vetId: vet.id })}>
                  <ThemedText
                    style={[
                      styles.vetButtonText,
                      formData.vetId === vet.id && { color: '#fff' },
                    ]}>
                    {vet.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Date *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              placeholder="YYYY-MM-DD"
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Time</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
              value={formData.time}
              onChangeText={(text) => setFormData({ ...formData, time: text })}
              placeholder="HH:mm (e.g., 14:30)"
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Title *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Short summary (e.g., Annual Visit)"
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Type *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
              value={formData.type}
              onChangeText={(text) => setFormData({ ...formData, type: text })}
              placeholder="e.g., Checkup, Vaccination, Surgery"
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Status</ThemedText>
            <View style={styles.statusButtons}>
              {(['Scheduled', 'Completed', 'Cancelled'] as AppointmentStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOptionButton,
                    formData.status === status && {
                      backgroundColor: getStatusColor(status),
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, status })}>
                  <ThemedText
                    style={[
                      styles.statusOptionButtonText,
                      formData.status === status && { color: '#fff' },
                    ]}>
                    {status}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Notes</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { borderColor: colors.icon, color: colors.text },
              ]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Additional notes"
              multiline
            />
          </ThemedView>

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
        {upcomingAppointments.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Upcoming ({upcomingAppointments.length})
            </ThemedText>
            {upcomingAppointments.map(renderAppointmentCard)}
          </View>
        )}

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Past Appointments ({pastAppointments.length})
          </ThemedText>

          {filteredAppointments.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <IconSymbol name="calendar.fill" size={48} color={colors.icon} />
              <ThemedText style={styles.emptyText}>No appointments yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>Tap &quot;Add&quot; to create your first appointment</ThemedText>
            </ThemedView>
          ) : (
            pastAppointments.map(renderAppointmentCard)
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    ...(Platform.OS === 'web' && {
      paddingTop: 20,
    }),
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
  petSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  petButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  petButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  vetSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  vetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statusOptionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  statusOptionButtonText: {
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
  appointmentCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentHeaderLeft: {
    flex: 1,
  },
  appointmentType: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#11181C', // Dark text for good contrast on white
  },
  appointmentPet: {
    fontSize: 14,
    color: '#6B7280', // Medium gray for better contrast
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDetails: {
    gap: 8,
    marginBottom: 12,
  },
  appointmentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentDetailText: {
    fontSize: 14,
    flex: 1,
    color: '#11181C', // Dark text for good contrast on white
  },
  appointmentNotes: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  appointmentNotesText: {
    fontSize: 14,
    color: '#4B5563', // Darker gray for better readability
    fontStyle: 'italic',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  editDeleteButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
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


