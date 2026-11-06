-- Thématique des réclamations Qualiopi (classement + réponse)

alter table public.crm_qualiopi_reclamations
  add column if not exists theme text;

alter table public.crm_qualiopi_reclamations
  drop constraint if exists crm_qualiopi_reclamations_theme_check;

alter table public.crm_qualiopi_reclamations
  add constraint crm_qualiopi_reclamations_theme_check
  check (
    theme is null
    or theme in ('organisation', 'outil_byound', 'programmation', 'contenu', 'formateur', 'autre')
  );

update public.crm_qualiopi_reclamations
set theme = 'autre'
where theme is null;

create index if not exists crm_qualiopi_reclamations_theme_idx
  on public.crm_qualiopi_reclamations (theme, received_at desc);
