import { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FOOD_TYPE_OPTIONS, NUTRITION_UNIT_OPTIONS, NUTRITION_REPEAT_OPTIONS } from '@/constants/nutrition';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { NutritionEntry } from '@/types';

const formatDisplayDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatPlannedLine = (entry: NutritionEntry) => `${entry.quantity} ${entry.unit} / ${entry.calories} cal`;

export default function AdminNutritionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const {
    canines,
    nutritionEntries,
    addNutritionEntry,
    updateNutritionEntry,
    deleteNutritionEntry,
  } = useApp();

  const [selectedCanineId, setSelectedCanineId] = useState<string | null>(canines[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEntry, setEditingEntry] = useState<NutritionEntry | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [foodType, setFoodType] = useState('');
  const [foodName, setFoodName] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [unit, setUnit] = useState<NutritionEntry['unit']>('ounces');
  const [caloriesInput, setCaloriesInput] = useState('');
  const [addOns, setAddOns] = useState('');
  const [repeatDays, setRepeatDays] = useState<number>(0);
  const [actualDate, setActualDate] = useState('');
  const [notes, setNotes] = useState('');

  const filteredEntries = useMemo(() => {
    let items = nutritionEntries;
    if (selectedCanineId) {
      items = items.filter((entry) => entry.canineId === selectedCanineId);
    }
    if (!search.trim()) return items;
    const term = search.trim().toLowerCase();
    return items.filter((entry) =>
      [entry.foodType, entry.foodName, entry.addOns]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    );
  }, [nutritionEntries, selectedCanineId, search]);

  const openCaninePicker = () => {
    if (canines.length === 0) {
      Alert.alert('No Pets', 'Create a canine profile first.');
      return;
    }
    const options = canines.map((c) => c.name);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, 'Cancel'],
          cancelButtonIndex: options.length,
        },
        (index) => {
          if (index === options.length) return;
          setSelectedCanineId(canines[index].id);
        }
      );
    } else {
      Alert.alert('Select Canine', undefined, [
        ...canines.map((canine) => ({ text: canine.name, onPress: () => setSelectedCanineId(canine.id) })),
        { text: 'All Pets', onPress: () => setSelectedCanineId(null) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

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
      Alert.alert('Food Type', undefined, [
        ...FOOD_TYPE_OPTIONS.map((option) => ({ text: option, onPress: () => setFoodType(option) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const openUnitPicker = () => {
    const options = [...NUTRITION_UNIT_OPTIONS];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, 'Cancel'],
          cancelButtonIndex: options.length,
        },
        (index) => {
          if (index === options.length) return;
          setUnit(options[index]);
        }
      );
    } else {
      Alert.alert('Select Unit', undefined, [
        ...options.map((option) => ({ text: option, onPress: () => setUnit(option) })),
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

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setFoodType('');
    setFoodName('');
    setQuantityInput('');
    setUnit('ounces');
    setCaloriesInput('');
    setAddOns('');
    setRepeatDays(0);
    setActualDate('');
    setNotes('');
    setEditingEntry(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (entry: NutritionEntry) => {
    setEditingEntry(entry);
    setDate(entry.date);
    setFoodType(entry.foodType);
    setFoodName(entry.foodName);
    setQuantityInput(String(entry.quantity));
    setUnit(entry.unit);
    setCaloriesInput(String(entry.calories));
    setAddOns(entry.addOns ?? '');
    setRepeatDays(entry.repeatDays ?? 0);
    setActualDate(entry.actualDate ?? '');
    setNotes(entry.notes ?? '');
    setShowForm(true);
  };

  const handleDelete = (entry: NutritionEntry) => {
    Alert.alert('Delete Plan', `Delete ${entry.foodName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNutritionEntry(entry.id);
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!selectedCanineId) {
      Alert.alert('Select Pet', 'Choose a canine before saving a plan.');
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
      canineId: selectedCanineId,
      date,
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
      if (editingEntry) {
        await updateNutritionEntry(editingEntry.id, payload);
        Alert.alert('Updated', 'Nutrition plan updated successfully.');
      } else {
        await addNutritionEntry(payload);
        Alert.alert('Saved', 'Nutrition plan created successfully.');
      }
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving nutrition entry:', error);
      Alert.alert('Error', 'Unable to save the entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView
      style={[styles.screen, { paddingTop: insets.top + 12 }]}
      darkColor={colors.background}
      lightColor={colors.background}>
      <View style={styles.headerRow}>
        <ThemedText style={[styles.title, { color: colors.text }]}>Nutrition Planner (Admin)</ThemedText>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.tint }]} onPress={openCreateForm}>
          <IconSymbol name="plus" size={18} color={colors.inverseText} />
          <ThemedText style={styles.addButtonText}>Add</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={openCaninePicker}>
          <IconSymbol name="pawprint" size={16} color={colors.icon} />
          <ThemedText style={[styles.filterChipText, { color: colors.text }]}>
            {selectedCanineId ? canines.find((c) => c.id === selectedCanineId)?.name ?? 'Select Pet' : 'All Pets'}
          </ThemedText>
          <IconSymbol name="chevron.down" size={14} color={colors.icon} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <IconSymbol name="magnifyingglass" size={16} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search"
            placeholderTextColor={`${colors.icon}80`}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <ThemedView
            style={[styles.emptyState, { borderColor: `${colors.icon}1A`, backgroundColor: colors.surface }]}
            darkColor={colors.surface}
            lightColor={colors.surface}>
            <IconSymbol name="leaf" size={36} color={colors.icon} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No entries found</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Use the Add button to create a plan.</ThemedText>
          </ThemedView>
        )}
        renderItem={({ item }) => (
          <ThemedView
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
            darkColor={colors.surface}
            lightColor={colors.surface}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleBlock}>
                <ThemedText style={[styles.cardTitle, { color: colors.text }]}>{item.foodType}</ThemedText>
                <ThemedText style={[styles.cardSubtitle, { color: colors.secondaryText }]}>{item.foodName}</ThemedText>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openEditForm(item)} style={styles.iconButton} accessibilityRole="button">
                  <IconSymbol name="pencil" size={18} color={colors.tint} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconButton} accessibilityRole="button">
                  <IconSymbol name="trash" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardRow}>
              <IconSymbol name="pawprint" size={14} color={colors.icon} />
              <ThemedText style={[styles.cardRowText, { color: colors.text }]}>
                {canines.find((c) => c.id === item.canineId)?.name ?? 'Unknown'}
              </ThemedText>
            </View>
            <View style={styles.cardRow}>
              <IconSymbol name="scalemass" size={14} color={colors.icon} />
              <ThemedText style={[styles.cardRowText, { color: colors.text }]}>{formatPlannedLine(item)}</ThemedText>
            </View>
            <View style={styles.cardRow}>
              <IconSymbol name="calendar" size={14} color={colors.icon} />
              <ThemedText style={[styles.cardRowText, { color: colors.text }]}>{formatDisplayDate(item.date)}</ThemedText>
            </View>
            {item.actualDate ? (
              <View style={styles.cardRow}>
                <IconSymbol name="checkmark.circle" size={14} color={colors.icon} />
                <ThemedText style={[styles.cardRowText, { color: colors.text }]}>
                  Actual: {formatDisplayDate(item.actualDate)}
                </ThemedText>
              </View>
            ) : null}
            {item.addOns ? (
              <View style={styles.cardRow}>
                <IconSymbol name="plus.circle" size={14} color={colors.icon} />
                <ThemedText style={[styles.cardRowText, { color: colors.secondaryText }]} numberOfLines={1}>
                  {item.addOns}
                </ThemedText>
              </View>
            ) : null}
            <ThemedText style={[styles.cardFooter, { color: colors.secondaryText }]}>Repeat: {item.repeatDays ?? 0} days</ThemedText>
          </ThemedView>
        )}
      />

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <ThemedView style={[styles.modalScreen, { backgroundColor: colors.background }]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 32 : 0}>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowForm(false)} style={styles.modalBackButton} accessibilityRole="button">
                  <IconSymbol name="xmark" size={24} color={colors.text} />
                </TouchableOpacity>
                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                  {editingEntry ? 'Edit Meal Plan' : 'Add Meal Plan'}
                </ThemedText>
                <View style={{ width: 24 }} />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: colors.text }]}>Date *</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={`${colors.icon}80`}
                />
              </View>

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
                  value={foodName}
                  onChangeText={setFoodName}
                  placeholder="Enter name"
                  placeholderTextColor={`${colors.icon}80`}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.half}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>Quantity *</ThemedText>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                    value={quantityInput}
                    onChangeText={setQuantityInput}
                    placeholder="0"
                    placeholderTextColor={`${colors.icon}80`}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.half}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>Unit *</ThemedText>
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
                  value={caloriesInput}
                  onChangeText={setCaloriesInput}
                  placeholder="0"
                  placeholderTextColor={`${colors.icon}80`}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: colors.text }]}>Add On’s</ThemedText>
                <TextInput
                  style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={addOns}
                  onChangeText={setAddOns}
                  placeholder="Optional add-ons"
                  placeholderTextColor={`${colors.icon}80`}
                  multiline
                />
              </View>

              <View style={styles.row}>
                <View style={styles.half}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>Repeat plan for days?</ThemedText>
                  <TouchableOpacity
                    style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    onPress={openRepeatPicker}>
                    <ThemedText style={[styles.selectText, { color: colors.text }]}>{repeatDays}</ThemedText>
                    <IconSymbol name="chevron.down" size={16} color={colors.icon} />
                  </TouchableOpacity>
                </View>
                <View style={styles.half}>
                  <ThemedText style={[styles.label, { color: colors.text }]}>Actual Date</ThemedText>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                    value={actualDate}
                    onChangeText={setActualDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={`${colors.icon}80`}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: colors.text }]}>Notes</ThemedText>
                <TextInput
                  style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Optional notes"
                  placeholderTextColor={`${colors.icon}80`}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}
              accessibilityRole="toolbar">
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={isSaving}>
                <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.tint, opacity: isSaving ? 0.7 : 1 }]}
                onPress={handleSave}
                disabled={isSaving}>
                <ThemedText style={styles.primaryButtonText}>{isSaving ? 'Saving…' : editingEntry ? 'Update' : 'Save'}</ThemedText>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      paddingHorizontal: 20,
      backgroundColor: colors.background,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    filterChipText: {
      fontSize: 14,
      fontWeight: '600',
      flexShrink: 1,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
    },
    listContent: {
      paddingBottom: 120,
      gap: 16,
    },
    card: {
      borderRadius: 24,
      borderWidth: 1,
      padding: 20,
      gap: 10,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitleBlock: {
      flex: 1,
      gap: 4,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    cardSubtitle: {
      fontSize: 14,
      fontWeight: '500',
    },
    cardActions: {
      flexDirection: 'row',
      gap: 8,
    },
    iconButton: {
      padding: 6,
      borderRadius: 14,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardRowText: {
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    cardFooter: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 6,
    },
    emptyState: {
      marginTop: 32,
      borderRadius: 24,
      borderWidth: 1,
      paddingVertical: 32,
      paddingHorizontal: 16,
      alignItems: 'center',
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    emptySubtitle: {
      fontSize: 13,
      textAlign: 'center',
      fontWeight: '500',
    },
    modalScreen: {
      flex: 1,
    },
    modalContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 18,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 12,
      paddingTop: 16,
    },
    modalBackButton: {
      padding: 6,
      borderRadius: 16,
    },
    modalTitle: {
      fontSize: 20,
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
      minHeight: 110,
      textAlignVertical: 'top',
      fontSize: 16,
      fontWeight: '600',
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
    row: {
      flexDirection: 'row',
      gap: 16,
    },
    half: {
      flex: 1,
      gap: 6,
    },
    modalFooter: {
      borderTopWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
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
  });


