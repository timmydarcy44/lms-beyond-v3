ALTER TABLE "BadgeClass"
ADD COLUMN IF NOT EXISTS "requiresEnrollment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "requiredCourseId" TEXT;

CREATE INDEX IF NOT EXISTS "BadgeClass_requiredCourseId_idx" ON "BadgeClass"("requiredCourseId");
