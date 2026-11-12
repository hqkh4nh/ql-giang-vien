import { useState } from 'react';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { deleteGiangVien, type GiangVien } from '@/lib/giangvien';
import { theme } from '@/lib/theme';

type Props = {
  target: GiangVien | null;
  onDismiss: () => void;
  onDeleted: (gv: GiangVien) => void;
  onError: (message: string) => void;
};

export function ConfirmDeleteDialog({ target, onDismiss, onDeleted, onError }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!target) return;
    setBusy(true);
    try {
      await deleteGiangVien(target.IDGV);
      onDeleted(target);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Không thể xóa giảng viên.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Portal>
      <Dialog visible={!!target} onDismiss={busy ? undefined : onDismiss} style={{ maxWidth: 420, width: '90%', alignSelf: 'center' }}>
        <Dialog.Title>Xóa giảng viên?</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">
            Giảng viên <Text style={{ fontWeight: '600' }}>{target?.Fullname}</Text> ({target?.IDGV}) sẽ bị xóa
            khỏi cơ sở dữ liệu.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={busy}>
            Hủy
          </Button>
          <Button mode="contained" buttonColor={theme.colors.error} onPress={handleDelete} loading={busy} disabled={busy}>
            Xóa
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
