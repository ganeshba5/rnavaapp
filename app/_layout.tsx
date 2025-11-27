import { useEffect, useMemo, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider } from '@/context/AppContext';
import { useWebStyles } from '@/hooks/use-web-styles';
import { Colors } from '@/constants/theme';
import { isWeb, getContainerMaxWidth, getResponsivePadding } from '@/utils/platform';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  useWebStyles(themeColors, (colorScheme ?? 'light') as 'light' | 'dark');

  const [layoutMetrics, setLayoutMetrics] = useState<{ maxWidth: number | string; padding: number }>(() => ({
    maxWidth: isWeb ? getContainerMaxWidth() : '100%',
    padding: isWeb ? getResponsivePadding() : 0,
  }));

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    const handleResize = () => {
      setLayoutMetrics({
        maxWidth: getContainerMaxWidth(),
        padding: getResponsivePadding(),
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyle = useMemo(() => {
    const responsiveStyle: Record<string, string | number> = {
      backgroundColor: themeColors.background,
    };

    if (isWeb) {
      responsiveStyle.alignSelf = 'center';
      responsiveStyle.paddingHorizontal = layoutMetrics.padding;
      responsiveStyle.maxWidth = layoutMetrics.maxWidth;
    }

    return responsiveStyle;
  }, [layoutMetrics.maxWidth, layoutMetrics.padding, themeColors.background]);

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={[styles.container, containerStyle]}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen name="user-profile" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen
              name="canine-profile"
              options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen name="test-connection" options={{ title: 'Test Supabase Connection' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </View>
      </ThemeProvider>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
    }),
  },
});
