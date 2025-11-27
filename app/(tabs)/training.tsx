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
  Switch,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { TrainingLog } from '@/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router, useLocalSearchParams } from 'expo-router';

export default function TrainingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { userProfile, canines, trainingLogs, addTrainingLog, updateTrainingLog, deleteTrainingLog } = useApp();
  const params = useLocalSearchParams<{ add?: string }>();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TrainingLog>>({
    canineId: '',
    date: new Date().toISOString().split('T')[0],
    skill: '',
    duration: undefined,
    success: true,
    notes: '',
  });

  // Filter entries for current user's pets
  const userCanines = userProfile ? canines.filter((c) => c.userId === userProfile.id) : [];
  const userCanineIds = userCanines.map((c) => c.id);
  const filteredLogs = userProfile?.role === 'Pet Owner'
    ? trainingLogs.filter((t) => userCanineIds.includes(t.canineId))
    : trainingLogs;

  const sortedLogs = [...filteredLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  useEffect(() => {
    if (params.add === 'true') {
      setIsAdding(true);
    }
  }, [params.add]);

  const resetForm = () => {
    setFormData({
      canineId: '',
      date: new Date().toISOString().split('T')[0],
      skill: '',
      duration: undefined,
      success: true,
      notes: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.canineId || !formData.skill) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateTrainingLog(editingId, formData);
      Alert.alert('Success', 'Training log updated successfully');
    } else {
      addTrainingLog(formData as Omit<TrainingLog, 'id' | 'createdAt' | 'updatedAt'>);
      Alert.alert('Success', 'Training log added successfully');
    }
    resetForm();
  };

  const handleEdit = (log: TrainingLog) => {
    setFormData({
      canineId: log.canineId,
      date: log.date,
      skill: log.skill,
      duration: log.duration,
      success: log.success,
      notes: log.notes,
    });
    setEditingId(log.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Log', 'Are you sure you want to delete this training log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTrainingLog(id);
          Alert.alert('Success', 'Log deleted successfully');
        },
      },
    ]);
  };

  const getCanineName = (canineId: string) => {
    return canines.find((c) => c.id === canineId)?.name || 'Unknown Pet';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.title, { color: colors.primary }]}>
          Training
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
            {editingId ? 'Edit Log' : 'Add Log'}
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
            <ThemedText style={styles.label}>Date *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              placeholder="YYYY-MM-DD"
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Skill *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
              value={formData.skill}
              onChangeText={(text) => setFormData({ ...formData, skill: text })}
              placeholder="e.g., Sit, Stay, Heel"
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>Duration (minutes)</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.icon, color: colors.text }]}
              value={formData.duration?.toString() || ''}
              onChangeText={(text) =>
                setFormData({ ...formData, duration: text ? parseInt(text) : undefined })
              }
              placeholder="0"
              keyboardType="numeric"
            />
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <View style={styles.switchRow}>
              <ThemedText style={styles.label}>Success</ThemedText>
              <Switch
                value={formData.success ?? true}
                onValueChange={(value) => setFormData({ ...formData, success: value })}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor="#fff"
              />
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
              placeholder="Training notes, observations, etc."
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
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Training Logs ({sortedLogs.length})
        </ThemedText>

        {sortedLogs.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="star.fill" size={48} color={colors.icon} />
            <ThemedText style={styles.emptyText}>No training logs yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>Tap &quot;Add&quot; to create your first log</ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={sortedLogs}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[styles.logCard, { borderColor: colors.icon }]}> 
                <View style={styles.logHeader}> 
                  <View style={styles.logHeaderLeft}> 
                    <ThemedText type="defaultSemiBold" style={styles.logPetName} numberOfLines={1}> 
                      {getCanineName(item.canineId)}
                    </ThemedText>
                    <ThemedText style={styles.logDate} numberOfLines={1}>
                      {item.skill} • {new Date(item.date).toLocaleDateString()}
                    </ThemedText>
                  </View>
                  <View style={styles.logActions}>
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
  logCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logHeaderLeft: {
    flex: 1,
  },
  logPetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#11181C', // Dark text for good contrast on white
  },
  logDate: {
    fontSize: 12,
    color: '#6B7280', // Medium gray for better contrast
  },
  logActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  logDetails: {
    gap: 8,
  },
  logDetailRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  logLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
    color: '#374151', // Dark gray for labels
  },
  logValue: {
    fontSize: 14,
    flex: 1,
    color: '#11181C', // Dark text for good contrast on white
  },
  successBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  successBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logNotes: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  logNotesText: {
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


