import { Stack } from 'expo-router';

/**
 * Admin Module Layout
 * Handles routing for all admin screens
 */
export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics & Dashboard' }} />
      <Stack.Screen name="users" options={{ title: 'Users Management' }} />
      <Stack.Screen name="canines" options={{ title: 'Canine Profiles' }} />
      <Stack.Screen name="vets" options={{ title: 'Vet Profiles' }} />
      <Stack.Screen name="contacts" options={{ title: 'Contacts' }} />
      <Stack.Screen name="nutrition" options={{ title: 'Nutrition Entries' }} />
      <Stack.Screen name="training" options={{ title: 'Training Logs' }} />
      <Stack.Screen name="appointments" options={{ title: 'Appointments' }} />
      <Stack.Screen name="media" options={{ title: 'Media Items' }} />
    </Stack>
  );
}





