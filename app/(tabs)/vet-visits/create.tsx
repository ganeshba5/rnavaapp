import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent, DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, type ThemeColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { VetVisit, VetProfile } from '@/types';

interface VetFormState {
  name: string;
  clinicName: string;
  phone: string;
  email: string;
}

const EMPTY_NEW_VET: VetFormState = {
  name: '',
  clinicName: '',
  phone: '',
  email: '',
};

type PickerState = {
  mode: 'date';
};

export default function VetVisitFormScreen() {
  const { canineId: canineIdParam, visitId } = useLocalSearchParams<{ canineId?: string; visitId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const {
    vetVisits,
    addVetVisit,
    updateVetVisit,
    vets,
    addVet,
  } = useApp();

  const existingVisit = useMemo<VetVisit | undefined>(
    () => (visitId ? vetVisits.find((item) => item.id === visitId) : undefined),
    [vetVisits, visitId]
  );

  const resolvedCanineId = canineIdParam || existingVisit?.canineId;
  const isEditing = Boolean(existingVisit);

  const [vetName, setVetName] = useState(existingVisit?.vetName ?? '');
  const [selectedVetId, setSelectedVetId] = useState<string | null>(existingVisit?.vetId ?? null);
  const [reason, setReason] = useState(existingVisit?.reason ?? '');
  const [endResults, setEndResults] = useState(existingVisit?.endResults ?? '');
  const [visitDate, setVisitDate] = useState(existingVisit?.visitDate ?? '');
  const [notes, setNotes] = useState(existingVisit?.notes ?? '');

  const [isSaving, setIsSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [iosPickerValue, setIosPickerValue] = useState<Date | null>(null);

  const [showVetModal, setShowVetModal] = useState(false);
  const [vetSearch, setVetSearch] = useState('');
  const [showAddVetForm, setShowAddVetForm] = useState(false);
  const [newVetData, setNewVetData] = useState<VetFormState>(EMPTY_NEW_VET);

  useEffect(() => {
    if (existingVisit && !canineIdParam) {
      setVetName(existingVisit.vetName);
      setSelectedVetId(existingVisit.vetId ?? null);
      setReason(existingVisit.reason);
      setEndResults(existingVisit.endResults);
      setVisitDate(existingVisit.visitDate);
      setNotes(existingVisit.notes ?? '');
    }
  }, [existingVisit, canineIdParam]);

  const filteredVets = useMemo(() => {
    if (!vetSearch.trim()) {
      return vets;
    }
    const term = vetSearch.trim().toLowerCase();
    return vets.filter((vet) =>
      vet.name.toLowerCase().includes(term) || (vet.clinicName ?? '').toLowerCase().includes(term)
    );
  }, [vetSearch, vets]);

  const openVetPicker = () => {
    setVetSearch('');
    setShowAddVetForm(false);
    setNewVetData(EMPTY_NEW_VET);
    setShowVetModal(true);
  };

  const closeVetPicker = () => {
    setShowVetModal(false);
    setShowAddVetForm(false);
    setNewVetData(EMPTY_NEW_VET);
  };

  const handleSelectVet = (vet: VetProfile) => {
    setSelectedVetId(vet.id);
    setVetName(vet.name);
    closeVetPicker();
  };

  const handleAddNewVet = async () => {
    if (!newVetData.name.trim()) {
      Alert.alert('Validation', 'Please enter the veterinarian name.');
      return;
    }
    const created = await addVet({
      name: newVetData.name.trim(),
      clinicName: newVetData.clinicName.trim(),
      phone: newVetData.phone.trim(),
      email: newVetData.email.trim(),
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      specialization: '',
      notes: '',
    });
    handleSelectVet(created);
  };

  const openDatePicker = () => {
    if (Platform.OS === 'web') {
      const nextValue = window.prompt('Enter visit date (YYYY-MM-DD)', visitDate || '');
      if (nextValue) setVisitDate(nextValue);
      return;
    }
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        display: 'calendar',
        value: getDateForPicker(visitDate),
        onChange: (event, date) => {
          if (event.type !== 'set' || !date) return;
          setVisitDate(date.toISOString().split('T')[0]);
        },
      });
      return;
    }
    setIosPickerValue(getDateForPicker(visitDate));
    setPickerVisible(true);
  };

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setIosPickerValue(null);
      setPickerVisible(false);
      return;
    }
    if (!date) return;
    setIosPickerValue(date);
  };

  const dismissPicker = () => {
    setPickerVisible(false);
    setIosPickerValue(null);
  };

  const confirmPicker = () => {
    if (iosPickerValue) {
      setVisitDate(iosPickerValue.toISOString().split('T')[0]);
    }
    dismissPicker();
  };

  const validateForm = () => {
    if (!resolvedCanineId) {
      Alert.alert('Error', 'Missing canine information. Please go back and try again.');
      return false;
    }
    if (!vetName.trim()) {
      Alert.alert('Validation', 'Please enter the veterinarian name.');
      return false;
    }
    if (!reason.trim()) {
      Alert.alert('Validation', 'Enter the reason for the visit.');
      return false;
    }
    if (!endResults.trim()) {
      Alert.alert('Validation', 'Enter the end results.');
      return false;
    }
    if (!visitDate.trim()) {
      Alert.alert('Validation', 'Select a visit date.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const payload = {
        canineId: resolvedCanineId!,
        vetId: selectedVetId ?? undefined,
        vetName: vetName.trim(),
        reason: reason.trim(),
        endResults: endResults.trim(),
        visitDate,
        notes: notes.trim() || undefined,
      } satisfies Omit<VetVisit, 'id' | 'createdAt' | 'updatedAt'>;

      if (isEditing && visitId) {
        await updateVetVisit(visitId, payload);
        Alert.alert('Updated', 'Vet visit updated successfully.');
      } else {
        await addVetVisit(payload);
        Alert.alert('Saved', 'Vet visit added successfully.');
      }
      router.back();
    } catch (error) {
      console.error('Error saving vet visit:', error);
      Alert.alert('Error', 'Unable to save the visit. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getDateForPicker = (value: string) => {
    if (!value) return new Date();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  return (
    <ThemedView
      style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 20) }]}
      darkColor={colors.background}
      lightColor={colors.background}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 32 : 0}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
              <ThemedText style={[styles.backLabel, { color: colors.text }]}>Back</ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              {isEditing ? 'Edit Vet Visit' : 'Create Canine Vet Visits'}
            </ThemedText>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Veterinarian Name *</ThemedText>
            <View style={[styles.inputWithIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter veterinarian name"
                placeholderTextColor={`${colors.icon}99`}
                value={vetName}
                onChangeText={(text) => {
                  setVetName(text);
                  if (selectedVetId) setSelectedVetId(null);
                }}
                maxLength={30}
              />
              <TouchableOpacity style={styles.inputIconButton} onPress={openVetPicker} accessibilityRole="button">
                <IconSymbol name="chevron.down" size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{vetName.length}/30</ThemedText>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Reason *</ThemedText>
            <TextInput
              style={[styles.inputField, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Enter Reason"
              placeholderTextColor={`${colors.icon}99`}
              value={reason}
              onChangeText={setReason}
              maxLength={100}
            />
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{reason.length}/100</ThemedText>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>End Results *</ThemedText>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Enter End Results"
              placeholderTextColor={`${colors.icon}99`}
              value={endResults}
              onChangeText={setEndResults}
              multiline
              maxLength={120}
            />
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{endResults.length}/120</ThemedText>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Date *</ThemedText>
            <TouchableOpacity
              style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={openDatePicker}>
              <IconSymbol name="calendar" size={18} color={colors.icon} />
              <ThemedText style={[styles.selectFieldText, { color: visitDate ? colors.text : colors.secondaryText }]}>
                {visitDate ? visitDate : 'Select date'}
              </ThemedText>
              {visitDate ? (
                <TouchableOpacity onPress={() => setVisitDate('')} accessibilityRole="button">
                  <IconSymbol name="xmark" size={16} color={colors.icon} />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Notes</ThemedText>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Additional notes"
              placeholderTextColor={`${colors.icon}99`}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={160}
            />
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{notes.length}/160</ThemedText>
          </View>
        </ScrollView>

        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            disabled={isSaving}
            accessibilityRole="button">
            <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.primaryButton, { backgroundColor: colors.tint }]}
            disabled={isSaving}
            accessibilityRole="button">
            <ThemedText style={styles.primaryButtonText}>Save</ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showVetModal} transparent animationType="fade" onRequestClose={closeVetPicker}>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            darkColor={colors.surface}
            lightColor={colors.surface}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Select Veterinarian</ThemedText>
              <TouchableOpacity onPress={closeVetPicker} accessibilityRole="button">
                <IconSymbol name="xmark" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
              <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search veterinarian"
                placeholderTextColor={`${colors.icon}99`}
                value={vetSearch}
                onChangeText={setVetSearch}
              />
            </View>

            <ScrollView style={styles.modalList} contentContainerStyle={{ gap: 12 }}>
              {filteredVets.map((vet) => (
                <TouchableOpacity
                  key={vet.id}
                  style={[styles.modalItem, { borderColor: colors.border }]}
                  onPress={() => handleSelectVet(vet)}>
                  <ThemedText style={[styles.modalItemTitle, { color: colors.text }]}>{vet.name}</ThemedText>
                  {vet.clinicName ? (
                    <ThemedText style={[styles.modalItemSubtitle, { color: colors.secondaryText }]}>
                      {vet.clinicName}
                    </ThemedText>
                  ) : null}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.addVetToggle, { borderColor: colors.border }]}
                onPress={() => setShowAddVetForm((prev) => !prev)}>
                <IconSymbol name={showAddVetForm ? 'minus' : 'plus'} size={16} color={colors.tint} />
                <ThemedText style={[styles.addVetToggleText, { color: colors.tint }]}>
                  {showAddVetForm ? 'Hide new veterinarian form' : 'Add new veterinarian'}
                </ThemedText>
              </TouchableOpacity>

              {showAddVetForm ? (
                <View style={styles.newVetForm}>
                  <TextInput
                    style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Name"
                    placeholderTextColor={`${colors.icon}99`}
                    value={newVetData.name}
                    onChangeText={(text) => setNewVetData((prev) => ({ ...prev, name: text }))}
                  />
                  <TextInput
                    style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Clinic Name"
                    placeholderTextColor={`${colors.icon}99`}
                    value={newVetData.clinicName}
                    onChangeText={(text) => setNewVetData((prev) => ({ ...prev, clinicName: text }))}
                  />
                  <TextInput
                    style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Phone"
                    placeholderTextColor={`${colors.icon}99`}
                    value={newVetData.phone}
                    onChangeText={(text) => setNewVetData((prev) => ({ ...prev, phone: text }))}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Email"
                    placeholderTextColor={`${colors.icon}99`}
                    value={newVetData.email}
                    onChangeText={(text) => setNewVetData((prev) => ({ ...prev, email: text }))}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <TouchableOpacity
                    style={[styles.modalPrimaryButton, { backgroundColor: colors.tint }]}
                    onPress={handleAddNewVet}
                    accessibilityRole="button">
                    <ThemedText style={styles.modalPrimaryText}>Save Veterinarian</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

      {Platform.OS === 'ios' && pickerVisible ? (
        <Modal transparent animationType="fade" visible onRequestClose={dismissPicker}>
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerCard, { backgroundColor: colors.surface }] }>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={dismissPicker}>
                  <ThemedText style={[styles.pickerCancelText, { color: colors.tint }]}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmPicker}>
                  <ThemedText style={[styles.pickerDoneText, { color: colors.tint }]}>Done</ThemedText>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={iosPickerValue ?? getDateForPicker(visitDate)}
                mode="date"
                display="inline"
                onChange={handlePickerChange}
                style={styles.nativePicker}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </ThemedView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
      gap: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    backLabel: {
      fontSize: 16,
      fontWeight: '600',
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
    },
    formGroup: {
      gap: 6,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
    },
    inputIconButton: {
      padding: 4,
    },
    helperText: {
      fontSize: 12,
      textAlign: 'right',
    },
    inputField: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      fontWeight: '600',
    },
    textArea: {
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 16,
      fontWeight: '600',
      minHeight: 100,
      textAlignVertical: 'top',
    },
    selectField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    selectFieldText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 12,
      gap: 16,
    },
    secondaryButton: {
      flex: 1,
      borderRadius: 999,
      borderWidth: 1,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '700',
    },
    primaryButton: {
      flex: 1,
      borderRadius: 999,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.35)',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    modalCard: {
      borderRadius: 20,
      borderWidth: 1,
      padding: 20,
      maxHeight: '80%',
      shadowColor: '#00000055',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 8,
      gap: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
    },
    modalList: {
      maxHeight: 320,
    },
    modalItem: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      gap: 4,
    },
    modalItemTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    modalItemSubtitle: {
      fontSize: 14,
      fontWeight: '500',
    },
    addVetToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      marginTop: 4,
    },
    addVetToggleText: {
      fontSize: 14,
      fontWeight: '600',
    },
    newVetForm: {
      gap: 10,
      marginTop: 8,
    },
    modalInput: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      fontWeight: '600',
    },
    modalPrimaryButton: {
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    modalPrimaryText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end',
    },
    pickerCard: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    },
    pickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    pickerCancelText: {
      fontSize: 16,
      fontWeight: '600',
    },
    pickerDoneText: {
      fontSize: 16,
      fontWeight: '700',
    },
    nativePicker: {
      backgroundColor: 'transparent',
    },
  });

