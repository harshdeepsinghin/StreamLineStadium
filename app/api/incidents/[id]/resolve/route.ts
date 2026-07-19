import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseClient';

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

    // Check if incident exists
    const { data: incident, error: selectError } = await supabaseAdmin
      .from('incidents')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Failed to query incident from Supabase: ${selectError.message}`);
    }

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Update in Supabase
    const { error: updateError } = await supabaseAdmin
      .from('incidents')
      .update({
        status: resolutionStatus,
        active: false,
        resolutionNotes: notes || '',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Failed to update incident in Supabase: ${updateError.message}`);
    }

    return NextResponse.json({ success: true, id, status: resolutionStatus });
  } catch (error) {
    console.error('API /api/incidents/[id]/resolve error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
