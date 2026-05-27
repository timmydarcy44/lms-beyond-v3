-- Sessions d'intégrité pour évaluations Open Badge (temps de rédaction, onglets, sorties de page)

alter table public.learning_sessions
  drop constraint if exists learning_sessions_content_type_check;

alter table public.learning_sessions
  add constraint learning_sessions_content_type_check
  check (content_type in ('path', 'course', 'resource', 'test', 'badge_assessment'));

alter table public.learning_session_events
  drop constraint if exists learning_session_events_event_type_check;

alter table public.learning_session_events
  add constraint learning_session_events_event_type_check
  check (
    event_type in (
      'start',
      'stop',
      'mousemove',
      'idle',
      'resume',
      'focus',
      'blur',
      'tab_hidden',
      'tab_visible',
      'page_leave',
      'page_return'
    )
  );

comment on column public.learning_sessions.metadata is
  'JSON libre : badgeClassId, methodId, assessmentId, leave_count, tab_hidden_count, etc.';
