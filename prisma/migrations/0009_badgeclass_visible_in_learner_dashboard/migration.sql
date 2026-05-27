ALTER TABLE "BadgeClass"
ADD COLUMN IF NOT EXISTS "visibleInLearnerDashboard" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "BadgeClass_visibleInLearnerDashboard_idx"
ON "BadgeClass" ("visibleInLearnerDashboard")
WHERE "visibleInLearnerDashboard" = true;
