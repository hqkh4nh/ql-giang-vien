import { writeBatch, doc } from 'firebase/firestore';

import { db } from './firebase';
import type { GiangVien } from './giangvien';
import { SAMPLE_AVATARS } from './sample-avatars';

const SAMPLE: Omit<GiangVien, 'Image'>[] = [
  { IDGV: 'GV001', Fullname: 'Nguyễn Văn An', SumClass: 4 },
  { IDGV: 'GV002', Fullname: 'Trần Thị Bích Ngọc', SumClass: 6 },
  { IDGV: 'GV003', Fullname: 'Lê Hoàng Minh', SumClass: 3 },
  { IDGV: 'GV004', Fullname: 'Phạm Thu Hà', SumClass: 5 },
];

export function seedSampleData() {
  const batch = writeBatch(db);
  SAMPLE.forEach((gv, i) => batch.set(doc(db, 'GiangVien', gv.IDGV), { ...gv, Image: SAMPLE_AVATARS[i] ?? '' }));
  return batch.commit();
}
