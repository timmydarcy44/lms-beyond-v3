-- Analyse IA soft skills (route /api/soft-skills/analyze)
alter table public.soft_skills_resultats
  add column if not exists ai_analysis text;
