alter table tee_times
  add column if not exists format text not null default 'stroke' check (format in ('stroke', 'scramble'));

alter table tee_times
  add column if not exists teams jsonb not null default '[]'::jsonb;
