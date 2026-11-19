-- Align live specialization check with CFA_SPECIALIZATIONS (MEM / REM / RDC).
-- Previous envs still had the NTC-only check from 20261007140000.

alter table public.cfa_applications
  drop constraint if exists cfa_applications_specialization_check;

alter table public.cfa_applications
  add constraint cfa_applications_specialization_check check (
    specialization in (
      'ai_business',
      'sport_business',
      'real_estate',
      'retail_experience',
      'merchandising',
      'luxury_premium',
      'ai_management',
      'business_performance',
      'transition_innovation',
      'growth_acquisition',
      'entrepreneurship',
      'international_business',
      'strategic_partnerships'
    )
  );
