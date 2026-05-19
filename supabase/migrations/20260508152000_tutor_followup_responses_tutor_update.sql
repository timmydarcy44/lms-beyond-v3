-- Permettre au tuteur de mettre à jour ses propres réponses (re-soumission formulaire).

drop policy if exists tutor_followup_responses_update_tutor on public.tutor_followup_responses;

create policy tutor_followup_responses_update_tutor on public.tutor_followup_responses
  for update
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);
