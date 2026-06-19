create table if not exists side_bets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount numeric not null,
  participants text[] not null,
  winner text,
  created_by text,
  created_at timestamptz not null default now()
);

alter table side_bets enable row level security;
create policy "allow all side_bets" on side_bets for all using (true) with check (true);

alter publication supabase_realtime add table side_bets;
