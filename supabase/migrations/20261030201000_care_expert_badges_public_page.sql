-- La fiche praticien ouvre la page publique du badge, pas la page de critères.

begin;

create or replace view public.care_expert_badges
with (security_invoker = false) as
select
  p.expert_id,
  ob.id as badge_id,
  coalesce(nullif(ob.name, ''), ob.title, 'Open Badge') as name,
  ob.image_url,
  '/badges/' || a.id::text as verification_url,
  a.issued_at as awarded_at
from public.care_profiles p
join public.badge_assertions a
  on a.recipient_profile_id = p.expert_id
 and a.is_public = true
 and a.revoked_at is null
join public.open_badges ob
  on ob.id = a.badge_class_id;

grant select on public.care_expert_badges to anon, authenticated, service_role;

commit;
