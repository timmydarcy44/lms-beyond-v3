DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProfileRole') THEN
    CREATE TYPE "ProfileRole" AS ENUM ('ADMIN', 'ENTREPRISE', 'PARTICULIER', 'APPRENANT', 'ECOLE', 'SALARIE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'ADMIN'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ProfileRole')
  ) THEN
    ALTER TYPE "ProfileRole" ADD VALUE 'ADMIN';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role "ProfileRole" NOT NULL DEFAULT 'PARTICULIER';
  ELSE
    UPDATE public.profiles
    SET role = CASE
      WHEN role IS NULL OR btrim(role) = '' THEN 'PARTICULIER'
      ELSE upper(role)
    END;

    UPDATE public.profiles
    SET role = CASE
      WHEN role IN ('USER', 'CLIENT', 'PARTICULIER') THEN 'PARTICULIER'
      WHEN role IN ('ADMIN', 'SUPERADMIN') THEN 'ADMIN'
      ELSE role
    END;

    BEGIN
      ALTER TABLE public.profiles
        ALTER COLUMN role TYPE "ProfileRole" USING (upper(role)::"ProfileRole");
    EXCEPTION
      WHEN invalid_text_representation THEN
        ALTER TABLE public.profiles
          ALTER COLUMN role SET DEFAULT 'PARTICULIER';
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'disc_profile'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN disc_profile text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'disc_score'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN disc_score integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'disc_scores'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN disc_scores jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'disc_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN disc_status text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'score_d'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN score_d integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'score_i'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN score_i integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'score_s'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN score_s integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'score_c'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN score_c integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;
