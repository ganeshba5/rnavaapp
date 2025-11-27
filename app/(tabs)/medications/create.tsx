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
  ActionSheetIOS,
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
import type { MedicationEntry, VetProfile } from '@/types';

const DOSAGE_UNITS = ['Gram', 'Milligram', 'Capsule', 'Tablet', 'Teaspoon', 'Tablespoon', 'Drop', 'ml'];
const FREQUENCY_OPTIONS = ['Daily', 'Every other day', 'Twice daily', 'Weekly', 'Monthly', 'As needed'];

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

type PickerTarget = 'startDate' | 'endDate' | 'startTime';

type PickerState = {
  mode: 'date' | 'time';
  target: PickerTarget;
};

export default function MedicationFormScreen() {
  const { canineId: canineIdParam, entryId } = useLocalSearchParams<{ canineId?: string; entryId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const {
    medications,
    addMedicationEntry,
    updateMedicationEntry,
    vets,
    addVet,
  } = useApp();

  const existingEntry = useMemo<MedicationEntry | undefined>(
    () => (entryId ? medications.find((item) => item.id === entryId) : undefined),
    [medications, entryId]
  );

  const resolvedCanineId = canineIdParam || existingEntry?.canineId;
  const isEditing = Boolean(existingEntry);

  const [vetName, setVetName] = useState(existingEntry?.vetName ?? '');
  const [selectedVetId, setSelectedVetId] = useState<string | null>(existingEntry?.vetId ?? null);
  const [medicationName, setMedicationName] = useState(existingEntry?.medicationName ?? '');
  const [reason, setReason] = useState(existingEntry?.reason ?? '');
  const [description, setDescription] = useState(existingEntry?.description ?? '');
  const [quantityInput, setQuantityInput] = useState(existingEntry?.quantity.toString() ?? '');
  const [dosageUnit, setDosageUnit] = useState(existingEntry?.dosageUnit ?? '');
  const [frequency, setFrequency] = useState(existingEntry?.frequency ?? '');
  const [startDate, setStartDate] = useState(existingEntry?.startDate ?? '');
  const [startTime, setStartTime] = useState(existingEntry?.startTime ?? '');
  const [endDate, setEndDate] = useState(existingEntry?.endDate ?? '');
  const [notes, setNotes] = useState(existingEntry?.notes ?? '');

  const [isSaving, setIsSaving] = useState(false);
  const [pickerState, setPickerState] = useState<PickerState | null>(null);
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [iosPickerValue, setIosPickerValue] = useState<Date | null>(null);

  const [showVetModal, setShowVetModal] = useState(false);
  const [vetSearch, setVetSearch] = useState('');
  const [showAddVetForm, setShowAddVetForm] = useState(false);
  const [newVetData, setNewVetData] = useState<VetFormState>(EMPTY_NEW_VET);

  useEffect(() => {
    if (existingEntry && !canineIdParam) {
      setVetName(existingEntry.vetName);
      setSelectedVetId(existingEntry.vetId ?? null);
      setMedicationName(existingEntry.medicationName);
      setReason(existingEntry.reason);
      setDescription(existingEntry.description ?? '');
      setQuantityInput(existingEntry.quantity.toString());
      setDosageUnit(existingEntry.dosageUnit);
      setFrequency(existingEntry.frequency);
      setStartDate(existingEntry.startDate ?? '');
      setStartTime(existingEntry.startTime ?? '');
      setEndDate(existingEntry.endDate ?? '');
      setNotes(existingEntry.notes ?? '');
    }
  }, [existingEntry, canineIdParam]);

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

  const openPicker = (target: PickerTarget, mode: 'date' | 'time') => {
    if (Platform.OS === 'web') {
      const prompts: Record<PickerTarget, string> = {
        startDate: 'Enter start date (YYYY-MM-DD)',
        endDate: 'Enter end date (YYYY-MM-DD)',
        startTime: 'Enter start time (HH:MM)',
      };
      const currentValue =
        target === 'startDate' ? startDate : target === 'endDate' ? endDate : startTime;
      const nextValue = window.prompt(prompts[target], currentValue ?? '');
      if (nextValue) {
        if (target === 'startDate') setStartDate(nextValue);
        if (target === 'endDate') setEndDate(nextValue);
        if (target === 'startTime') setStartTime(nextValue);
      }
      return;
    }

    if (Platform.OS === 'android') {
      const baseDate =
        target === 'startTime'
          ? getTimeForPicker(startTime, new Date())
          : getDateForPicker(target === 'startDate' ? startDate : endDate, new Date());

      DateTimePickerAndroid.open({
        mode,
        value: baseDate,
        is24Hour: true,
        display: mode === 'time' ? 'clock' : 'calendar',
        onChange: (event, date) => {
          if (event.type !== 'set' || !date) {
            return;
          }
          applyPickerValue(target, date);
        },
      });
      return;
    }

    const baseValue =
      target === 'startTime'
        ? getTimeForPicker(startTime, new Date())
        : getDateForPicker(target === 'startDate' ? startDate : endDate, new Date());
    setIosPickerValue(baseValue);
    setPickerState({ target, mode });
    setShowNativePicker(true);
  };

  const handlePickerChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (!date) return;
    setIosPickerValue(date);
  };

  const dismissPicker = () => {
    setIosPickerValue(null);
    setPickerState(null);
    setShowNativePicker(false);
  };

  const confirmPicker = () => {
    if (pickerState && iosPickerValue) {
      applyPickerValue(pickerState.target, iosPickerValue);
    }
    dismissPicker();
  };

  const handlePickDosage = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...DOSAGE_UNITS],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index > 0) setDosageUnit(DOSAGE_UNITS[index - 1]);
        }
      );
    } else {
      Alert.alert('Select Dosage', undefined, [
        ...DOSAGE_UNITS.map((unit) => ({ text: unit, onPress: () => setDosageUnit(unit) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handlePickFrequency = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...FREQUENCY_OPTIONS],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index > 0) setFrequency(FREQUENCY_OPTIONS[index - 1]);
        }
      );
    } else {
      Alert.alert('Select Frequency', undefined, [
        ...FREQUENCY_OPTIONS.map((option) => ({ text: option, onPress: () => setFrequency(option) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
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
    if (!medicationName.trim()) {
      Alert.alert('Validation', 'Enter the medication or vitamin name.');
      return false;
    }
    if (!reason.trim()) {
      Alert.alert('Validation', 'Enter the reason for this medication.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation', 'Enter a description.');
      return false;
    }
    const quantityNumber = Number(quantityInput);
    if (!quantityInput.trim() || Number.isNaN(quantityNumber) || quantityNumber <= 0) {
      Alert.alert('Validation', 'Enter a valid quantity.');
      return false;
    }
    if (!dosageUnit.trim()) {
      Alert.alert('Validation', 'Select the dosage.');
      return false;
    }
    if (!frequency.trim()) {
      Alert.alert('Validation', 'Select the frequency.');
      return false;
    }
    if (!startDate.trim()) {
      Alert.alert('Validation', 'Select a start date.');
      return false;
    }
    if (!startTime.trim()) {
      Alert.alert('Validation', 'Select a start time.');
      return false;
    }
    if (!endDate.trim()) {
      Alert.alert('Validation', 'Select an end date.');
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
        medicationName: medicationName.trim(),
        reason: reason.trim(),
        description: description.trim(),
        quantity: Number(quantityInput),
        dosageUnit,
        frequency,
        startDate,
        startTime,
        endDate,
        notes: notes.trim() || undefined,
      } satisfies Omit<MedicationEntry, 'id' | 'createdAt' | 'updatedAt'>;

      if (isEditing && entryId) {
        await updateMedicationEntry(entryId, payload);
        Alert.alert('Updated', 'Medication entry updated successfully.');
      } else {
        await addMedicationEntry(payload);
        Alert.alert('Saved', 'Medication entry added successfully.');
      }
      router.back();
    } catch (error) {
      console.error('Error saving medication entry:', error);
      Alert.alert('Error', 'Unable to save the medication. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearField = (setter: (value: string) => void) => () => setter('');

  const applyPickerValue = (target: PickerTarget, date: Date) => {
    if (target === 'startTime') {
      const timeValue = date.toTimeString().slice(0, 5);
      setStartTime(timeValue);
      return;
    }

    const isoValue = date.toISOString().split('T')[0];
    if (target === 'startDate') {
      setStartDate(isoValue);
    } else {
      setEndDate(isoValue);
    }
  };

  const getDateForPicker = (value: string, fallback: Date) => {
    if (!value) return fallback;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  };

  const getTimeForPicker = (value: string, fallback: Date) => {
    if (!value) return fallback;
    const [hours, minutes] = value.split(':').map((part) => Number(part));
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return fallback;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
              <ThemedText style={[styles.backLabel, { color: colors.text }]}>Back</ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.title, { color: colors.text }]}>{
              isEditing ? 'Edit Medication' : 'Add Medication'
            }</ThemedText>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Veterinarian Name *</ThemedText>
            <View style={[styles.inputWithIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter Veterinarian Name"
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
            <ThemedText style={[styles.label, { color: colors.text }]}>Medication / Vitamin *</ThemedText>
            <TextInput
              style={[styles.inputField, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Enter medication name"
              placeholderTextColor={`${colors.icon}99`}
              value={medicationName}
              onChangeText={setMedicationName}
              maxLength={40}
            />
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{medicationName.length}/40</ThemedText>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Reason *</ThemedText>
            <TextInput
              style={[styles.inputField, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Enter Reason"
              placeholderTextColor={`${colors.icon}99`}
              value={reason}
              onChangeText={setReason}
              maxLength={50}
            />
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{reason.length}/50</ThemedText>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Description *</ThemedText>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Enter Description"
              placeholderTextColor={`${colors.icon}99`}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={120}
            />
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{description.length}/120</ThemedText>
          </View>

          <View style={styles.formRow}>
            <View style={styles.rowItem}>
              <ThemedText style={[styles.label, { color: colors.text }]}>Start date *</ThemedText>
              <TouchableOpacity
                style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => openPicker('startDate', 'date')}>
                <IconSymbol name="calendar" size={18} color={colors.icon} />
                <ThemedText style={[styles.selectFieldText, { color: startDate ? colors.text : colors.secondaryText }]}>
                  {startDate ? startDate : 'Select Start date'}
                </ThemedText>
                {startDate ? (
                  <TouchableOpacity onPress={handleClearField(setStartDate)} accessibilityRole="button">
                    <IconSymbol name="xmark" size={16} color={colors.icon} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>
            <View style={styles.rowItem}>
              <ThemedText style={[styles.label, { color: colors.text }]}>Start time *</ThemedText>
              <TouchableOpacity
                style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => openPicker('startTime', 'time')}>
                <IconSymbol name="clock" size={18} color={colors.icon} />
                <ThemedText style={[styles.selectFieldText, { color: startTime ? colors.text : colors.secondaryText }]}>
                  {startTime ? startTime : 'Select Start time'}
                </ThemedText>
                {startTime ? (
                  <TouchableOpacity onPress={handleClearField(setStartTime)} accessibilityRole="button">
                    <IconSymbol name="xmark" size={16} color={colors.icon} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.rowItem}>
              <ThemedText style={[styles.label, { color: colors.text }]}>QTY *</ThemedText>
              <TextInput
                style={[styles.inputField, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="QTY"
                placeholderTextColor={`${colors.icon}99`}
                value={quantityInput}
                onChangeText={setQuantityInput}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
            <View style={styles.rowItem}>
              <ThemedText style={[styles.label, { color: colors.text }]}>Dosage *</ThemedText>
              <TouchableOpacity
                style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={handlePickDosage}>
                <ThemedText style={[styles.selectFieldText, { color: dosageUnit ? colors.text : colors.secondaryText }]}>
                  {dosageUnit ? dosageUnit : 'Select Dosage'}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colors.icon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.rowItem}>
              <ThemedText style={[styles.label, { color: colors.text }]}>Frequency *</ThemedText>
              <TouchableOpacity
                style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={handlePickFrequency}>
                <ThemedText style={[styles.selectFieldText, { color: frequency ? colors.text : colors.secondaryText }]}>
                  {frequency ? frequency : 'Select Frequency'}
                </ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <View style={styles.rowItem}>
              <ThemedText style={[styles.label, { color: colors.text }]}>End date *</ThemedText>
              <TouchableOpacity
                style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => openPicker('endDate', 'date')}>
                <IconSymbol name="calendar" size={18} color={colors.icon} />
                <ThemedText style={[styles.selectFieldText, { color: endDate ? colors.text : colors.secondaryText }]}>
                  {endDate ? endDate : 'Select end date'}
                </ThemedText>
                {endDate ? (
                  <TouchableOpacity onPress={handleClearField(setEndDate)} accessibilityRole="button">
                    <IconSymbol name="xmark" size={16} color={colors.icon} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>
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
            <ThemedText style={styles.primaryButtonText}>{isEditing ? 'Save' : 'Add'}</ThemedText>
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
                    keyboardType="email-address"
                    autoCapitalize="none"
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

      {Platform.OS === 'ios' && showNativePicker && pickerState ? (
        <Modal transparent animationType="fade" visible onRequestClose={dismissPicker}>
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerCard, { backgroundColor: colors.surface }]}
              pointerEvents="box-none">
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={dismissPicker}>
                  <ThemedText style={[styles.pickerCancelText, { color: colors.tint }]}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmPicker}>
                  <ThemedText style={[styles.pickerDoneText, { color: colors.tint }]}>Done</ThemedText>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={
                  iosPickerValue ??
                  (pickerState.target === 'startTime'
                    ? getTimeForPicker(startTime, new Date())
                    : getDateForPicker(
                        pickerState.target === 'startDate' ? startDate : endDate,
                        new Date()
                      ))
                }
                mode={pickerState.mode}
                display={pickerState.mode === 'time' ? 'spinner' : 'inline'}
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
      marginBottom: 8,
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
    formRow: {
      flexDirection: 'row',
      gap: 16,
    },
    rowItem: {
      flex: 1,
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
      paddingBottom: Platform.OS === 'ios' ? 32 : 12,
      paddingHorizontal: 20,
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
