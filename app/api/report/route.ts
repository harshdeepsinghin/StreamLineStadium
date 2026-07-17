import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { db, Incident } from '@/lib/firestore';
import { extractIncident, generateRecommendations } from '@/lib/gemini';

const schema = z.object({
  text: z.string().min(3, 'Report text must be at least 3 characters long'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { text } = parsed.data;

    // Fetch recent incidents (last 30 minutes / latest 10) to serve as prompt context
    const recentIncidentsSnapshot = await db
      .collection('incidents')
      .where('active', '==', true)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const recentIncidents = recentIncidentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        category: data.category,
        location: data.location,
        timestamp: data.timestamp,
      };
    });

    // 1. Extract Structured Incident from raw text
    const structuredData = await extractIncident(text);

    // 2. Generate recommendations based on the new incident and recent history
    const recommendations = await generateRecommendations(structuredData, recentIncidents);

    // Create database document reference
    const docRef = db.collection('incidents').doc();
    const newIncident: Incident = {
      id: docRef.id,
      text,
      ...structuredData,
      status: 'reported',
      active: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      recommendations,
    };

    // Save to Firestore
    await docRef.set(newIncident);

    // Fetch the stored doc (so we return the actual timestamps format if needed)
    const savedDoc = await docRef.get();
    const savedData = savedDoc.data();

    return NextResponse.json({
      ...newIncident,
      // convert serverTimestamp for JSON serialization
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('API /api/report error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
