-- Lecture missions par employee_id (salarié lié sans profile_id sur la mission)

drop policy if exists employee_missions_employee_read on public.employee_missions;
create policy employee_missions_employee_read on public.employee_missions
  for select to authenticated
  using (
    employee_id in (
      select e.id
      from public.employees e
      where e.profile_id = auth.uid()
         or lower(e.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists employee_missions_employee_update on public.employee_missions;
create policy employee_missions_employee_update on public.employee_missions
  for update to authenticated
  using (
    employee_id in (
      select e.id
      from public.employees e
      where e.profile_id = auth.uid()
         or lower(e.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  with check (
    employee_id in (
      select e.id
      from public.employees e
      where e.profile_id = auth.uid()
         or lower(e.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
