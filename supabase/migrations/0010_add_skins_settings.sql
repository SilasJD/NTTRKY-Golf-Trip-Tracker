create table if not exists skins_settings (
  id int primary key default 1,
  buy_in numeric not null default 1,
  updated_by text,
  updated_at timestamptz not null default now(),
  constraint skins_settings_singleton check (id = 1)
);

insert into skins_settings (id, buy_in) values (1, 1) on conflict (id) do nothing;

alter table skins_settings enable row level security;
create policy "allow all skins_settings" on skins_settings for all using (true) with check (true);

alter publication supabase_realtime add table skins_settings;
