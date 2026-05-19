-- Pair validation: link a course to a validator (peer)

alter table public.courses
  add column if not exists validated_by_peer_id uuid;

comment on column public.courses.validated_by_peer_id is 'Validator (peer) id from public.validators.';

