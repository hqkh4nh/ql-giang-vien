import { router, Stack } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Divider,
  FAB,
  Icon,
  IconButton,
  Menu,
  Searchbar,
  Snackbar,
  Text,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { GvAvatar } from '@/components/gv-avatar';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { saveGiangVien, subscribeGiangVien, type GiangVien } from '@/lib/giangvien';
import { seedSampleData } from '@/lib/sample-data';
import { CONTENT_MAX_WIDTH, RADIUS, theme, useIsWide } from '@/lib/theme';

type SortKey = 'IDGV' | 'Fullname' | 'SumClass';

const SORT_LABELS: Record<SortKey, string> = {
  IDGV: 'Theo mã',
  Fullname: 'Theo tên',
  SumClass: 'Nhiều lớp nhất',
};

// Strip Vietnamese diacritics so searching "nguyen" still matches "Nguyễn".
const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

// Vietnamese names sort by the given name (last word), not the family name.
const givenName = (fullname: string) => fullname.trim().split(/\s+/).pop() ?? '';

function exportJson(items: GiangVien[]) {
  const blob = new Blob([JSON.stringify({ GiangVien: items }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'GiangVien.json';
  a.click();
  URL.revokeObjectURL(url);
}

const openDetail = (gv: GiangVien) => router.push({ pathname: '/[id]', params: { id: gv.IDGV } });
const openEdit = (gv: GiangVien) => router.push({ pathname: '/form', params: { id: gv.IDGV } });

type RowProps = {
  item: GiangVien;
  isLast: boolean;
  onDelete: (gv: GiangVien) => void;
};

function TableRow({ item, isLast, onDelete }: RowProps) {
  return (
    <>
      {/* The whole row is clickable with a mouse; the link role sits on the name cell so the edit/delete buttons are not nested inside another button. */}
      <Pressable
        onPress={() => openDetail(item)}
        focusable={false}
        style={(state) => [
          styles.tableRow,
          // react-native-web adds a hovered state that React Native's types do not declare.
          (state.pressed || (state as { hovered?: boolean }).hovered) && styles.rowActive,
        ]}>
        <Pressable
          onPress={() => openDetail(item)}
          style={[styles.colName, styles.nameCell]}
          accessibilityRole="link"
          accessibilityLabel={`Xem ${item.Fullname}`}>
          <GvAvatar image={item.Image} name={item.Fullname} seed={item.IDGV} size={36} />
          <Text variant="bodyLarge" numberOfLines={1} style={styles.name}>
            {item.Fullname}
          </Text>
        </Pressable>
        <Text variant="bodyMedium" style={[styles.colCode, styles.code]}>
          {item.IDGV}
        </Text>
        <Text variant="bodyLarge" style={[styles.colCount, styles.num, { textAlign: 'right' }]}>
          {item.SumClass}
        </Text>
        <View style={[styles.colActions, styles.actionsCell]}>
          <IconButton
            icon="pencil-outline"
            size={20}
            accessibilityLabel={`Sửa ${item.Fullname}`}
            onPress={() => openEdit(item)}
          />
          <IconButton
            icon="delete-outline"
            size={20}
            iconColor={theme.colors.error}
            accessibilityLabel={`Xóa ${item.Fullname}`}
            onPress={() => onDelete(item)}
          />
        </View>
      </Pressable>
      {!isLast && <Divider />}
    </>
  );
}

// On phones a row only opens the detail screen; edit/delete live there to avoid accidental taps.
function CompactRow({ item, isLast }: Omit<RowProps, 'onDelete'>) {
  return (
    <>
      <Pressable
        onPress={() => openDetail(item)}
        style={({ pressed }) => [styles.compactRow, pressed && styles.rowActive]}
        accessibilityRole="button"
        accessibilityLabel={`Xem ${item.Fullname}`}>
        <GvAvatar image={item.Image} name={item.Fullname} seed={item.IDGV} size={44} />
        <View style={styles.compactText}>
          <Text variant="bodyLarge" numberOfLines={1} style={styles.name}>
            {item.Fullname}
          </Text>
          <Text variant="bodySmall" style={styles.muted}>
            {item.IDGV} · <Text variant="bodySmall" style={[styles.muted, styles.num]}>{item.SumClass} lớp</Text>
          </Text>
        </View>
        <Icon source="chevron-right" size={22} color={theme.colors.outline} />
      </Pressable>
      {!isLast && <Divider style={{ marginLeft: 72 }} />}
    </>
  );
}

export default function GiangVienListScreen() {
  const wide = useIsWide();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState<GiangVien[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('IDGV');
  const [sortOpen, setSortOpen] = useState(false);
  const [toDelete, setToDelete] = useState<GiangVien | null>(null);
  const [lastDeleted, setLastDeleted] = useState<GiangVien | null>(null);
  const [message, setMessage] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(
    () =>
      subscribeGiangVien(
        (data) => {
          setItems(data);
          setLoading(false);
          setError('');
        },
        (e) => {
          setError(e.message);
          setLoading(false);
        }
      ),
    []
  );

  const visible = useMemo(() => {
    const q = normalize(search.trim());
    const filtered = q
      ? items.filter((gv) => normalize(gv.Fullname).includes(q) || normalize(gv.IDGV).includes(q))
      : items;
    return [...filtered].sort((a, b) => {
      if (sort === 'SumClass') return b.SumClass - a.SumClass || a.IDGV.localeCompare(b.IDGV);
      if (sort === 'Fullname')
        return givenName(a.Fullname).localeCompare(givenName(b.Fullname), 'vi') || a.Fullname.localeCompare(b.Fullname, 'vi');
      return a.IDGV.localeCompare(b.IDGV);
    });
  }, [items, search, sort]);

  const totalClasses = items.reduce((sum, gv) => sum + gv.SumClass, 0);

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedSampleData();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Không tạo được dữ liệu mẫu.');
    } finally {
      setSeeding(false);
    }
  }

  async function handleUndo() {
    if (!lastDeleted) return;
    try {
      await saveGiangVien(lastDeleted);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Không khôi phục được.');
    }
    setLastDeleted(null);
  }

  const summary = search.trim()
    ? `Tìm thấy ${visible.length}/${items.length} giảng viên`
    : `${items.length} giảng viên · ${totalClasses} lớp`;

  const header = (
    <View style={[styles.header, { marginBottom: wide && visible.length > 0 ? 0 : 16 }]}>
      <View style={styles.titleRow}>
        <View style={{ flexShrink: 1 }}>
          <Text variant={wide ? 'headlineSmall' : 'titleLarge'} style={styles.title}>
            Giảng viên
          </Text>
          <Text variant="bodyMedium" style={[styles.muted, styles.num]}>
            {loading ? 'Đang tải…' : summary}
          </Text>
        </View>
        {wide && (
          <View style={styles.headerActions}>
            {Platform.OS === 'web' && (
              <Button mode="outlined" icon="download" onPress={() => exportJson(items)} disabled={!items.length}>
                Xuất JSON
              </Button>
            )}
            <Button mode="contained" icon="plus" onPress={() => router.push('/form')}>
              Thêm giảng viên
            </Button>
          </View>
        )}
      </View>

      <View style={[styles.filterRow, !wide && styles.filterRowNarrow]}>
        <Searchbar
          placeholder="Tìm theo mã hoặc họ tên"
          value={search}
          onChangeText={setSearch}
          style={[styles.search, wide && { flex: 1 }]}
          inputStyle={{ minHeight: 0 }}
        />
        <Menu
          visible={sortOpen}
          onDismiss={() => setSortOpen(false)}
          anchorPosition="bottom"
          anchor={
            <Button
              mode="outlined"
              icon="sort"
              onPress={() => setSortOpen(true)}
              style={styles.sortButton}
              contentStyle={{ height: 46 }}
              textColor={theme.colors.onSurface}>
              {SORT_LABELS[sort]}
            </Button>
          }>
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <Menu.Item
              key={key}
              title={SORT_LABELS[key]}
              leadingIcon={sort === key ? 'check' : undefined}
              onPress={() => {
                setSort(key);
                setSortOpen(false);
              }}
            />
          ))}
        </Menu>
      </View>

      {wide && visible.length > 0 && (
        <View style={[styles.tableHead, styles.tableTop]}>
          <Text variant="labelMedium" style={[styles.colName, styles.headText]}>
            Họ và tên
          </Text>
          <Text variant="labelMedium" style={[styles.colCode, styles.headText]}>
            Mã GV
          </Text>
          <Text variant="labelMedium" style={[styles.colCount, styles.headText, { textAlign: 'right' }]}>
            Số lớp
          </Text>
          <View style={styles.colActions} />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.account}>
              {wide && (
                <Text variant="bodySmall" style={styles.muted} numberOfLines={1}>
                  {user?.email}
                </Text>
              )}
              <Button compact icon="logout" onPress={() => signOut(auth)}>
                Đăng xuất
              </Button>
            </View>
          ),
        }}
      />

      <FlatList
        data={visible}
        keyExtractor={(gv) => gv.IDGV}
        contentContainerStyle={[styles.content, { paddingBottom: wide ? 32 : 96 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          const isLast = index === visible.length - 1;
          return (
            <View
              style={[
                styles.listBody,
                isFirst && !wide && styles.listTop,
                isLast && styles.listBottom,
              ]}>
              {wide ? (
                <TableRow item={item} isLast={isLast} onDelete={setToDelete} />
              ) : (
                <CompactRow item={item} isLast={isLast} />
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator />
            ) : error ? (
              <>
                <Icon source="alert-circle-outline" size={28} color={theme.colors.error} />
                <Text style={[styles.emptyText, { color: theme.colors.error }]}>Không tải được dữ liệu: {error}</Text>
              </>
            ) : search ? (
              <>
                <Icon source="account-search-outline" size={28} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.emptyText}>Không có giảng viên nào khớp với “{search.trim()}”.</Text>
                <Button onPress={() => setSearch('')}>Xóa tìm kiếm</Button>
              </>
            ) : (
              <>
                <Icon source="account-group-outline" size={32} color={theme.colors.onSurfaceVariant} />
                <Text variant="titleMedium" style={{ marginTop: 4 }}>
                  Chưa có giảng viên
                </Text>
                <Text style={styles.emptyText}>Thêm giảng viên đầu tiên, hoặc tạo nhanh vài dòng dữ liệu mẫu.</Text>
                <View style={styles.emptyActions}>
                  <Button mode="contained" icon="plus" onPress={() => router.push('/form')}>
                    Thêm giảng viên
                  </Button>
                  <Button mode="outlined" icon="database-plus-outline" loading={seeding} disabled={seeding} onPress={handleSeed}>
                    Tạo dữ liệu mẫu
                  </Button>
                </View>
              </>
            )}
          </View>
        }
      />

      {!wide && (
        <FAB
          icon="plus"
          label="Thêm"
          onPress={() => router.push('/form')}
          style={[styles.fab, { bottom: 16 + insets.bottom }]}
          color={theme.colors.onPrimary}
        />
      )}

      <ConfirmDeleteDialog
        target={toDelete}
        onDismiss={() => setToDelete(null)}
        onDeleted={(gv) => {
          setToDelete(null);
          setLastDeleted(gv);
          setMessage(`Đã xóa ${gv.Fullname}.`);
        }}
        onError={(m) => {
          setToDelete(null);
          setMessage(m);
        }}
      />
      <Snackbar
        visible={!!message}
        onDismiss={() => {
          setMessage('');
          setLastDeleted(null);
        }}
        duration={5000}
        action={lastDeleted ? { label: 'Hoàn tác', onPress: handleUndo } : undefined}
        wrapperStyle={{ maxWidth: 560, alignSelf: 'center' }}>
        {message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', padding: 16 },
  header: { gap: 16 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  title: { fontWeight: '600', color: theme.colors.onSurface },
  headerActions: { flexDirection: 'row', gap: 8 },
  account: { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8, maxWidth: 360 },
  muted: { color: theme.colors.onSurfaceVariant },
  num: { fontVariant: ['tabular-nums'] },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterRowNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  search: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    height: 48,
  },
  sortButton: { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface },
  listBody: {
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: 'hidden',
  },
  listTop: { borderTopWidth: 1, borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS },
  listBottom: { borderBottomWidth: 1, borderBottomLeftRadius: RADIUS, borderBottomRightRadius: RADIUS },
  tableTop: {
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 16,
    paddingRight: 8,
    height: 40,
    backgroundColor: theme.colors.surfaceVariant,
  },
  headText: { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.4 },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingLeft: 16, paddingRight: 8, minHeight: 60 },
  colName: { flex: 1, minWidth: 0 },
  colCode: { width: 110 },
  colCount: { width: 64 },
  colActions: { width: 96 },
  nameCell: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionsCell: { flexDirection: 'row', justifyContent: 'flex-end' },
  name: { color: theme.colors.onSurface, fontWeight: '500', flexShrink: 1 },
  code: { color: theme.colors.onSurfaceVariant, fontVariant: ['tabular-nums'] },
  rowActive: { backgroundColor: theme.colors.surfaceVariant },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  compactText: { flex: 1, minWidth: 0, gap: 2 },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: RADIUS,
  },
  emptyText: { color: theme.colors.onSurfaceVariant, textAlign: 'center', maxWidth: 360 },
  emptyActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 8 },
  fab: { position: 'absolute', right: 16, backgroundColor: theme.colors.primary },
});
