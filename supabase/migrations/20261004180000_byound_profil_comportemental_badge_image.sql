-- Image officielle du badge profil croisé / connaissance de soi (3 tests).

update public.open_badges
set
  image_url = 'https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Badges/Badge%20dore%20isole%20sur%20fond%20transparent.png',
  name = coalesce(nullif(trim(name), ''), 'Profil comportemental Byound'),
  title = coalesce(nullif(trim(title), ''), 'Connaissance de soi'),
  description = coalesce(
    nullif(trim(description), ''),
    'Validation du profil croisé : tests DISC, IDMC et soft skills Byound.'
  ),
  updated_at = now()
where id = 'a1000001-0000-4000-8000-000000000001'
   or lower(name) in (
     'diagnostic commercial',
     'profil comportemental edge',
     'profil comportemental byound'
   );
