import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, HelperText, Text, TextInput } from 'react-native-paper';

import { GvAvatar } from '@/components/gv-avatar';
import { existsGiangVien, getGiangVien, saveGiangVien } from '@/lib/giangvien';
import { pickImage } from '@/lib/pick-image';
import { RADIUS, theme, useIsWide } from '@/lib/theme';

type Errors = Partial<Record<'IDGV' | 'Fullname' | 'SumClass' | 'form', string>>;

// IDGV is used as the document ID, so it must not contain "/".
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export default function GiangVienFormScreen() {
  const wide = useIsWide();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [idgv, setIdgv] = useState(id ?? '');
  const [fullname, setFullname] = useState('');
  const [sumClass, setSumClass] = useState('');
  const [image, setImage] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (!id) return;
    getGiangVien(id)
      .then((gv) => {
        if (!gv) {
          setErrors({ form: 'Không tìm thấy giảng viên.' });
          return;
        }
        setFullname(gv.Fullname);
        setSumClass(String(gv.SumClass));
        setImage(gv.Image);
      })
      .catch((e: Error) => setErrors({ form: e.message }))
      .finally(() => setLoading(false));
  }, [id]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  async function handlePick(source: 'library' | 'camera') {
    setPicking(true);
    try {
      const uri = await pickImage(source);
      if (uri) setImage(uri);
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Không chọn được ảnh.' });
    } finally {
      setPicking(false);
    }
  }

  function validate(): Errors {
    const next: Errors = {};
    const code = idgv.trim();
    if (!code) next.IDGV = 'Vui lòng nhập mã giảng viên.';
    else if (!ID_PATTERN.test(code)) next.IDGV = 'Mã chỉ gồm chữ, số, dấu "-" hoặc "_".';
    if (!fullname.trim()) next.Fullname = 'Vui lòng nhập họ và tên.';
    if (!/^\d+$/.test(sumClass.trim())) next.SumClass = 'Tổng số lớp phải là số nguyên không âm.';
    return next;
  }

  async function handleSave() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const code = idgv.trim();
      if (!isEdit && (await existsGiangVien(code))) {
        setErrors({ IDGV: `Mã ${code} đã tồn tại.` });
        return;
      }
      await saveGiangVien({
        IDGV: code,
        Fullname: fullname.trim().replace(/\s+/g, ' '),
        Image: image,
        SumClass: Number(sumClass.trim()),
      });
      goBack();
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Không lưu được dữ liệu.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const imagePanel = (
    <View style={[styles.imagePanel, wide && styles.imagePanelWide]}>
      <GvAvatar image={image} name={fullname || '?'} seed={idgv} size={wide ? 128 : 88} />
      <View style={[styles.imageButtons, wide && styles.imageButtonsWide]}>
        <Button mode="outlined" icon="image-outline" onPress={() => handlePick('library')} disabled={picking} loading={picking}>
          {image ? 'Đổi ảnh' : 'Chọn ảnh'}
        </Button>
        {Platform.OS !== 'web' && (
          <Button mode="outlined" icon="camera-outline" onPress={() => handlePick('camera')} disabled={picking}>
            Chụp ảnh
          </Button>
        )}
        {!!image && (
          <Button icon="close" textColor={theme.colors.onSurfaceVariant} onPress={() => setImage('')}>
            Bỏ ảnh
          </Button>
        )}
        {wide && (
          <Text variant="bodySmall" style={styles.hint}>
            Ảnh được cắt vuông và thu nhỏ tự động.
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: isEdit ? 'Sửa giảng viên' : 'Thêm giảng viên' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.panel, wide && styles.panelWide]}>
          {imagePanel}

          <View style={[styles.fields, wide && styles.fieldsWide]}>
            <Text variant="titleMedium" style={styles.heading}>
              {isEdit ? 'Thông tin giảng viên' : 'Giảng viên mới'}
            </Text>

            <TextInput
              mode="outlined"
              label="Mã giảng viên"
              placeholder="VD: GV007"
              value={idgv}
              onChangeText={setIdgv}
              autoCapitalize="characters"
              disabled={isEdit}
              error={!!errors.IDGV}
              style={styles.input}
            />
            <HelperText type={errors.IDGV ? 'error' : 'info'} visible>
              {errors.IDGV ?? (isEdit ? 'Mã giảng viên không thể thay đổi.' : 'Chữ, số, dấu "-" hoặc "_". Không được trùng.')}
            </HelperText>

            <TextInput
              mode="outlined"
              label="Họ và tên"
              value={fullname}
              onChangeText={setFullname}
              autoCapitalize="words"
              autoComplete="name"
              error={!!errors.Fullname}
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.Fullname}>
              {errors.Fullname}
            </HelperText>

            <TextInput
              mode="outlined"
              label="Tổng số lớp"
              value={sumClass}
              onChangeText={setSumClass}
              keyboardType="number-pad"
              error={!!errors.SumClass}
              style={[styles.input, wide && { maxWidth: 200 }]}
              onSubmitEditing={handleSave}
            />
            <HelperText type="error" visible={!!errors.SumClass}>
              {errors.SumClass}
            </HelperText>

            {!!errors.form && (
              <HelperText type="error" visible>
                {errors.form}
              </HelperText>
            )}

            {/* Phones: full-width primary button on top, Cancel below, so the label is never truncated. */}
            <View style={wide ? styles.buttonsWide : styles.buttonsNarrow}>
              <Button mode={wide ? 'outlined' : 'text'} onPress={goBack} disabled={saving}>
                Hủy
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                contentStyle={!wide && { height: 46 }}
                loading={saving}
                disabled={saving || picking}>
                {isEdit ? 'Lưu thay đổi' : 'Thêm giảng viên'}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  imagePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  imagePanelWide: {
    width: 260,
    flexDirection: 'column',
    paddingVertical: 32,
    backgroundColor: theme.colors.surfaceVariant,
    borderBottomWidth: 0,
    borderRightWidth: 1,
    borderRightColor: theme.colors.outlineVariant,
  },
  imageButtons: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageButtonsWide: { flex: 0, flexDirection: 'column', flexWrap: 'nowrap', alignSelf: 'stretch', marginTop: 8 },
  hint: { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 },
  fields: { padding: 20 },
  fieldsWide: { flex: 1, padding: 28 },
  heading: { fontWeight: '600', color: theme.colors.onSurface, marginBottom: 16 },
  input: { backgroundColor: theme.colors.surface },
  buttonsWide: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  buttonsNarrow: { flexDirection: 'column-reverse', gap: 8, marginTop: 8 },
});
