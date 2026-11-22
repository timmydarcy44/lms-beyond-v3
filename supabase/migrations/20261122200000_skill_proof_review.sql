-- Review Byound des preuves de compétences (hors Open Badge)
alter table public.skill_declarations
  add column if not exists proof_review_status text not null default 'none',
  add column if not exists proof_review_note text,
  add column if not exists proof_file_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'skill_declarations_proof_review_status_chk'
  ) then
    alter table public.skill_declarations
      add constraint skill_declarations_proof_review_status_chk
      check (proof_review_status in ('none', 'pending', 'validated', 'refused', 'needs_more'));
  end if;
end $$;

comment on column public.skill_declarations.proof_review_status is
  'none | pending | validated | refused | needs_more — décision Byound sur la preuve.';
comment on column public.skill_declarations.proof_review_note is
  'Motif / feedback Byound (analyse IA ou revue manuelle).';
comment on column public.skill_declarations.proof_file_path is
  'Chemin storage du fichier déposé (PDF, vidéo, image…).';

-- Les « Prouvée » auto (note seule, sans validation) repassent en analyse
update public.skill_declarations
set
  status = 'declared',
  proof_review_status = 'pending',
  updated_at = now()
where status = 'proven'
  and coalesce(proof_review_status, 'none') in ('none', 'pending');

create index if not exists skill_declarations_proof_pending_idx
  on public.skill_declarations (proof_review_status, updated_at desc)
  where proof_review_status = 'pending';
