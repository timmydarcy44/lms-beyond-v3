-- Archive du credential remplacé lors d'une réémission.
-- Cette colonne n'est jamais sélectionnée par les lectures publiques.

begin;

alter table public.badge_assertions
  add column if not exists superseded_credential_jwt text,
  add column if not exists superseded_at timestamptz;

comment on column public.badge_assertions.superseded_credential_jwt is
  'Ancien VC-JWT conservé après réémission. Jamais servi publiquement.';

create or replace function public.badge_assertions_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.badge_can_issue() then
    return new;
  end if;

  if auth.uid() is distinct from old.recipient_profile_id then
    raise exception 'badge_assertions: modification refusée' using errcode = '42501';
  end if;

  if new.id is distinct from old.id
    or new.badge_class_id is distinct from old.badge_class_id
    or new.recipient_profile_id is distinct from old.recipient_profile_id
    or new.recipient_name is distinct from old.recipient_name
    or new.recipient_identity_hash is distinct from old.recipient_identity_hash
    or new.recipient_salt is distinct from old.recipient_salt
    or new.issued_at is distinct from old.issued_at
    or new.valid_until is distinct from old.valid_until
    or new.evidence is distinct from old.evidence
    or new.credential_jwt is distinct from old.credential_jwt
    or new.kid is distinct from old.kid
    or new.status_index is distinct from old.status_index
    or new.revoked_at is distinct from old.revoked_at
    or new.revocation_reason is distinct from old.revocation_reason
    or new.created_at is distinct from old.created_at
    or new.superseded_credential_jwt is distinct from old.superseded_credential_jwt
    or new.superseded_at is distinct from old.superseded_at
  then
    raise exception 'badge_assertions: le titulaire ne peut modifier que is_public'
      using errcode = '42501';
  end if;

  if new.is_public and old.is_public is not true then
    new.public_since := now();
  elsif new.is_public is not true then
    new.public_since := null;
  end if;

  return new;
end;
$$;

commit;
