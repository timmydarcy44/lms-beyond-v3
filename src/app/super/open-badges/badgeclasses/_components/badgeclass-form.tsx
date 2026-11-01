"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Manrope } from "next/font/google";
import { resolveValidatorPhotoUrl } from "@/lib/validators/photo-url";
import { getBaseUrl } from "@/lib/openbadges/urls";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BADGE_EVALUATION_METHODS,
  BADGE_LEVEL_OPTIONS,
  formatEvaluationMethodsSummary,
  formatOrganizationDisplayName,
  type BadgeEvaluationMethodId,
  isBadgeEvaluationMethodId,
} from "@/lib/openbadges/badge-evaluation";
import {
  buildAggregatedEvaluationPrompt,
  getQcmPassingScorePercent,
  hasExplicitQcmPassingScore,
  defaultMethodConfig,
  parseMethodConfigs,
  validateMethodConfigsForMethods,
  type BadgeMethodConfig,
} from "@/lib/openbadges/badge-method-config";
import { BadgeLearnerAttemptsPanel } from "@/app/super/open-badges/badgeclasses/_components/badge-learner-attempts-panel";
import { MoreHorizontal } from "lucide-react";
import { BadgeBuilderPreview } from "@/app/super/open-badges/badgeclasses/_components/badge-builder-preview";
import { BadgeBuilderStepIdentity } from "@/app/super/open-badges/badgeclasses/_components/badge-builder-step-identity";
import { BadgeBuilderStepCriteria } from "@/app/super/open-badges/badgeclasses/_components/badge-builder-step-criteria";
import { BadgeBuilderStepExam } from "@/app/super/open-badges/badgeclasses/_components/badge-builder-step-exam";
import { BadgeBuilderStepPublish } from "@/app/super/open-badges/badgeclasses/_components/badge-builder-step-publish";
import { BadgeBuilderStart } from "@/app/super/open-badges/badgeclasses/_components/badge-builder-start";
import type { DemandLevel, PlannedBadge, SectionSummary } from "@/lib/openbadges/badge-course-generation";
import { buildCriteriaNarrative, criterionCoverage, prunePractices } from "@/lib/openbadges/criterion-coverage";
import { coverageExamKeys, listPlaygroundActivities, scoreOnlyReviewIssue } from "@/lib/openbadges/playground-activity";
import { materializeGeneratedBadge, seriesPrerequisite, type BadgeDomainRecord, type BadgeSeriesRecord, type GeneratedBadge } from "@/lib/openbadges/badge-catalog";
import type { ByoundCompetencyDraft } from "@/lib/openbadges/badge-builder";
import {
  ACHIEVEMENT_TYPES,
  achievementLabel,
  cropSquareBadgeImage,
  emptyBuilderState,
  expiresAfterDays,
  publishChecklist,
  resolvedWeights,
  readBuilderState,
  validityLabel,
  type BadgeBuilderState,
} from "@/lib/openbadges/badge-builder";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-badge-builder" });

type AuthHeaders = {
  userId: string;
  userRole: "SUPER_ADMIN";
};

type Organization = { id: string; name: string };
type IssuerProfile = {
  id: string;
  name: string;
  url: string;
  organizationName?: string | null;
  type?: string | null;
};
type CourseOption = {
  id: string;
  title: string;
  description?: string | null;
  presentation?: string | null;
  objectives?: string | null;
  source?: "org" | "lms";
};
type ValidatorOption = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  professionnal_title?: string | null;
  description?: string | null;
  photo_url?: string | null;
};

type BadgeCriteriaInput = {
  id: string;
  label: string;
  description?: string | null;
  expectedOutcome?: string | null;
  competencyId?: string | null;
  sortOrder: number;
};

type ReceivabilityInput = {
  expectedModalities: string;
  aiEvaluationPrompt: string;
  methodConfigs?: unknown;
};

type BadgeClassPayload = {
  id?: string;
  organizationId: string;
  issuerProfileId?: string;
  name: string;
  description: string;
  imageUrl: string;
  criteriaUrl?: string | null;
  criteriaMarkdown?: string | null;
  criteria: BadgeCriteriaInput[];
  receivability: ReceivabilityInput;
  receivabilityReviewMode?: "HUMAN" | "AI" | "MIXED";
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  requiresEnrollment?: boolean;
  requiredCourseId?: string | null;
  failureRemediationCourseId?: string | null;
  visibleInLearnerDashboard?: boolean;
  level?: number | null;
  evaluationMethods?: string[];
  validatorExpertId?: string | null;
  methodConfigs?: BadgeMethodConfig[];
  builder?: BadgeBuilderState;
  achievementType?: string;
  expiresAfterDays?: number | null;
};

type BadgeClassRecord = {
  id: string;
  orgId: string;
  issuerId: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  imageTemplateUrl: string;
  criteriaUrl?: string | null;
  criteriaMarkdown?: string | null;
  requiresEnrollment?: boolean;
  requiredCourseId?: string | null;
  failureRemediationCourseId?: string | null;
  visibleInLearnerDashboard?: boolean;
  receivabilityReviewMode?: "HUMAN" | "AI" | "MIXED";
  createdAt: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  level?: number | null;
  evaluationMethods?: string[];
  validatorExpertId?: string | null;
  issuer?: IssuerProfile;
  criteria: BadgeCriteriaInput[];
  receivability?: ReceivabilityInput | null;
};

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

const createHeaders = (auth: AuthHeaders, orgId: string) => ({
  "x-user-id": auth.userId,
  "x-user-role": auth.userRole,
  "x-org-id": orgId,
});

const emptyCriteria = (): BadgeCriteriaInput => ({
  id: crypto.randomUUID(),
  label: "",
  description: "",
  expectedOutcome: "",
  sortOrder: 0,
});

const normalizeBadgeStatus = (raw: unknown): BadgeClassRecord["status"] => {
  const value = String(raw ?? "DRAFT").trim().toUpperCase();
  if (value === "ACTIVE" || value === "ARCHIVED") return value;
  return "DRAFT";
};

const statusLabel = (value: BadgeClassRecord["status"]) => {
  if (value === "ACTIVE") return "Publié";
  if (value === "ARCHIVED") return "Archivé";
  return "Brouillon";
};

function badgeStepForError(key: string) {
  if (
    key === "criteria" ||
    key === "skills" ||
    key === "competency-validation" ||
    key === "coverage" ||
    key === "exam" ||
    key === "evaluationMethods" ||
    key === "validatorExpertId" ||
    key === "methodConfigs" ||
    key === "expert"
  ) return 2;
  return 1;
}

function frenchSaveError(payload: Record<string, unknown> | null): { message: string; field: string | null } {
  const code = String(payload?.error ?? "");
  const message = String(payload?.message ?? "");
  if (code === "AI_PROMPT_REQUIRED") return { message: "Une consigne d'épreuve est incomplète.", field: "methodConfigs" };
  if (code === "REQUIRED_COURSE_ID" || code === "REQUIRED_COURSE_MISSING") return { message: "La formation obligatoire n'est pas choisie.", field: "requiredCourseId" };
  if (code === "COURSE_NOT_FOUND") return { message: "La formation liée est introuvable.", field: "requiredCourseId" };
  if (code === "CONFLICT") return { message: "Un badge avec ce nom existe déjà.", field: "name" };
  if (code === "ORG_MISMATCH") return { message: "L'émetteur choisi n'est pas valide.", field: "organizationId" };
  const readable = message && message !== code ? message : code;
  if (readable && readable.length < 180) return { message: readable, field: null };
  return { message: "Le serveur n'a pas pu enregistrer le badge.", field: null };
}

function CourseSelectItems({ courses }: { courses: CourseOption[] }) {
  const lms = courses.filter((course) => course.source === "lms");
  const org = courses.filter((course) => course.source !== "lms");
  return (
    <>
      {lms.length ? (
        <SelectGroup>
          <SelectLabel>LMS Byound</SelectLabel>
          {lms.map((course) => (
            <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
          ))}
        </SelectGroup>
      ) : null}
      {org.length ? (
        <SelectGroup>
          <SelectLabel>Formations du club</SelectLabel>
          {org.map((course) => (
            <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
          ))}
        </SelectGroup>
      ) : null}
    </>
  );
}

const ensureCriteriaIds = (items: BadgeCriteriaInput[]): BadgeCriteriaInput[] =>
  items.map((item, index) => ({
    ...item,
    id: typeof item.id === "string" && item.id.trim() ? item.id : crypto.randomUUID(),
    sortOrder: item.sortOrder ?? index,
  }));

