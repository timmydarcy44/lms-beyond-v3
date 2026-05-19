-- Aligner check_course_category sur les thématiques autorisées côté appli
-- (src/lib/edge-lab-course-categories.ts, src/lib/playmakers-course-categories.ts).
-- Sans cela, les 5 piliers Playmakers (ex. « LA VENTE EN CONTEXTE ÉVÉNEMENTIEL ») sont
-- rejetés par la DB (23514) alors qu’ils sont valides côté builder.
--
-- N’inclut que `category` (la contrainte historique porte d’ordinaire sur cette colonne).
-- Adapter le tableau ici quand on ajoute/retire une thématique côté TypeScript.

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'check_course_category'
      and conrelid = 'public.courses'::regclass
  ) then
    alter table public.courses drop constraint check_course_category;
  end if;
end;
$$;

alter table public.courses
  add constraint check_course_category
  check (
    category is null
    or category = any (array[
        'Formation',
        'Non catégorisé',
        -- EDGE Lab
        'Intelligence artificielle',
        'Automatisation & IA commerciale',
        'Analyse comportementale',
        'Communication & Storytelling professionnel',
        'Leadership & Management',
        'Négociation & Influence',
        'Métacognition & Apprentissage',
        'Soft Skills & Intelligence émotionnelle',
        'Pilotage de la performance & KPIs',
        'Transition écologique & RSE',
        'Créativité & Innovation',
        'Gestion du temps & Productivité',
        'Recrutement & Marque employeur',
        -- Playmakers (canon + libellés historiques / variantes d’appariement)
        'L''ÉCOSYSTÈME DU SPORT PROFESSIONNEL',
        'L''écosystème du sport professionnel',
        'Ecosystème du sport professionnel',
        'L''ECOSYSTEME DU SPORT PROFESSIONNEL',
        'CONSTRUIRE ET VALORISER UNE OFFRE PARTENARIAT',
        'Construire et valoriser une offre partenariat',
        'SPONSORING, PARTENARIATS & ÉVÉNEMENTIEL SPORTIF',
        'Sponsoring, partenariats & événementiel sportif',
        'Sponsoring sportif',
        'Partenariats sport',
        'LA NÉGOCIATION COMMERCIALE DANS LE SPORT',
        'La négociation commerciale dans le sport',
        'VENTE & NÉGOCIATION',
        'Vente & négociation',
        'Négociation, marketing & stratégie sportive',
        'Négociation sport',
        'NÉGOCIATION SPORT',
        'LA VENTE EN CONTEXTE ÉVÉNEMENTIEL',
        'La vente en contexte événementiel',
        'Événementiel sportif',
        'MÉDIAS, DIGITAL & COMMUNICATION SPORTIVE',
        'Médias, digital & communication sportive',
        'Communication sportive',
        'PILOTAGE ET DÉVELOPPEMENT COMMERCIAL',
        'Pilotage et développement commercial',
        'MANAGEMENT & GOUVERNANCE DES ORGANISATIONS SPORTIVES',
        'Management & gouvernance des organisations sportives',
        'DROIT, FINANCE & ÉCONOMIE DU SPORT',
        'Droit, finance & économie du sport',
        'PERFORMANCE, PRÉPARATION & ACCOMPAGNEMENT DES SPORTIFS',
        'Performance, préparation & accompagnement des sportifs',
        'DÉVELOPPEMENT DURABLE, RSE & RESPONSABILITÉ DANS LE SPORT',
        'Développement durable, RSE & responsabilité dans le sport',
        'Digital sport'
    ]::text[])
  );
