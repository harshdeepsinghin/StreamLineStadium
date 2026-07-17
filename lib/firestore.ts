import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'hack2skill-a226e',
  });
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
