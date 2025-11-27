import { StyleSheet, ScrollView, TouchableOpacity, View, Platform, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApp } from '@/context/AppContext';

/**
 * Admin Dashboard
 * Different UI with hyperlink text menu for each entity
 */
export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { userProfile, logout, allUsers, vets, contacts, mediaItems } = useApp();

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

  const navItems = [
    { title: 'Users', route: '/admin/users' },
    { title: 'Vet Profiles', route: '/admin/vets' },
  ];

  const menuItems = [
    { title: 'Dashboard & Analytics', route: '/admin/analytics', icon: 'chart.bar.fill', count: null },
    { title: 'Users', route: '/admin/users', icon: 'person.2.fill', count: allUsers.length },
    { title: 'Vet Profiles', route: '/admin/vets', icon: 'cross.case.fill', count: vets.length },
    { title: 'Contacts', route: '/admin/contacts', icon: 'person.3.fill', count: contacts.length },
    { title: 'Media Items', route: '/admin/media', icon: 'photo.fill', count: mediaItems.length },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <ThemedText type="title" style={[styles.title, { color: colors.primary }]}> 
              Admin Dashboard
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Welcome, {userProfile?.firstName} {userProfile?.lastName}
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.logoutButton, { borderColor: colors.icon }]}
            accessibilityLabel="Logout">
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.text} />
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.navBar}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, { borderColor: colors.icon }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}>
              <ThemedText style={[styles.navItemText, { color: colors.primary }]}>{item.title}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Management Menu
        </ThemedText>
        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuLink, { borderBottomColor: colors.icon }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}>
              <View style={styles.menuLinkContent}>
                <View style={styles.menuLinkLeft}>
                  <IconSymbol name={item.icon as any} size={18} color={colors.primary} />
                  <ThemedText style={[styles.menuLinkText, { color: colors.primary }]}>
                    {item.title}
                  </ThemedText>
                </View>
                {item.count !== null && (
                  <ThemedText style={[styles.menuLinkCount, { color: colors.icon }]}>
                    {item.count}
                  </ThemedText>
                )}
                <IconSymbol name="chevron.right" size={16} color={colors.icon} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    ...(Platform.OS === 'web' && {
      paddingTop: 20,
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  navBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  menuList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      borderWidth: 1,
      borderColor: '#E5E5E5',
    }),
  },
  menuLink: {
    borderBottomWidth: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  menuLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuLinkText: {
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  menuLinkCount: {
    fontSize: 14,
    marginRight: 8,
  },
});


