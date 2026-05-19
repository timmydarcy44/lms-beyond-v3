-- Couverture visuelle + référentiel déposé / structure extraite (IA) pour les cursus école.

alter table public.school_classes
  add column if not exists cover_image_url text;

alter table public.school_classes
  add column if not exists referential_structure jsonb;

alter table public.school_classes
  add column if not exists referential_extracted_text text;

comment on column public.school_classes.cover_image_url is 'URL publique ou stockage de la cover du cursus (affiche Mes classes).';
comment on column public.school_classes.referential_structure is 'Arborescence générée depuis le référentiel (modules, cours, missions entreprise).';
comment on column public.school_classes.referential_extracted_text is 'Extrait texte brut du PDF (aperçu / debug, tronqué côté app).';
