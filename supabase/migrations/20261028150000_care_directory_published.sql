-- L'annuaire public liste les praticiens Care publiés.
-- La complétude (photo, titre, accroche, prestation) reste un garde-fou dashboard,
-- elle ne doit plus vider l'annuaire.

create or replace view public.care_directory
with (security_invoker = true) as
select
  p.expert_id,
  p.slug,
  p.display_name,
  p.title,
  p.tagline,
  p.headline,
  p.avatar_url,
  p.domains,
  p.city,
  p.offers_cabinet,
  p.offers_visio,
  p.publics,
  p.member_since,
  coalesce(b.badge_count, 0)::integer as badge_count,
  s.min_price_cents
from public.care_profiles p
left join lateral (
  select min(cs.price_cents) as min_price_cents
  from public.care_services cs
  where cs.expert_id = p.expert_id
    and cs.active
    and char_length(btrim(cs.name)) > 0
) s on true
left join lateral (
  select count(*)::integer as badge_count
  from public.care_expert_badges beb
  where beb.expert_id = p.expert_id
) b on true
where p.published
  and p.is_care;

grant select on public.care_directory to anon, authenticated;
