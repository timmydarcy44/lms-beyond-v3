-- Configuration d'évaluation : niveau, méthodes, expert validateur
ALTER TABLE "BadgeClass"
  ADD COLUMN IF NOT EXISTS "level" INTEGER,
  ADD COLUMN IF NOT EXISTS "evaluationMethods" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "validatorExpertId" TEXT;

CREATE INDEX IF NOT EXISTS "BadgeClass_validatorExpertId_idx" ON "BadgeClass"("validatorExpertId");
