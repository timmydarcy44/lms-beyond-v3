-- Ajoute Timmy Darcy comme validateur Open Badges (idempotent)
INSERT INTO public.validators (first_name, last_name, description)
SELECT
  'Timmy',
  'Darcy',
  'Validateur Open Badges — Beyond LMS'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.validators
  WHERE lower(trim(first_name)) = 'timmy'
    AND lower(trim(last_name)) = 'darcy'
);