export function BadgeClassForm({
  auth,
  badgeClassId,
}: {
  auth: AuthHeaders;
  badgeClassId?: string;
}) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [validators, setValidators] = useState<ValidatorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [criteriaUrl, setCriteriaUrl] = useState("");
  const [criteriaMarkdown, setCriteriaMarkdown] = useState("");
  const [criteria, setCriteria] = useState<BadgeCriteriaInput[]>([emptyCriteria()]);
  const [level, setLevel] = useState<string>(badgeClassId ? "" : "1");
  const [evaluationMethods, setEvaluationMethods] = useState<string[]>([]);
  const [methodConfigs, setMethodConfigs] = useState<BadgeMethodConfig[]>([]);
  const [validatorExpertId, setValidatorExpertId] = useState("");
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configDialogMethod, setConfigDialogMethod] = useState<BadgeEvaluationMethodId | null>(null);
  const [status, setStatus] = useState<BadgeClassRecord["status"]>("DRAFT");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [requiresEnrollment, setRequiresEnrollment] = useState(false);
  const [formationChoice, setFormationChoice] = useState<"unset" | "existing" | "new">(badgeClassId ? "new" : "unset");
  const [requiredCourseId, setRequiredCourseId] = useState<string | null>(null);
  const [failureRemediationCourseId, setFailureRemediationCourseId] = useState<string | null>(null);
  const [visibleInLearnerDashboard, setVisibleInLearnerDashboard] = useState(false);
  const [receivabilityReviewMode, setReceivabilityReviewMode] = useState<"HUMAN" | "AI" | "MIXED">(badgeClassId ? "HUMAN" : "MIXED");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const [builder, setBuilder] = useState<BadgeBuilderState>(emptyBuilderState());
  const [previewMode, setPreviewMode] = useState<"card" | "page">("card");
  const [visitedStep, setVisitedStep] = useState(1);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localId, setLocalId] = useState(badgeClassId ?? "");
  const idRef = useRef(badgeClassId ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveField, setSaveField] = useState<string | null>(null);
  const [customMonths, setCustomMonths] = useState("");
  const skipSaveRef = useRef(true);
  const [step, setStep] = useState(badgeClassId ? 1 : 0);
  const [catalog, setCatalog] = useState<{ domains: BadgeDomainRecord[]; series: BadgeSeriesRecord[]; competencies: ByoundCompetencyDraft[] }>({ domains: [], series: [], competencies: [] });
  const [siblings, setSiblings] = useState<Array<{ id: string; name: string; seriesName?: string | null; level?: number | null }>>([]);
  const [preparedFrom, setPreparedFrom] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [courseChanged, setCourseChanged] = useState(false);
  const [openMethod, setOpenMethod] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [demand, setDemand] = useState<DemandLevel>("maitrise");
  const [waitLabel, setWaitLabel] = useState("");
  const [genError, setGenError] = useState("");
  const [sectionSummaries, setSectionSummaries] = useState<SectionSummary[]>([]);
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);
  const [createdDrafts, setCreatedDrafts] = useState<Array<{ id: string; name: string }>>([]);
  const previousOrgId = useRef<string | null>(null);
  const hydratingBadgeRef = useRef(false);

  const applyGenerated = (badge: GeneratedBadge, extra?: Partial<BadgeBuilderState>) => {
    const made = materializeGeneratedBadge(badge, catalog.competencies);
    setName(badge.name);
    setDescription(badge.description);
    setLevel(String(badge.level));
    setCriteria(made.criteria);
    setEvaluationMethods(made.methodIds);
    setMethodConfigs(made.configs);
    setReviewCount(made.reviewCount);
    setBuilder((current) => ({
      ...current,
      ...extra,
      domain: badge.domain ?? current.domain,
      seriesName: badge.seriesName ?? current.seriesName,
      levelLabel: badge.levelLabel ?? current.levelLabel,
      competencies: made.competencies,
      skills: made.competencies.map((item) => item.name),
      generated: true,
      reviewedCriterionIds: [],
      exam: {
        ...current.exam,
        practices: made.practices,
        durationMin: badge.durationMin ?? current.exam.durationMin,
        attempts: 3,
        retryDelayDays: 7,
        reviewSlaDays: 5,
        accommodations: true,
        integrityCheck: true,
        deliverablesVisible: true,
      },
    }));
    setReceivabilityReviewMode("MIXED");
    setVisitedStep(3);
    setStep(1);
  };

  const refreshCatalog = async () => {
    const response = await fetch("/api/super-admin/open-badges/catalog");
    if (!response.ok) return;
    const payload = await response.json();
    setCatalog({
      domains: Array.isArray(payload.domains) ? payload.domains : [],
      series: Array.isArray(payload.series) ? payload.series : [],
      competencies: Array.isArray(payload.competencies) ? payload.competencies : [],
    });
  };

  const prepareFromText = async (text: string, file: File | null, sourceBadgeId: string) => {
    setAiGenerating(true);
    try {
      if (sourceBadgeId) {
        const response = await fetch(`/api/admin/badgeclasses/${sourceBadgeId}`, { headers: createHeaders(auth, organizationId) });
        const payload = await response.json();
        const source = payload.badgeClass ?? payload.badge ?? payload;
        if (!response.ok || !source?.name) {
          toast.error("Badge introuvable");
          return;
        }
        setName(`${source.name} (copie)`);
        setDescription(source.description ?? "");
        setLevel(source.level != null ? String(source.level) : "1");
        if (Array.isArray(source.criteria)) setCriteria(ensureCriteriaIds(source.criteria));
        if (Array.isArray(source.evaluationMethods)) setEvaluationMethods(source.evaluationMethods);
        setMethodConfigs(parseMethodConfigs(source.receivability?.methodConfigs ?? source.methodConfigs));
        setBuilder(readBuilderState(source.builder, source.expiresAfterDays));
        setPreparedFrom(source.name);
        setStep(1);
        return;
      }
      let prompt = text.trim();
      if (file) {
        const body = new FormData();
        body.set("file", file);
        const extracted = await fetch("/api/super-admin/open-badges/extract-pdf", { method: "POST", body });
        const payload = await extracted.json();
        if (!extracted.ok) {
          toast.error(payload.error ?? "PDF illisible");
          return;
        }
        prompt = `${prompt}\n${payload.text ?? ""}`.trim();
      }
      if (!prompt) return;
      setWaitLabel("Rédaction des critères, puis création des questions…");
      setGenError("");
      const response = await fetch("/api/super-admin/open-badges/generate-from-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          demand,
          library: catalog.competencies.map((item) => item.name),
          domains: catalog.domains.map((item) => item.name),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.badge) {
        const detail = [payload.error, payload.detail].filter(Boolean).join(" — ");
        setGenError(detail || "La génération a échoué");
        toast.error(detail || "La génération a échoué");
        return;
      }
      applyGenerated(payload.badge as GeneratedBadge);
      setPreparedFrom(null);
      const issues = Array.isArray(payload.issues) ? payload.issues.filter((item: unknown) => typeof item === "string") as string[] : [];
      if (issues.length) toast.error(issues[0]);
      else toast.success("Badge préparé — relisez les champs");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setAiGenerating(false);
    }
  };

  const postCourse = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/super-admin/open-badges/generate-from-course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = [payload.error, payload.detail].filter(Boolean).join(" — ");
      throw new Error(detail || "La génération a échoué");
    }
    return payload as Record<string, unknown>;
  };

  const prepareFromCourse = async (courseId: string) => {
    setPendingCourseId(courseId);
    setGenError("");
    setCreatedDrafts([]);
    setAiGenerating(true);
    try {
      setWaitLabel("Lecture des sections…");
      const summarized = await postCourse({
        phase: "summaries",
        courseId,
        demand,
      });
      const summaries = Array.isArray(summarized.summaries) ? summarized.summaries as SectionSummary[] : [];
      setSectionSummaries(summaries);
      const courseTitle = String((summarized.course as { title?: string } | undefined)?.title ?? "");
      const hours = summaries.reduce((sum, item) => sum + (item.hours ?? 0), 0);
      setPreparedFrom(courseTitle);
      setWaitLabel("Rédaction des critères, puis création des questions…");
      await generateChosenBadges(courseId, summaries, [{
        key: "single",
        title: courseTitle || "Badge",
        kind: "single",
        sectionTitle: null,
        hours: hours || null,
        summary: "Un seul badge pour toute la formation. Les critères suivent la démarche du métier.",
      }], courseTitle, "");
    } catch (failure) {
      setGenError(failure instanceof Error ? failure.message : "La génération a échoué");
    } finally {
      setAiGenerating(false);
      setWaitLabel("");
    }
  };

  const generateChosenBadges = async (courseId: string, summaries: SectionSummary[], badges: PlannedBadge[], seriesName: string, domain: string) => {
    if (!courseId || badges.length === 0) return;
    setGenError("");
    setAiGenerating(true);
    setWaitLabel("Rédaction des critères, puis création des questions…");
    try {
      const payload = await postCourse({
        phase: "badges",
        courseId,
        demand,
        summaries,
        badges,
        seriesName,
        domain,
        library: catalog.competencies.map((item) => item.name),
      });
      const rows = (Array.isArray(payload.badges) ? payload.badges as Array<{ badge: GeneratedBadge; issues?: string[]; planned?: PlannedBadge }> : [])
        .sort((left, right) => (left.planned?.kind === "synthesis" ? 1 : 0) - (right.planned?.kind === "synthesis" ? 1 : 0));
      const course = payload.course as { id: string; title: string; updatedAt?: string | null; fingerprint?: string };
      const expertId = String((payload.expert as { id?: string } | null)?.id ?? "");
      const failures = Array.isArray(payload.failures) ? payload.failures as Array<{ title: string; issues: string[] }> : [];
      if (failures.length) setGenError(failures.map((item) => `${item.title} : ${item.issues.join(" ")}`).join(" · "));
      if (rows.length === 1 && rows[0].issues?.length) {
        setGenError(rows[0].issues.join(" "));
      }
      if (rows.length === 1) {
        applyGenerated(rows[0].badge, {
          linkedCourseId: course.id,
          associatedCourseId: course.id,
          fallbackCourseId: course.id,
          courseRequiredBeforeExam: true,
          linkedCourseUpdatedAt: course.updatedAt ?? null,
          linkedCourseFingerprint: course.fingerprint ?? null,
          seriesName,
          domain: rows[0].badge.domain || domain,
        });
        if (expertId) setValidatorExpertId(expertId);
        setRequiresEnrollment(true);
        setRequiredCourseId(course.id);
        setFailureRemediationCourseId(course.id);
        setPreparedFrom(course.title);
        return;
      }
      const saved: Array<{ id: string; name: string }> = [];
      const sectionIds: string[] = [];
      for (const row of rows) {
        const made = materializeGeneratedBadge(row.badge, catalog.competencies);
        const nextBuilder = emptyBuilderState();
        const isSynthesis = row.planned?.kind === "synthesis";
        const response = await fetch("/api/admin/badgeclasses", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...createHeaders(auth, organizationId) },
          body: JSON.stringify({
            organizationId,
            name: row.badge.name,
            description: row.badge.description.slice(0, 300),
            imageUrl: "",
            status: "DRAFT",
            level: row.badge.level,
            evaluationMethods: made.methodIds,
            validatorExpertId: expertId || null,
            methodConfigs: made.configs,
            receivabilityReviewMode: "MIXED",
            criteria: made.criteria,
            receivability: {
              expectedModalities: made.methodIds.join(", "),
              aiEvaluationPrompt: made.configs.map((item) => item.evaluationPrompt).filter(Boolean).join("\n\n"),
              methodConfigs: made.configs,
            },
            builder: {
              ...nextBuilder,
              domain: row.badge.domain || domain,
              seriesName,
              levelLabel: row.badge.levelLabel,
              competencies: made.competencies,
              skills: made.competencies.map((item) => item.name),
              generated: true,
              reviewedCriterionIds: [],
              linkedCourseId: course.id,
              associatedCourseId: course.id,
              fallbackCourseId: course.id,
              courseRequiredBeforeExam: true,
              linkedCourseUpdatedAt: course.updatedAt ?? null,
              linkedCourseFingerprint: course.fingerprint ?? null,
              exam: {
                ...nextBuilder.exam,
                practices: made.practices,
                durationMin: row.badge.durationMin ?? null,
                prerequisiteBadgeIds: isSynthesis ? sectionIds : [],
              },
            },
          }),
        });
        const created = await response.json().catch(() => ({}));
        const id = String(created.badgeClass?.id ?? "");
        if (id) {
          saved.push({ id, name: row.badge.name });
          if (!isSynthesis) sectionIds.push(id);
        }
      }
      setCreatedDrafts(saved);
      if (saved.length === 0) setGenError("Les brouillons n'ont pas pu être enregistrés. Vérifiez l'émetteur, puis réessayez.");
    } catch (failure) {
      setGenError(failure instanceof Error ? failure.message : "La génération a échoué");
    } finally {
      setAiGenerating(false);
      setWaitLabel("");
    }
  };

  useEffect(() => {
    const loadOrganizations = async () => {
      const res = await fetch("/api/super-admin/organisations?internal_badges_only=1");
      const json = await res.json();
      const orgs = (json.organizations ?? []) as Organization[];
      setOrganizations(orgs);
      if (!badgeClassId) {
        setOrganizationId((current) => {
          if (current) return current;
          const byound = orgs.find((org) => formatOrganizationDisplayName(org.name) === "Byound");
          return byound?.id ?? orgs[0]?.id ?? "";
        });
      }
    };
    loadOrganizations();
  }, []);

  useEffect(() => {
    const domain = builder.domain?.trim() ?? "";
    if (!domain) {
      setValidators([]);
      return;
    }
    void fetch(`/api/super-admin/open-badges/experts?domain=${encodeURIComponent(domain)}`)
      .then((response) => response.json())
      .then((payload: { experts?: ValidatorOption[] }) => {
        const experts = Array.isArray(payload.experts) ? payload.experts : [];
        setValidators(experts);
        setValidatorExpertId((current) => current || experts[0]?.id || "");
      })
      .catch(() => setValidators([]));
  }, [builder.domain]);

  const validatorLabel = (validator: ValidatorOption) => {
    const fromParts = [validator.first_name, validator.last_name].filter(Boolean).join(" ").trim();
    const base =
      fromParts ||
      (validator.full_name ?? "").trim() ||
      validator.id.slice(0, 8);
    const title = validator.professionnal_title ?? validator.description;
    return title ? `${base} — ${title}` : base;
  };

  const toggleEvaluationMethod = (methodId: string, checked: boolean) => {
    if (!isBadgeEvaluationMethodId(methodId)) return;
    if (checked) {
      setEvaluationMethods((prev) => [...new Set([...prev, methodId])]);
      setConfigDialogMethod(methodId);
      setConfigDialogOpen(true);
    } else {
      setEvaluationMethods((prev) => prev.filter((id) => id !== methodId));
      setMethodConfigs((prev) => prev.filter((c) => c.methodId !== methodId));
    }
    clearFieldError("evaluationMethods");
    clearFieldError("methodConfigs");
  };

  const openMethodConfig = (methodId: BadgeEvaluationMethodId) => {
    setConfigDialogMethod(methodId);
    setConfigDialogOpen(true);
  };

  const saveMethodConfig = (config: BadgeMethodConfig) => {
    setMethodConfigs((prev) => {
      const rest = prev.filter((c) => c.methodId !== config.methodId);
      return [...rest, config];
    });
    if (!evaluationMethods.includes(config.methodId)) {
      setEvaluationMethods((prev) => [...prev, config.methodId]);
    }
    clearFieldError("methodConfigs");
  };

  const fillFromCourse = (courseId: string) => {
    setRequiredCourseId(courseId || null);
    const course = courses.find((item) => item.id === courseId);
    if (!course) return;
    if (!organizationId) {
      const byound = organizations.find((org) => formatOrganizationDisplayName(org.name) === "Byound");
      if (byound) setOrganizationId(byound.id);
    }
    setRequiresEnrollment(true);
    if (course.title) setName(course.title.replace(/^LMS · /, ""));
    const text = [course.description, course.presentation, course.objectives]
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (Array.isArray(item)) return item.map((entry) => (typeof entry === "string" ? entry : "")).filter(Boolean).join("\n");
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
    if (!text) return;
    setDescription(text.slice(0, 800));
    setCriteria([{ id: crypto.randomUUID(), label: "Valider la formation", description: text.slice(0, 500), sortOrder: 0 }]);
  };

  const qcmConfig = methodConfigs.find((c) => c.methodId === "qcm");
  const qcmThresholdMissing =
    evaluationMethods.includes("qcm") &&
    qcmConfig &&
    !hasExplicitQcmPassingScore(qcmConfig);


  useEffect(() => {
    const loadCourses = async () => {
      const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : "";
      const res = await fetch(`/api/admin/courses${query}`, {
        headers: createHeaders(auth, organizationId || auth.userId),
      });
      const json = await res.json();
      setCourses(json.courses ?? []);
    };
    void loadCourses();
  }, [organizationId, auth]);

  useEffect(() => {
    if (!badgeClassId) return;
    const loadBadge = async () => {
      hydratingBadgeRef.current = true;
      const res = await fetch(`/api/admin/badgeclasses/${badgeClassId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        toast.error("Impossible de charger le badge");
        hydratingBadgeRef.current = false;
        return;
      }
      const json = await res.json();
      const badge = json.badgeClass as BadgeClassRecord | undefined;
      if (!badge) {
        toast.error("Badge introuvable");
        hydratingBadgeRef.current = false;
        return;
      }
      const orgId = String(badge.orgId ?? "").trim();
      if (orgId) {
        previousOrgId.current = orgId;
        setOrganizationId(orgId);
      }
      setName(badge.name ?? "");
      setDescription(badge.description ?? "");
      setImageUrl(badge.imageUrl ?? badge.imageTemplateUrl ?? "");
      setCriteriaUrl(badge.criteriaUrl ?? "");
      setCriteriaMarkdown(badge.criteriaMarkdown ?? "");
      const criteriaList = Array.isArray(badge.criteria) ? badge.criteria : [];
      setCriteria(
        criteriaList.length ? ensureCriteriaIds(criteriaList) : [emptyCriteria()],
      );
      setLevel(badge.level != null ? String(badge.level) : "");
      setEvaluationMethods(
        Array.isArray(badge.evaluationMethods) && badge.evaluationMethods.length > 0
          ? badge.evaluationMethods
          : [],
      );
      setValidatorExpertId(badge.validatorExpertId ?? "");
      setMethodConfigs(parseMethodConfigs(badge.receivability?.methodConfigs));
      setReceivabilityReviewMode(badge.receivabilityReviewMode ?? "HUMAN");
      setStatus(normalizeBadgeStatus(badge.status));
      setCreatedAt(badge.createdAt ?? null);
      setRequiresEnrollment(Boolean(badge.requiresEnrollment));
      setRequiredCourseId(badge.requiredCourseId ?? null);
      setFailureRemediationCourseId(badge.failureRemediationCourseId ?? null);
      setVisibleInLearnerDashboard(Boolean(badge.visibleInLearnerDashboard));
      const record = badge as BadgeClassRecord & {
        builder?: unknown;
        achievementType?: string | null;
        expiresAfterDays?: number | null;
      };
      const nextBuilder = readBuilderState(record.builder, record.expiresAfterDays);
      if (record.achievementType && ACHIEVEMENT_TYPES.some((item) => item.id === record.achievementType)) {
        nextBuilder.achievementType = record.achievementType as BadgeBuilderState["achievementType"];
      }
      setBuilder(nextBuilder);
      setCustomMonths(nextBuilder.validityMonths ? String(nextBuilder.validityMonths) : "");
      setVisitedStep(4);
      skipSaveRef.current = true;
      hydratingBadgeRef.current = false;
    };
    void loadBadge();
  }, [badgeClassId]);

  const handleOrganizationChange = (nextOrgId: string) => {
    setOrganizationId(nextOrgId);
    clearFieldError("organizationId");
  };

  const formationBuilderHref = useMemo(() => {
    const params = new URLSearchParams();
    if (organizationId) params.set("orgId", organizationId);
    if (badgeClassId) params.set("badgeClassId", badgeClassId);
    if (name.trim()) params.set("title", name.trim());
    const q = params.toString();
    return q ? `/dashboard/formateur/formations/new?${q}` : "/dashboard/formateur/formations/new";
  }, [organizationId, badgeClassId, name]);

  const hostedBadgeUrl = useMemo(() => {
    if (!badgeClassId || !baseUrl) return null;
    return `${baseUrl}/api/public/badgeclasses/${badgeClassId}`;
  }, [badgeClassId]);

  const criteriaUrlDisplay = useMemo(() => {
    if (!badgeClassId) return "";
    const base = getBaseUrl().replace(/\/$/, "");
    return `${base}/badgeclasses/${badgeClassId}/criteria`;
  }, [badgeClassId]);


  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/badgeclasses/image", {
        method: "POST",
        headers: createHeaders(auth, organizationId),
        body: formData,
      });
      const raw = await res.text();
      let json: Record<string, unknown> | null = null;
      try {
        json = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
      } catch {
        json = null;
      }
      if (!res.ok) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[badgeclass][upload] failed", { status: res.status, raw, json });
        }
        const hint = (json?.hint as string | undefined) ?? "";
        const message =
          (json?.error as string | undefined)
          ?? (json?.message as string | undefined)
          ?? raw
          ?? "Unknown error";
        const userMessage = hint
          ? `Échec de l’upload : ${message}. ${hint}`
          : `Échec de l’upload : ${message}`;
        setErrors((prev) => ({ ...prev, imageUrl: userMessage }));
        toast.error(`Upload image: ${res.status} ${message}`);
        return;
      }
      const imageUrl = (json?.imageUrl as string | undefined) ?? undefined;
      if (!imageUrl) {
        toast.error("Upload impossible (réponse invalide)");
        return;
      }
      setImageUrl(imageUrl);
      clearFieldError("imageUrl");
      toast.success("Image enregistrée");
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[badgeclass][upload] exception", error);
      }
      toast.error(String(error));
    } finally {
      setImageUploading(false);
    }
  };

  const generateBadgeVisual = async () => {
    if (!organizationId) {
      toast.error("Choisissez d'abord l'émetteur");
      return;
    }
    if (!name.trim()) {
      toast.error("Indiquez d'abord le nom du badge");
      return;
    }
    setImageUploading(true);
    try {
      const res = await fetch("/api/admin/badgeclasses/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...createHeaders(auth, organizationId) },
        body: JSON.stringify({
          name: name.trim(),
          domain: builder.domain,
          description: description.trim(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.imageUrl) {
        toast.error(json?.error ?? "Génération du visuel impossible");
        return;
      }
      setImageUrl(String(json.imageUrl));
      toast.success("Visuel généré");
    } catch {
      toast.error("Génération du visuel impossible");
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageDryRun = async () => {
    if (!uploadFile) {
      toast.error("Sélectionnez un fichier d’abord.");
      return;
    }
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const res = await fetch("/api/admin/badgeclasses/image?dryRun=1", {
        method: "POST",
        headers: createHeaders(auth, organizationId),
        body: formData,
      });
      const raw = await res.text();
      let json: Record<string, unknown> | null = null;
      try {
        json = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
      } catch {
        json = null;
      }
      if (!res.ok) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[badgeclass][upload][dry-run] failed", { status: res.status, raw, json });
        }
        const message =
          (json?.error as string | undefined)
          ?? (json?.message as string | undefined)
          ?? raw
          ?? "Unknown error";
        toast.error(`Dry-run: ${res.status} ${message}`);
        return;
      }
      const mime = (json?.mime as string | undefined) ?? "unknown";
      const size = (json?.size as number | undefined) ?? 0;
      toast.success(`Fichier reçu: ${mime} ${size}b`);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[badgeclass][upload][dry-run] exception", error);
      }
      toast.error(String(error));
    } finally {
      setImageUploading(false);
    }
  };

  const passRule = builder.exam.passMode === "threshold"
    ? `Règle de réussite : chaque épreuve est réussie lorsqu'au moins ${builder.exam.passCount} critère${builder.exam.passCount > 1 ? "s sont validés" : " est validé"}.`
    : "Règle de réussite : chaque épreuve doit être réussie.";
  const narrativeFromCriteria = buildCriteriaNarrative({
    criteria: criteria.map((item) => ({ label: item.label, expectedOutcome: item.expectedOutcome })),
    methods: evaluationMethods.map((id) => {
      const links = builder.exam.practices[id]?.criteria ?? [];
      const labels = links.map((link) => criteria.find((item) => item.id === link.criterionId)?.label ?? "").filter(Boolean);
      const quiz = methodConfigs.find((item) => item.methodId === id)?.quiz;
      const detail = id === "qcm" && quiz ? `seuil ${quiz.passingScorePercent ?? 80} %` : "";
      return { id, criterionLabels: labels, detail };
    }),
    passRule: builder.exam.requirePractice
      ? `${passRule} Une mise en pratique est exigée pour un critère seulement couvert par le questionnaire.`
      : passRule,
  });

  const serializePayload = (nextStatus?: BadgeClassRecord["status"]): BadgeClassPayload => ({
    organizationId,
    name,
    description: description.slice(0, 300),
    imageUrl,
    criteriaUrl: criteriaUrl || null,
    criteriaMarkdown: narrativeFromCriteria || criteriaMarkdown || null,
    criteria: criteria.map((item, index) => ({
      ...item,
      sortOrder: index,
    })),
    receivability: {
      expectedModalities: formatEvaluationMethodsSummary(evaluationMethods),
      aiEvaluationPrompt: buildAggregatedEvaluationPrompt(methodConfigs),
      methodConfigs,
    },
    receivabilityReviewMode,
    status: nextStatus ?? status,
    requiresEnrollment,
    requiredCourseId: requiresEnrollment ? requiredCourseId : null,
    failureRemediationCourseId: failureRemediationCourseId || null,
    visibleInLearnerDashboard: requiresEnrollment ? false : visibleInLearnerDashboard,
    level: level ? Number.parseInt(level, 10) : null,
    evaluationMethods,
    validatorExpertId: validatorExpertId || null,
    methodConfigs,
    builder: {
      ...builder,
      skills: builder.competencies.map((item) => item.name),
      catalog,
      validityMonths: builder.validityMode === "custom" ? Number(customMonths) || null : builder.validityMode === "12" ? 12 : builder.validityMode === "24" ? 24 : null,
      ...(nextStatus === "ACTIVE" && builder.linkedCourseId ? { linkedCourseUpdatedAt: new Date().toISOString() } : {}),
    },
    achievementType: builder.achievementType,
    expiresAfterDays: expiresAfterDays(
      builder.validityMode,
      builder.validityMode === "custom" ? Number(customMonths) || null : null,
    ),
  });

  const checklist = () => {
    const qcm = methodConfigs.filter((item) => item.methodId === "qcm");
    const playground = methodConfigs.find((item) => item.methodId === "playground")?.playground;
    const examKeys = coverageExamKeys(evaluationMethods, playground);
    const coverage = criterionCoverage(
      criteria.filter((item) => item.label.trim()),
      examKeys.map((id) => ({
        id,
        criterionIds: (builder.exam.practices[id]?.criteria ?? []).map((link) => link.criterionId),
      })),
    );
    const instructionsComplete = examKeys.every((id) => {
      const config = methodConfigs.find((item) => item.methodId === id || (id.startsWith("playground") && item.methodId === "playground"));
      if (!config) return false;
      if (id !== "qcm" && !config.evaluationPrompt.trim()) return false;
      if (id === "qcm") return (config.quiz?.questions.length ?? 0) > 0;
      if (id === "case_study") return Boolean(config.caseStudy?.learnerPrompt.trim());
      if (id === "playground" || id.startsWith("playground:")) {
        const activity = listPlaygroundActivities(config.playground).find((item) => id === "playground" || id.endsWith(`:${item.id}`));
        if (activity?.type === "situation") return Boolean(activity.situation?.character.trim());
        if (activity?.type === "module") return Boolean(activity.module);
        return Boolean(activity?.learnerPrompt.trim() || config.playground?.learnerPrompt.trim());
      }
      return Boolean(config.learnerInstruction?.trim());
    });
    return publishChecklist({
      name,
      level,
      description,
      criteria,
      competencies: builder.competencies,
      methods: evaluationMethods,
      instructionsComplete,
      questionsReviewed: qcm.every((item) => (item.quiz?.questions ?? []).every((question) => question.reviewStatus === "reviewed")),
      deliverableCount: Object.values(builder.exam.practices).reduce((total, practice) => total + practice.deliverables.filter((item) => item.title.trim()).length, 0),
      uncoveredCount: coverage.filter((row) => row.tone === "missing").length,
      qcmOnlyCount: coverage.filter((row) => row.tone === "qcm").length,
      hasExpert: Boolean(validatorExpertId),
      hasDelay: builder.exam.reviewSlaDays > 0,
      hasImage: Boolean(imageUrl.trim()),
    });
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedCriteriaMarkdown = criteriaMarkdown.trim();
    const hasCriteriaLabel = criteria.some((item) => item.label.trim().length > 0);
    const configError = validateMethodConfigsForMethods(evaluationMethods, methodConfigs);

    if (!organizationId) nextErrors.organizationId = "Organisation requise.";
    if (!trimmedName) nextErrors.name = "Nom requis.";
    if (!trimmedDescription) nextErrors.description = "Description requise.";
    if (!trimmedCriteriaMarkdown && !hasCriteriaLabel) {
      nextErrors.criteria = "Ajoutez au moins un critère.";
    }
    if (!level) nextErrors.level = "Niveau requis.";
    if (evaluationMethods.length === 0) nextErrors.evaluationMethods = "Choisissez au moins une méthode.";
    if (!validatorExpertId) nextErrors.validatorExpertId = "Validateur requis.";
    const reviewIssue = scoreOnlyReviewIssue(listPlaygroundActivities(methodConfigs.find((item) => item.methodId === "playground")?.playground), receivabilityReviewMode);
    if (configError || reviewIssue) nextErrors.methodConfigs = reviewIssue || configError || "";
    if (requiresEnrollment && !requiredCourseId) {
      nextErrors.requiredCourseId = "Formation requise.";
    }
    for (const item of checklist()) {
      if (item.required && !item.ok) nextErrors[item.id] = item.label;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const labelMap: Record<string, string> = {
        organizationId: "Organisation",
        name: "Nom",
        description: "Description",
        criteria: "Critères",
        imageUrl: "Image",
        level: "Niveau",
        evaluationMethods: "Méthodes d'évaluation",
        validatorExpertId: "Validateur",
        methodConfigs: "Configuration des méthodes",
        requiredCourseId: "Formation requise",
      };
      const labels = Object.keys(nextErrors)
        .map((key) => labelMap[key] ?? key)
        .slice(0, 3);
      toast.error(`Champs manquants : ${labels.join(", ")}`);
      const order = [
        "organizationId",
        "name",
        "description",
        "criteria",
        "imageUrl",
        "level",
        "evaluationMethods",
        "validatorExpertId",
        "methodConfigs",
        "requiredCourseId",
      ];
      const firstKey = order.find((key) => nextErrors[key]);
      if (firstKey) {
        setStep(badgeStepForError(firstKey));
        window.setTimeout(() => {
          const target = document.getElementById(`field-${firstKey}`);
          if (!target) return;
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          if ("focus" in target) (target as HTMLElement).focus();
        }, 80);
      }
      toast.error("Merci de compléter les champs obligatoires.");
      return false;
    }
    return true;
  };

  const saveBadge = async (nextStatus?: BadgeClassRecord["status"], options?: { openTrial?: boolean }) => {
    if (nextStatus !== "ARCHIVED" && !validateForm()) return;
    setLoading(true);
    try {
      const method = badgeClassId ? "PUT" : "POST";
      const url = badgeClassId ? `/api/admin/badgeclasses/${badgeClassId}` : "/api/admin/badgeclasses";
      const payload = { ...serializePayload(nextStatus), organizationId };
      if (process.env.NODE_ENV !== "production") {
        console.debug("[badgeclass][save] payload", payload);
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...createHeaders(auth, organizationId) },
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
      const rawTruncated = raw.length > 2000 ? `${raw.slice(0, 2000)}…` : raw;
      let json: Record<string, unknown> | null = null;
      try {
        json = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
      } catch {
        json = null;
      }
      if (!res.ok) {
        const safeRaw = rawTruncated || "NO_EXTRA_INFO";
        const safeJson = json ?? "NO_EXTRA_INFO";
        console.error("[badgeclass][save] failed", {
          phase: "http",
          url,
          method,
          orgId: organizationId || undefined,
          status: res.status,
          raw: safeRaw,
          json: safeJson,
        });
        const errorCode = (json?.error as string | undefined) ?? undefined;
        if (errorCode === "AI_PROMPT_REQUIRED") {
          setErrors((prev) => ({ ...prev, methodConfigs: "Configurez chaque méthode d’évaluation." }));
          setStep(2);
          toast.error("Une consigne d'épreuve est incomplète.");
          return;
        }
        if (errorCode === "REQUIRED_COURSE_ID" || errorCode === "REQUIRED_COURSE_MISSING") {
          setErrors((prev) => ({ ...prev, requiredCourseId: "Formation requise." }));
          setStep(1);
          toast.error("Formation requise.");
          return;
        }
        if (errorCode === "COURSE_NOT_FOUND") {
          setErrors((prev) => ({ ...prev, requiredCourseId: "Formation introuvable." }));
          setStep(1);
          toast.error("Formation introuvable.");
          return;
        }
        if (errorCode === "CONFLICT") {
          const field = (json?.field as string | undefined) ?? undefined;
          if (field === "name") {
            setErrors((prev) => ({ ...prev, name: "Un badge avec ce nom existe déjà." }));
            setStep(1);
          }
        }
        if (errorCode === "FK_INVALID") {
          const field = (json?.field as string | undefined) ?? undefined;
          if (field?.includes("requiredCourseId")) {
            setErrors((prev) => ({ ...prev, requiredCourseId: "Formation invalide." }));
          }
        }
        if (errorCode === "ORG_MISMATCH") {
          setErrors((prev) => ({ ...prev, organizationId: "Organisation invalide." }));
        }
        const message =
          (json?.error as string | undefined)
          ?? (json?.message as string | undefined)
          ?? rawTruncated
          ?? res.statusText
          ?? "Unknown error";
        toast.error(`Sauvegarde: ${res.status} ${message}`);
        return;
      }
      const jsonOk = json as { badgeClass?: { id?: string } } | null;
      if (!badgeClassId && jsonOk?.badgeClass?.id) {
        const nextId = jsonOk.badgeClass.id;
        window.location.href = options?.openTrial
          ? `/super/open-badges/badgeclasses/${nextId}/essai`
          : `/super/open-badges/badgeclasses/${nextId}/edit`;
        return;
      }
      if (options?.openTrial && (badgeClassId || localId)) {
        window.open(`/super/open-badges/badgeclasses/${badgeClassId || localId}/essai`, "_blank", "noopener");
      }
      setErrors({});
      const savedStatus = (json?.badgeClass as { status?: unknown } | undefined)?.status;
      setStatus(normalizeBadgeStatus(savedStatus ?? nextStatus ?? status));
      if (
        nextStatus === "ACTIVE"
        && !requiresEnrollment
        && !visibleInLearnerDashboard
      ) {
        toast.message(
          "Pour l’afficher aux apprenants, activez « Visible dans le dashboard apprenant » puis enregistrez.",
          { duration: 8000 },
        );
      }
      toast.success(
        nextStatus === "ACTIVE"
          ? "Badge publié"
          : nextStatus === "ARCHIVED"
            ? "Badge archivé"
            : "Badge enregistré",
      );
    } catch (error) {
      const method = badgeClassId ? "PUT" : "POST";
      const url = badgeClassId ? `/api/admin/badgeclasses/${badgeClassId}` : "/api/admin/badgeclasses";
      const errorName = error instanceof Error ? error.name : typeof error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error("[badgeclass][save] failed", {
        phase: "fetch",
        url,
        method,
        orgId: organizationId || undefined,
        errorName,
        errorMessage,
        errorStack,
        debug: errorMessage ? undefined : "NO_EXTRA_INFO",
      });
      toast.error("Sauvegarde impossible (réseau/serveur). Voir console.");
    } finally {
      setLoading(false);
    }
  };

  const locked = status === "ACTIVE";
  const activeId = localId || badgeClassId || "";
  idRef.current = activeId;

  const persistDraft = async () => {
    if (locked) return;
    if (!organizationId || !name.trim()) {
      setSaveState("error");
      setSaveError(!name.trim() ? "Indiquez le nom du badge pour enregistrer." : "Choisissez l'émetteur pour enregistrer.");
      setSaveField(!name.trim() ? "name" : "organizationId");
      return;
    }
    setSaveState("saving");
    try {
      const payload = { ...serializePayload("DRAFT"), organizationId };
      const currentId = idRef.current;
      const res = await fetch(currentId ? `/api/admin/badgeclasses/${currentId}` : "/api/admin/badgeclasses", {
        method: currentId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...createHeaders(auth, organizationId) },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null) as Record<string, unknown> | null;
      if (!res.ok) {
        const reason = frenchSaveError(json);
        setSaveError(reason.message);
        setSaveField(reason.field);
        setSaveState("error");
        return;
      }
      setSaveError(null);
      setSaveField(null);
      const createdId = String((json?.badgeClass as { id?: string } | undefined)?.id ?? "");
      if (!currentId && createdId) {
        idRef.current = createdId;
        setLocalId(createdId);
        window.history.replaceState(null, "", `/super/open-badges/badgeclasses/${createdId}/edit`);
      }
      setSavedAt(Date.now());
      setSaveState("saved");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Le serveur n'a pas répondu.");
      setSaveField(null);
      setSaveState("error");
    }
  };

  const forkBadge = async (mode: "version" | "copy") => {
    if (!organizationId || !name.trim()) return;
    setMenuOpen(false);
    setLoading(true);
    try {
      const source = serializePayload("DRAFT");
      const payload = {
        ...source,
        name: mode === "copy" ? `Copie de ${name.trim()}` : name.trim(),
        status: "DRAFT",
        builder: {
          ...source.builder,
          version: mode === "version" ? (builder.version || 1) + 1 : 1,
          parentBadgeId: mode === "version" ? activeId || null : null,
        },
      };
      const res = await fetch("/api/admin/badgeclasses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...createHeaders(auth, organizationId) },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.badgeClass?.id) {
        toast.error("Impossible de créer la copie");
        return;
      }
      router.push(`/super/open-badges/badgeclasses/${json.badgeClass.id}/edit`);
    } finally {
      setLoading(false);
    }
  };

  const criterionKey = criteria.map((item) => item.id).join("|");
  useEffect(() => {
    const result = prunePractices(builder.exam.practices, criteria.map((item) => item.id));
    if (result.warnings.length === 0) return;
    setBuilder((current) => ({ ...current, exam: { ...current.exam, practices: result.practices } }));
    toast.message(result.warnings.join(" "));
    // Le recalcul suit uniquement la liste des critères.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criterionKey]);

  const coverCriterion = (criterionId: string, methodId: string, open = true) => {
    if (!isBadgeEvaluationMethodId(methodId)) return;
    setEvaluationMethods((current) => (current.includes(methodId) ? current : [...current, methodId]));
    setMethodConfigs((current) => {
      if (current.some((item) => item.methodId === methodId)) return current;
      const created = defaultMethodConfig(methodId);
      if (methodId === "qcm" && created.quiz) {
        created.quiz = { ...created.quiz, passingScorePercent: 80, randomDraw: true };
      }
      return [...current, created];
    });
    setBuilder((current) => {
      const practice = current.exam.practices[methodId] ?? { criteria: [], deliverables: [] };
      const ids = practice.criteria.some((link) => link.criterionId === criterionId)
        ? practice.criteria.map((link) => link.criterionId)
        : [...practice.criteria.map((link) => link.criterionId), criterionId];
      const weights = resolvedWeights(ids, Object.fromEntries(practice.criteria.map((link) => [link.criterionId, link.weight])));
      return {
        ...current,
        exam: {
          ...current.exam,
          practices: {
            ...current.exam.practices,
            [methodId]: { ...practice, criteria: ids.map((id) => ({ criterionId: id, weight: weights[id] ?? 0 })) },
          },
        },
      };
    });
    if (open) setOpenMethod(methodId);
  };

  const autoCover = () => {
    const titled = criteria.filter((item) => item.label.trim());
    const host = evaluationMethods.find((id) => id !== "qcm") ?? evaluationMethods[0] ?? "case_study";
    if (!isBadgeEvaluationMethodId(host)) return;
    setEvaluationMethods((current) => (current.includes(host) ? current : [...current, host]));
    setMethodConfigs((current) => {
      if (current.some((item) => item.methodId === host)) return current;
      const created = defaultMethodConfig(host);
      if (host === "qcm" && created.quiz) created.quiz = { ...created.quiz, passingScorePercent: 80, randomDraw: true };
      return [...current, created];
    });
    setBuilder((current) => {
      const practice = current.exam.practices[host] ?? { criteria: [], deliverables: [] };
      const covered = new Set(Object.values(current.exam.practices).flatMap((item) => (item?.criteria ?? []).map((link) => link.criterionId)));
      const missing = titled.map((item) => item.id).filter((id) => !covered.has(id));
      const ids = [...practice.criteria.map((link) => link.criterionId), ...missing];
      const weights = resolvedWeights(ids, Object.fromEntries(practice.criteria.map((link) => [link.criterionId, link.weight])));
      return {
        ...current,
        exam: {
          ...current.exam,
          practices: {
            ...current.exam.practices,
            [host]: {
              ...practice,
              deliverables: host === "qcm" ? [] : practice.deliverables,
              criteria: ids.map((id) => ({ criterionId: id, weight: weights[id] ?? 0 })),
            },
          },
        },
      };
    });
  };

  const toggleCriterionExam = (criterionId: string, methodId: string) => {
    if (!isBadgeEvaluationMethodId(methodId)) return;
    const linked = (builder.exam.practices[methodId]?.criteria ?? []).some((link) => link.criterionId === criterionId);
    if (!linked) {
      coverCriterion(criterionId, methodId, false);
      return;
    }
    setBuilder((current) => {
      const practice = current.exam.practices[methodId];
      if (!practice) return current;
      const ids = practice.criteria.map((link) => link.criterionId).filter((id) => id !== criterionId);
      const weights = resolvedWeights(ids, {});
      return {
        ...current,
        exam: {
          ...current.exam,
          practices: {
            ...current.exam.practices,
            [methodId]: { ...practice, criteria: ids.map((id) => ({ criterionId: id, weight: weights[id] ?? 0 })) },
          },
        },
      };
    });
  };

  useEffect(() => {
    void refreshCatalog();
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    void fetch(`/api/admin/badgeclasses?organizationId=${encodeURIComponent(organizationId)}`, {
      headers: createHeaders(auth, organizationId),
    })
      .then((response) => response.json())
      .then((payload: { badgeClasses?: Array<{ id?: string; name?: string; level?: number | null; builder?: { seriesName?: string | null } | null }> }) => {
        const rows = Array.isArray(payload.badgeClasses) ? payload.badgeClasses : [];
        setSiblings(rows.flatMap((item) => item.id && item.name ? [{
          id: item.id,
          name: item.name,
          seriesName: item.builder?.seriesName ?? null,
          level: item.level ?? null,
        }] : []));
      })
      .catch(() => setSiblings([]));
  }, [organizationId, auth]);

  useEffect(() => {
    const levelNumber = Number(level);
    const previous = seriesPrerequisite(builder.seriesName ?? "", levelNumber, siblings, localId || badgeClassId);
    const lockedIds = previous ? [previous.id] : [];
    const same = lockedIds.join() === builder.lockedPrerequisiteBadgeIds.join();
    const present = !previous || builder.exam.prerequisiteBadgeIds.includes(previous.id);
    if (same && present) return;
    setBuilder((current) => {
      const ids = new Set(current.exam.prerequisiteBadgeIds);
      for (const id of current.lockedPrerequisiteBadgeIds) {
        if (!lockedIds.includes(id)) ids.delete(id);
      }
      if (previous) ids.add(previous.id);
      return {
        ...current,
        lockedPrerequisiteBadgeIds: lockedIds,
        exam: { ...current.exam, prerequisiteBadgeIds: [...ids] },
      };
    });
  }, [builder.seriesName, builder.lockedPrerequisiteBadgeIds, builder.exam.prerequisiteBadgeIds, level, siblings, localId, badgeClassId]);

  useEffect(() => {
    if (status !== "ACTIVE" || !builder.linkedCourseId || !builder.linkedCourseUpdatedAt) {
      setCourseChanged(false);
      return;
    }
    const courseId = builder.linkedCourseId;
    const baseline = builder.linkedCourseUpdatedAt;
    void fetch(`/api/super-admin/open-badges/generate-from-course?id=${encodeURIComponent(courseId)}`)
      .then((response) => response.json())
      .then((payload: { courses?: Array<{ updatedAt?: string | null }> }) => {
        const updatedAt = payload.courses?.[0]?.updatedAt;
        setCourseChanged(Boolean(updatedAt && new Date(updatedAt).getTime() > new Date(baseline).getTime()));
      })
      .catch(() => setCourseChanged(false));
  }, [status, builder.linkedCourseId, builder.linkedCourseUpdatedAt]);

  useEffect(() => {
    if (locked || hydratingBadgeRef.current || !organizationId || !name.trim()) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      void persistDraft();
    }, 1500);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- le brouillon suit les champs saisis
  }, [
    name,
    description,
    imageUrl,
    level,
    organizationId,
    builder,
    customMonths,
    criteria,
    criteriaMarkdown,
    evaluationMethods,
    methodConfigs,
    validatorExpertId,
    requiresEnrollment,
    requiredCourseId,
    failureRemediationCourseId,
    visibleInLearnerDashboard,
    receivabilityReviewMode,
    locked,
  ]);

  const savedLabel = saveState === "saving" ? "Enregistrement…" : saveState === "error" ? (saveError || "Le serveur n'a pas pu enregistrer le badge.") : savedAt ? "Enregistré" : "";

  const badgeSteps = [
    { id: 1, label: "Le badge" },
    { id: 2, label: "Évaluation" },
    { id: 3, label: "Publication" },
  ] as const;

  const issuerName = formatOrganizationDisplayName(
    organizations.find((org) => org.id === organizationId)?.name ?? "Byound",
  );
  const expertName = validators.find((item) => item.id === validatorExpertId)
    ? validatorLabel(validators.find((item) => item.id === validatorExpertId)!)
    : "";
  const pendingReview = builder.generated
    ? criteria.filter((item) => item.label.trim() && !builder.reviewedCriterionIds.includes(item.id)).length
      + methodConfigs.reduce((count, config) => count + (config.quiz?.questions ?? []).filter((question) => question.reviewStatus !== "reviewed").length, 0)
    : reviewCount;
  const pageTitle = builder.version > 1 && name.trim() ? `${name.trim()} · v${builder.version}` : "Nouveau badge";
  const goToStep = (next: number) => {
    const target = Math.min(3, Math.max(1, next));
    setStep(target);
    setVisitedStep((current) => Math.max(current, target));
  };

  return (
    <div className={`${manrope.variable} badge-builder min-h-screen px-4 pb-28 pt-6 md:px-8`}>
      <div className="mx-auto max-w-[1180px]">
        <p className="text-sm text-[#8C94B2]">
          <Link href="/super/open-badges/badgeclasses" className="text-[#A9B0CC]">Open Badges</Link>
          {" › "}
          Nouveau badge
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            {savedLabel ? (
              <p className={`text-sm ${saveState === "error" ? "text-[#F2C15A]" : "text-[#3DDCAB]"}`}>
                {saveState === "error" ? savedLabel : `✓ ${savedLabel}`}
                {saveState === "error" && saveField ? (
                  <button type="button" className="ml-2 underline" onClick={() => { goToStep(badgeStepForError(saveField)); window.setTimeout(() => document.getElementById(`field-${saveField}`)?.focus(), 50); }}>
                    Voir le champ
                  </button>
                ) : null}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (activeId) {
                  window.open(`/super/open-badges/badgeclasses/${activeId}/essai`, "_blank", "noopener");
                  return;
                }
                void saveBadge(undefined, { openTrial: true });
              }}
              className="relative z-20 rounded-full border border-[#6E5BFF] px-4 py-2 text-sm font-semibold text-[#B9B2FF]"
            >
              Tester l&apos;épreuve
            </button>
            {activeId ? (
              <div className="relative">
                <button type="button" aria-label="Autres actions" onClick={() => setMenuOpen((open) => !open)} className="rounded-full border border-[#26304F] p-2">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-[#1A2340] bg-[#111831] p-1 text-sm shadow-xl">
                    <button type="button" className="block w-full rounded-xl px-3 py-2 text-left hover:bg-[#0B1122]" onClick={() => void forkBadge("copy")}>Dupliquer</button>
                    <button type="button" className="block w-full rounded-xl px-3 py-2 text-left hover:bg-[#0B1122]" onClick={() => void forkBadge("version")}>Nouvelle version</button>
                    <button type="button" className="block w-full rounded-xl px-3 py-2 text-left hover:bg-[#0B1122]" onClick={() => { setMenuOpen(false); void saveBadge("ARCHIVED"); }}>Archiver</button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        {locked ? (
          <p className="mt-4 rounded-2xl border border-[#F2C15A]/40 bg-[#F2C15A]/10 px-4 py-3 text-sm text-[#F2C15A]">
            Ce badge est publié. Les badges déjà délivrés gardent cette version. Créez une nouvelle version pour le modifier.
          </p>
        ) : null}
        {courseChanged && builder.linkedCourseId ? (
          <p className="mt-4 rounded-2xl border border-[#F2C15A]/40 bg-[#F2C15A]/10 px-4 py-3 text-sm text-[#F2C15A]">
            La formation liée a changé depuis la publication : vérifiez les critères.{" "}
            <Link href={`/super/lms/formations/${builder.linkedCourseId}`} className="underline">Voir la formation</Link>
          </p>
        ) : null}
        {step === 0 ? (
          <div className="mt-8">
            {createdDrafts.length > 0 ? (
              <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
                <h2 className="text-lg font-semibold">Brouillons à relire</h2>
                <p className="mt-2 text-sm text-[#8C94B2]">Même série. Ouvrez chaque badge pour relire les critères, les questions et l&apos;expert.</p>
                <ul className="mt-4 space-y-2">
                  {createdDrafts.map((draft) => (
                    <li key={draft.id}>
                      <Link href={`/super/open-badges/badgeclasses/${draft.id}/edit`} className="text-[#B9B2FF]">{draft.name}</Link>
                      <span className="ml-2 text-xs text-[#F2C15A]">À relire</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
            <BadgeBuilderStart
              describing={aiGenerating}
              courseTitle={preparedFrom}
              demand={demand}
              onDemand={setDemand}
              waitLabel={waitLabel}
              error={genError}
              onRetry={() => { if (pendingCourseId) void prepareFromCourse(pendingCourseId); }}
              onBlank={() => setStep(1)}
              onDescribe={(text, file, badgeId) => void prepareFromText(text, file, badgeId)}
              onCourse={(courseId) => void prepareFromCourse(courseId)}
            />
            )}
          </div>
        ) : null}
        {step > 0 ? (
        <div className="mt-6 grid grid-cols-3 gap-3" role="tablist" aria-label="Étapes du badge">
          {badgeSteps.map((item) => {
            const done = item.id < step;
            const enabled = item.id <= Math.max(visitedStep, step);
            return (
              <button key={item.id} type="button" role="tab" aria-selected={step === item.id} disabled={!enabled} onClick={() => goToStep(item.id)} className="text-left disabled:opacity-40">
                <span className="mb-2 block h-1 rounded-full" style={{ background: item.id <= step ? "#6E5BFF" : "#1A2340" }} />
                <span className="flex items-center gap-2 text-sm">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${item.id <= step ? "bg-[#6E5BFF] text-white" : "border border-[#26304F] text-[#8C94B2]"}`}>{done ? "✓" : item.id}</span>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        ) : null}
        {step > 0 ? (
        <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_470px]">
          <div className={locked ? "pointer-events-none opacity-70" : ""}>
      {step === 1 ? (
        <>
        <BadgeBuilderStepIdentity
          name={name}
          onName={(value) => { setName(value); clearFieldError("name"); }}
          level={level}
          onLevel={(value) => { setLevel(value); clearFieldError("level"); }}
          description={description}
          onDescription={(value) => { setDescription(value); clearFieldError("description"); }}
          imageUploading={imageUploading}
          organizationId={organizationId}
          onPickImage={(file) => {
            void cropSquareBadgeImage(file).then((cropped) => handleImageUpload(cropped)).catch((error) => {
              toast.error(error instanceof Error ? error.message : "Image refusée");
            });
          }}
          onGenerateImage={() => void generateBadgeVisual()}
          builder={builder}
          onBuilder={(patch) => setBuilder((current) => ({ ...current, ...patch }))}
          customMonths={customMonths}
          onCustomMonths={setCustomMonths}
          organizations={organizations}
          organizationName={formatOrganizationDisplayName}
          onOrganization={handleOrganizationChange}
          courses={courses}
          requiresEnrollment={requiresEnrollment}
          onRequiresEnrollment={(value) => {
            setRequiresEnrollment(value);
            if (!value) setRequiredCourseId(null);
            else setVisibleInLearnerDashboard(false);
          }}
          requiredCourseId={requiredCourseId}
          onRequiredCourse={(id) => { setRequiredCourseId(id); clearFieldError("requiredCourseId"); }}
          failureCourseId={failureRemediationCourseId}
          onFailureCourse={setFailureRemediationCourseId}
          errors={errors}
          domains={catalog.domains}
          series={catalog.series}
          siblingBadges={siblings}
          selfId={localId || badgeClassId}
          onCreateDomain={(domain) => {
            void fetch("/api/super-admin/open-badges/catalog", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "upsert-domain", ...domain }),
            }).then((response) => response.json()).then((payload) => {
              if (payload.catalog) setCatalog(payload.catalog);
              if (payload.domain) setBuilder((current) => ({ ...current, domain: payload.domain.name, domainId: payload.domain.id, domainColor: payload.domain.color, domainIcon: payload.domain.icon }));
            });
          }}
          onCreateSeries={(seriesName) => {
            void fetch("/api/super-admin/open-badges/catalog", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "upsert-series", name: seriesName, domainId: builder.domainId }),
            }).then((response) => response.json()).then((payload) => {
              if (payload.catalog) setCatalog(payload.catalog);
              if (payload.series) setBuilder((current) => ({ ...current, seriesName: payload.series.name, seriesId: payload.series.id }));
            });
          }}
          compact
        />
        <div className="mt-5">
          <BadgeBuilderStepCriteria
            criteria={criteria}
            onCriteria={setCriteria}
            builder={builder}
            onBuilder={(patch) => setBuilder((current) => ({ ...current, ...patch }))}
            name={name}
            description={description}
            level={level}
            library={catalog.competencies}
            hideCriteria
          />
        </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          {builder.generated && preparedFrom ? (
            <p className="mb-4 rounded-2xl border border-[#6E5BFF]/40 bg-[#241C4A] px-4 py-3 text-sm">
              ✦ Préparé à partir de « {preparedFrom} ». Relisez ce qui est signalé, le reste est prêt.
              {pendingReview > 0 ? <span className="ml-2 rounded-full bg-[#F2C15A]/20 px-2 py-0.5 text-[#F2C15A]">{pendingReview} à relire</span> : null}
            </p>
          ) : null}
          <BadgeBuilderStepCriteria
            criteria={criteria}
            onCriteria={(next) => { setCriteria(next); clearFieldError("criteria"); }}
            builder={builder}
            onBuilder={(patch) => setBuilder((current) => ({ ...current, ...patch }))}
            name={name}
            description={description}
            level={level}
            library={catalog.competencies}
            courseId={builder.linkedCourseId || pendingCourseId}
            onRemove={(id) => {
              setCriteria((current) => current.filter((item) => item.id !== id));
              setBuilder((current) => {
                const practices = { ...current.exam.practices };
                for (const key of Object.keys(practices)) {
                  const practice = practices[key];
                  if (!practice) continue;
                  const ids = practice.criteria.filter((link) => link.criterionId !== id).map((link) => link.criterionId);
                  const weights = resolvedWeights(ids, {});
                  practices[key] = { ...practice, criteria: ids.map((criterionId) => ({ criterionId, weight: weights[criterionId] ?? 0 })) };
                }
                return {
                  ...current,
                  exam: { ...current.exam, practices },
                  reviewedCriterionIds: current.reviewedCriterionIds.filter((item) => item !== id),
                };
              });
            }}
            variant="lines"
            hideSkills
            methods={coverageExamKeys(evaluationMethods, methodConfigs.find((item) => item.methodId === "playground")?.playground)}
            links={Object.fromEntries(coverageExamKeys(evaluationMethods, methodConfigs.find((item) => item.methodId === "playground")?.playground).map((id) => [id, (builder.exam.practices[id]?.criteria ?? []).map((link) => link.criterionId)]))}
            onAutoCover={autoCover}
            onKept={(id) => {
              setBuilder((current) => current.reviewedCriterionIds.includes(id) ? current : { ...current, reviewedCriterionIds: [...current.reviewedCriterionIds, id] });
              const host = evaluationMethods.find((methodId) => methodId !== "qcm") ?? "case_study";
              coverCriterion(id, host, false);
            }}
            onToggleExam={toggleCriterionExam}
            onReviewed={(id) => setBuilder((current) => current.reviewedCriterionIds.includes(id) ? current : { ...current, reviewedCriterionIds: [...current.reviewedCriterionIds, id] })}
          />
          <div className="mt-5">
        <BadgeBuilderStepExam
          name={name}
          level={level}
          criteria={criteria}
          methods={evaluationMethods}
          onMethods={setEvaluationMethods}
          configs={methodConfigs}
          onConfigs={setMethodConfigs}
          builder={builder}
          onBuilder={(patch) => setBuilder((current) => ({ ...current, ...patch }))}
          validators={validators}
          expertId={validatorExpertId}
          onExpert={(id) => { setValidatorExpertId(id); clearFieldError("validatorExpertId"); }}
          aiPrecheck={receivabilityReviewMode !== "HUMAN"}
          onAiPrecheck={(value) => setReceivabilityReviewMode(value ? "MIXED" : "HUMAN")}
          openId={openMethod}
          onOpen={setOpenMethod}
          onAddCriteria={(items) => setCriteria((current) => [
            ...current,
            ...items.map((item, index) => ({
              id: crypto.randomUUID(),
              label: item.label,
              description: item.description,
              expectedOutcome: item.expectedOutcome,
              sortOrder: current.length + index,
            })),
          ])}
          variant="cards"
          domainLabel={builder.domain}
        />
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
        <BadgeBuilderStepPublish
          builder={builder}
          onBuilder={(patch) => setBuilder((current) => ({ ...current, ...patch }))}
          checks={checklist()}
          organizationId={organizationId}
          authHeaders={createHeaders(auth, organizationId)}
          currentBadgeId={badgeClassId}
          locked={locked}
          onCreateVersion={() => void forkBadge("version")}
          onComplete={goToStep}
          courseRequired={requiresEnrollment}
          onCourseRequired={(value) => {
            setRequiresEnrollment(value);
            if (value) setVisibleInLearnerDashboard(false);
            else setRequiredCourseId(null);
          }}
          essaiHref={activeId ? `/super/open-badges/badgeclasses/${activeId}/essai` : null}
        />
        {badgeClassId && organizationId ? (
          <BadgeLearnerAttemptsPanel
            badgeClassId={badgeClassId}
            auth={auth}
            organizationId={organizationId}
          />
        ) : null}
        </>
      ) : null}


          </div>
          <div className="space-y-4 lg:sticky lg:top-6">
          {step === 2 ? (
            <div className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-4 text-sm text-[#A9B0CC]">
              <p>{preparedFrom ? `Formation · ${preparedFrom}` : "Sans formation liée"}</p>
              <p className="mt-1">{builder.domain || "Domaine à choisir"} · {builder.seriesName ? `Série ${builder.seriesName}` : "Sans série"}</p>
              <p className="mt-1">{builder.competencies.map((item) => item.name).filter(Boolean).join(", ") || "Compétences à choisir"}</p>
              <p className="mt-1">{validityLabel(builder.validityMode, builder.validityMode === "custom" ? Number(customMonths) || null : builder.validityMonths)}</p>
            </div>
          ) : null}
          <BadgeBuilderPreview
            name={name}
            description={description}
            level={level ? Number.parseInt(level, 10) : null}
            levelLabel={builder.levelLabel}
            imageUrl={imageUrl}
            typeLabel={achievementLabel(builder.achievementType)}
            validityLabel={validityLabel(builder.validityMode, builder.validityMode === "custom" ? Number(customMonths) || null : builder.validityMonths)}
            criteriaCount={criteria.filter((item) => item.label.trim()).length}
            skills={builder.competencies.map((item) => item.name)}
            methodsLabel={formatEvaluationMethodsSummary(evaluationMethods)}
            expertName={expertName}
            issuerName={issuerName}
            mode={previewMode}
            onMode={setPreviewMode}
          />
          </div>
        </div>
        ) : null}
      </div>
      {step > 0 ? (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#1A2340] bg-[#0A0F1E]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => goToStep(step - 1)}
            className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold text-[#EEF0F7] disabled:opacity-40"
          >
            ← Précédent
          </button>
          <p className="text-sm text-[#8C94B2]">Étape {step} sur 3{pendingReview > 0 ? ` · ${pendingReview} éléments à relire` : ` · ${badgeSteps[step - 1]?.label}`}</p>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => goToStep(step + 1)}
              className="bb-white rounded-full px-5 py-2 text-sm font-semibold"
            >
              Continuer · {badgeSteps[step]?.label} →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void saveBadge("ACTIVE")}
              disabled={loading || locked || checklist().some((item) => item.required && !item.ok)}
              className="bb-white rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {locked ? "Publié" : "Publier le badge"}
            </button>
          )}
        </div>
      </div>
      ) : null}
    </div>
  );
}
