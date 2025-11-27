import { useEffect, useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Platform,
  Alert,
  FlatList,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, usePathname } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/context/AppContext';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const OVERLAY_WIDTH = SCREEN_WIDTH * 0.82;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { userProfile, canines, appointments, mediaItems, logout } = useApp();
  const pathname = usePathname();
  const screenHeight = Dimensions.get('window').height;
  const insets = useSafeAreaInsets();

  // Filter canines for current user (Pet Owner)
  const userCanines = useMemo(() => (userProfile ? canines.filter((c) => c.userId === userProfile.id) : []), [userProfile?.id, canines]);

  // For Pet Owner role, show only Canine Profiles in quick access
  const isPetOwner = userProfile?.role === 'Pet Owner';
  const isAdmin = userProfile?.role === 'Admin';
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayTranslate = useRef(new Animated.Value(-OVERLAY_WIDTH - 40)).current;
  const overlayBackdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isPetOwner) {
      setShowOverlay(false);
      overlayTranslate.setValue(-OVERLAY_WIDTH - 40);
    }
  }, [isPetOwner, overlayTranslate]);

  const toggleOverlay = (visible: boolean) => {
    if (!isPetOwner) return;
    setShowOverlay(visible);
    Animated.parallel([
      Animated.timing(overlayTranslate, {
        toValue: visible ? 0 : -OVERLAY_WIDTH - 40,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayBackdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 280,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const sharedMenuItems = [
    { title: 'Canine Profile', icon: 'pawprint.fill', route: '/canine-profile' },
    { title: 'Nutrition', icon: 'leaf.fill', route: '/(tabs)/nutrition' },
    { title: 'Training', icon: 'star.fill', route: '/(tabs)/training' },
    { title: 'Vet Profile', icon: 'cross.case.fill', route: '/(tabs)/vet-profile' },
    { title: 'Contacts', icon: 'person.2.fill', route: '/(tabs)/contacts' },
    { title: 'Appointments', icon: 'calendar.fill', route: '/(tabs)/appointments' },
  ];
  const menuItems = isPetOwner
    ? [
        { title: 'Nutrition', icon: 'leaf.fill', route: '/(tabs)/nutrition' },
        { title: 'Training', icon: 'star.fill', route: '/(tabs)/training' },
        { title: 'Vet Profile', icon: 'cross.case.fill', route: '/(tabs)/vet-profile' },
        { title: 'Contacts', icon: 'person.2.fill', route: '/(tabs)/contacts' },
        { title: 'Appointments', icon: 'calendar.fill', route: '/(tabs)/appointments' },
      ]
    : sharedMenuItems.filter(
        (item) =>
          !(
            isAdmin &&
            [
              'Canine Profile',
              'Nutrition',
              'Training',
              'Appointments',
              'Vet Profile',
              'Contacts',
            ].includes(item.title)
          )
      );
  const quickAccessTitle = isAdmin ? 'Admin' : 'Quick Access';
  const adminTabItems = [
    { title: 'Users', icon: 'person.crop.circle.fill', route: '/admin/users' },
    { title: 'Nutrition', icon: 'leaf.fill', route: '/admin/nutrition' },
    { title: 'Training', icon: 'star.fill', route: '/admin/training' },
    { title: 'Vet Profile', icon: 'cross.case.fill', route: '/admin/vets' },
    { title: 'Contacts', icon: 'person.2.fill', route: '/admin/contacts' },
    { title: 'Media', icon: 'photo.fill', route: '/admin/media' },
    { title: 'Appointments', icon: 'calendar.fill', route: '/admin/appointments' },
  ];
  const upcomingAppointments = appointments
    .filter((apt) => apt.status === 'Scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const confirmAndLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to logout?')) {
        confirmAndLogout();
      }
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: confirmAndLogout,
      },
    ]);
  };

  const showComingSoon = (title: string) => {
    Alert.alert(title, 'Content coming soon.');
  };

  const petOwnerAppointments = useMemo(() => {
    return appointments
      .filter((apt) => apt.status === 'Scheduled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 2);
  }, [appointments]);

  const renderOverlay = () => {
    if (!isPetOwner) return null;

    const fullName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Guest User';
    const hasProfilePhoto = Boolean(userProfile?.profilePhotoUrl);

    const landingMenu = [
      {
        key: 'dashboard',
        title: 'Dashboard',
        subtitle: 'Overview of your pets',
        icon: 'square.grid.2x2',
        onPress: () => toggleOverlay(false),
      },
      {
        key: 'profile',
        title: 'My Profile',
        subtitle: 'Manage your personal info',
        icon: 'person.crop.circle',
        onPress: () => {
          toggleOverlay(false);
          router.push('/user-profile');
        },
      },
      {
        key: 'changePassword',
        title: 'Change Password',
        subtitle: 'Update your login credentials',
        icon: 'lock.fill',
        onPress: () => {
          toggleOverlay(false);
          router.push('/change-password');
        },
      },
      {
        key: 'terms',
        title: 'Terms & Conditions',
        subtitle: 'Understand our policies',
        icon: 'doc.text.fill',
        onPress: () => showComingSoon('Terms & Conditions'),
      },
      {
        key: 'about',
        title: 'About Us',
        subtitle: 'Learn more about AVA',
        icon: 'info.circle.fill',
        onPress: () => showComingSoon('About Us'),
      },
      {
        key: 'logout',
        title: 'Logout',
        subtitle: 'Securely sign out',
        icon: 'rectangle.portrait.and.arrow.right',
        onPress: handleLogout,
      },
    ] as const;

    return (
      <View pointerEvents={showOverlay ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[styles.overlayBackdrop, { opacity: overlayBackdropOpacity }]}
          pointerEvents={showOverlay ? 'auto' : 'none'}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => toggleOverlay(false)} activeOpacity={1} />
        </Animated.View>
        <Animated.View
          pointerEvents={showOverlay ? 'auto' : 'none'}
          style={[
            styles.overlayContainer,
            {
              transform: [{ translateX: overlayTranslate }],
            },
          ]}>
          <ScrollView
            style={[styles.landingContainer, { backgroundColor: colors.background }]}
            contentContainerStyle={[styles.overlayContent, { paddingTop: insets.top + 12, paddingHorizontal: 20 }]}>
            <View style={styles.overlayHeaderRow}>
              <TouchableOpacity
                onPress={() => toggleOverlay(false)}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
                style={styles.overlayBackButton}>
                <IconSymbol name="chevron.left.circle.fill" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.landingCard, { marginHorizontal: 0 }]} pointerEvents="auto">
              <View style={[styles.landingHeader, { backgroundColor: colors.primary }]}>
                <View style={styles.avatarContainer}>
                  {hasProfilePhoto ? (
                    <Image source={{ uri: userProfile!.profilePhotoUrl }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <ThemedText style={styles.avatarInitials}>
                        {fullName
                          .split(' ')
                          .map((name) => name[0])
                          .join('')
                          .toUpperCase()}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText type="title" style={[styles.petOwnerName, { color: '#FFFFFF' }]}>
                  {fullName}
                </ThemedText>
                <ThemedText style={[styles.petOwnerPhone, { color: '#E5E7EB' }]}>
                  {userProfile?.phone || '(000) 000-0000'}
                </ThemedText>
              </View>

              <View style={styles.menuList}>
                {landingMenu.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.menuRow}
                    onPress={item.onPress}
                    accessibilityRole="button">
                    <View
                      style={[styles.menuIconWrapper, { backgroundColor: `${colors.primary}15` }]}>
                      <IconSymbol
                        name={item.icon as any}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <ThemedText style={styles.menuRowTitle}>{item.title}</ThemedText>
                      <ThemedText style={styles.menuRowSubtitle}>{item.subtitle}</ThemedText>
                    </View>
                    <IconSymbol name="chevron.right" size={18} color={colors.icon} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    );
  };

  if (isPetOwner && showOverlay) {
    return renderOverlay();
  }

  if (isPetOwner) {
    return (
      <View style={[styles.petOwnerRoot, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.petOwnerScroll}>
          <View style={styles.petOwnerTopBar}>
            <TouchableOpacity
              onPress={() => toggleOverlay(true)}
              style={styles.hamburgerButton}
              accessibilityRole="button"
              accessibilityLabel="Open menu">
              <IconSymbol name="line.3.horizontal" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={styles.notificationButton}
              accessibilityRole="button"
              accessibilityLabel="View notifications">
              <IconSymbol name="bell" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ThemedView style={[styles.petCarouselCard, { height: screenHeight * 0.25 }]}>
            <View style={styles.petCarouselHeader}>
              <ThemedText style={styles.petCarouselTitle}>My Canine</ThemedText>
              <TouchableOpacity
                onPress={() => router.push('/canine-profile')}
                style={styles.addCanineButton}
                accessibilityRole="button"
                accessibilityLabel="Add canine">
                <IconSymbol name="plus" size={18} color="#FFFFFF" />
                <ThemedText style={styles.addCanineText}>Add Canine</ThemedText>
              </TouchableOpacity>
            </View>

            <FlatList
              data={userCanines}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petListContent}
              renderItem={({ item }) => {
                const photo = item.profilePhotoId
                  ? mediaItems.find((m) => m.id === item.profilePhotoId)?.uri
                  : null;

                return (
                  <TouchableOpacity
                    style={styles.petCard}
                    onPress={() => router.push(`/canine-profile?id=${item.id}`)}
                    accessibilityRole="button">
                    {photo ? (
                      <Image source={{ uri: photo }} style={styles.petImage} contentFit="cover" />
                    ) : (
                      <View style={styles.petImagePlaceholder}>
                        <IconSymbol name="pawprint.fill" size={28} color="#FFFFFF" />
                      </View>
                    )}
                    <ThemedText style={styles.petName} numberOfLines={1}>
                      {item.name}
                    </ThemedText>
                  </TouchableOpacity>
                );
              }}
            />
          </ThemedView>

          {petOwnerAppointments.length > 0 && (
            <View style={[styles.ownerAppointmentsSection, { height: screenHeight * 0.1 }]}>
              <ThemedText style={styles.sectionHeadingCompact}>Upcoming Appointments</ThemedText>
              {petOwnerAppointments.map((appointment) => {
                const canine = canines.find((c) => c.id === appointment.canineId);
                return (
                  <View key={appointment.id} style={styles.ownerAppointmentCard}>
                    <ThemedText style={styles.ownerAppointmentPrimary} numberOfLines={1}>
                      {(appointment.type || 'Appointment') +
                        (appointment.time ? ` • ${appointment.time}` : '')}
                    </ThemedText>
                    <View style={styles.ownerAppointmentSecondaryRow}>
                      <ThemedText style={styles.ownerAppointmentSecondary} numberOfLines={1}>
                        Pet: {canine?.name ?? 'Unknown'}
                      </ThemedText>
                      <ThemedText style={styles.ownerAppointmentDate}>
                        {new Date(appointment.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomNavBar, { borderTopColor: `${colors.icon}33` }]}>
          {[
            { key: 'home', label: 'Home', icon: 'square.grid.2x2', route: '/(tabs)' },
            { key: 'contacts', label: 'Contacts', icon: 'person.2.fill', route: '/(tabs)/contacts' },
            { key: 'reminders', label: 'Reminders', icon: 'calendar', route: '/(tabs)/appointments' },
          ].map((item) => {
            const isActive = pathname === item.route || (item.key === 'home' && pathname === '/');
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.bottomNavItem}
                onPress={() => router.replace(item.route as any)}
                accessibilityRole="button">
                <IconSymbol
                  name={item.icon as any}
                  size={22}
                  color={isActive ? colors.primary : colors.icon}
                />
                <ThemedText style={[styles.bottomNavLabel, isActive && { color: colors.primary }]}>
                  {item.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <ThemedText type="title" style={[styles.title, { color: colors.primary }]}>
              AVA Dashboard
            </ThemedText>
            <ThemedText style={styles.subtitle}>Canine Health Management</ThemedText>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.logoutButton, { borderColor: colors.icon }]}
            accessibilityLabel="Logout">
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.text} />
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {quickAccessTitle}
        </ThemedText>
        {isAdmin ? (
          <View style={styles.adminTabBar}>
            {adminTabItems.map((item) => {
              const isActive = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.route}
                  style={styles.adminTabItem}
                  onPress={() => router.push(item.route as any)}>
                  <IconSymbol
                    name={item.icon as any}
                    size={22}
                    color={isActive ? colors.primary : colors.icon}
                  />
                  <ThemedText
                    style={[
                      styles.adminTabText,
                      isActive && { color: colors.primary },
                    ]}>
                    {item.title}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { borderColor: colors.icon }]}
                onPress={() => router.push(item.route as any)}>
                <IconSymbol name={item.icon as any} size={32} color={colors.primary} />
                <ThemedText style={styles.menuItemText}>{item.title}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!isAdmin && (
          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {isPetOwner ? 'Your Pets' : 'Canine Profiles'}
              </ThemedText>
              {isPetOwner && (
                <TouchableOpacity
                  onPress={() => router.push('/canine-profile')}
                  style={[styles.addPetButton, { borderColor: colors.icon }]}
                  activeOpacity={0.7}>
                  <IconSymbol name="plus" size={20} color={colors.text} />
                  <ThemedText style={styles.addPetButtonText}>Add Pet</ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {(isPetOwner ? userCanines : canines).length > 0 ? (
              (isPetOwner ? userCanines : canines).map((canine) => (
                <TouchableOpacity
                  key={canine.id}
                  style={[styles.canineCard, { borderColor: colors.icon }]}
                  onPress={() => router.push(`/canine-profile?id=${canine.id}`)}>
                  <View style={styles.canineCardContent}>
                    {canine.profilePhotoId ? (
                      (() => {
                        const photo = mediaItems.find((m) => m.id === canine.profilePhotoId);
                        return photo ? (
                          <Image
                            source={{ uri: photo.uri }}
                            style={styles.profilePhoto}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.profilePhotoContainer}>
                            <ThemedText style={styles.profilePhotoPlaceholder}>📷</ThemedText>
                          </View>
                        );
                      })()
                    ) : (
                      <IconSymbol name="pawprint.fill" size={32} color={colors.primary} />
                    )}
                    <View style={styles.canineInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.canineName}>
                        {canine.name}
                      </ThemedText>
                      {canine.breed && (
                        <ThemedText style={styles.canineBreed}>{canine.breed}</ThemedText>
                      )}
                    </View>
                    <IconSymbol name="chevron.right" size={20} color={colors.icon} />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              isPetOwner && (
                <ThemedText style={styles.emptyStateText}>
                  No pets yet. Use the &quot;Add Pet&quot; button above to add your first pet.
                </ThemedText>
              )
            )}
          </ThemedView>
        )}

        {!isAdmin && upcomingAppointments.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Upcoming Appointments
            </ThemedText>
            {upcomingAppointments.map((appointment) => {
              const canine = canines.find((c) => c.id === appointment.canineId);
              return (
                <View key={appointment.id} style={[styles.appointmentCard, { borderColor: colors.icon }]}>
                  <View style={styles.appointmentHeader}>
                    <ThemedText type="defaultSemiBold">{appointment.type}</ThemedText>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            appointment.status === 'Scheduled'
                              ? '#4CAF50'
                              : appointment.status === 'Completed'
                                ? '#2196F3'
                                : '#F44336',
                        },
                      ]}>
                      <ThemedText style={styles.statusText}>{appointment.status}</ThemedText>
                    </View>
                  </View>
                  {canine && (
                    <ThemedText style={styles.appointmentDetail}>
                      Pet: {canine.name}
                    </ThemedText>
                  )}
                  <ThemedText style={styles.appointmentDetail}>
                    {new Date(appointment.date).toLocaleDateString()}
                    {appointment.time && ` at ${appointment.time}`}
                  </ThemedText>
                </View>
              );
            })}
          </ThemedView>
        )}

        {Platform.OS === 'web' && (
          <ThemedView style={styles.infoSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Welcome to AVA
            </ThemedText>
            <ThemedText style={styles.infoText}>
              Track your pet&apos;s health, training, and activities all in one place.
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    landingContainer: {
      flex: 1,
    },
    landingCard: {
      marginHorizontal: 0,
      marginTop: 12,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: Platform.OS === 'web' ? 1 : 0,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
    landingHeader: {
      alignItems: 'center',
      paddingVertical: 36,
      paddingHorizontal: 24,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      backgroundColor: colors.tint,
    },
    avatarContainer: {
      width: 104,
      height: 104,
      borderRadius: 52,
      overflow: 'hidden',
      position: 'relative',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: colors.tintSoft,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarPlaceholder: {
      flex: 1,
      backgroundColor: `${colors.inverseText}33`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.inverseText,
    },
    petOwnerName: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 6,
      color: colors.inverseText,
    },
    petOwnerPhone: {
      fontSize: 16,
      fontWeight: '500',
      color: `${colors.inverseText}CC`,
    },
    menuList: {
      paddingVertical: 20,
      backgroundColor: colors.surface,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      gap: 16,
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
      }),
    },
    menuIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.tintSoft}55`,
    },
    menuTextContainer: {
      flex: 1,
    },
    menuRowTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    menuRowSubtitle: {
      fontSize: 13,
      color: colors.tertiaryText,
      marginTop: 2,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingTop: 60,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
      ...(Platform.OS === 'web' && {
        paddingTop: 20,
      }),
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerTextContainer: {
      flex: 1,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: colors.secondaryText,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      gap: 6,
      marginLeft: 12,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
      }),
    },
    logoutButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.tint,
    },
    content: {
      padding: 20,
      gap: 24,
    },
    section: {
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      width: '100%',
      overflow: 'visible',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      flex: 1,
      marginRight: 12,
      color: colors.text,
    },
    addPetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      gap: 6,
      flexShrink: 0,
      borderColor: colors.tint,
      backgroundColor: colors.surface,
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
      }),
    },
    addPetButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.tint,
    },
    menuGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 24,
    },
    adminTabBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 24,
    },
    adminTabItem: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 72,
    },
    petOwnerRoot: {
      flex: 1,
      backgroundColor: colors.background,
    },
    petOwnerScroll: {
      paddingBottom: 120,
    },
    petOwnerTopBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 24,
      paddingBottom: 24,
    },
    hamburgerButton: {
      padding: 10,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    notificationButton: {
      padding: 10,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    petCarouselCard: {
      marginHorizontal: 20,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.tint,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 6,
    },
    petCarouselHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    petCarouselTitle: {
      color: colors.inverseText,
      fontSize: 16,
      fontWeight: '700',
    },
    addCanineButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surface,
    },
    addCanineText: {
      color: colors.tint,
      fontSize: 12,
      fontWeight: '600',
    },
    petListContent: {
      marginTop: 12,
      gap: 10,
    },
    petCard: {
      width: 80,
      height: 110,
      borderRadius: 16,
      backgroundColor: colors.surface,
      marginRight: 10,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    viewAllCard: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.tintSoft,
    },
    petImage: {
      width: 60,
      height: 60,
      borderRadius: 14,
      marginBottom: 8,
    },
    petImagePlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 14,
      marginBottom: 8,
      backgroundColor: colors.tintSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    petName: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
    },
    weatherSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: 20,
      marginTop: 18,
      gap: 10,
    },
    weatherCard: {
      flex: 1,
      borderRadius: 20,
      backgroundColor: colors.surface,
      paddingVertical: 12,
      alignItems: 'center',
      gap: 4,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    weatherIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.tintSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    weatherDay: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    weatherTemp: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.tint,
    },
    weatherStatus: {
      fontSize: 11,
      color: colors.tertiaryText,
      textAlign: 'center',
    },
    ownerAppointmentsSection: {
      marginHorizontal: 20,
      marginTop: 18,
      gap: 10,
    },
    sectionHeadingCompact: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    ownerAppointmentCard: {
      borderRadius: 14,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 10,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ownerAppointmentPrimary: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    ownerAppointmentSecondaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
      gap: 8,
    },
    ownerAppointmentSecondary: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    ownerAppointmentDate: {
      fontSize: 11,
      color: colors.tint,
      fontWeight: '600',
    },
    bottomNavBar: {
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 24 : 16,
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 14,
      borderRadius: 24,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
      elevation: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bottomNavItem: {
      alignItems: 'center',
      gap: 4,
    },
    bottomNavLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.secondaryText,
    },
    menuButton: {
      marginRight: 12,
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
      }),
    },
    adminTabText: {
      marginTop: 4,
      fontSize: 12,
      color: colors.secondaryText,
      textAlign: 'center',
    },
    menuItem: {
      width: '30%',
      aspectRatio: 1,
      borderWidth: 1,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
      }),
    },
    menuItemText: {
      marginTop: 8,
      fontSize: 12,
      textAlign: 'center',
      color: colors.text,
    },
    canineCard: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
      }),
    },
    canineCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profilePhoto: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
    },
    profilePhotoContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    profilePhotoPlaceholder: {
      fontSize: 24,
      color: colors.text,
    },
    canineInfo: {
      flex: 1,
    },
    canineName: {
      fontSize: 16,
      marginBottom: 4,
      color: colors.text,
    },
    canineBreed: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    appointmentCard: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    appointmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: colors.inverseText,
      fontSize: 10,
      fontWeight: '600',
    },
    appointmentDetail: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 4,
    },
    infoSection: {
      marginTop: 20,
      padding: 20,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
    },
    infoText: {
      fontSize: 14,
      color: colors.secondaryText,
      lineHeight: 20,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.tertiaryText,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
    overlayContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: OVERLAY_WIDTH,
      height: '100%',
      zIndex: 10,
      borderRadius: 28,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
    overlayContent: {
      paddingBottom: 40,
    },
    overlayHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    overlayBackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    overlayBackLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    overlayBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(15, 23, 42, 0.35)',
    },
  });
