import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { auth } from '@/lib/firebase';
import { theme, useIsWide } from '@/lib/theme';

function authErrorMessage(e: unknown) {
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Email hoặc mật khẩu không đúng.';
      case 'auth/invalid-email':
        return 'Email không hợp lệ.';
      case 'auth/too-many-requests':
        return 'Đăng nhập sai quá nhiều lần, vui lòng thử lại sau.';
      case 'auth/network-request-failed':
        return 'Không kết nối được máy chủ, kiểm tra lại mạng.';
    }
  }
  return 'Đăng nhập thất bại, vui lòng thử lại.';
}

export default function LoginScreen() {
  const wide = useIsWide();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 48 }]}
        keyboardShouldPersistTaps="handled">
        {/* Phones drop the brand bar so the form is not pushed off-center; the system name moves into the subtitle. */}
        {wide && (
          <View style={styles.brand}>
            <Text variant="titleMedium" style={styles.brandName}>
              QLHocPhan
            </Text>
            <Text variant="bodyMedium" style={styles.brandSub}>
              Quản lý giảng viên
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <Text variant="headlineSmall" style={styles.title}>
            Đăng nhập
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {wide ? 'Dùng tài khoản admin được cấp để tiếp tục.' : 'Hệ thống quản lý giảng viên QLHocPhan.'}
          </Text>

          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            onSubmitEditing={handleLogin}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword((v) => !v)}
                accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              />
            }
            style={styles.input}
          />
          <HelperText type="error" visible={!!error} style={styles.error}>
            {error}
          </HelperText>

          <Button mode="contained" onPress={handleLogin} loading={busy} disabled={busy} contentStyle={{ height: 44 }}>
            Đăng nhập
          </Button>
          <Text variant="bodySmall" style={styles.note}>
            Chưa có tài khoản? Liên hệ quản trị viên hệ thống.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.surface },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  brand: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  brandName: { fontWeight: '700', color: theme.colors.primary, letterSpacing: -0.2 },
  brandSub: { color: theme.colors.onSurfaceVariant },
  form: { flex: 1, width: '100%', maxWidth: 360, alignSelf: 'center', justifyContent: 'center', paddingVertical: 32 },
  title: { fontWeight: '600', color: theme.colors.onSurface },
  subtitle: { color: theme.colors.onSurfaceVariant, marginTop: 4, marginBottom: 24 },
  input: { marginBottom: 12, backgroundColor: theme.colors.surface },
  error: { paddingHorizontal: 0, marginTop: -4 },
  note: { color: theme.colors.onSurfaceVariant, marginTop: 16 },
});
