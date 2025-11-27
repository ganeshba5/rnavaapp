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
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, type ThemeColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { ImmunizationRecord } from '@/types';

const formatAge = (years: number, months: number) => {
  const y = `${years}y`;
  const m = `${months}m`;
  return `${y}${m}`;
};

const formatDisplayDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const formatTimestamp = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export default function ImmunizationListScreen() {
  const { canineId } = useLocalSearchParams<{ canineId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { getImmunizationsByCanine, deleteImmunizationRecord } = useApp();

  const [search, setSearch] = useState('');

  const immunizations = useMemo(() => {
    const items = canineId ? getImmunizationsByCanine(canineId) : [];
    if (!search.trim()) return items;
    const term = search.trim().toLowerCase();
    return items.filter((record) =>
      [record.vetName, record.vaccineName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [canineId, getImmunizationsByCanine, search]);

  const handleAdd = () => {
    if (!canineId) {
      Alert.alert('Select Pet', 'Please open this screen from a canine profile.');
      return;
    }
    router.push(`/(tabs)/immunizations/create?canineId=${canineId}`);
  };

  const handleEdit = (record: ImmunizationRecord) => {
    if (!canineId) return;
    router.push(`/(tabs)/immunizations/create?canineId=${canineId}&recordId=${record.id}`);
  };

  const confirmDelete = (record: ImmunizationRecord) => {
    Alert.alert('Delete Immunization', `Remove record for ${record.vaccineName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteImmunizationRecord(record.id);
        },
      },
    ]);
  };

  const openMenu = (record: ImmunizationRecord) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (index) => {
          if (index === 1) handleEdit(record);
          if (index === 2) confirmDelete(record);
        }
      );
    } else {
      Alert.alert(record.vaccineName, 'Choose an action', [
        { text: 'Edit', onPress: () => handleEdit(record) },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(record) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <ThemedView
      style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) }]}
      darkColor={colors.background}
      lightColor={colors.background}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
          <ThemedText style={[styles.backLabel, { color: colors.text }]}>Back</ThemedText>
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <ThemedText style={[styles.title, { color: colors.text }]}>Immunization Tracker</ThemedText>
          <View style={[styles.countBadge, { backgroundColor: `${colors.tint}22` }]}
            accessibilityRole="text">
            <ThemedText style={[styles.countText, { color: colors.tint }]}>{immunizations.length}</ThemedText>
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
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={immunizations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <ThemedView style={[styles.emptyState, { borderColor: `${colors.icon}33` }]}
            darkColor={colors.surface}
            lightColor={colors.surface}>
            <IconSymbol name="syringe" size={32} color={colors.icon} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No immunizations yet</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Tap the plus button to log one.</ThemedText>
          </ThemedView>
        )}
        renderItem={({ item }) => (
          <ThemedView
            key={item.id}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
              <ThemedText style={[styles.cardTitle, { color: colors.text }]}>{item.vetName}</ThemedText>
              <TouchableOpacity style={styles.cardMenuButton} onPress={() => openMenu(item)} accessibilityRole="button">
                <IconSymbol name="ellipsis" size={18} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.fieldRow}>
                <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>Age</ThemedText>
                <ThemedText style={[styles.fieldValue, { color: colors.text }]}>
                  {formatAge(item.ageYears, item.ageMonths)}
                </ThemedText>
              </View>
              <View style={styles.fieldRow}>
                <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>Vaccine</ThemedText>
                <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{item.vaccineName}</ThemedText>
              </View>
              <View style={styles.fieldRow}>
                <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>Immunization Date</ThemedText>
                <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{formatDisplayDate(item.immunizationDate)}</ThemedText>
              </View>
              <View style={styles.fieldRow}>
                <ThemedText style={[styles.fieldLabel, { color: colors.secondaryText }]}>Last Vaccinated Date</ThemedText>
                <ThemedText style={[styles.fieldValue, { color: colors.text }]}>{formatDisplayDate(item.lastVaccinatedDate)}</ThemedText>
              </View>
            </View>
            <View style={[styles.timestampPill, { backgroundColor: `${colors.tint}1A` }]}
              accessibilityRole="text">
              <ThemedText style={[styles.timestampText, { color: colors.tint }]}>{formatTimestamp(item.updatedAt)}</ThemedText>
            </View>
          </ThemedView>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint, shadowColor: colors.shadow }]}
        onPress={handleAdd}
        accessibilityRole="button"
        accessibilityLabel="Add immunization">
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
      gap: 12,
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
      gap: 12,
      borderRadius: 18,
      borderWidth: 1,
      padding: 14,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    fieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
    },
    fieldValue: {
      fontSize: 14,
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


