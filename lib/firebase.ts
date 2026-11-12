import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAsG1Ra1Iwn272c9QzCU_2JNHQuU4-AuGk",
  authDomain: "qlhocphan-e50a7.firebaseapp.com",
  projectId: "qlhocphan-e50a7",
  storageBucket: "qlhocphan-e50a7.firebasestorage.app",
  messagingSenderId: "733845804039",
  appId: "1:733845804039:web:490deda83d394ed82ac6a2",
  measurementId: "G-NQ0B7GS6DC",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
