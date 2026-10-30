-- timmydarcy44@gmail.com est un praticien réel. La migration précédente l'avait marqué en test.

update public.care_profiles p
set is_test = false
from public.experts e
where e.id = p.expert_id
  and lower(e.email) = 'timmydarcy44@gmail.com';
