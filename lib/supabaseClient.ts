import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nrizpohkvmwijfkcdxkf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only administrative client to bypass RLS policies securely
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

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
  timestamp: string;
  updatedAt: string;
  recommendations: Recommendation[];
  resolutionNotes?: string;
}

export interface Recommendation {
  id: string;
  action: string;
  reasoning: string;
  priority: number;
}

