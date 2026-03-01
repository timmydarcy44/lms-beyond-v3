-- Add new fields to badge_classes
ALTER TABLE "BadgeClass"
  ADD COLUMN "createdByUserId" TEXT,
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "criteriaMarkdown" TEXT;

-- Backfill createdByUserId with org owner if possible (left null if not available)
-- Note: no default to avoid wrong attribution

-- Add criteria/receivability tables
CREATE TABLE "BadgeCriteria" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "badgeClassId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BadgeCriteria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BadgeReceivability" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "badgeClassId" TEXT NOT NULL,
  "expectedModalities" TEXT NOT NULL,
  "aiEvaluationPrompt" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BadgeReceivability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BadgeReceivability_badgeClassId_key" ON "BadgeReceivability"("badgeClassId");
CREATE INDEX "BadgeCriteria_badgeClassId_idx" ON "BadgeCriteria"("badgeClassId");

ALTER TABLE "BadgeCriteria"
  ADD CONSTRAINT "BadgeCriteria_badgeClassId_fkey"
  FOREIGN KEY ("badgeClassId") REFERENCES "BadgeClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BadgeReceivability"
  ADD CONSTRAINT "BadgeReceivability_badgeClassId_fkey"
  FOREIGN KEY ("badgeClassId") REFERENCES "BadgeClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key and indexes to BadgeClass
CREATE INDEX "BadgeClass_orgId_idx" ON "BadgeClass"("orgId");
CREATE INDEX "BadgeClass_issuerId_idx" ON "BadgeClass"("issuerId");

ALTER TABLE "BadgeClass"
  ADD CONSTRAINT "BadgeClass_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
