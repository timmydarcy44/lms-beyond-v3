ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
CHECK (role = ANY (ARRAY[
  'student',
  'entreprise',
  'admin',
  'tutor',
  'ecole',
  'mentor',
  'PARTICULIER',
  'demo'
]));
