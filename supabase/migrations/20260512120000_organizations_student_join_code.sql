-- Code d'établissement : rattachement auto des apprenants (sans UUID).
-- L'apprenant saisit `organizations.student_join_code` sur /dashboard/apprenant ;
-- l'équipe école voit / copie / régénère le code depuis « Mes apprenants ».

alter table if exists public.organizations
  add column if not exists student_join_code text;

create unique index if not exists organizations_student_join_code_lower_uidx
  on public.organizations (lower(trim(student_join_code)))
  where student_join_code is not null and length(trim(student_join_code)) > 0;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'organizations' and column_name = 'student_join_code'
  ) then
    execute $c$
      comment on column public.organizations.student_join_code is
        'Code saisi par l''apprenant pour lier son compte à cette organisation (CFA). Préférer stockage en minuscules ; unicité insensible à la casse (index lower(trim)).';
    $c$;
  end if;
end $$;
