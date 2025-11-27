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

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, type ThemeColors } from '@/constants/theme';
import { FOOD_TYPE_OPTIONS } from '@/constants/nutrition';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/context/AppContext';
import type { CanineAllergy } from '@/types';

export default function CreateAllergyScreen() {
  const { canineId: canineParam, recordId } = useLocalSearchParams<{ canineId?: string; recordId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const {
    canines,
    getCanineAllergiesByCanine,
    addCanineAllergy,
    updateCanineAllergy,
  } = useApp();

  const resolvedCanineId = useMemo(() => {
    if (canineParam) return canineParam;
    return canines[0]?.id ?? null;
  }, [canineParam, canines]);

  const existingAllergy: CanineAllergy | undefined = useMemo(() => {
    if (!recordId || !resolvedCanineId) return undefined;
    return getCanineAllergiesByCanine(resolvedCanineId).find((item) => item.id === recordId);
  }, [recordId, resolvedCanineId, getCanineAllergiesByCanine]);

  const [foodType, setFoodType] = useState(existingAllergy?.foodType ?? '');
  const [name, setName] = useState(existingAllergy?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingAllergy) {
      setFoodType(existingAllergy.foodType);
      setName(existingAllergy.name);
    }
  }, [existingAllergy]);

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
    if (!name.trim()) {
      Alert.alert('Validation', 'Enter a food name or allergy.');
      return;
    }

    const payload: Omit<CanineAllergy, 'id' | 'createdAt' | 'updatedAt'> = {
      canineId: resolvedCanineId,
      foodType: foodType.trim(),
      name: name.trim(),
    };

    try {
      setIsSaving(true);
      if (existingAllergy && recordId) {
        await updateCanineAllergy(recordId, payload);
        Alert.alert('Updated', 'Entry updated successfully.');
      } else {
        await addCanineAllergy(payload);
        Alert.alert('Saved', 'Entry added successfully.');
      }
      router.back();
    } catch (error) {
      console.error('Error saving allergy item:', error);
      Alert.alert('Error', 'Unable to save this entry. Please try again.');
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
              <ThemedText style={[styles.backLabel, { color: colors.text }]}>Back</ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              {existingAllergy ? 'Edit Entry' : 'Create Canine Eats & Allergies'}
            </ThemedText>
            <View style={{ width: 44 }} />
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
            <ThemedText style={[styles.label, { color: colors.text }]}>Food Name *</ThemedText>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder="Enter name"
              placeholderTextColor={`${colors.icon}80`}
              value={name}
              onChangeText={setName}
              maxLength={100}
              multiline
            />
            <ThemedText style={[styles.helperText, { color: colors.secondaryText }]}>{name.length}/100</ThemedText>
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
            <ThemedText style={styles.primaryButtonText}>{isSaving ? 'Saving…' : existingAllergy ? 'Update' : 'Save'}</ThemedText>
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
      gap: 20,
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
    formGroup: {
      gap: 6,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
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


