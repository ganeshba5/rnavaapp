import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { isWeb } from '@/utils/platform';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        lazy: true,
        tabBarButton: HapticTab,
        tabBarStyle: {
          display: 'none',
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
      <Tabs.Screen name="training" options={{ title: 'Training' }} />
      <Tabs.Screen name="vet-profile" options={{ title: 'Vet Profile' }} />
      <Tabs.Screen name="medications" options={{ title: 'Medications', href: null }} />
      <Tabs.Screen name="vet-visits" options={{ title: 'Vet Visits', href: null }} />
      <Tabs.Screen name="immunizations" options={{ title: 'Immunizations', href: null }} />
      <Tabs.Screen name="contacts" options={{ title: 'Contacts' }} />
      <Tabs.Screen name="media" options={{ title: 'Media' }} />
      <Tabs.Screen name="appointments" options={{ title: 'Appointments' }} />
    </Tabs>
  );
}
