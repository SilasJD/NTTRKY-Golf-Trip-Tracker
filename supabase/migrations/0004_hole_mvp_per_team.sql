delete from hole_mvp;

alter table hole_mvp add column if not exists team_name text not null default '';

alter table hole_mvp drop constraint if exists hole_mvp_tee_time_id_hole_number_key;

alter table hole_mvp
  add constraint hole_mvp_tee_time_id_hole_number_team_name_key
  unique (tee_time_id, hole_number, team_name);
