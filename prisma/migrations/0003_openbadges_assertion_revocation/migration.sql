ALTER TABLE "Assertion"
ADD COLUMN IF NOT EXISTS "revokedByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "Assertion_revokedAt_idx" ON "Assertion"("revokedAt");
