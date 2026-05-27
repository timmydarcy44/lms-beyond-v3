-- OPTIONNEL — Schéma Prisma « BadgeClass » (stack avancée assessments / assertions).
-- Si vous utilisez déjà public.open_badges, préférez :
--   supabase/migrations/20260527130000_open_badges_admin_columns.sql
-- Idempotent : peut être relancé sans erreur si déjà partiellement appliqué.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EVALUATOR', 'EARNER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BadgeClassStatus') THEN
    CREATE TYPE "BadgeClassStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EvidenceType') THEN
    CREATE TYPE "EvidenceType" AS ENUM ('FILE', 'URL', 'TEXT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssessmentStatus') THEN
    CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'NEEDS_INFO', 'APPROVED', 'REJECTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VerificationType') THEN
    CREATE TYPE "VerificationType" AS ENUM ('HOSTED', 'SIGNED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReceivabilityReviewMode') THEN
    CREATE TYPE "ReceivabilityReviewMode" AS ENUM ('AI', 'HUMAN', 'MIXED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId" uuid NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "email" text NOT NULL UNIQUE,
  "name" text,
  "role" "UserRole" NOT NULL DEFAULT 'EARNER',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "IssuerProfile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId" uuid NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "url" text NOT NULL,
  "email" text NOT NULL,
  "description" text,
  "imageUrl" text,
  "publicKeys" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "CompetencyFramework" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId" uuid NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "url" text,
  "version" int NOT NULL DEFAULT 1,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Competency" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "frameworkId" uuid NOT NULL REFERENCES "CompetencyFramework"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "category" text,
  "level" text,
  "tags" text[] NOT NULL DEFAULT '{}',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "BadgeClass" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "orgId" uuid NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "issuerId" uuid NOT NULL REFERENCES "IssuerProfile"("id") ON DELETE RESTRICT,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "imageTemplateUrl" text NOT NULL,
  "criteriaUrl" text,
  "criteriaText" text,
  "alignment" jsonb,
  "tags" text[] NOT NULL DEFAULT '{}',
  "version" int NOT NULL DEFAULT 1,
  "status" "BadgeClassStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Assessment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "badgeClassId" uuid NOT NULL REFERENCES "BadgeClass"("id") ON DELETE CASCADE,
  "earnerId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "evaluatorId" uuid REFERENCES "User"("id") ON DELETE SET NULL,
  "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
  "rubric" jsonb,
  "decisionAt" timestamptz,
  "notes" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Evidence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "assessmentId" uuid REFERENCES "Assessment"("id") ON DELETE SET NULL,
  "type" "EvidenceType" NOT NULL,
  "url" text,
  "fileKey" text,
  "mime" text,
  "title" text,
  "description" text,
  "submittedById" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "submittedAt" timestamptz NOT NULL DEFAULT now(),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Assertion" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "badgeClassId" uuid NOT NULL REFERENCES "BadgeClass"("id") ON DELETE CASCADE,
  "issuerId" uuid NOT NULL REFERENCES "IssuerProfile"("id") ON DELETE RESTRICT,
  "earnerId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "assessmentId" uuid REFERENCES "Assessment"("id") ON DELETE SET NULL,
  "recipientIdentifierHash" text NOT NULL,
  "recipientSalt" text NOT NULL,
  "issuedOn" timestamptz NOT NULL,
  "expires" timestamptz,
  "evidenceRefs" jsonb,
  "verificationType" "VerificationType" NOT NULL DEFAULT 'HOSTED',
  "hostedUrl" text,
  "signedJws" text,
  "bakedImageUrl" text,
  "revoked" boolean NOT NULL DEFAULT false,
  "revokedAt" timestamptz,
  "revocationReason" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "RevocationEntry" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "issuerId" uuid NOT NULL REFERENCES "IssuerProfile"("id") ON DELETE CASCADE,
  "assertionId" uuid NOT NULL UNIQUE REFERENCES "Assertion"("id") ON DELETE CASCADE,
  "reason" text,
  "revokedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "StatusList" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "issuerId" uuid NOT NULL REFERENCES "IssuerProfile"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "statusPurpose" text NOT NULL,
  "encodedList" text,
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorId" uuid REFERENCES "User"("id") ON DELETE SET NULL,
  "action" text NOT NULL,
  "entityType" text NOT NULL,
  "entityId" uuid,
  "metadata" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- Colonnes & tables admin (migrations Prisma 0002–0009)
ALTER TABLE "BadgeClass" ADD COLUMN IF NOT EXISTS "createdByUserId" uuid;
ALTER TABLE "BadgeClass" ADD COLUMN IF NOT EXISTS "imageUrl" text;
ALTER TABLE "BadgeClass" ADD COLUMN IF NOT EXISTS "criteriaMarkdown" text;
ALTER TABLE "BadgeClass" ADD COLUMN IF NOT EXISTS "requiresEnrollment" boolean NOT NULL DEFAULT false;
ALTER TABLE "BadgeClass" ADD COLUMN IF NOT EXISTS "requiredCourseId" text;
ALTER TABLE "BadgeClass" ADD COLUMN IF NOT EXISTS "receivabilityReviewMode" "ReceivabilityReviewMode" NOT NULL DEFAULT 'HUMAN';
ALTER TABLE "BadgeClass" ADD COLUMN IF NOT EXISTS "level" integer;
ALTER TABLE "BadgeClass" ADD COLUMN IF NOT EXISTS "evaluationMethods" text[] NOT NULL DEFAULT '{}';
ALTER TABLE "BadgeClass" ADD COLUMN IF NOT EXISTS "validatorExpertId" text;
ALTER TABLE "BadgeClass" ADD COLUMN IF NOT EXISTS "visibleInLearnerDashboard" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "BadgeCriteria" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "badgeClassId" uuid NOT NULL REFERENCES "BadgeClass"("id") ON DELETE CASCADE,
  "label" text NOT NULL,
  "description" text,
  "sortOrder" integer NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "BadgeReceivability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "badgeClassId" uuid NOT NULL UNIQUE REFERENCES "BadgeClass"("id") ON DELETE CASCADE,
  "expectedModalities" text NOT NULL,
  "aiEvaluationPrompt" text NOT NULL DEFAULT '',
  "methodConfigs" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "Assertion" ADD COLUMN IF NOT EXISTS "revokedByUserId" uuid;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "integrityMetrics" jsonb;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "methodResponses" jsonb;

ALTER TABLE "BadgeReceivability" ADD COLUMN IF NOT EXISTS "methodConfigs" jsonb;

CREATE INDEX IF NOT EXISTS "BadgeClass_orgId_idx" ON "BadgeClass"("orgId");
CREATE INDEX IF NOT EXISTS "BadgeClass_issuerId_idx" ON "BadgeClass"("issuerId");
CREATE INDEX IF NOT EXISTS "BadgeClass_requiredCourseId_idx" ON "BadgeClass"("requiredCourseId");
CREATE INDEX IF NOT EXISTS "BadgeClass_validatorExpertId_idx" ON "BadgeClass"("validatorExpertId");
CREATE INDEX IF NOT EXISTS "BadgeClass_visibleInLearnerDashboard_idx"
  ON "BadgeClass"("visibleInLearnerDashboard") WHERE "visibleInLearnerDashboard" = true;
CREATE INDEX IF NOT EXISTS "BadgeCriteria_badgeClassId_idx" ON "BadgeCriteria"("badgeClassId");
CREATE INDEX IF NOT EXISTS "Assertion_revokedAt_idx" ON "Assertion"("revokedAt");

DO $$ BEGIN
  ALTER TABLE "BadgeClass"
    ADD CONSTRAINT "BadgeClass_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
