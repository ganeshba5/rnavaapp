import { useMemo, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  Linking,
  ActionSheetIOS,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/context/AppContext';
import { MedicalRecord } from '@/types';

export default function MedicalRecordsListScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { canineId } = useLocalSearchParams<{ canineId?: string; recordId?: string }>();
  const { medicalRecords, deleteMedicalRecord } = useApp();
  const [search, setSearch] = useState('');

  const records = useMemo(() => {
    const base = canineId
      ? medicalRecords.filter((rec) => rec.canineId === canineId)
      : medicalRecords;

    if (!search.trim()) {
      return base;
    }
    const term = search.trim().toLowerCase();
    return base.filter(
      (rec) =>
        rec.vetName.toLowerCase().includes(term) ||
        rec.clinicName.toLowerCase().includes(term) ||
        rec.reportType.toLowerCase().includes(term)
    );
  }, [medicalRecords, canineId, search]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Medical Record', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMedicalRecord(id);
        },
      },
    ]);
  };

  const handleRecordOptions = (record: MedicalRecord) => {
    const editAction = () =>
      router.push({
        pathname: '/(tabs)/medical-records/create',
        params: { canineId: canineId ?? record.canineId, recordId: record.id },
      });
    const deleteAction = () => handleDelete(record.id);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
          title: record.vetName,
        },
        (index) => {
          if (index === 1) editAction();
          if (index === 2) deleteAction();
        }
      );
    } else {
      Alert.alert(record.vetName, undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: editAction },
        { text: 'Delete', style: 'destructive', onPress: deleteAction },
      ]);
    }
  };

  const handleOpenAttachment = async (uri: string) => {
    try {
      await Linking.openURL(uri);
    } catch (error) {
      console.error('Error opening attachment:', error);
      Alert.alert('Unable to open attachment');
    }
  };

  const handleCreate = () => {
    router.push({ pathname: '/(tabs)/medical-records/create', params: { canineId } });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 120 }}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
          <ThemedText style={styles.backLabel}>Back</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>Medical Records</ThemedText>
        <View style={{ width: 44 }} />
      </ThemedView>

      <View style={styles.content}>
        <View style={styles.countRow}>
          <ThemedText style={styles.countLabel}>Medical Records</ThemedText>
          <View style={styles.countBadge}>
            <ThemedText style={styles.countText}>{records.length}</ThemedText>
          </View>
        </View>
        <View style={[styles.searchBar, { borderColor: colors.icon }]}>
          <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search..."
            placeholderTextColor={`${colors.icon}99`}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
              <IconSymbol name="xmark.circle.fill" size={18} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {records.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="doc.text.fill" size={56} color={colors.icon} />
            <ThemedText style={styles.emptyTitle}>No medical records yet</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Tap the plus button below to add a new medical record.
            </ThemedText>
          </ThemedView>
        ) : (
          records.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={styles.recordHeaderText}>
                  <ThemedText style={styles.recordTitle}>{record.vetName}</ThemedText>
                  <ThemedText style={styles.recordSubtitle}>{record.clinicName}</ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.recordMenuButton}
                  onPress={() => handleRecordOptions(record)}>
                  <IconSymbol name="ellipsis" size={18} color={colors.icon} />
                </TouchableOpacity>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Medical Report Type</ThemedText>
                <ThemedText style={styles.detailValue}>{record.reportType}</ThemedText>
              </View>
              {record.attachments.length > 0 && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Upload Medical Report</ThemedText>
                  <View style={styles.attachmentRow}>
                    {record.attachments.map((attachment) => (
                      <TouchableOpacity
                        key={attachment.id}
                        style={styles.attachmentChip}
                        onPress={() => handleOpenAttachment(attachment.uri)}>
                        <IconSymbol
                          name={attachment.type === 'photo' ? 'photo' : 'doc.fill'}
                          size={14}
                          color={colors.tint}
                        />
                        <ThemedText style={styles.attachmentLabel} numberOfLines={1}>
                          {attachment.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <View style={styles.timestampBadge}>
                <ThemedText style={styles.timestampText}>
                  {new Date(record.createdAt).toLocaleString()}
                </ThemedText>
              </View>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={handleCreate}
        accessibilityRole="button"
        accessibilityLabel="Add medical record">
        <IconSymbol name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  countBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#312E81',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  recordCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  recordHeaderText: {
    flex: 1,
    gap: 4,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  recordSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  recordMenuButton: {
    padding: 6,
  },
  detailRow: {
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  attachmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  attachmentLabel: {
    fontSize: 12,
    color: '#1F2937',
    maxWidth: 180,
  },
  timestampBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timestampText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
});
