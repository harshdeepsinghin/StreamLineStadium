import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase, Incident } from '@/lib/supabaseClient';
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

    // Fetch recent incidents (latest 10 active) to serve as prompt context
    const { data: recentIncidentsData, error: fetchError } = await supabase
      .from('incidents')
      .select('category, location, timestamp')
      .eq('active', true)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error("Error fetching recent incidents context from Supabase:", fetchError);
    }

    const recentIncidents = (recentIncidentsData || []).map(inc => ({
      category: inc.category,
      location: inc.location,
      timestamp: inc.timestamp,
    }));

    // 1. Extract Structured Incident from raw text
    const structuredData = await extractIncident(text);

    // 2. Generate recommendations based on the new incident and recent history
    const recommendations = await generateRecommendations(structuredData, recentIncidents);

    // Create database document
    const newId = crypto.randomUUID();
    const timestampStr = new Date().toISOString();
    const newIncident: Incident = {
      id: newId,
      text,
      ...structuredData,
      status: 'reported',
      active: true,
      timestamp: timestampStr,
      updatedAt: timestampStr,
      recommendations,
    };

    // Save to Supabase
    const { error: insertError } = await supabase
      .from('incidents')
      .insert(newIncident);

    if (insertError) {
      throw new Error(`Failed to save incident to Supabase: ${insertError.message}`);
    }

    return NextResponse.json(newIncident);
  } catch (error) {
    console.error('API /api/report error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
