import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Divider, Icon, Snackbar, Text } from 'react-native-paper';

import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { GvAvatar } from '@/components/gv-avatar';
import { subscribeOneGiangVien, type GiangVien } from '@/lib/giangvien';
import { RADIUS, theme, useIsWide } from '@/lib/theme';

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon source={icon} size={20} color={theme.colors.onSurfaceVariant} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodySmall" style={styles.label}>
          {label}
        </Text>
        <Text variant="bodyLarge" style={styles.value}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function GiangVienDetailScreen() {
  const wide = useIsWide();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [gv, setGv] = useState<GiangVien | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(
    () =>
      subscribeOneGiangVien(
        id,
        (data) => {
          setGv(data);
          setLoading(false);
        },
        (e) => {
          setError(e.message);
          setLoading(false);
        }
      ),
    [id]
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!gv) {
    return (
      <View style={styles.center}>
        <Icon source="account-question-outline" size={32} color={theme.colors.onSurfaceVariant} />
        <Text style={{ color: theme.colors.onSurfaceVariant, marginVertical: 12, textAlign: 'center' }}>
          {error || 'Không tìm thấy giảng viên này, có thể đã bị xóa.'}
        </Text>
        <Button mode="outlined" onPress={goBack}>
          Về danh sách
        </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.panel, wide && styles.panelWide]}>
        <View style={[styles.profile, wide && styles.profileWide]}>
          <GvAvatar image={gv.Image} name={gv.Fullname} seed={gv.IDGV} size={wide ? 136 : 112} />
          <Text variant="headlineSmall" style={styles.name}>
            {gv.Fullname}
          </Text>
          <Text variant="bodyMedium" style={styles.code}>
            {gv.IDGV}
          </Text>
        </View>

        <View style={[styles.details, wide && styles.detailsWide]}>
          {!wide && <Divider />}
          <InfoRow icon="card-account-details-outline" label="Mã giảng viên" value={gv.IDGV} />
          <Divider style={styles.inset} />
          <InfoRow icon="account-outline" label="Họ và tên" value={gv.Fullname} />
          <Divider style={styles.inset} />
          <InfoRow icon="google-classroom" label="Tổng số lớp" value={`${gv.SumClass} lớp`} />
          <Divider />

          <View style={styles.buttons}>
            <Button
              mode="contained"
              icon="pencil-outline"
              style={styles.button}
              onPress={() => router.push({ pathname: '/form', params: { id: gv.IDGV } })}>
              {wide ? 'Sửa thông tin' : 'Sửa'}
            </Button>
            <Button
              mode="outlined"
              icon="delete-outline"
              textColor={theme.colors.error}
              style={styles.button}
              onPress={() => setConfirmDelete(true)}>
              Xóa
            </Button>
          </View>
        </View>
      </View>

      <ConfirmDeleteDialog
        target={confirmDelete ? gv : null}
        onDismiss={() => setConfirmDelete(false)}
        onDeleted={goBack}
        onError={(m) => {
          setConfirmDelete(false);
          setError(m);
        }}
      />
      <Snackbar visible={!!error} onDismiss={() => setError('')}>
        {error}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  content: { padding: 16, paddingBottom: 32 },
  panel: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: 'hidden',
  },
  panelWide: { maxWidth: 800, flexDirection: 'row' },
  profile: { alignItems: 'center', paddingTop: 28, paddingBottom: 24, paddingHorizontal: 16 },
  profileWide: {
    width: 280,
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: theme.colors.surfaceVariant,
    borderRightWidth: 1,
    borderRightColor: theme.colors.outlineVariant,
  },
  name: { fontWeight: '600', marginTop: 16, textAlign: 'center', color: theme.colors.onSurface },
  code: { color: theme.colors.onSurfaceVariant, marginTop: 2, fontVariant: ['tabular-nums'] },
  details: {},
  detailsWide: { flex: 1, justifyContent: 'center', paddingTop: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 14 },
  inset: { marginLeft: 56 },
  label: { color: theme.colors.onSurfaceVariant },
  value: { color: theme.colors.onSurface, fontWeight: '500', marginTop: 2 },
  buttons: { flexDirection: 'row', gap: 12, padding: 20 },
  button: { flex: 1 },
});
