create table if not exists photos_link (
  id int primary key default 1,
  url text not null default '',
  updated_by text,
  updated_at timestamptz not null default now(),
  constraint photos_link_singleton check (id = 1)
);

insert into photos_link (id, url)
values (1, '')
on conflict (id) do nothing;

alter table photos_link enable row level security;

create policy "allow all photos_link" on photos_link for all using (true) with check (true);

alter publication supabase_realtime add table photos_link;
