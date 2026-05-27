-- Config par méthode d'évaluation + métriques d'intégrité apprenant
ALTER TABLE "BadgeReceivability"
  ADD COLUMN IF NOT EXISTS "methodConfigs" JSONB;

ALTER TABLE "Assessment"
  ADD COLUMN IF NOT EXISTS "integrityMetrics" JSONB,
  ADD COLUMN IF NOT EXISTS "methodResponses" JSONB;
