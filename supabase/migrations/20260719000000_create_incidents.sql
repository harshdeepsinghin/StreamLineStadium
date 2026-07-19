-- Create incidents table
create table if not exists public.incidents (
  id text primary key,
  text text not null,
  location text not null,
  category text not null,
  severity text not null,
  confidence numeric not null,
  description text not null,
  suggested_teams jsonb not null, -- Stores array of strings
  status text not null,
  active boolean not null,
  timestamp timestamptz default now() not null,
  "updatedAt" timestamptz default now() not null,
  recommendations jsonb not null, -- Stores array of recommendation objects
  "resolutionNotes" text
);

-- Enable real-time for incidents table
alter publication supabase_realtime add table public.incidents;

-- Option 1: Disable Row Level Security (RLS) for Hackathon demo speed and zero auth friction
alter table public.incidents disable row level security;

-- Option 2: Alternatively, if you want RLS enabled, you can run the following to allow anonymous reads/writes:
-- alter table public.incidents enable row level security;
-- create policy "Allow public read access" on public.incidents for select using (true);
-- create policy "Allow public write access" on public.incidents for insert with check (true);
-- create policy "Allow public update access" on public.incidents for update using (true);
