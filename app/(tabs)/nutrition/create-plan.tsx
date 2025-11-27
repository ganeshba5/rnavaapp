import { useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, type ThemeColors } from '@/constants/theme';
import { FOOD_TYPE_OPTIONS, NUTRITION_UNIT_OPTIONS, NUTRITION_REPEAT_OPTIONS, NUTRITION_DAY_COUNT } from '@/constants/nutrition';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/context/AppContext';
import type { NutritionEntry } from '@/types';

const buildDateWindow = (count: number) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, idx) => {
    const date = new Date(start);
    date.setDate(start.getDate() + idx);
    return date.toISOString().split('T')[0];
  });
};

const formatChipDay = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
};

export default function CreateNutritionPlanScreen() {
  const { canineId: canineParam, date: initialDate, recordId } = useLocalSearchParams<{
    canineId?: string;
    date?: string;
    recordId?: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const { canines, getNutritionEntriesByCanine, addNutritionEntry, updateNutritionEntry } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const resolvedCanineId = useMemo(() => {
    if (canineParam) return canineParam;
    return canines[0]?.id ?? null;
  }, [canineParam, canines]);

  const existingEntry: NutritionEntry | undefined = useMemo(() => {
    if (!recordId || !resolvedCanineId) return undefined;
    return getNutritionEntriesByCanine(resolvedCanineId).find((entry) => entry.id === recordId);
  }, [recordId, resolvedCanineId, getNutritionEntriesByCanine]);

  const defaultDate = existingEntry?.date ?? initialDate ?? today;
  const dateWindow = useMemo(() => buildDateWindow(NUTRITION_DAY_COUNT), []);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (dateWindow.includes(defaultDate)) {
      return defaultDate;
    }
    return dateWindow[0] ?? defaultDate;
  });

  const [foodType, setFoodType] = useState(existingEntry?.foodType ?? '');
  const [foodName, setFoodName] = useState(existingEntry?.foodName ?? '');
  const [quantityInput, setQuantityInput] = useState(existingEntry ? String(existingEntry.quantity) : '');
  const [unit, setUnit] = useState(existingEntry?.unit ?? 'ounces');
  const [caloriesInput, setCaloriesInput] = useState(existingEntry ? String(existingEntry.calories) : '');
  const [addOns, setAddOns] = useState(existingEntry?.addOns ?? '');
  const [repeatDays, setRepeatDays] = useState<number>(existingEntry?.repeatDays ?? 0);
  const [notes, setNotes] = useState(existingEntry?.notes ?? '');
  const [actualDate, setActualDate] = useState(existingEntry?.actualDate ?? '');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingEntry) {
      setSelectedDate(existingEntry.date);
      setFoodType(existingEntry.foodType);
      setFoodName(existingEntry.foodName);
      setQuantityInput(String(existingEntry.quantity));
      setUnit(existingEntry.unit);
      setCaloriesInput(String(existingEntry.calories));
      setAddOns(existingEntry.addOns ?? '');
      setRepeatDays(existingEntry.repeatDays ?? 0);
      setNotes(existingEntry.notes ?? '');
      setActualDate(existingEntry.actualDate ?? '');
    }
  }, [existingEntry]);

  const openFoodTypePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...FOOD_TYPE_OPTIONS, 'Cancel'],
          cancelButtonIndex: FOOD_TYPE_OPTIONS.length,
        },
        (index) => {
          if (index === FOOD_TYPE_OPTIONS.length) return;
          setFoodType(FOOD_TYPE_OPTIONS[index]);
        }
      );
    } else {
      Alert.alert('Select Food Type', undefined, [
        ...FOOD_TYPE_OPTIONS.map((option) => ({ text: option, onPress: () => setFoodType(option) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const openUnitPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...NUTRITION_UNIT_OPTIONS, 'Cancel'],
          cancelButtonIndex: NUTRITION_UNIT_OPTIONS.length,
        },
        (index) => {
          if (index === NUTRITION_UNIT_OPTIONS.length) return;
          setUnit(NUTRITION_UNIT_OPTIONS[index]);
        }
      );
    } else {
      Alert.alert('Select Unit', undefined, [
        ...NUTRITION_UNIT_OPTIONS.map((option) => ({ text: option, onPress: () => setUnit(option) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const openRepeatPicker = () => {
    const options = NUTRITION_REPEAT_OPTIONS.map((value) => value.toString());
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, 'Cancel'],
          cancelButtonIndex: options.length,
        },
        (index) => {
          if (index === options.length) return;
          setRepeatDays(Number(options[index]));
        }
      );
    } else {
      Alert.alert('Repeat plan for days?', undefined, [
        ...options.map((value) => ({ text: value, onPress: () => setRepeatDays(Number(value)) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!resolvedCanineId) {
      Alert.alert('Select Pet', 'Please choose or create a canine profile first.');
      return;
    }
    if (!foodType.trim()) {
      Alert.alert('Validation', 'Select a food type.');
      return;
    }
    if (!foodName.trim()) {
      Alert.alert('Validation', 'Enter a food item or brand name.');
      return;
    }
    const quantity = parseFloat(quantityInput);
    if (Number.isNaN(quantity) || quantity <= 0) {
      Alert.alert('Validation', 'Enter a valid quantity.');
      return;
    }
    const calories = parseInt(caloriesInput, 10);
    if (Number.isNaN(calories) || calories <= 0) {
      Alert.alert('Validation', 'Enter the calories for this meal.');
      return;
    }

    const payload: Omit<NutritionEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      canineId: resolvedCanineId,
      date: selectedDate,
      foodType: foodType.trim(),
      foodName: foodName.trim(),
      quantity,
      unit,
      calories,
      addOns: addOns.trim() ? addOns.trim() : undefined,
      repeatDays,
      actualDate: actualDate.trim() ? actualDate.trim() : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    try {
      setIsSaving(true);
      if (existingEntry && recordId) {
        await updateNutritionEntry(recordId, payload);
        Alert.alert('Updated', 'Meal plan updated successfully.');
      } else {
        await addNutritionEntry(payload);
        Alert.alert('Saved', 'Meal plan created successfully.');
      }
      router.back();
    } catch (error) {
      console.error('Error saving nutrition plan:', error);
      Alert.alert('Error', 'Unable to save the meal plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView
      style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 24) }]}
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
              {existingEntry ? 'Update Daily Meal Plan' : 'Plan Meal For Day'}
            </ThemedText>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dateWindow.map((date) => {
              const isActive = date === selectedDate;
              return (
                <TouchableOpacity
                  key={date}
                  style={[styles.dateChip, isActive && { backgroundColor: colors.tint }]}
                  onPress={() => setSelectedDate(date)}>
                  <ThemedText style={[styles.dateChipLabel, { color: isActive ? colors.inverseText : colors.text }]}>
                    {formatChipDay(date)}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Food Type *</ThemedText>
            <TouchableOpacity
              style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={openFoodTypePicker}>
              <ThemedText style={[styles.selectText, { color: foodType ? colors.text : colors.secondaryText }]}>
                {foodType || 'Select Food Type'}
              </ThemedText>
              <IconSymbol name="chevron.down" size={16} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Food Item/Brand Name *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Enter food name"
              placeholderTextColor={`${colors.icon}80`}
              value={foodName}
              onChangeText={setFoodName}
              maxLength={50}
            />
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{foodName.length}/50</ThemedText>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <ThemedText style={[styles.label, { color: colors.text }]}>Quantity *</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                placeholder="0"
                placeholderTextColor={`${colors.icon}80`}
                value={quantityInput}
                onChangeText={setQuantityInput}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>
            <View style={styles.half}>
              <ThemedText style={[styles.label, { color: colors.text }]}>Units *</ThemedText>
              <TouchableOpacity
                style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={openUnitPicker}>
                <ThemedText style={[styles.selectText, { color: colors.text }]}>{unit}</ThemedText>
                <IconSymbol name="chevron.down" size={16} color={colors.icon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Calories (cal) *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="0"
              placeholderTextColor={`${colors.icon}80`}
              value={caloriesInput}
              onChangeText={setCaloriesInput}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Add On’s</ThemedText>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Optional toppers or supplements"
              placeholderTextColor={`${colors.icon}80`}
              value={addOns}
              onChangeText={setAddOns}
              maxLength={100}
              multiline
            />
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{addOns.length}/100</ThemedText>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Repeat plan for days?</ThemedText>
            <TouchableOpacity
              style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={openRepeatPicker}>
              <ThemedText style={[styles.selectText, { color: colors.text }]}>{repeatDays}</ThemedText>
              <IconSymbol name="chevron.down" size={16} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Actual Date</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={`${colors.icon}80`}
              value={actualDate}
              onChangeText={setActualDate}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.text }]}>Notes</ThemedText>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Optional notes"
              placeholderTextColor={`${colors.icon}80`}
              value={notes}
              onChangeText={setNotes}
              maxLength={120}
              multiline
            />
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{notes.length}/120</ThemedText>
          </View>
        </ScrollView>

        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
            disabled={isSaving}>
            <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.tint, opacity: isSaving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={isSaving}>
            <ThemedText style={styles.primaryButtonText}>{isSaving ? 'Saving…' : existingEntry ? 'Update' : 'Save'}</ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
      paddingBottom: 24,
      gap: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
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
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
    },
    dateRow: {
      gap: 12,
      paddingVertical: 12,
    },
    dateChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: `${colors.icon}22`,
      backgroundColor: `${colors.surface}ee`,
    },
    dateChipLabel: {
      fontSize: 14,
      fontWeight: '700',
    },
    formGroup: {
      gap: 6,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
    },
    input: {
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
      minHeight: 110,
      textAlignVertical: 'top',
    },
    helperText: {
      fontSize: 12,
      textAlign: 'right',
    },
    row: {
      flexDirection: 'row',
      gap: 16,
    },
    half: {
      flex: 1,
      gap: 6,
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
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      marginRight: 12,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      gap: 16,
      paddingTop: 16,
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
  });
