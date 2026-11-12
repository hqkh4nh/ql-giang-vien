import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { ActivityIndicator, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/lib/auth-context';
import { theme } from '@/lib/theme';

// Deep links to the detail/form screens still get the list underneath so the back button works.
export const unstable_settings = { initialRouteName: 'index' };

function RootStack() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerShadowVisible: true,
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false, title: 'Đăng nhập' }} />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="index" options={{ title: 'Quản lý giảng viên' }} />
        <Stack.Screen name="[id]" options={{ title: 'Thông tin giảng viên' }} />
        <Stack.Screen name="form" options={{ title: 'Giảng viên' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
      <StatusBar style="dark" />
    </PaperProvider>
  );
}
