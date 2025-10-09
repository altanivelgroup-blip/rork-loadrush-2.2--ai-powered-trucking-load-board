import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCBWrYNQFTrhVXFVPORseQfQaI44s_yYQA",
  authDomain: "loadrush-admin-console.firebaseapp.com",
  projectId: "loadrush-admin-console",
  storageBucket: "loadrush-admin-console.firebasestorage.app",
  messagingSenderId: "71906929791",
  appId: "1:71906929791:web:4ece0f5394c4bb6ff4634a"
};

let app;
let auth;
let db;
let storage;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  console.log('✅ Firebase initialized successfully:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    platform: Platform.OS
  });
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw error;
}

export { auth, db, storage };
export default app;
