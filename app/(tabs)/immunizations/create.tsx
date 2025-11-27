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
import type { ImmunizationRecord, VetProfile } from '@/types';

const VACCINE_OPTIONS = ['Rabies', 'DHPP', 'Bordetella', 'Lyme', 'Canine Influenza', 'Leptospirosis'];

interface VetFormState {
  name: string;
  clinicName: string;
  phone: string;
  email: string;
}

const EMPTY_VET_FORM: VetFormState = {
  name: '',
  clinicName: '',
  phone: '',
  email: '',
};

type PickerTarget = 'immunization' | 'lastVaccinated';

export default function ImmunizationFormScreen() {
  const { canineId: canineIdParam, recordId } = useLocalSearchParams<{ canineId?: string; recordId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const {
    immunizations,
    addImmunizationRecord,
    updateImmunizationRecord,
    vets,
    addVet,
  } = useApp();

  const existingRecord = useMemo<ImmunizationRecord | undefined>(
    () => (recordId ? immunizations.find((record) => record.id === recordId) : undefined),
    [immunizations, recordId]
  );

  const resolvedCanineId = canineIdParam || existingRecord?.canineId;
  const isEditing = Boolean(existingRecord);

  const [vetName, setVetName] = useState(existingRecord?.vetName ?? '');
  const [selectedVetId, setSelectedVetId] = useState<string | null>(existingRecord?.vetId ?? null);
  const [ageYears, setAgeYears] = useState(existingRecord?.ageYears.toString() ?? '');
  const [ageMonths, setAgeMonths] = useState(existingRecord?.ageMonths.toString() ?? '');
  const [vaccineName, setVaccineName] = useState(existingRecord?.vaccineName ?? '');
  const [immunizationDate, setImmunizationDate] = useState(existingRecord?.immunizationDate ?? '');
  const [lastVaccinatedDate, setLastVaccinatedDate] = useState(existingRecord?.lastVaccinatedDate ?? '');
  const [notes, setNotes] = useState(existingRecord?.notes ?? '');

  const [isSaving, setIsSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [iosPickerValue, setIosPickerValue] = useState<Date | null>(null);

  const [showVetModal, setShowVetModal] = useState(false);
  const [vetSearch, setVetSearch] = useState('');
  const [showAddVetForm, setShowAddVetForm] = useState(false);
  const [newVetForm, setNewVetForm] = useState<VetFormState>(EMPTY_VET_FORM);

  useEffect(() => {
    if (existingRecord && !canineIdParam) {
      setVetName(existingRecord.vetName);
      setSelectedVetId(existingRecord.vetId ?? null);
      setAgeYears(existingRecord.ageYears.toString());
      setAgeMonths(existingRecord.ageMonths.toString());
      setVaccineName(existingRecord.vaccineName);
      setImmunizationDate(existingRecord.immunizationDate);
      setLastVaccinatedDate(existingRecord.lastVaccinatedDate);
      setNotes(existingRecord.notes ?? '');
    }
  }, [existingRecord, canineIdParam]);

  const filteredVets = useMemo(() => {
    if (!vetSearch.trim()) return vets;
    const term = vetSearch.trim().toLowerCase();
    return vets.filter((vet) =>
      vet.name.toLowerCase().includes(term) || (vet.clinicName ?? '').toLowerCase().includes(term)
    );
  }, [vetSearch, vets]);

  const openVetPicker = () => {
    setVetSearch('');
    setShowAddVetForm(false);
    setNewVetForm(EMPTY_VET_FORM);
    setShowVetModal(true);
  };

  const closeVetPicker = () => {
    setShowVetModal(false);
    setShowAddVetForm(false);
    setNewVetForm(EMPTY_VET_FORM);
  };

  const handleSelectVet = (vet: VetProfile) => {
    setSelectedVetId(vet.id);
    setVetName(vet.name);
    closeVetPicker();
  };

  const handleAddNewVet = async () => {
    if (!newVetForm.name.trim()) {
      Alert.alert('Validation', 'Please enter the veterinarian name.');
      return;
    }
    const created = await addVet({
      name: newVetForm.name.trim(),
      clinicName: newVetForm.clinicName.trim(),
      phone: newVetForm.phone.trim(),
      email: newVetForm.email.trim(),
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

  const applyPickerValue = (target: PickerTarget, date: Date) => {
    const formatted = date.toISOString().split('T')[0];
    if (target === 'immunization') {
      setImmunizationDate(formatted);
    } else {
      setLastVaccinatedDate(formatted);
    }
  };

  const openPicker = (target: PickerTarget) => {
    if (Platform.OS === 'web') {
      const prompts: Record<PickerTarget, string> = {
        immunization: 'Enter immunization date (YYYY-MM-DD)',
        lastVaccinated: 'Enter last vaccinated date (YYYY-MM-DD)',
      };
      const currentValue = target === 'immunization' ? immunizationDate : lastVaccinatedDate;
      const nextValue = window.prompt(prompts[target], currentValue ?? '');
      if (nextValue) {
        if (target === 'immunization') setImmunizationDate(nextValue);
        else setLastVaccinatedDate(nextValue);
      }
      return;
    }
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        display: 'calendar',
        value: target === 'immunization' ? getDateForPicker(immunizationDate) : getDateForPicker(lastVaccinatedDate),
        onChange: (event, date) => {
          if (event.type !== 'set' || !date) return;
          applyPickerValue(target, date);
        },
      });
      return;
    }
    setIosPickerValue(target === 'immunization' ? getDateForPicker(immunizationDate) : getDateForPicker(lastVaccinatedDate));
    setPickerTarget(target);
    setShowNativePicker(true);
  };

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setIosPickerValue(null);
      setPickerTarget(null);
      setShowNativePicker(false);
      return;
    }
    if (!date) return;
    setIosPickerValue(date);
  };

  const dismissPicker = () => {
    setIosPickerValue(null);
    setPickerTarget(null);
    setShowNativePicker(false);
  };

  const confirmPicker = () => {
    if (pickerTarget && iosPickerValue) {
      applyPickerValue(pickerTarget, iosPickerValue);
    }
    dismissPicker();
  };

  const handlePickVaccine = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...VACCINE_OPTIONS],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index > 0) setVaccineName(VACCINE_OPTIONS[index - 1]);
        }
      );
    } else {
      Alert.alert('Select Vaccine', undefined, [
        ...VACCINE_OPTIONS.map((option) => ({ text: option, onPress: () => setVaccineName(option) })),
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
    const yearsNumber = Number(ageYears);
    const monthsNumber = Number(ageMonths);
    if (Number.isNaN(yearsNumber) || yearsNumber < 0) {
      Alert.alert('Validation', 'Enter a valid age in years.');
      return false;
    }
    if (Number.isNaN(monthsNumber) || monthsNumber < 0 || monthsNumber > 11) {
      Alert.alert('Validation', 'Enter months between 0 and 11.');
      return false;
    }
    if (!vaccineName.trim()) {
      Alert.alert('Validation', 'Select a vaccine.');
      return false;
    }
    if (!immunizationDate.trim()) {
      Alert.alert('Validation', 'Select an immunization date.');
      return false;
    }
    if (!lastVaccinatedDate.trim()) {
      Alert.alert('Validation', 'Select the last vaccinated date.');
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
        vaccineName,
        ageYears: Number(ageYears) || 0,
        ageMonths: Number(ageMonths) || 0,
        immunizationDate,
        lastVaccinatedDate,
        notes: notes.trim() || undefined,
      } satisfies Omit<ImmunizationRecord, 'id' | 'createdAt' | 'updatedAt'>;

      if (isEditing && recordId) {
        await updateImmunizationRecord(recordId, payload);
        Alert.alert('Updated', 'Immunization record updated successfully.');
      } else {
        await addImmunizationRecord(payload);
        Alert.alert('Saved', 'Immunization recorded successfully.');
      }
      router.back();
    } catch (error) {
      console.error('Error saving immunization:', error);
      Alert.alert('Error', 'Unable to save the record. Please try again.');
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
              {isEditing ? 'Edit Immunization' : 'Create Immunization Tracker'}
            </ThemedText>
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

          <View style={styles.formRow}>
            <View style={styles.rowItem}>
              <ThemedText style={[styles.label, { color: colors.text }]}>Age *</ThemedText>
              <TouchableOpacity
                style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => {
                  ActionSheetIOS.showActionSheetWithOptions?.(
                    {
                      options: ['Cancel', ...Array.from({ length: 21 }, (_, idx) => `${idx}`)],
                      cancelButtonIndex: 0,
                    },
                    (index) => {
                      if (index > 0) setAgeYears((index - 1).toString());
                    }
                  ) ?? null;
                }}
                disabled={Platform.OS !== 'ios'}>
                <ThemedText style={[styles.selectFieldText, { color: colors.text }]}>{ageYears || 'Year'}</ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <View style={styles.rowItem}>
              <TouchableOpacity
                style={[styles.selectField, { marginTop: 28, borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => {
                  ActionSheetIOS.showActionSheetWithOptions?.(
                    {
                      options: ['Cancel', ...Array.from({ length: 12 }, (_, idx) => `${idx}`)],
                      cancelButtonIndex: 0,
                    },
                    (index) => {
                      if (index > 0) setAgeMonths((index - 1).toString());
                    }
                  ) ?? null;
                }}
                disabled={Platform.OS !== 'ios'}>
                <ThemedText style={[styles.selectFieldText, { color: colors.text }]}>{ageMonths || 'Month'}</ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colors.icon} />
              </TouchableOpacity>
            </View>
          </View>

          {Platform.OS !== 'ios' ? (
            <View style={styles.formRowAlt}>
              <TextInput
                style={[styles.inputField, { flex: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Year"
                placeholderTextColor={`${colors.icon}99`}
                value={ageYears}
                onChangeText={setAgeYears}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.inputField, { flex: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="Month"
                placeholderTextColor={`${colors.icon}99`}
                value={ageMonths}
                onChangeText={setAgeMonths}
                keyboardType="numeric"
              />
            </View>
          ) : null}

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Vaccine *</ThemedText>
            <TouchableOpacity
              style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={handlePickVaccine}>
              <ThemedText style={[styles.selectFieldText, { color: vaccineName ? colors.text : colors.secondaryText }]}>
                {vaccineName ? vaccineName : 'Select Vaccine'}
              </ThemedText>
              <IconSymbol name="chevron.down" size={16} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Immunization Date *</ThemedText>
            <TouchableOpacity
              style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => openPicker('immunization')}>
              <IconSymbol name="calendar" size={18} color={colors.icon} />
              <ThemedText style={[styles.selectFieldText, { color: immunizationDate ? colors.text : colors.secondaryText }]}>
                {immunizationDate ? immunizationDate : 'Select Immunization Date'}
              </ThemedText>
              {immunizationDate ? (
                <TouchableOpacity onPress={() => setImmunizationDate('')} accessibilityRole="button">
                  <IconSymbol name="xmark" size={16} color={colors.icon} />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Last Vaccinated Date *</ThemedText>
            <TouchableOpacity
              style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => openPicker('lastVaccinated')}>
              <IconSymbol name="calendar" size={18} color={colors.icon} />
              <ThemedText style={[styles.selectFieldText, { color: lastVaccinatedDate ? colors.text : colors.secondaryText }]}>
                {lastVaccinatedDate ? lastVaccinatedDate : 'Select Last Vaccinated Date'}
              </ThemedText>
              {lastVaccinatedDate ? (
                <TouchableOpacity onPress={() => setLastVaccinatedDate('')} accessibilityRole="button">
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
              maxLength={180}
            />
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{notes.length}/180</ThemedText>
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
                    value={newVetForm.name}
                    onChangeText={(text) => setNewVetForm((prev) => ({ ...prev, name: text }))}
                  />
                  <TextInput
                    style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Clinic Name"
                    placeholderTextColor={`${colors.icon}99`}
                    value={newVetForm.clinicName}
                    onChangeText={(text) => setNewVetForm((prev) => ({ ...prev, clinicName: text }))}
                  />
                  <TextInput
                    style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Phone"
                    placeholderTextColor={`${colors.icon}99`}
                    value={newVetForm.phone}
                    onChangeText={(text) => setNewVetForm((prev) => ({ ...prev, phone: text }))}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Email"
                    placeholderTextColor={`${colors.icon}99`}
                    value={newVetForm.email}
                    onChangeText={(text) => setNewVetForm((prev) => ({ ...prev, email: text }))}
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

      {Platform.OS === 'ios' && showNativePicker && pickerTarget ? (
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
                  (pickerTarget === 'immunization'
                    ? getDateForPicker(immunizationDate)
                    : getDateForPicker(lastVaccinatedDate))
                }
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
    formRow: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'flex-start',
    },
    formRowAlt: {
      flexDirection: 'row',
      gap: 16,
      marginTop: -8,
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
