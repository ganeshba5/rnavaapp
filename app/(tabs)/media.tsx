import { useMemo, useRef, useState } from 'react';
import { FlatList, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ResizeMode, Video } from 'expo-av';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function MediaScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { mediaItems, userProfile, canines } = useApp();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const userMedia = useMemo(() => {
    if (!userProfile) return [];
    const ownedCanines = canines.filter((c) => c.userId === userProfile.id);
    const canineIds = ownedCanines.map((c) => c.id);
    return mediaItems
      .filter((item) => canineIds.includes(item.canineId))
      .map((item) => ({
        ...item,
        canine: ownedCanines.find((dog) => dog.id === item.canineId),
      }));
  }, [mediaItems, userProfile?.id, canines]);

  if (!userProfile) {
    return (
      <ThemedView style={styles.centered}>
        <IconSymbol name="pawprint.fill" size={48} color={colors.icon} />
        <ThemedText style={styles.infoText}>Sign in to view your media gallery.</ThemedText>
      </ThemedView>
    );
  }

  if (userMedia.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <IconSymbol name="photo.on.rectangle" size={48} color={colors.icon} />
        <ThemedText style={styles.infoText}>No media found for your pets yet.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to dashboard">
          <IconSymbol name="chevron.left" size={22} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={[styles.title, { color: colors.tint }]}>
          Media Gallery
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        ref={flatListRef}
        data={userMedia}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.carousel}
        onMomentumScrollEnd={(event) => {
          const width = event.nativeEvent.layoutMeasurement.width;
          const offset = event.nativeEvent.contentOffset.x;
          const index = Math.round(offset / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.mediaCard}>
              {item.type === 'video' ? (
                <Video
                  source={{ uri: item.uri }}
                  style={styles.mediaImage}
                  resizeMode={ResizeMode.COVER}
                  useNativeControls
                  shouldPlay={false}
                />
              ) : (
                <Image
                  source={{ uri: item.uri }}
                  style={styles.mediaImage}
                  contentFit="cover"
                  transition={300}
                />
              )}
              {item.type === 'video' && (
                <View style={styles.playOverlay}>
                  <IconSymbol name="play.circle.fill" size={56} color="#FFFFFFDD" />
                </View>
              )}
            </View>
            <View style={styles.metaRow}>
              <ThemedText style={[styles.petLabel, { color: colors.text }]}>
                {item.canine?.name ?? 'Unknown Pet'}
              </ThemedText>
              <View style={[styles.typeChip, item.type === 'video' ? styles.videoChip : styles.photoChip]}>
                <ThemedText style={styles.typeChipText}>{item.type.toUpperCase()}</ThemedText>
              </View>
            </View>
            {item.caption ? (
              <ThemedText style={styles.captionText}>{item.caption}</ThemedText>
            ) : (
              <ThemedText style={styles.captionPlaceholder}>No caption provided.</ThemedText>
            )}
          </View>
        )}
      />

      {userMedia.length > 1 && (
        <>
          <TouchableOpacity
            style={[styles.arrowButton, styles.arrowLeft]}
            accessibilityRole="button"
            accessibilityLabel="Previous photo"
            disabled={currentIndex === 0}
            onPress={() => {
              if (currentIndex === 0) return;
              const nextIndex = currentIndex - 1;
              flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
              setCurrentIndex(nextIndex);
            }}>
            <IconSymbol
              name="chevron.left.circle.fill"
              size={36}
              color={currentIndex === 0 ? '#CBD5F5' : colors.tint}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.arrowButton, styles.arrowRight]}
            accessibilityRole="button"
            accessibilityLabel="Next photo"
            disabled={currentIndex >= userMedia.length - 1}
            onPress={() => {
              if (currentIndex >= userMedia.length - 1) return;
              const nextIndex = currentIndex + 1;
              flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
              setCurrentIndex(nextIndex);
            }}>
            <IconSymbol
              name="chevron.right.circle.fill"
              size={36}
              color={currentIndex >= userMedia.length - 1 ? '#CBD5F5' : colors.tint}
            />
          </TouchableOpacity>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  carousel: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  slide: {
    width: Platform.OS === 'web' ? 480 : 320,
    marginRight: 20,
    alignItems: 'center',
  },
  mediaCard: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 16,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: '45%',
    left: '45%',
    transform: [{ translateX: -28 }, { translateY: -28 }],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petLabel: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFFEA',
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  videoChip: {
    backgroundColor: '#1D4ED8',
  },
  photoChip: {
    backgroundColor: '#059669',
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  captionText: {
    marginTop: 6,
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  captionPlaceholder: {
    marginTop: 6,
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  arrowButton: {
    position: 'absolute',
    top: '45%',
    padding: 6,
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

