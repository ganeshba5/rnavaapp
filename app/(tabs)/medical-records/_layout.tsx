import { Stack } from 'expo-router';

export default function MedicalRecordsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    />
  );
}

