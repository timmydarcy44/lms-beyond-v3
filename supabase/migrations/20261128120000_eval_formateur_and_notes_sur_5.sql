-- Satisfaction formateur en fin de session + notes à chaud / à froid sur 5.

do $$
declare r record;
begin
  for r in
    select conname, conrelid::regclass as tbl
    from pg_constraint
    where contype = 'c'
      and conrelid in (
        'public.formation_assessment_templates'::regclass,
        'public.formation_assessment_attempts'::regclass
      )
      and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table %s drop constraint if exists %I', r.tbl, r.conname);
  end loop;
end $$;

alter table public.formation_assessment_templates
  add constraint formation_assessment_templates_kind_check
  check (kind in (
    'positionnement',
    'eval_chaud',
    'eval_froid',
    'questionnaire_entreprise',
    'eval_formateur'
  ));

alter table public.formation_assessment_attempts
  add constraint formation_assessment_attempts_kind_check
  check (kind in (
    'positionnement',
    'eval_chaud',
    'eval_froid',
    'questionnaire_entreprise',
    'eval_formateur'
  ));

insert into public.formation_assessment_templates (kind, title, questions)
select
  'eval_formateur',
  'Satisfaction formateur',
  $formateur$[
    {"id":"intro","prompt":"Votre retour sur cette session nous aide à améliorer l'organisation pédagogique. Quelques minutes suffisent.","type":"section","sectionLabel":"Satisfaction formateur"},
    {"id":"t1_positionnement","prompt":"Le test de positionnement des salariés reflète-t-il le niveau en cours de formation ?","type":"single","options":["Oui","Plutôt oui","Plutôt non","Non"]},
    {"id":"t1_positionnement_pourquoi","prompt":"Pourquoi ?","type":"text","required":true,"showWhen":{"questionId":"t1_positionnement","values":["Plutôt non","Non"]}},
    {"id":"t2_besoin","prompt":"L'analyse du besoin était-elle en adéquation avec les besoins exprimés pendant la formation ?","type":"single","options":["Oui","Plutôt oui","Plutôt non","Non"]},
    {"id":"t2_besoin_pourquoi","prompt":"Pourquoi ?","type":"text","required":true,"showWhen":{"questionId":"t2_besoin","values":["Plutôt non","Non"]}},
    {"id":"t3_elements","prompt":"Avez-vous reçu les éléments de la session au moins 7 jours avant ?","type":"single","options":["Oui","Non"]},
    {"id":"t4_backstage","prompt":"Le Backstage formateur vous a-t-il permis de bien organiser votre session ?","type":"single","options":["Oui","Plutôt oui","Plutôt non","Non"]},
    {"id":"t4_backstage_pourquoi","prompt":"Pourquoi ?","type":"text","required":true,"showWhen":{"questionId":"t4_backstage","values":["Plutôt non","Non"]}},
    {"id":"t5_commentaires","prompt":"Commentaires :","type":"text"}
  ]$formateur$::jsonb
where not exists (
  select 1 from public.formation_assessment_templates
  where kind = 'eval_formateur' and training_course_id is null
);

update public.formation_assessment_templates
set
  title = 'Évaluation à chaud',
  questions = $chaud$[
    {"id":"intro","prompt":"Ce questionnaire nous permet de connaître votre avis sur la formation. Environ 5 minutes — vos réponses aident à améliorer nos formations.","type":"section","sectionLabel":"Qualiopi · Indicateur 30"},
    {"id":"c1_infos","prompt":"Informations reçues avant la formation (programme, convocation, livret d'accueil)","type":"single","options":["Pas du tout satisfait","Peu satisfait","Satisfait","Très satisfait"]},
    {"id":"c1_materiel","prompt":"Conditions matérielles ou accès à la plateforme en ligne","type":"single","options":["Pas du tout satisfait","Peu satisfait","Satisfait","Très satisfait"]},
    {"id":"c1_rythme","prompt":"Rythme et durée de la formation","type":"single","options":["Pas du tout satisfait","Peu satisfait","Satisfait","Très satisfait"]},
    {"id":"c1_assistance","prompt":"Réactivité de l'assistance pédagogique et technique","type":"single","options":["Pas du tout satisfait","Peu satisfait","Satisfait","Très satisfait"]},
    {"id":"c2_adequation","prompt":"Adéquation du contenu avec vos attentes","type":"single","options":["Pas du tout satisfait","Peu satisfait","Satisfait","Très satisfait"]},
    {"id":"c2_clarte","prompt":"Clarté et progression des contenus","type":"single","options":["Pas du tout satisfait","Peu satisfait","Satisfait","Très satisfait"]},
    {"id":"c2_supports","prompt":"Qualité des supports (vidéos, documents, exercices)","type":"single","options":["Pas du tout satisfait","Peu satisfait","Satisfait","Très satisfait"]},
    {"id":"c2_equilibre","prompt":"Équilibre entre apports théoriques et mise en pratique","type":"single","options":["Pas du tout satisfait","Peu satisfait","Satisfait","Très satisfait"]},
    {"id":"c3_maitrise","prompt":"La formatrice / le formateur — maîtrise du sujet","type":"single","options":["Pas du tout satisfait","Peu satisfait","Satisfait","Très satisfait"]},
    {"id":"c3_explications","prompt":"Clarté des explications","type":"single","options":["Pas du tout satisfait","Peu satisfait","Satisfait","Très satisfait"]},
    {"id":"c3_ecoute","prompt":"Disponibilité et écoute","type":"single","options":["Pas du tout satisfait","Peu satisfait","Satisfait","Très satisfait"]},
    {"id":"c3_adaptation","prompt":"Adaptation à votre profil et à votre rythme","type":"single","options":["Pas du tout satisfait","Peu satisfait","Satisfait","Très satisfait"]},
    {"id":"c4_objectifs","prompt":"Les objectifs annoncés dans le programme ont-ils été atteints ?","type":"single","options":["Totalement","En grande partie","Partiellement","Pas du tout"]},
    {"id":"c4_appris","prompt":"Avez-vous appris de nouvelles choses ?","type":"single","options":["Beaucoup","Assez","Peu","Pas du tout"]},
    {"id":"c4_capable","prompt":"Vous sentez-vous capable d'utiliser ce que vous avez appris ?","type":"single","options":["Oui, tout à fait","Plutôt oui","Plutôt non","Non"]},
    {"id":"c5_access","prompt":"Avez-vous eu besoin d'adaptations (handicap, contraintes particulières) ?","type":"single","options":["Non","Oui, et elles ont été satisfaisantes","Oui, mais elles n'ont pas été suffisantes"]},
    {"id":"c6_note","prompt":"Note globale de la formation (1 = très insatisfait, 5 = très satisfait)","type":"nps","min":1,"max":5,"labels":["Très insatisfait","Très satisfait"]},
    {"id":"c6_reco","prompt":"Recommanderiez-vous cette formation à une personne de votre entourage ?","type":"single","options":["Oui","Non"]},
    {"id":"c6_commentaires","prompt":"Commentaires :","type":"text"},
    {"id":"c6_info","prompt":"Souhaitez-vous être informé(e) d'autres formations Byound ?","type":"single","options":["Oui","Non"]}
  ]$chaud$::jsonb,
  updated_at = now()
