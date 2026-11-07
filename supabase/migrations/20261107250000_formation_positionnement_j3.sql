-- Positionnement J-3 + synthèse formateur (kinds planifiés)

alter table public.formation_scheduled_mails
  drop constraint if exists formation_scheduled_mails_kind_check;

alter table public.formation_scheduled_mails
  add constraint formation_scheduled_mails_kind_check
  check (kind in (
    'devis_relance_j3',
    'devis_relance_j7',
    'convention_relance_j3',
    'convention_relance_j7',
    'convocation_j7',
    'positionnement_j3',
    'positionnement_synth_formateur',
    'absent_relance',
    'eval_froid_j60',
    'questionnaire_entreprise_j60'
  ));

comment on table public.formation_scheduled_mails is
  'File d''attente mails formation (relances, convocations J-7, positionnement J-3, synthèse formateur, absents, J+60)';
