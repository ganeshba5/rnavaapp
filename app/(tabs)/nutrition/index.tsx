import { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, type ThemeColors } from '@/constants/theme';
import { NUTRITION_DAY_COUNT } from '@/constants/nutrition';
import { useApp } from '@/context/AppContext';
import type { NutritionEntry, CanineAllergy } from '@/types';

const formatDisplayDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatChipDay = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
};

const buildDateWindow = (count: number) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, idx) => {
    const date = new Date(start);
    date.setDate(start.getDate() + idx);
    return date.toISOString().split('T')[0];
  });
};

const formatPlannedLine = (entry: NutritionEntry) => `${entry.quantity} ${entry.unit} / ${entry.calories} cal`;

export default function NutritionDashboard() {
  const { canineId: canineParam } = useLocalSearchParams<{ canineId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const {
    canines,
    nutritionEntries,
    getNutritionEntriesByCanine,
    getCanineAllergiesByCanine,
    deleteNutritionEntry,
  } = useApp();

  const dateWindow = useMemo(() => buildDateWindow(NUTRITION_DAY_COUNT), []);
  const [selectedDate, setSelectedDate] = useState(() => dateWindow[0] ?? new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const activeCanineId = useMemo(() => {
    if (canineParam) return canineParam;
    return canines[0]?.id ?? null;
  }, [canineParam, canines]);

  const meals = useMemo(() => {
    if (!activeCanineId) return [];
    const items = getNutritionEntriesByCanine(activeCanineId).filter((entry) => entry.date === selectedDate);
    if (!searchTerm.trim()) return items;
    const term = searchTerm.trim().toLowerCase();
    return items.filter((entry) =>
      [entry.foodType, entry.foodName, entry.addOns]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    );
  }, [activeCanineId, getNutritionEntriesByCanine, selectedDate, searchTerm]);

  const allergies = useMemo<CanineAllergy[]>(() => {
    if (!activeCanineId) return [];
    return getCanineAllergiesByCanine(activeCanineId);
  }, [activeCanineId, getCanineAllergiesByCanine]);

  const handleAddMeal = () => {
    if (!activeCanineId) {
      Alert.alert('Select Pet', 'Please choose or create a canine profile first.');
      return;
    }
    router.push(`/(tabs)/nutrition/create-plan?canineId=${activeCanineId}&date=${selectedDate}`);
  };

  const handleSeeAllMeals = () => {
    if (!activeCanineId) return;
    router.push(`/(tabs)/nutrition/schedule?canineId=${activeCanineId}&date=${selectedDate}`);
  };

  const handleSeeAllAllergies = () => {
    if (!activeCanineId) return;
    router.push(`/(tabs)/nutrition/allergies?canineId=${activeCanineId}`);
  };

  const handleEditMeal = (entry: NutritionEntry) => {
    if (!activeCanineId) return;
    router.push(`/(tabs)/nutrition/create-plan?canineId=${activeCanineId}&recordId=${entry.id}`);
  };

  const confirmDeleteMeal = (entry: NutritionEntry) => {
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

  const openMealMenu = (entry: NutritionEntry) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (index) => {
          if (index === 1) handleEditMeal(entry);
          if (index === 2) confirmDeleteMeal(entry);
        }
      );
    } else {
      Alert.alert(entry.foodName, 'Choose an action', [
        { text: 'Edit', onPress: () => handleEditMeal(entry) },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteMeal(entry) },
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
        <View style={styles.headerTitles}>
          <ThemedText style={[styles.title, { color: colors.text }]}>Canine Nutrition</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.secondaryText }]}>Dietary information for day!</ThemedText>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
        {dateWindow.map((date) => {
          const isActive = date === selectedDate;
          return (
            <TouchableOpacity
              key={date}
              accessibilityRole="button"
              style={[styles.dateChip, isActive && { backgroundColor: colors.tint }]}
              onPress={() => {
                setSelectedDate(date);
                setSearchTerm('');
              }}>
              <ThemedText style={[styles.dateChipLabel, { color: isActive ? colors.inverseText : colors.text }]}>
                {formatChipDay(date)}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Schedule Daily Meal</ThemedText>
        <TouchableOpacity accessibilityRole="button" onPress={handleSeeAllMeals}>
          <ThemedText style={[styles.sectionLink, { color: colors.tint }]}>See All</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search food or add-ons"
          placeholderTextColor={`${colors.icon}80`}
          value={searchTerm}
          onChangeText={setSearchTerm}
          returnKeyType="search"
        />
      </View>

      {meals.length === 0 ? (
        <ThemedView
          style={[styles.emptyState, { borderColor: `${colors.icon}1A`, backgroundColor: colors.surface }]}
          darkColor={colors.surface}
          lightColor={colors.surface}>
          <IconSymbol name="leaf" size={32} color={colors.icon} />
          <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No meals planned</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Tap the plus button to plan today’s meal.</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.cardList}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <ThemedView
              style={[styles.mealCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
              darkColor={colors.surface}
              lightColor={colors.surface}>
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleBlock}>
                  <ThemedText style={[styles.mealTitle, { color: colors.text }]}>{item.foodType}</ThemedText>
                  <ThemedText style={[styles.mealSubtitle, { color: colors.secondaryText }]}>{item.foodName}</ThemedText>
                </View>
                <TouchableOpacity accessibilityRole="button" style={styles.mealMenuButton} onPress={() => openMealMenu(item)}>
                  <IconSymbol name="ellipsis" size={18} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <View style={styles.mealDetailsRow}>
                <IconSymbol name="scalemass" size={16} color={colors.icon} />
                <ThemedText style={[styles.mealDetailText, { color: colors.text }]}>{`Planned: ${formatPlannedLine(item)}`}</ThemedText>
              </View>
              <View style={styles.mealDetailsRow}>
                <IconSymbol name="calendar" size={16} color={colors.icon} />
                <ThemedText style={[styles.mealDetailText, { color: colors.text }]}>{`Planned: ${formatDisplayDate(item.date)}`}</ThemedText>
              </View>
              <View style={styles.mealDetailsRow}>
                <IconSymbol name="checkmark.circle" size={16} color={colors.icon} />
                <ThemedText style={[styles.mealDetailText, { color: colors.text }]}>
                  {`Actual: ${item.actualDate ? formatDisplayDate(item.actualDate) : 'Not Available'}`}
                </ThemedText>
              </View>
              {item.addOns ? (
                <View style={styles.mealDetailsRow}>
                  <IconSymbol name="plus.circle" size={16} color={colors.icon} />
                  <ThemedText style={[styles.mealDetailText, { color: colors.text }]} numberOfLines={1}>
                    {`Add-ons: ${item.addOns}`}
                  </ThemedText>
                </View>
              ) : null}

              <View style={[styles.mealFooterBadge, { backgroundColor: `${colors.tint}22` }]}
                accessibilityRole="text">
                <ThemedText style={[styles.mealFooterText, { color: colors.tint }]}>{formatDisplayDate(item.createdAt)}</ThemedText>
              </View>
            </ThemedView>
          )}
        />
      )}

      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>The canine eats & Allergies</ThemedText>
        <TouchableOpacity accessibilityRole="button" onPress={handleSeeAllAllergies}>
          <ThemedText style={[styles.sectionLink, { color: colors.tint }]}>See All</ThemedText>
        </TouchableOpacity>
      </View>

      {allergies.length === 0 ? (
        <ThemedView
          style={[styles.emptyState, { borderColor: `${colors.icon}1A`, backgroundColor: colors.surface }]}
          darkColor={colors.surface}
          lightColor={colors.surface}>
          <IconSymbol name="bandage" size={28} color={colors.icon} />
          <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No allergies recorded</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Keep track of sensitivities and favourites here.</ThemedText>
        </ThemedView>
      ) : (
        <View style={styles.allergyList}>
          {allergies.slice(0, 4).map((item) => (
            <ThemedView
              key={item.id}
              style={[styles.allergyCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
              darkColor={colors.surface}
              lightColor={colors.surface}>
              <View style={styles.allergyHeader}>
                <ThemedText style={[styles.allergyType, { color: colors.text }]}>{item.foodType}</ThemedText>
                <IconSymbol name="ellipsis" size={16} color={colors.icon} />
              </View>
              <ThemedText style={[styles.allergyName, { color: colors.secondaryText }]} numberOfLines={2}>
                {item.name}
              </ThemedText>
            </ThemedView>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint, shadowColor: colors.shadow }]}
        onPress={handleAddMeal}
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
      paddingHorizontal: 20,
      backgroundColor: colors.background,
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
    headerTitles: {
      alignItems: 'center',
      gap: 4,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '500',
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
      backgroundColor: `${colors.surface}99`,
    },
    dateChipLabel: {
      fontSize: 14,
      fontWeight: '700',
    },
    sectionHeader: {
      marginTop: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    sectionLink: {
      fontSize: 14,
      fontWeight: '600',
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
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
    },
    emptyState: {
      marginTop: 12,
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
    cardList: {
      paddingVertical: 16,
      gap: 16,
    },
    mealCard: {
      borderRadius: 24,
      borderWidth: 1,
      padding: 20,
      gap: 10,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    mealHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    mealTitleBlock: {
      flex: 1,
      gap: 4,
    },
    mealTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    mealSubtitle: {
      fontSize: 14,
      fontWeight: '500',
    },
    mealMenuButton: {
      padding: 6,
      borderRadius: 16,
    },
    mealDetailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    mealDetailText: {
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    mealFooterBadge: {
      alignSelf: 'flex-start',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    mealFooterText: {
      fontSize: 12,
      fontWeight: '700',
    },
    allergyList: {
      marginTop: 12,
      gap: 12,
    },
    allergyCard: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 18,
      gap: 8,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    allergyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    allergyType: {
      fontSize: 16,
      fontWeight: '700',
    },
    allergyName: {
      fontSize: 14,
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
