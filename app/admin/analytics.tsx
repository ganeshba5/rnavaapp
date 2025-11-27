import { StyleSheet, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';

/**
 * Analytics & Dashboard Placeholder
 * This is a placeholder for future analytics implementation
 */
export default function AdminAnalytics() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { allUsers, canines, vets, contacts, nutritionEntries, trainingLogs, appointments, mediaItems } = useApp();

  const stats = [
    { label: 'Total Users', value: allUsers.length },
    { label: 'Total Canines', value: canines.length },
    { label: 'Total Vets', value: vets.length },
    { label: 'Total Contacts', value: contacts.length },
    { label: 'Nutrition Entries', value: nutritionEntries.length },
    { label: 'Training Logs', value: trainingLogs.length },
    { label: 'Appointments', value: appointments.length },
    { label: 'Media Items', value: mediaItems.length },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Analytics & Dashboard
        </ThemedText>
        <ThemedText style={styles.placeholderText}>
          This is a placeholder for future analytics and dashboard features.
        </ThemedText>

        <ThemedView style={styles.statsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Statistics
          </ThemedText>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <ThemedView key={index} style={[styles.statCard, { borderColor: colors.icon }]}>
                <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                  {stat.value}
                </ThemedText>
                <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
              </ThemedView>
            ))}
          </View>
        </ThemedView>

        <ThemedView style={styles.placeholderSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Future Features
          </ThemedText>
          <ThemedText style={styles.featureText}>• User activity analytics</ThemedText>
          <ThemedText style={styles.featureText}>• Growth metrics</ThemedText>
          <ThemedText style={styles.featureText}>• Usage statistics</ThemedText>
          <ThemedText style={styles.featureText}>• Revenue tracking</ThemedText>
          <ThemedText style={styles.featureText}>• Custom reports</ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  placeholderSection: {
    marginTop: 24,
  },
  featureText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
});





