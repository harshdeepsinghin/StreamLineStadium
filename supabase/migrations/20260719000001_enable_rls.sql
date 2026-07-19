-- Enable Row Level Security (RLS) to enforce server-mediated database modifications
alter table public.incidents enable row level security;

-- Create policy to allow public anonymous read-only access
create policy "Allow public read-only access" on public.incidents
  for select
  to anon, authenticated
  using (true);
