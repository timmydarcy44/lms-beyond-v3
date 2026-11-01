-- Notes de lecture : type, note personnelle, ancre de retour au passage.
alter table public.lesson_ai_user_transformations
  add column if not exists note_kind text,
  add column if not exists personal_note text,
  add column if not exists anchor jsonb;

comment on column public.lesson_ai_user_transformations.note_kind is
  'highlight, personal, schema ou summary.';
comment on column public.lesson_ai_user_transformations.anchor is
  'Ancre : blockId, offset, excerpt de contrôle.';

update public.lesson_ai_user_transformations
set note_kind = case
  when action in ('schema', 'mindmap') then 'schema'
  when action = 'highlight' then 'highlight'
  when action = 'personal' then 'personal'
  else 'summary'
end
where note_kind is null;

update public.lesson_ai_user_transformations
set selection_excerpt = trim(regexp_replace(
  regexp_replace(
    regexp_replace(selection_excerpt, '</(p|div|h[1-6]|li|tr|blockquote)>', E'\n', 'gi'),
    '<[^>]+>',
    ' ',
    'g'
  ),
  '[[:space:]]+',
  ' ',
  'g'
))
where selection_excerpt ~ '<';
