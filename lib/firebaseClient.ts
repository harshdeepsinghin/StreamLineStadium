import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "winter-time-304723",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || undefined,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || undefined,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || undefined,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined
};

// Initialize Firebase App for client side usage
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const clientDb = getFirestore(app);
export { app as clientApp };
