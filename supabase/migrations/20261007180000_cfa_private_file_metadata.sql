alter table public.cfa_applications
  add column if not exists private_files jsonb not null default '{}'::jsonb;

comment on column public.cfa_applications.private_files is
  'Métadonnées des pièces privées du bucket cfa-applications : path, original_name, mime_type, size_bytes, uploaded_at.';

create index if not exists cfa_applications_private_files_gin
  on public.cfa_applications using gin (private_files);

update public.cfa_applications
set private_files =
  private_files
  || case
    when cv_path is not null and not (private_files ? 'cv')
      then jsonb_build_object('cv', jsonb_build_object('path', cv_path))
    else '{}'::jsonb
  end
  || case
    when motivation_media_url is not null
      and motivation_media_url not like 'http%'
      and not (private_files ? 'motivation')
      then jsonb_build_object('motivation', jsonb_build_object('path', motivation_media_url))
    else '{}'::jsonb
  end
  || case
    when administrative_documents ? 'identity' and not (private_files ? 'identity')
      then jsonb_build_object('identity', jsonb_build_object('path', administrative_documents->>'identity'))
    else '{}'::jsonb
  end
  || case
    when administrative_documents ? 'social_security' and not (private_files ? 'social_security')
      then jsonb_build_object('social_security', jsonb_build_object('path', administrative_documents->>'social_security'))
    else '{}'::jsonb
  end
  || case
    when administrative_documents ? 'diploma' and not (private_files ? 'diploma')
      then jsonb_build_object('diploma', jsonb_build_object('path', administrative_documents->>'diploma'))
    else '{}'::jsonb
  end;
