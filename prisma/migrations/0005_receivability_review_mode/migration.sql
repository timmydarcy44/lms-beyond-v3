DO $$
BEGIN
  CREATE TYPE "ReceivabilityReviewMode" AS ENUM ('AI', 'HUMAN', 'MIXED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "BadgeClass"
ADD COLUMN IF NOT EXISTS "receivabilityReviewMode" "ReceivabilityReviewMode" NOT NULL DEFAULT 'HUMAN';
