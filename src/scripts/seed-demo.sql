INSERT INTO profiles (
  id, email, first_name, last_name,
  role, access_lms, access_connect
)
VALUES
  (gen_random_uuid(), 'anais.demo@beyond.fr',
   'Anaïs', 'Dupont', 'student', true, true),
  (gen_random_uuid(), 'lucas.demo@beyond.fr',
   'Lucas', 'Bernard', 'student', true, true),
  (gen_random_uuid(), 'emma.demo@beyond.fr',
   'Emma', 'Petit', 'student', true, true),
  (gen_random_uuid(), 'thomas.demo@beyond.fr',
   'Thomas', 'Martin', 'student', true, true),
  (gen_random_uuid(), 'sarah.demo@beyond.fr',
   'Sarah', 'Leroy', 'student', true, true)
ON CONFLICT DO NOTHING;
