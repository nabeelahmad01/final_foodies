import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Provider } from 'react-redux';
import store from '../src/redux/store';
import { ToastProvider } from '../src/context.js/ToastContext';
import React from 'react';
import { loadLanguage } from '../src/utils/i18n';


export default function RootLayout() {
  const colorScheme = useColorScheme();
  React.useEffect(() => {
    loadLanguage();
  }, []);

  return (
    <Provider store={store}>
      <ToastProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ToastProvider>
    </Provider>
  );
}
