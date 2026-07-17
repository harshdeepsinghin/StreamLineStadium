import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/firestore';

const schema = z.object({
  resolutionStatus: z.enum(['resolved', 'dismissed']),
  notes: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { resolutionStatus, notes } = parsed.data;

    const docRef = db.collection('incidents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Update in Firestore
    await docRef.update({
      status: resolutionStatus,
      active: false,
      resolutionNotes: notes || '',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id, status: resolutionStatus });
  } catch (error: any) {
    console.error('API /api/incidents/[id]/resolve error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
