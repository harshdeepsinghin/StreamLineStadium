import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.GOOGLE_CLOUD_PROJECT || serviceAccount.project_id || 'winter-time-304723',
      });
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', err);
      // Fallback to ADC
      initializeApp({
        credential: applicationDefault(),
        projectId: process.env.GOOGLE_CLOUD_PROJECT || 'winter-time-304723',
      });
    }
  } else {
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'winter-time-304723',
    });
  }
}

export const db = getFirestore();

export interface Incident {
  id: string;
  text: string;
  location: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  description: string;
  suggested_teams: string[];
  status: 'reported' | 'investigating' | 'resolving' | 'resolved' | 'dismissed';
  active: boolean;
  timestamp: any; // Firestore Timestamp
  updatedAt: any;
  recommendations: Recommendation[];
  resolutionNotes?: string;
}

export interface Recommendation {
  id: string;
  action: string;
  reasoning: string;
  priority: number; // 1 = highest
}
