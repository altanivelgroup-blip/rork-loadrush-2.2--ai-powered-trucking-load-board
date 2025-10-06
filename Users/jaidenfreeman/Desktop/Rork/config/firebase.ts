import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCBWrYNQFTrhVXFVPORseQfQaI44s_yYQA",
  authDomain: "loadrush-admin-console.firebaseapp.com",
  projectId: "loadrush-admin-console",
  storageBucket: "loadrush-admin-console.firebasestorage.app",
  messagingSenderId: "71906929791",
  appId: "1:71906929791:web:4ece0f5394c4bb6ff4634a"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
