create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category text not null default 'trip' check (category in ('green_fees', 'skins', 'trip')),
  amount numeric(10, 2) not null check (amount > 0),
  paid_by text not null,
  split_among text[] not null,
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;

create policy "allow all expenses" on expenses for all using (true) with check (true);

alter publication supabase_realtime add table expenses;
