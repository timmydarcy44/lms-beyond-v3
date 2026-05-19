-- Optional URLs for extended certification modalities (video / livrable).
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'badges'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'badges' and column_name = 'video_presentation_url'
    ) then
      alter table public.badges add column video_presentation_url text;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'badges' and column_name = 'technical_deliverable_url'
    ) then
      alter table public.badges add column technical_deliverable_url text;
    end if;
  end if;
end$$;
