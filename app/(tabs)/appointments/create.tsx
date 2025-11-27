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
import type { Appointment } from '@/types';

const CATEGORY_OPTIONS = [
  'Vet/Clinic',
  'Vaccination',
  'Grooming',
  'Training',
  'Medication',
  'Exercise',
  'Diet',
  'Other',
];

const TITLE_SUGGESTIONS: Record<string, string[]> = {
  'Vet/Clinic': ['Canine Care Consultation', 'Annual Wellness Exam', 'Post-Surgery Checkup'],
  Vaccination: ['Rabies Booster', 'DHPP', 'Bordetella'],
  Grooming: ['Full Grooming Session', 'Bath & Brush', 'Nail Trim'],
  Training: ['Obedience Class', 'Behavior Follow-up', 'Agility Session'],
  Medication: ['Medication Refill', 'Flea & Tick Prevention', 'Heartworm Treatment'],
  Exercise: ['Park Playdate', 'Treadmill Session', 'Jog with Trainer'],
  Diet: ['Nutrition Consultation', 'Weight Check-in', 'Meal Plan Update'],
  Other: ['Playdate', 'Pet Sitting', 'Boarding Drop-off'],
};

const formatTimeForPicker = (value: string, fallback: Date) => {
  if (!value) return fallback;
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return fallback;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const formatDateForPicker = (value: string, fallback: Date) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

export default function AppointmentFormScreen() {
  const { canineId: canineIdParam, recordId } = useLocalSearchParams<{ canineId?: string; recordId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const {
    appointments,
    addAppointment,
    updateAppointment,
    canines,
  } = useApp();

  const existingAppointment = useMemo<Appointment | undefined>(
    () => (recordId ? appointments.find((item) => item.id === recordId) : undefined),
    [appointments, recordId]
  );

  const resolvedCanineId = canineIdParam || existingAppointment?.canineId;
  const isEditing = Boolean(existingAppointment);

  const [category, setCategory] = useState(existingAppointment?.category ?? '');
  const [title, setTitle] = useState(existingAppointment?.title ?? '');
  const [description, setDescription] = useState(existingAppointment?.description ?? '');
  const [date, setDate] = useState(existingAppointment?.date ?? '');
  const [startTime, setStartTime] = useState(existingAppointment?.startTime ?? '');
  const [endTime, setEndTime] = useState(existingAppointment?.endTime ?? '');
  const [notes, setNotes] = useState(existingAppointment?.notes ?? '');

  const [isSaving, setIsSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'date' | 'start' | 'end' | null>(null);
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [iosPickerValue, setIosPickerValue] = useState<Date | null>(null);

  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showTitleSheet, setShowTitleSheet] = useState(false);

  const availableCanines = useMemo(() => (
    canineIdParam ? canines.filter((c) => c.id === canineIdParam) : canines
  ), [canineIdParam, canines]);

  useEffect(() => {
    if (existingAppointment && !canineIdParam) {
      setCategory(existingAppointment.category);
      setTitle(existingAppointment.title);
      setDescription(existingAppointment.description ?? '');
      setDate(existingAppointment.date);
      setStartTime(existingAppointment.startTime);
      setEndTime(existingAppointment.endTime);
      setNotes(existingAppointment.notes ?? '');
    }
  }, [existingAppointment, canineIdParam]);

  const openCategoryPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...CATEGORY_OPTIONS, 'Cancel'],
          cancelButtonIndex: CATEGORY_OPTIONS.length,
        },
        (index) => {
          if (index === CATEGORY_OPTIONS.length) return;
          const selected = CATEGORY_OPTIONS[index];
          setCategory(selected);
          if (TITLE_SUGGESTIONS[selected] && TITLE_SUGGESTIONS[selected].length > 0) {
            setTitle(TITLE_SUGGESTIONS[selected][0]);
          }
        }
      );
    } else {
      Alert.alert('Select Category', undefined, [
        ...CATEGORY_OPTIONS.map((option) => ({ text: option, onPress: () => setCategory(option) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const applyPickerValue = (target: 'date' | 'start' | 'end', nextDate: Date) => {
    if (target === 'date') {
      setDate(nextDate.toISOString().split('T')[0]);
    } else {
      const timeValue = nextDate.toTimeString().slice(0, 5);
      if (target === 'start') setStartTime(timeValue);
      if (target === 'end') setEndTime(timeValue);
    }
  };

  const openPicker = (target: 'date' | 'start' | 'end') => {
    if (Platform.OS === 'web') {
      const prompts: Record<typeof target, string> = {
        date: 'Enter date (YYYY-MM-DD)',
        start: 'Enter start time (HH:MM)',
        end: 'Enter end time (HH:MM)',
      } as any;
      const currentValue = target === 'date' ? date : target === 'start' ? startTime : endTime;
      const nextValue = window.prompt(prompts[target], currentValue ?? '');
      if (nextValue) {
        if (target === 'date') setDate(nextValue);
        if (target === 'start') setStartTime(nextValue);
        if (target === 'end') setEndTime(nextValue);
      }
      return;
    }
    if (Platform.OS === 'android') {
      const mode = target === 'date' ? 'date' : 'time';
      const value =
        target === 'date'
          ? formatDateForPicker(date, new Date())
          : formatTimeForPicker(target === 'start' ? startTime : endTime, new Date());
      DateTimePickerAndroid.open({
        mode,
        display: mode === 'time' ? 'clock' : 'calendar',
        is24Hour: true,
        value,
        onChange: (event, selectedDate) => {
          if (event.type !== 'set' || !selectedDate) return;
          applyPickerValue(target, selectedDate);
        },
      });
      return;
    }
    const initialValue =
      target === 'date'
        ? formatDateForPicker(date, new Date())
        : formatTimeForPicker(target === 'start' ? startTime : endTime, new Date());
    setIosPickerValue(initialValue);
    setPickerTarget(target);
    setShowNativePicker(true);
  };

  const handlePickerChange = (event: DateTimePickerEvent, nextDate?: Date) => {
    if (event.type === 'dismissed') {
      setIosPickerValue(null);
      setPickerTarget(null);
      setShowNativePicker(false);
      return;
    }
    if (!nextDate) return;
    setIosPickerValue(nextDate);
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

  const openTitlePicker = () => {
    if (!category || !TITLE_SUGGESTIONS[category]) {
      Alert.alert('Select Category', 'Choose a category first to view title suggestions.');
      return;
    }

    const suggestions = TITLE_SUGGESTIONS[category];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...suggestions, 'Cancel'],
          cancelButtonIndex: suggestions.length,
        },
        (index) => {
          if (index === suggestions.length) return;
          setTitle(suggestions[index]);
        }
      );
    } else {
      Alert.alert('Select Title', undefined, [
        ...suggestions.map((option) => ({ text: option, onPress: () => setTitle(option) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const validateForm = () => {
    if (!resolvedCanineId) {
      Alert.alert('Missing Pet', 'Please open this screen from a canine profile or select a pet.');
      return false;
    }
    if (!category.trim()) {
      Alert.alert('Validation', 'Select a category.');
      return false;
    }
    if (!title.trim()) {
      Alert.alert('Validation', 'Enter a title.');
      return false;
    }
    if (!date.trim()) {
      Alert.alert('Validation', 'Select a date.');
      return false;
    }
    if (!startTime.trim()) {
      Alert.alert('Validation', 'Select a start time.');
      return false;
    }
    if (!endTime.trim()) {
      Alert.alert('Validation', 'Select an end time.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const payload: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
        canineId: resolvedCanineId!,
        vetId: undefined,
        category,
        title,
        description: description.trim() || undefined,
        date,
        startTime,
        endTime,
        status: 'Scheduled',
        notes: notes.trim() || undefined,
      };

      if (isEditing && recordId) {
        await updateAppointment(recordId, payload);
        Alert.alert('Updated', 'Schedule updated successfully.');
      } else {
        await addAppointment(payload);
        Alert.alert('Saved', 'Schedule created successfully.');
      }
      router.back();
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Unable to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
              {isEditing ? 'Edit Canine Schedule' : 'Create Canine Schedule'}
            </ThemedText>
            <View style={{ width: 44 }} />
          </View>

          {!canineIdParam && (
            <View style={styles.formGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>Pet *</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petChoiceRow}>
                {availableCanines.map((canine) => {
                  const isSelected = resolvedCanineId === canine.id;
                  return (
                    <TouchableOpacity
                      key={canine.id}
                      style={[styles.petChip, isSelected && { backgroundColor: colors.tint }]}
                      onPress={() =>
                        router.replace(`/(tabs)/appointments/create?canineId=${canine.id}${recordId ? `&recordId=${recordId}` : ''}`)
                      }>
                      <ThemedText style={[styles.petChipText, isSelected && { color: colors.inverseText }]}>
                        {canine.name}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Category *</ThemedText>
            <TouchableOpacity
              style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={openCategoryPicker}>
              <ThemedText style={[styles.selectText, { color: category ? colors.text : colors.secondaryText }]}>
                {category ? category : 'Select Category'}
              </ThemedText>
              <IconSymbol name="chevron.down" size={16} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Title *</ThemedText>
            <TouchableOpacity
              style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={openTitlePicker}>
              <ThemedText style={[styles.selectText, { color: title ? colors.text : colors.secondaryText }]}>
                {title ? title : 'Select Title'}
              </ThemedText>
              <IconSymbol name="chevron.down" size={16} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Description</ThemedText>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Enter description"
              placeholderTextColor={`${colors.icon}99`}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={100}
            />
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{description.length}/100</ThemedText>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Select Date *</ThemedText>
            <TouchableOpacity
              style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => openPicker('date')}>
              <IconSymbol name="calendar" size={18} color={colors.icon} />
              <ThemedText style={[styles.selectText, { color: date ? colors.text : colors.secondaryText }]}>
                {date ? date : 'Select Date'}
              </ThemedText>
              {date ? (
                <TouchableOpacity onPress={() => setDate('')} accessibilityRole="button">
                  <IconSymbol name="xmark" size={16} color={colors.icon} />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          </View>

          <View style={styles.formRowTimes}>
            <View style={styles.rowItem}>
              <ThemedText style={[styles.label, { color: colors.text }]}>Start Time *</ThemedText>
              <TouchableOpacity
                style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => openPicker('start')}>
                <IconSymbol name="clock" size={18} color={colors.icon} />
                <ThemedText style={[styles.selectText, { color: startTime ? colors.text : colors.secondaryText }]}>
                  {startTime ? startTime : 'Start time'}
                </ThemedText>
                {startTime ? (
                  <TouchableOpacity onPress={() => setStartTime('')} accessibilityRole="button">
                    <IconSymbol name="xmark" size={16} color={colors.icon} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>
            <View style={styles.rowItem}>
              <ThemedText style={[styles.label, { color: colors.text }]}>End Time *</ThemedText>
              <TouchableOpacity
                style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => openPicker('end')}>
                <IconSymbol name="clock" size={18} color={colors.icon} />
                <ThemedText style={[styles.selectText, { color: endTime ? colors.text : colors.secondaryText }]}>
                  {endTime ? endTime : 'End time'}
                </ThemedText>
                {endTime ? (
                  <TouchableOpacity onPress={() => setEndTime('')} accessibilityRole="button">
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
              placeholder="Reminder notes or location"
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

      {Platform.OS === 'ios' && showNativePicker && pickerTarget ? (
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
                value={
                  iosPickerValue ??
                  (pickerTarget === 'date'
                    ? formatDateForPicker(date, new Date())
                    : formatTimeForPicker(pickerTarget === 'start' ? startTime : endTime, new Date()))
                }
                mode={pickerTarget === 'date' ? 'date' : 'time'}
                display={pickerTarget === 'date' ? 'inline' : 'spinner'}
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
    petChoiceRow: {
      gap: 8,
    },
    petChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
    },
    petChipText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    selectField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    selectText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      marginRight: 12,
    },
    textArea: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 16,
      fontWeight: '600',
      minHeight: 100,
      textAlignVertical: 'top',
    },
    helperText: {
      fontSize: 12,
      textAlign: 'right',
    },
    formRowTimes: {
      flexDirection: 'row',
      gap: 16,
    },
    rowItem: {
      flex: 1,
      gap: 6,
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

