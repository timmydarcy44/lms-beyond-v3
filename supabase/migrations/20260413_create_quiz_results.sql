-- Quiz results tracking (scores per learner & course)
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

CREATE TABLE IF NOT EXISTS public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenant_id uuid REFERENCES auth.users(id),
  course_id uuid REFERENCES public.courses(id),
  quiz_id uuid, -- ID du quiz concerné
  score int,
  total_questions int,
  completed_at timestamptz DEFAULT now()
);

