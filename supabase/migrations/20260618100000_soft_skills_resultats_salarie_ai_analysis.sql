-- Cache analyse IA soft skills (parcours salarié, route /api/soft-skills/analyze)
alter table public.soft_skills_resultats_salarie
  add column if not exists ai_analysis text;
