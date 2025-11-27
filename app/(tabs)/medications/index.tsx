import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  ActionSheetIOS,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/context/AppContext';
import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { MedicationEntry } from '@/types';

function formatDisplayDate(value?: string) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
  } catch (error) {
    // ignore formatting error and fallback to raw value
  }
  return value;
}

function formatDisplayTime(value?: string) {
  if (!value) return '—';
  return value.length > 5 ? value.slice(0, 5) : value;
}

function formatTimestamp(value?: string) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  } catch (error) {
    // ignore error
  }
  return value;
}

export default function MedicationsScreen() {
  const { canineId } = useLocalSearchParams<{ canineId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { getMedicationsByCanine, deleteMedicationEntry } = useApp();

  const [search, setSearch] = useState('');

  const medications = useMemo(() => {
    const items = canineId ? getMedicationsByCanine(canineId) : [];
    if (!search.trim()) return items;
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      return (
        item.vetName.toLowerCase().includes(term) ||
        item.medicationName.toLowerCase().includes(term) ||
        item.reason.toLowerCase().includes(term)
      );
    });
  }, [canineId, getMedicationsByCanine, search]);

  const handleAdd = () => {
    if (!canineId) {
      Alert.alert('Select Pet', 'Please open this screen from a canine profile.');
      return;
    }
    router.push(`/(tabs)/medications/create?canineId=${canineId}`);
  };

  const handleEdit = (entry: MedicationEntry) => {
    if (!canineId) return;
    router.push(`/(tabs)/medications/create?canineId=${canineId}&entryId=${entry.id}`);
  };

  const confirmDelete = (entry: MedicationEntry) => {
    Alert.alert('Delete Medication', `Remove ${entry.medicationName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMedicationEntry(entry.id);
        },
      },
    ]);
  };

  const openCardMenu = (entry: MedicationEntry) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (selected) => {
          if (selected === 1) handleEdit(entry);
          if (selected === 2) confirmDelete(entry);
        }
      );
    } else {
      Alert.alert(entry.medicationName, 'Choose an action', [
        { text: 'Edit', onPress: () => handleEdit(entry) },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(entry) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) }]}
      darkColor={colors.background}
      lightColor={colors.background}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
          <ThemedText style={[styles.backLabel, { color: colors.text }]}>Back</ThemedText>
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <ThemedText style={[styles.title, { color: colors.text }]}>Medications/Vitamins</ThemedText>
          <View style={[styles.countBadge, { backgroundColor: `${colors.tint}22` }]}
            accessibilityRole="text">
            <ThemedText style={[styles.countText, { color: colors.tint }]}>{medications.length}</ThemedText>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search..."
          placeholderTextColor={`${colors.icon}99`}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <ThemedView style={[styles.emptyState, { borderColor: `${colors.icon}33` }]}
            darkColor={colors.surface}
            lightColor={colors.surface}>
            <IconSymbol name="pills" size={36} color={colors.icon} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No medications yet</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Tap the plus button to add one.</ThemedText>
          </ThemedView>
        )}
        renderItem={({ item }) => (
          <ThemedView
            key={item.id}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
            darkColor={colors.surface}
            lightColor={colors.surface}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <ThemedText style={[styles.cardTitle, { color: colors.text }]}>{item.vetName}</ThemedText>
                <ThemedText style={[styles.cardSubtitle, { color: colors.secondaryText }]}>{item.medicationName}</ThemedText>
              </View>
              <TouchableOpacity style={styles.cardMenuButton} onPress={() => openCardMenu(item)} accessibilityRole="button">
                <IconSymbol name="ellipsis" size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.fieldRow}>
                <View style={styles.fieldColumn}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>Reason</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]} numberOfLines={2}>
                    {item.reason || '—'}
                  </ThemedText>
                </View>
                <View style={styles.fieldColumn}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>Quantity</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{item.quantity}</ThemedText>
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldColumn}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>Dosage</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{item.dosageUnit}</ThemedText>
                </View>
                <View style={styles.fieldColumn}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>Frequency</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{item.frequency}</ThemedText>
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldColumn}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>Start Date</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{formatDisplayDate(item.startDate)}</ThemedText>
                </View>
                <View style={styles.fieldColumn}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>End Date</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{formatDisplayDate(item.endDate)}</ThemedText>
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldColumn}>
                  <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>Start Time</ThemedText>
                  <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{formatDisplayTime(item.startTime)}</ThemedText>
                </View>
              </View>
            </View>

            <View style={[styles.timestampPill, { backgroundColor: colors.tintSoft }]}
              accessibilityRole="text">
              <ThemedText style={[styles.timestampText, { color: colors.inverseText }]}>
                {formatTimestamp(item.updatedAt)}
              </ThemedText>
            </View>
          </ThemedView>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint, shadowColor: colors.shadow }]}
        onPress={handleAdd}
        accessibilityRole="button"
        accessibilityLabel="Add medication">
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
      marginBottom: 20,
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
    titleBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
    },
    countBadge: {
      minWidth: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    countText: {
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
      fontWeight: '500',
    },
    listContent: {
      paddingTop: 20,
      paddingBottom: 120,
      gap: 16,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      borderRadius: 24,
      borderWidth: 1,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginTop: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      textAlign: 'center',
    },
    card: {
      borderRadius: 24,
      borderWidth: 1,
      padding: 18,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      gap: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    cardHeaderText: {
      flex: 1,
      gap: 4,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    cardSubtitle: {
      fontSize: 15,
      fontWeight: '500',
    },
    cardMenuButton: {
      padding: 6,
      borderRadius: 16,
    },
    cardBody: {
      gap: 14,
    },
    fieldRow: {
      flexDirection: 'row',
      gap: 18,
    },
    fieldColumn: {
      flex: 1,
      gap: 4,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    fieldValue: {
      fontSize: 15,
      fontWeight: '600',
    },
    timestampPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 18,
    },
    timestampText: {
      fontSize: 13,
      fontWeight: '600',
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

export { createStyles };
