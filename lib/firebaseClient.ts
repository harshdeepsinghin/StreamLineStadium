import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDjo5QgBrvBXPJnSpDI6dqNcCYRKqdL_fI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hack2skill-a226e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hack2skill-a226e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hack2skill-a226e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "376597987794",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:376597987794:web:4c02f1467a990a3941480b",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-X143GWLBTT"
};

// Initialize Firebase App for client side usage
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const clientDb = getFirestore(app);
export { app as clientApp };
