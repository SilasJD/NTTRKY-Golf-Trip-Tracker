create table if not exists hole_mvp (
  id uuid primary key default gen_random_uuid(),
  tee_time_id uuid not null references tee_times(id) on delete cascade,
  hole_number int not null check (hole_number between 1 and 18),
  player_name text not null,
  updated_at timestamptz not null default now(),
  unique (tee_time_id, hole_number)
);

alter table hole_mvp enable row level security;

create policy "allow all hole_mvp" on hole_mvp for all using (true) with check (true);

alter publication supabase_realtime add table hole_mvp;
