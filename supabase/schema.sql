create table if not exists tee_times (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null check (course_slug in ('wolf-creek', 'mt-ogden')),
  play_date date not null,
  tee_time time not null,
  players text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  tee_time_id uuid not null references tee_times(id) on delete cascade,
  player_name text not null,
  hole_number int not null check (hole_number between 1 and 18),
  strokes int check (strokes between 1 and 15),
  updated_at timestamptz not null default now(),
  unique (tee_time_id, player_name, hole_number)
);

alter table tee_times enable row level security;
alter table scores enable row level security;

create policy "allow all tee_times" on tee_times for all using (true) with check (true);
create policy "allow all scores" on scores for all using (true) with check (true);

alter publication supabase_realtime add table tee_times;
alter publication supabase_realtime add table scores;
