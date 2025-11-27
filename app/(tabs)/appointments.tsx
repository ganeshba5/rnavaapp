import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActionSheetIOS,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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

const formatDisplayDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const formatDisplayTime = (value: string) => (value ? value : '—');

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export default function AppointmentsScreen() {
  const { canineId } = useLocalSearchParams<{ canineId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const { appointments, canines, deleteAppointment } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const canineNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    canines.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [canines]);

  const filteredAppointments = useMemo(() => {
    let items = appointments;
    if (canineId) {
      items = items.filter((item) => item.canineId === canineId);
    }
    if (selectedCategory) {
      items = items.filter((item) => item.category === selectedCategory);
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      items = items.filter((item) =>
        [item.title, item.description, item.category]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term))
      );
    }
    return [...items].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
    });
  }, [appointments, canineId, search, selectedCategory]);

  const handleAdd = () => {
    const base = '/(tabs)/appointments/create';
    if (canineId) {
      router.push(`${base}?canineId=${canineId}`);
    } else {
      router.push(base as any);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    const base = `/(tabs)/appointments/create?recordId=${appointment.id}`;
    if (canineId ?? appointment.canineId) {
      router.push(`${base}&canineId=${appointment.canineId}` as any);
    } else {
      router.push(base as any);
    }
  };

  const confirmDelete = (appointment: Appointment) => {
    Alert.alert('Delete Schedule', `Remove “${appointment.title}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteAppointment(appointment.id);
        },
      },
    ]);
  };

  const openCategoryPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['All Categories', ...CATEGORY_OPTIONS, 'Cancel'],
          cancelButtonIndex: CATEGORY_OPTIONS.length + 1,
        },
        (index) => {
          if (index === CATEGORY_OPTIONS.length + 1) return;
          if (index === 0) {
            setSelectedCategory('');
          } else {
            setSelectedCategory(CATEGORY_OPTIONS[index - 1]);
          }
        }
      );
    } else {
      Alert.alert('Select Category', undefined, [
        { text: 'All Categories', onPress: () => setSelectedCategory('') },
        ...CATEGORY_OPTIONS.map((category) => ({ text: category, onPress: () => setSelectedCategory(category) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const renderItem = ({ item }: { item: Appointment }) => (
    <ThemedView
      key={item.id}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
      darkColor={colors.surface}
      lightColor={colors.surface}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <ThemedText style={[styles.cardTitle, { color: colors.text }]}>{item.title}</ThemedText>
          <ThemedText style={[styles.cardSubtitle, { color: colors.secondaryText }]}
            numberOfLines={1}>
            {item.category} • {canineNameMap[item.canineId] ?? 'Unknown Pet'}
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.cardMenuButton} onPress={() => openItemMenu(item)} accessibilityRole="button">
          <IconSymbol name="ellipsis" size={18} color={colors.icon} />
        </TouchableOpacity>
      </View>
      {item.description ? (
        <ThemedText style={[styles.cardDescription, { color: colors.secondaryText }]}
          numberOfLines={2}>
          {item.description}
        </ThemedText>
      ) : null}
      <View style={styles.scheduleRow}>
        <View style={styles.scheduleColumn}>
          <ThemedText style={[styles.scheduleLabel, { color: colors.secondaryText }]}>Start Date</ThemedText>
          <ThemedText style={[styles.scheduleValue, { color: colors.text }]}>{formatDisplayDate(item.date)}</ThemedText>
        </View>
        <View style={styles.scheduleColumn}>
          <ThemedText style={[styles.scheduleLabel, { color: colors.secondaryText }]}>Start Time</ThemedText>
          <ThemedText style={[styles.scheduleValue, { color: colors.text }]}>{formatDisplayTime(item.startTime)}</ThemedText>
        </View>
        <View style={styles.scheduleColumn}>
          <ThemedText style={[styles.scheduleLabel, { color: colors.secondaryText }]}>End Time</ThemedText>
          <ThemedText style={[styles.scheduleValue, { color: colors.text }]}>{formatDisplayTime(item.endTime)}</ThemedText>
        </View>
      </View>
      <View style={[styles.timestampPill, { backgroundColor: `${colors.tint}1A` }]}
        accessibilityRole="text">
        <ThemedText style={[styles.timestampText, { color: colors.tint }]}> {formatTimestamp(item.updatedAt)}</ThemedText>
      </View>
    </ThemedView>
  );

  const openItemMenu = (appointment: Appointment) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (index) => {
          if (index === 1) handleEdit(appointment);
          if (index === 2) confirmDelete(appointment);
        }
      );
    } else {
      Alert.alert(appointment.title, 'Choose an action', [
        { text: 'Edit', onPress: () => handleEdit(appointment) },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(appointment) },
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
        <ThemedText style={[styles.title, { color: colors.text }]}>Canine Schedule</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.categorySelector, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={openCategoryPicker}
          accessibilityRole="button">
          <ThemedText
            style={[styles.categorySelectorText, { color: selectedCategory ? colors.text : colors.secondaryText }]}
            numberOfLines={1}>
            {selectedCategory ? selectedCategory : 'Select Category'}
          </ThemedText>
          <IconSymbol name="chevron.down" size={16} color={colors.icon} />
        </TouchableOpacity>
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
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <ThemedView style={[styles.emptyState, { borderColor: `${colors.icon}33` }]}>
            <IconSymbol name="calendar" size={36} color={colors.icon} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No schedule entries yet</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.secondaryText }]}>Tap the plus button to create one.</ThemedText>
          </ThemedView>
        )}
        renderItem={renderItem}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint, shadowColor: colors.shadow }]}
        onPress={handleAdd}
        accessibilityRole="button"
        accessibilityLabel="Add schedule">
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
      marginBottom: 16,
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
      fontSize: 24,
      fontWeight: '700',
    },
    filters: {
      marginBottom: 12,
    },
    categorySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    categorySelectorText: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      marginRight: 10,
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
    cardTitleBlock: {
      flex: 1,
      gap: 4,
      marginRight: 12,
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
    cardDescription: {
      fontSize: 13,
      fontWeight: '500',
    },
    scheduleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    scheduleColumn: {
      flex: 1,
      gap: 4,
    },
    scheduleLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    scheduleValue: {
      fontSize: 14,
      fontWeight: '700',
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


