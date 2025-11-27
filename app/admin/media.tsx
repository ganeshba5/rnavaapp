import { StyleSheet, ScrollView, View, FlatList, Linking, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Image } from 'expo-image';

/**
 * Admin Media Items Screen
 * Shows all media items across all users
 */
export default function AdminMediaScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { mediaItems, canines, allUsers } = useApp();

  const mediaByUser = allUsers.reduce<Record<string, { userName: string; items: typeof mediaItems }>>( (acc, user) => {
    acc[user.id] = { userName: `${user.firstName} ${user.lastName}`, items: [] };
    return acc;
  }, {});

  mediaItems.forEach((item) => {
    const canine = canines.find((c) => c.id === item.canineId);
    if (!canine) {
      return;
    }
    const userGroup = mediaByUser[canine.userId];
    if (userGroup) {
      userGroup.items.push(item);
    }
  });

  const sections = Object.values(mediaByUser)
    .filter((section) => section.items.length > 0)
    .sort((a, b) => a.userName.localeCompare(b.userName));

  const renderMediaCard = (item: (typeof mediaItems)[number]) => {
    const canine = canines.find((c) => c.id === item.canineId);
    const caption = item.caption ? ` • ${item.caption}` : '';
    return (
      <View key={item.id} style={[styles.mediaCard, { borderColor: colors.icon }]}> 
        <View style={styles.mediaHeader}>
          <ThemedText type="defaultSemiBold" style={styles.mediaPet} numberOfLines={1}>
            {(canine?.name || 'Unknown Canine') + caption}
          </ThemedText>
          <TouchableOpacity
            style={[styles.viewButton, { borderColor: colors.icon }]}
            onPress={() => Linking.openURL(item.uri)}>
            <ThemedText style={[styles.viewButtonText, { color: colors.primary }]}>View</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.mediaMeta} numberOfLines={1}>
          {item.type === 'photo' ? 'Photo' : 'Video'}
        </ThemedText>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}> 
      <ThemedView style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { borderColor: colors.icon }]}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <IconSymbol name="chevron.left" size={20} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={[styles.title, { color: colors.primary }]}> 
            Media Items
          </ThemedText>
        </View>
        <ThemedText style={styles.count}>{mediaItems.length}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        {sections.length === 0 ? (
          <ThemedText style={styles.emptyText}>No media items found</ThemedText>
        ) : (
          sections.map((section) => (
            <View key={section.userName} style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {section.userName}
              </ThemedText>
              <FlatList
                data={section.items}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => renderMediaCard(item)}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          ))
        )}
      </ThemedView>
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
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 999,
    padding: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  mediaCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mediaPet: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  mediaMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 20,
  },
});


