create table if not exists nav_destination (
  id int primary key default 1,
  address text not null default '',
  updated_by text,
  updated_at timestamptz not null default now(),
  constraint nav_destination_singleton check (id = 1)
);

insert into nav_destination (id, address)
values (1, '')
on conflict (id) do nothing;

alter table nav_destination enable row level security;

create policy "allow all nav_destination" on nav_destination for all using (true) with check (true);

alter publication supabase_realtime add table nav_destination;
