import { useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, type ThemeColors } from '@/constants/theme';
import { NUTRITION_DAY_COUNT } from '@/constants/nutrition';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/context/AppContext';
import type { NutritionEntry } from '@/types';

function formatDisplayDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatChipDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function buildDateWindow(count: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, idx) => {
    const date = new Date(start);
    date.setDate(start.getDate() + idx);
    return date.toISOString().split('T')[0];
  });
}

function formatPlannedLine(entry: NutritionEntry) {
  return `${entry.quantity} ${entry.unit} / ${entry.calories} cal`;
}

export default function NutritionScheduleScreen() {
  const { canineId: canineParam, date: initialDate } = useLocalSearchParams<{ canineId?: string; date?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const { canines, getNutritionEntriesByCanine, deleteNutritionEntry } = useApp();

  const dateWindow = useMemo(() => buildDateWindow(NUTRITION_DAY_COUNT), []);

  const resolveInitialDate = useMemo(() => {
    if (initialDate && dateWindow.includes(initialDate)) {
      return initialDate;
    }
    return dateWindow[0] ?? new Date().toISOString().split('T')[0];
  }, [initialDate, dateWindow]);

  const [selectedDate, setSelectedDate] = useState(resolveInitialDate);
  const [search, setSearch] = useState('');

  const activeCanineId = useMemo(() => {
    if (canineParam) return canineParam;
    return canines[0]?.id ?? null;
  }, [canineParam, canines]);

  const entries = useMemo(() => {
    if (!activeCanineId) return [];
    const items = getNutritionEntriesByCanine(activeCanineId).filter((entry) => entry.date === selectedDate);
    if (!search.trim()) return items;
    const term = search.trim().toLowerCase();
    return items.filter((entry) =>
      [entry.foodType, entry.foodName, entry.addOns]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    );
  }, [activeCanineId, getNutritionEntriesByCanine, selectedDate, search]);

  useEffect(() => {
    if (initialDate && dateWindow.includes(initialDate)) {
      setSelectedDate(initialDate);
    }
  }, [initialDate, dateWindow]);

  const handleAdd = () => {
    if (!activeCanineId) {
      Alert.alert('Select Pet', 'Please choose or create a canine profile first.');
      return;
    }
    router.push(`/(tabs)/nutrition/create-plan?canineId=${activeCanineId}&date=${selectedDate}`);
  };

  const handleEdit = (entry: NutritionEntry) => {
    if (!activeCanineId) return;
    router.push(`/(tabs)/nutrition/create-plan?canineId=${activeCanineId}&recordId=${entry.id}`);
  };

  const confirmDelete = (entry: NutritionEntry) => {
    Alert.alert('Delete Plan', `Delete meal plan “${entry.foodName}”?`, [
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

  const openMenu = (entry: NutritionEntry) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (index) => {
          if (index === 1) handleEdit(entry);
          if (index === 2) confirmDelete(entry);
        }
      );
    } else {
      Alert.alert(entry.foodName, 'Choose an action', [
        { text: 'Edit', onPress: () => handleEdit(entry) },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(entry) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <ThemedView
      style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 20) }]}
      darkColor={colors.background}
      lightColor={colors.background}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
          <ThemedText style={[styles.backLabel, { color: colors.text }]}>Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={[styles.title, { color: colors.text }]}>Dietary Information for day!</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <FlatList
              data={dateWindow}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateRow}
              renderItem={({ item }) => {
                const isActive = item === selectedDate;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.dateChip, isActive && { backgroundColor: colors.tint }]}
                    onPress={() => {
                      setSelectedDate(item);
                      setSearch('');
                    }}>
                    <ThemedText style={[styles.dateChipLabel, { color: isActive ? colors.inverseText : colors.text }]}>
                      {formatChipDay(item)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              }}
            />

            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
              <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search food or add-ons"
                placeholderTextColor={`${colors.icon}80`}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
            </View>
          </>
        }
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
              <TouchableOpacity style={styles.cardMenuButton} onPress={() => openMenu(item)} accessibilityRole="button">
                <IconSymbol name="ellipsis" size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <View style={styles.cardRow}>
              <IconSymbol name="scalemass" size={16} color={colors.icon} />
              <ThemedText style={[styles.cardRowText, { color: colors.text }]}>{`Planned: ${formatPlannedLine(item)}`}</ThemedText>
            </View>
            <View style={styles.cardRow}>
              <IconSymbol name="calendar" size={16} color={colors.icon} />
              <ThemedText style={[styles.cardRowText, { color: colors.text }]}>{`Planned: ${formatDisplayDate(item.date)}`}</ThemedText>
            </View>
            <View style={styles.cardRow}>
              <IconSymbol name="checkmark.circle" size={16} color={colors.icon} />
              <ThemedText style={[styles.cardRowText, { color: colors.text }]}>
                {`Actual: ${item.actualDate ? formatDisplayDate(item.actualDate) : 'Not Available'}`}
              </ThemedText>
            </View>
            {item.addOns ? (
              <View style={styles.cardRow}>
                <IconSymbol name="plus.circle" size={16} color={colors.icon} />
                <ThemedText style={[styles.cardRowText, { color: colors.text }]} numberOfLines={1}>
                  {`Add-ons: ${item.addOns}`}
                </ThemedText>
              </View>
            ) : null}
            <View style={[styles.cardBadge, { backgroundColor: `${colors.tint}22` }]}
              accessibilityRole="text">
              <ThemedText style={[styles.cardBadgeText, { color: colors.tint }]}>{formatDisplayDate(item.createdAt)}</ThemedText>
            </View>
          </ThemedView>
        )}
        ListEmptyComponent={() => (
          <ThemedView
            style={[styles.emptyState, { borderColor: `${colors.icon}1A`, backgroundColor: colors.surface }]}
            darkColor={colors.surface}
            lightColor={colors.surface}>
            <IconSymbol name="leaf" size={32} color={colors.icon} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No meals planned</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Tap the plus button to add one.</ThemedText>
          </ThemedView>
        )}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint, shadowColor: colors.shadow }]}
        onPress={handleAdd}
        accessibilityRole="button"
        accessibilityLabel="Add meal">
        <IconSymbol name="plus" size={24} color={colors.inverseText} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
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
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
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
      gap: 12,
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
    cardMenuButton: {
      padding: 6,
      borderRadius: 16,
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
    cardBadge: {
      alignSelf: 'flex-start',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    cardBadgeText: {
      fontSize: 12,
      fontWeight: '700',
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
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 6,
    },
  });
