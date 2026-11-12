import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';

import { db } from './firebase';

// The assignment accepts exactly these 4 fields; no extra fields may be added.
export type GiangVien = {
  IDGV: string;
  Fullname: string;
  Image: string;
  SumClass: number;
};

const COLLECTION = 'GiangVien';
const col = collection(db, COLLECTION);

export function subscribeGiangVien(
  onData: (items: GiangVien[]) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    query(col, orderBy('IDGV')),
    (snap) => onData(snap.docs.map((d) => d.data() as GiangVien)),
    onError
  );
}

export function subscribeOneGiangVien(
  idgv: string,
  onData: (item: GiangVien | null) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(
    doc(db, COLLECTION, idgv),
    (snap) => onData(snap.exists() ? (snap.data() as GiangVien) : null),
    onError
  );
}

export async function getGiangVien(idgv: string) {
  const snap = await getDoc(doc(db, COLLECTION, idgv));
  return snap.exists() ? (snap.data() as GiangVien) : null;
}

export async function existsGiangVien(idgv: string) {
  return (await getDoc(doc(db, COLLECTION, idgv))).exists();
}

// IDGV doubles as the document ID so lecturer codes can never be duplicated.
export function saveGiangVien(gv: GiangVien) {
  return setDoc(doc(db, COLLECTION, gv.IDGV), {
    IDGV: gv.IDGV,
    Fullname: gv.Fullname,
    Image: gv.Image,
    SumClass: gv.SumClass,
  });
}

export function deleteGiangVien(idgv: string) {
  return deleteDoc(doc(db, COLLECTION, idgv));
}