where kind = 'eval_chaud' and training_course_id is null;

update public.formation_assessment_templates
set
  title = 'Évaluation à froid',
  questions = $froid$[
    {"id":"intro","prompt":"Il y a quelques mois, vous avez suivi une formation Byound. Ce questionnaire nous aide à mesurer la mise en pratique et l'impact dans la durée (~5 min).","type":"section","sectionLabel":"Qualiopi · Indicateurs 30 et 32"},
    {"id":"f1_competences","prompt":"La formation m'a permis de développer de nouvelles compétences","type":"single","options":["Pas du tout d'accord","Plutôt pas d'accord","Plutôt d'accord","Tout à fait d'accord"]},
    {"id":"f1_aise","prompt":"Je me sens plus à l'aise sur le sujet qu'avant la formation","type":"single","options":["Pas du tout d'accord","Plutôt pas d'accord","Plutôt d'accord","Tout à fait d'accord"]},
    {"id":"f1_utile","prompt":"Ce que j'ai appris est utile dans ma situation actuelle","type":"single","options":["Pas du tout d'accord","Plutôt pas d'accord","Plutôt d'accord","Tout à fait d'accord"]},
    {"id":"f1_besoins","prompt":"Avec le recul, la formation correspondait à mes besoins réels","type":"single","options":["Pas du tout d'accord","Plutôt pas d'accord","Plutôt d'accord","Tout à fait d'accord"]},
    {"id":"f2_pratique","prompt":"Depuis la fin de la formation, mettez-vous en œuvre les compétences acquises ?","type":"single","options":["Régulièrement","Occasionnellement","Pas encore","Non"]},
    {"id":"f2_exemples","prompt":"Donnez un ou deux exemples concrets de situations où vous les avez utilisées :","type":"text"},
    {"id":"f3_freins","prompt":"Qu'est-ce qui a pu limiter la mise en pratique ?","type":"multi","options":["Aucun frein","Manque de temps","Manque d'occasions","Besoin d'approfondir certains points","Contexte professionnel ou personnel","Autre"]},
    {"id":"f3_autre","prompt":"Si « Autre », précisez :","type":"text"},
    {"id":"f4_impact","prompt":"La formation a-t-elle fait avancer votre projet professionnel (reconversion, nouvelle mission, évolution…) ?","type":"single","options":["Beaucoup","Un peu","Pas encore","Non"]},
    {"id":"f4_change","prompt":"Décrivez en quelques mots ce qui a changé pour vous :","type":"text"},
    {"id":"f5_note","prompt":"Note globale de la formation aujourd'hui (1 = très insatisfait, 5 = très satisfait)","type":"nps","min":1,"max":5,"labels":["Très insatisfait","Très satisfait"]},
    {"id":"f5_reco","prompt":"Recommanderiez-vous cette formation ?","type":"single","options":["Oui","Non"]},
    {"id":"f5_commentaires","prompt":"Commentaires :","type":"text"},
    {"id":"f6_recontact","prompt":"Souhaitez-vous être recontacté(e) pour approfondir ou compléter votre formation ?","type":"single","options":["Oui","Non"]},
    {"id":"f6_sujet","prompt":"Si oui, sur quel sujet ?","type":"text"}
  ]$froid$::jsonb,
  updated_at = now()
where kind = 'eval_froid' and training_course_id is null;
