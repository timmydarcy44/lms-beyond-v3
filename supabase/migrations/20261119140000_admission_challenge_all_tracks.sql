-- Questions challenge propres à toutes les filières Byound School (idempotent).

insert into public.admission_challenge_questions (specialization, slug, label, prompt, starter_hint, sort_order)
values
  ('real_estate', 're_trust', 'Confiance',
   'Une personne visite un appartement et dit « c’est trop cher » sans autre détail. Que ferais-tu ensuite ?',
   'Je lui demanderais…', 1),
  ('real_estate', 're_value', 'Valeur',
   'Comment expliques-tu la différence entre le prix d’un bien et sa valeur pour un acheteur ?',
   'Pour moi, le prix…', 2),
  ('merchandising', 'merch_attention', 'Attention',
   'Dans un rayon trop chargé, le client ne regarde plus rien. Que changerais-tu en premier ?',
   'Je commencerais par…', 1),
  ('merchandising', 'merch_story', 'Mise en scène',
   'Comment raconterais-tu une histoire de produit sans parler, juste avec le rayon ?',
   'Je mettrais en avant…', 2),
  ('luxury_premium', 'lux_detail', 'Exigence',
   'Un client premium remarque un détail qui cloche. Comment réagirais-tu sans casser l’expérience ?',
   'Je…', 1),
  ('luxury_premium', 'lux_desire', 'Désir',
   'Qu’est-ce qui, selon toi, transforme un bel objet en quelque chose dont on a vraiment envie ?',
   'Pour moi, c’est…', 2),
  ('ai_management', 'aim_priority', 'Priorisation',
   'Ton équipe a 10 idées IA, mais seulement 2 semaines. Comment choisis-tu par quoi commencer ?',
   'Je regarderais d’abord…', 1),
  ('ai_management', 'aim_people', 'Équipe',
   'Un collaborateur a peur que l’IA remplace son travail. Comment en parles-tu avec lui ?',
   'Je lui dirais…', 2),
  ('business_performance', 'perf_signal', 'Lecture',
   'Les ventes baissent depuis 3 semaines. Quelles 3 infos regarderais-tu en premier ?',
   'Je regarderais…', 1),
  ('business_performance', 'perf_action', 'Action',
   'Un indicateur est rouge, mais personne n’est d’accord sur la cause. Que fais-tu concrètement ?',
   'Je…', 2),
  ('transition_innovation', 'trans_resistance', 'Changement',
   'Une équipe refuse une nouvelle façon de travailler « parce que ça a toujours marché ». Que fais-tu ?',
   'Je commencerais par…', 1),
  ('transition_innovation', 'trans_idea', 'Innovation',
   'Propose une petite innovation (pas un projet géant) qui améliorerait le quotidien d’une entreprise que tu connais.',
   'Je proposerais…', 2),
  ('growth_acquisition', 'growth_channel', 'Acquisition',
   'Tu as 200 € pour trouver tes 20 premiers clients. Où les mets-tu, et pourquoi ?',
   'Je les mettrais…', 1),
  ('growth_acquisition', 'growth_message', 'Message',
   'Écris en une phrase ce que tu dirais à quelqu’un pour qu’il clique sur « essayer ».',
   'Je dirais…', 2),
  ('entrepreneurship', 'entro_problem', 'Problème',
   'Quel problème du quotidien aimerais-tu résoudre avec une petite entreprise, et pour qui ?',
   'Je voudrais aider…', 1),
  ('entrepreneurship', 'entro_test', 'Test',
   'Tu as une idée mais pas encore de produit. Comment vérifierais-tu qu’il y a un vrai besoin ?',
   'Je testerais en…', 2),
  ('international_business', 'intl_culture', 'Culture',
   'Un partenaire étranger te dit « oui » mais ne donne jamais de suite. Que comprends-tu, et que fais-tu ?',
   'Je me dirais que…', 1),
  ('international_business', 'intl_offer', 'Adaptation',
   'Un produit marche en France. Qu’est-ce que tu vérifierais avant de le proposer ailleurs ?',
   'Je vérifierais…', 2),
  ('strategic_partnerships', 'part_fit', 'Alliance',
   'Deux marques veulent s’associer. Comment saurais-tu si le partenariat a du sens ?',
   'Je regarderais…', 1),
  ('strategic_partnerships', 'part_pitch', 'Proposition',
   'Tu as 2 minutes pour convaincre une entreprise de devenir partenaire. Que dis-tu ?',
   'Je dirais…', 2)
on conflict (specialization, slug) do update set
  label = excluded.label,
  prompt = excluded.prompt,
  starter_hint = excluded.starter_hint,
  sort_order = excluded.sort_order,
  active = true,
  updated_at = now();

insert into public.admission_challenge_question_versions (question_id, version, label, prompt, starter_hint)
select q.id, 1, q.label, q.prompt, q.starter_hint
from public.admission_challenge_questions q
where not exists (
  select 1 from public.admission_challenge_question_versions v
  where v.question_id = q.id and v.version = 1
);

insert into public.admission_track_prerequisites (specialization, required_diploma, label)
select s.specialization, 'bac', 'Bac (général, technologique ou pro)'
from (
  values
    ('real_estate'),
    ('merchandising'),
    ('luxury_premium'),
    ('ai_management'),
    ('business_performance'),
    ('transition_innovation'),
    ('growth_acquisition'),
    ('entrepreneurship'),
    ('international_business'),
    ('strategic_partnerships'),
    ('ai_business'),
    ('sport_business'),
    ('retail_experience')
) as s(specialization)
on conflict (specialization) do update set
  required_diploma = excluded.required_diploma,
  label = excluded.label,
  updated_at = now();
