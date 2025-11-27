import { useMemo, useState } from 'react';
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

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, type ThemeColors } from '@/constants/theme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/context/AppContext';
import type { CanineAllergy } from '@/types';

export default function NutritionAllergiesScreen() {
  const { canineId: canineParam } = useLocalSearchParams<{ canineId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const {
    canines,
    getCanineAllergiesByCanine,
    addCanineAllergy,
    updateCanineAllergy,
    deleteCanineAllergy,
  } = useApp();

  const activeCanineId = useMemo(() => {
    if (canineParam) return canineParam;
    return canines[0]?.id ?? null;
  }, [canineParam, canines]);

  const [search, setSearch] = useState('');

  const allergies = useMemo(() => {
    if (!activeCanineId) return [];
    const items = getCanineAllergiesByCanine(activeCanineId);
    if (!search.trim()) return items;
    const term = search.trim().toLowerCase();
    return items.filter((item) =>
      [item.foodType, item.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    );
  }, [activeCanineId, getCanineAllergiesByCanine, search]);

  const handleAdd = () => {
    if (!activeCanineId) {
      Alert.alert('Select Pet', 'Please choose or create a canine profile first.');
      return;
    }
    router.push(`/(tabs)/nutrition/create-allergy?canineId=${activeCanineId}`);
  };

  const handleEdit = (item: CanineAllergy) => {
    if (!activeCanineId) return;
    router.push(`/(tabs)/nutrition/create-allergy?canineId=${activeCanineId}&recordId=${item.id}`);
  };

  const confirmDelete = (item: CanineAllergy) => {
    Alert.alert('Delete Item', `Remove “${item.name}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCanineAllergy(item.id);
        },
      },
    ]);
  };

  const openMenu = (item: CanineAllergy) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (index) => {
          if (index === 1) handleEdit(item);
          if (index === 2) confirmDelete(item);
        }
      );
    } else {
      Alert.alert(item.foodType, 'Choose an action', [
        { text: 'Edit', onPress: () => handleEdit(item) },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(item) },
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
        <ThemedText style={[styles.title, { color: colors.text }]}>The canine eats & Allergies</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search food type or item"
          placeholderTextColor={`${colors.icon}80`}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={allergies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <ThemedView
            style={[styles.emptyState, { borderColor: `${colors.icon}1A`, backgroundColor: colors.surface }]}
            darkColor={colors.surface}
            lightColor={colors.surface}>
            <IconSymbol name="bandage" size={32} color={colors.icon} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No entries yet</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Tap the plus button to add a favourite food or allergy.</ThemedText>
          </ThemedView>
        )}
        renderItem={({ item }) => (
          <ThemedView
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
            darkColor={colors.surface}
            lightColor={colors.surface}>
            <View style={styles.cardHeader}>
              <ThemedText style={[styles.cardTitle, { color: colors.text }]}>{item.foodType}</ThemedText>
              <TouchableOpacity style={styles.cardMenuButton} onPress={() => openMenu(item)} accessibilityRole="button">
                <IconSymbol name="ellipsis" size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <ThemedText style={[styles.cardBody, { color: colors.secondaryText }]}>{item.name}</ThemedText>
          </ThemedView>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint, shadowColor: colors.shadow }]}
        onPress={handleAdd}
        accessibilityRole="button"
        accessibilityLabel="Add item">
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
    title: {
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
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
      gap: 12,
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
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    cardMenuButton: {
      padding: 6,
      borderRadius: 16,
    },
    cardBody: {
      fontSize: 14,
      fontWeight: '500',
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


