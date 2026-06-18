create table if not exists player_venmo (
  player_name text primary key,
  venmo_username text,
  updated_at timestamptz not null default now()
);

alter table player_venmo enable row level security;

create policy "allow all player_venmo" on player_venmo for all using (true) with check (true);

alter publication supabase_realtime add table player_venmo;
