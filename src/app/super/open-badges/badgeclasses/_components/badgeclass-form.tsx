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
  parseMethodConfigs,
  validateMethodConfigsForMethods,
  type BadgeMethodConfig,
} from "@/lib/openbadges/badge-method-config";
import { EvaluationMethodConfigDialog } from "@/app/super/open-badges/badgeclasses/_components/evaluation-method-config-dialog";
import { BadgeLearnerAttemptsPanel } from "@/app/super/open-badges/badgeclasses/_components/badge-learner-attempts-panel";
import { Check, MoreHorizontal } from "lucide-react";
import { BadgeBuilderPreview } from "@/app/super/open-badges/badgeclasses/_components/badge-builder-preview";
import { BadgeBuilderStepIdentity } from "@/app/super/open-badges/badgeclasses/_components/badge-builder-step-identity";
import {
  ACHIEVEMENT_TYPES,
  achievementLabel,
  cropSquareBadgeImage,
  emptyBuilderState,
  expiresAfterDays,
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
  if (key === "criteria") return 2;
  if (
    key === "level" ||
    key === "evaluationMethods" ||
    key === "validatorExpertId" ||
    key === "methodConfigs" ||
    key === "requiredCourseId"
  ) {
    return 3;
  }
  return 1;
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
  const [receivabilityReviewMode, setReceivabilityReviewMode] = useState<"HUMAN" | "AI" | "MIXED">("HUMAN");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const [builder, setBuilder] = useState<BadgeBuilderState>(emptyBuilderState());
  const [previewMode, setPreviewMode] = useState<"card" | "page">("card");
  const [visitedStep, setVisitedStep] = useState(1);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [menuOpen, setMenuOpen] = useState(false);
  const [localId, setLocalId] = useState(badgeClassId ?? "");
  const idRef = useRef(badgeClassId ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [customMonths, setCustomMonths] = useState("");
  const skipSaveRef = useRef(true);
  const [step, setStep] = useState(1);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const previousOrgId = useRef<string | null>(null);
  const hydratingBadgeRef = useRef(false);

  const generateFromAiPrompt = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      toast.error("Décrivez le badge à générer");
      return;
    }
    setAiGenerating(true);
    try {
      const res = await fetch("/api/super-admin/open-badges/generate-from-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Génération impossible");
        return;
      }
      const badge = json.badge as Record<string, unknown> | undefined;
      if (!badge) return;
      if (typeof badge.name === "string" && badge.name.trim()) setName(badge.name.trim());
      if (typeof badge.description === "string") setDescription(badge.description.trim());
      if (typeof badge.criteriaMarkdown === "string") setCriteriaMarkdown(badge.criteriaMarkdown.trim());
      if (typeof badge.level === "number") setLevel(String(Math.min(3, Math.max(1, badge.level))));
      if (typeof badge.domain === "string" && badge.domain.trim()) {
        setBuilder((current) => ({ ...current, domain: badge.domain as string }));
      }
      if (typeof badge.achievementType === "string" && ACHIEVEMENT_TYPES.some((item) => item.id === badge.achievementType)) {
        setBuilder((current) => ({ ...current, achievementType: badge.achievementType as BadgeBuilderState["achievementType"] }));
      }
      if (Array.isArray(badge.skills)) {
        const skills = badge.skills.map((item) => String(item)).filter(Boolean);
        setBuilder((current) => ({ ...current, skills }));
      }
      if (Array.isArray(badge.criteria) && badge.criteria.length > 0) {
        setCriteria(
          badge.criteria.map((c: { label?: string; description?: string; expectedOutcome?: string }, i: number) => ({
            id: crypto.randomUUID(),
            label: String(c.label ?? ""),
            description: [c.description, c.expectedOutcome].filter(Boolean).join(" — "),
            sortOrder: i,
          })),
        );
      }
      const methods = Array.isArray(badge.evaluationMethods)
        ? badge.evaluationMethods.filter((m): m is BadgeEvaluationMethodId =>
            typeof m === "string" && isBadgeEvaluationMethodId(m),
          )
        : [];
      if (methods.length > 0) {
        setEvaluationMethods(methods);
        const promptText =
          typeof badge.suggestedEvaluationPrompt === "string"
            ? badge.suggestedEvaluationPrompt
            : "";
        setMethodConfigs(
          methods.map((methodId) => ({
            methodId,
            evaluationPrompt: promptText,
            ...(methodId === "qcm"
              ? {
                  quiz: {
                    generationMode: "ai" as const,
                    questionCount: 5,
                    title: typeof badge.name === "string" ? badge.name : "",
                    level: typeof badge.level === "number" ? badge.level : undefined,
                    questions: [],
                  },
                }
              : {}),
          })),
        );
      }
      toast.success("Badge pré-rempli par l’IA — vérifiez et complétez");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setAiGenerating(false);
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
    const loadValidators = async () => {
      const res = await fetch("/api/super-admin/validators");
      if (!res.ok) return;
      const json = await res.json();
      setValidators(json.validators ?? []);
    };
    loadOrganizations();
    loadValidators();
  }, []);

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

  const updateCriteria = (index: number, patch: Partial<BadgeCriteriaInput>) => {
    setCriteria((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
    clearFieldError("criteria");
  };

  const moveCriterion = (index: number, direction: -1 | 1) => {
    setCriteria((prev) => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(newIndex, 0, item);
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

  const narrativeFromCriteria = criteria
    .map((item) => [item.label.trim(), (item.description ?? "").trim()].filter(Boolean).join(" — "))
    .filter(Boolean)
    .join("\n");

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
      validityMonths: builder.validityMode === "custom" ? Number(customMonths) || null : builder.validityMode === "12" ? 12 : builder.validityMode === "24" ? 24 : null,
    },
    achievementType: builder.achievementType,
    expiresAfterDays: expiresAfterDays(
      builder.validityMode,
      builder.validityMode === "custom" ? Number(customMonths) || null : null,
    ),
  });

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
    if (configError) nextErrors.methodConfigs = configError;
    if (requiresEnrollment && !requiredCourseId) {
      nextErrors.requiredCourseId = "Formation requise.";
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

  const saveBadge = async (nextStatus?: BadgeClassRecord["status"]) => {
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
          setStep(3);
          toast.error("Configurez chaque méthode d’évaluation.");
          return;
        }
        if (errorCode === "REQUIRED_COURSE_ID" || errorCode === "REQUIRED_COURSE_MISSING") {
          setErrors((prev) => ({ ...prev, requiredCourseId: "Formation requise." }));
          setStep(3);
          toast.error("Formation requise.");
          return;
        }
        if (errorCode === "COURSE_NOT_FOUND") {
          setErrors((prev) => ({ ...prev, requiredCourseId: "Formation introuvable." }));
          setStep(3);
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
        window.location.href = `/super/open-badges/badgeclasses/${jsonOk.badgeClass.id}/edit`;
        return;
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
    if (locked || !organizationId || !name.trim()) return;
    setSaveState("saving");
    try {
      const payload = { ...serializePayload("DRAFT"), organizationId };
      const currentId = idRef.current;
      const res = await fetch(currentId ? `/api/admin/badgeclasses/${currentId}` : "/api/admin/badgeclasses", {
        method: currentId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...createHeaders(auth, organizationId) },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setSaveState("error");
        return;
      }
      const createdId = String(json?.badgeClass?.id ?? "");
      if (!currentId && createdId) {
        idRef.current = createdId;
        setLocalId(createdId);
        window.history.replaceState(null, "", `/super/open-badges/badgeclasses/${createdId}/edit`);
      }
      setSavedAt(Date.now());
      setSaveState("saved");
    } catch {
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

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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

  const savedLabel = (() => {
    if (saveState === "saving") return "Enregistrement…";
    if (saveState === "error") return "Enregistrement impossible";
    if (!savedAt) return "";
    const seconds = Math.max(0, Math.round((clock - savedAt) / 1000));
    return `Brouillon enregistré il y a ${seconds} s`;
  })();

  const badgeSteps = [
    { id: 1, label: "Le badge" },
    { id: 2, label: "Critères" },
    { id: 3, label: "Épreuve" },
    { id: 4, label: "Publication" },
  ] as const;

  const issuerName = formatOrganizationDisplayName(
    organizations.find((org) => org.id === organizationId)?.name ?? "Byound",
  );
  const expertName = validators.find((item) => item.id === validatorExpertId)
    ? validatorLabel(validators.find((item) => item.id === validatorExpertId)!)
    : "";
  const pageTitle = builder.version > 1 && name.trim() ? `${name.trim()} · v${builder.version}` : "Nouveau badge";
  const goToStep = (next: number) => {
    const target = Math.min(4, Math.max(1, next));
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
            {savedLabel ? <p className="text-sm text-[#3DDCAB]">{saveState === "saved" ? <Check className="mr-1 inline h-4 w-4" /> : null}{savedLabel}</p> : null}
            {activeId ? (
              <a href={`/super/open-badges/badgeclasses/${activeId}/essai`} target="_blank" rel="noreferrer" className="rounded-full border border-[#6E5BFF] px-4 py-2 text-sm font-semibold text-[#B9B2FF]">
                Tester l&apos;épreuve
              </a>
            ) : (
              <span className="rounded-full border border-[#26304F] px-4 py-2 text-sm text-[#5F688A]">Tester l&apos;épreuve</span>
            )}
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
        <div className="mt-6 grid grid-cols-4 gap-3" role="tablist" aria-label="Étapes du badge">
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
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_470px]">
          <div className={locked ? "pointer-events-none opacity-70" : ""}>
      {step === 1 ? (
        <BadgeBuilderStepIdentity
          aiPrompt={aiPrompt}
          aiGenerating={aiGenerating}
          onAiPrompt={setAiPrompt}
          onGenerate={() => void generateFromAiPrompt()}
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
        />
      ) : null}

      {step === 2 ? (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Critères détaillés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ajoutez des critères un par un pour une lecture plus claire.
          </p>
          {criteria.map((criterion, index) => (
            <div key={`criterion-${criterion.id}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-900">Critère {index + 1}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => moveCriterion(index, -1)}>
                    ↑
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moveCriterion(index, 1)}>
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCriteria((prev) => prev.filter((item) => item.id !== criterion.id))}
                    disabled={criteria.length === 1}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
              <Label className="text-slate-900">Titre du critère</Label>
              <Input
                className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Titre du critère"
                value={criterion.label}
                onChange={(event) => updateCriteria(index, { label: event.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Un intitulé court (ex : “Fournir un rapport d’analyse”).
              </p>
              <Label className="text-slate-900">Détails (optionnel)</Label>
              <Textarea
                className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="Détails (optionnel)"
                value={criterion.description ?? ""}
                onChange={(event) => updateCriteria(index, { description: event.target.value })}
                rows={2}
              />
              <p className="text-sm text-muted-foreground">
                Précisions ou exemples attendus.
              </p>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setCriteria((prev) => [
                ...prev,
                { ...emptyCriteria(), description: null, sortOrder: prev.length },
              ])
            }
          >
            + Ajouter un critère
          </Button>
        </CardContent>
      </Card>
      ) : null}

      {step === 3 ? (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="text-slate-900">Évaluation & validation</CardTitle>
          <Button type="button" variant="outline" asChild disabled={!organizationId}>
            <Link href={formationBuilderHref}>Créer la formation</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-900">Niveau du badge</Label>
              <Select
                value={level}
                onValueChange={(value) => {
                  setLevel(value);
                  clearFieldError("level");
                }}
              >
                <SelectTrigger
                  id="field-level"
                  className={`border-slate-300 bg-white text-slate-900 ${
                    errors.level ? "border-destructive" : ""
                  }`}
                  aria-invalid={Boolean(errors.level)}
                >
                  <SelectValue placeholder="Choisir un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {BADGE_LEVEL_OPTIONS.map((n) => (
                    <SelectItem key={`badge-level-${n}`} value={String(n)}>
                      Niveau {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.level ? (
                <p id="error-level" className="text-sm text-destructive">
                  {errors.level}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-900">Validateur</Label>
              <Select
                value={validatorExpertId}
                onValueChange={(value) => {
                  setValidatorExpertId(value);
                  clearFieldError("validatorExpertId");
                }}
              >
                <SelectTrigger
                  id="field-validatorExpertId"
                  className={`border-slate-300 bg-white text-slate-900 ${
                    errors.validatorExpertId ? "border-destructive" : ""
                  }`}
                  aria-invalid={Boolean(errors.validatorExpertId)}
                >
                  <SelectValue placeholder="Sélectionner un validateur" />
                </SelectTrigger>
                <SelectContent>
                  {validators.map((validator) => {
                    const photo = resolveValidatorPhotoUrl(
                      validator as Record<string, unknown>,
                    );
                    return (
                      <SelectItem key={validator.id} value={validator.id}>
                        <span className="flex items-center gap-2">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-600">
                              ?
                            </span>
                          )}
                          {validatorLabel(validator)}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Personne qui valide les preuves.
              </p>
              {errors.validatorExpertId ? (
                <p id="error-validatorExpertId" className="text-sm text-destructive">
                  {errors.validatorExpertId}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3" id="field-evaluationMethods">
            <Label className="text-slate-900">Méthodes d’évaluation</Label>
            <p className="text-sm text-muted-foreground">
              Cochez une méthode pour ouvrir sa configuration (prompt ou QCM). Une consigne par
              méthode remplace l’ancienne consigne IA globale.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {BADGE_EVALUATION_METHODS.map((method) => {
                const checked = evaluationMethods.includes(method.id);
                const configured = methodConfigs.some((c) => c.methodId === method.id);
                return (
                  <div
                    key={method.id}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition ${
                      checked
                        ? "border-sky-500/50 bg-sky-50/80"
                        : "border-slate-200 bg-white"
                    } ${errors.evaluationMethods || errors.methodConfigs ? "border-destructive/60" : ""}`}
                  >
                    <label className="flex flex-1 cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleEvaluationMethod(method.id, value === true)
                        }
                      />
                      <span className="text-sm font-medium text-slate-900">{method.label}</span>
                    </label>
                    {checked ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-xs"
                        onClick={() => openMethodConfig(method.id)}
                      >
                        {configured ? "Modifier" : "Configurer"}
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {evaluationMethods.length > 0 ? (
              <p className="text-xs text-slate-500">
                Résumé : {formatEvaluationMethodsSummary(evaluationMethods)}
                {qcmConfig && !qcmThresholdMissing
                  ? ` — QCM : seuil ${getQcmPassingScorePercent(qcmConfig)} %`
                  : null}
              </p>
            ) : null}
            {qcmThresholdMissing ? (
              <p className="rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                Le seuil d&apos;acceptation du QCM n&apos;est pas enregistré (100 % appliqué par
                défaut). Ouvrez la configuration QCM, définissez le pourcentage souhaité, validez
                puis enregistrez le badge.
              </p>
            ) : null}
            {errors.evaluationMethods ? (
              <p id="error-evaluationMethods" className="text-sm text-destructive">
                {errors.evaluationMethods}
              </p>
            ) : null}
            {errors.methodConfigs ? (
              <p id="error-methodConfigs" className="text-sm text-destructive">
                {errors.methodConfigs}
              </p>
            ) : null}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-slate-900">Qui corrige l&apos;épreuve ?</Label>
            <Select
              value={receivabilityReviewMode}
              onValueChange={(value) => setReceivabilityReviewMode(value as "HUMAN" | "AI" | "MIXED")}
            >
              <SelectTrigger className="border-slate-300 bg-white text-slate-900">
                <SelectValue placeholder="Choisir un mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HUMAN">Évaluateur (humain)</SelectItem>
                <SelectItem value="AI">IA (prompts par méthode)</SelectItem>
                <SelectItem value="MIXED">IA + humain</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Les consignes IA sont définies dans chaque méthode. L’intégrité (onglets, temps de
              rédaction) est transmise automatiquement à l’évaluateur et bloque la validation si
              l’apprenant a quitté l’onglet.
            </p>
          </div>
        </CardContent>
      </Card>
      ) : null}

      <EvaluationMethodConfigDialog
        open={configDialogOpen}
        methodId={configDialogMethod}
        initial={methodConfigs.find((c) => c.methodId === configDialogMethod) ?? null}
        badgeTitle={name.trim()}
        badgeLevel={level ? Number.parseInt(level, 10) : null}
        onClose={() => {
          setConfigDialogOpen(false);
          setConfigDialogMethod(null);
        }}
        onSave={saveMethodConfig}
      />

      {step === 4 ? (
      <>
      <Card className="border border-[#E3E0D8] bg-white text-[#07080B] shadow-sm">
        <CardHeader className="border-b border-[#E3E0D8] pb-4">
          <CardTitle className="text-lg font-semibold text-[#07080B]">
            Aperçu
          </CardTitle>
          <p className="text-sm text-[#6B6F7A]">
            Résumé avant publication.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pt-6 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Nom du badge</p>
            <p className="text-base font-semibold text-[#07080B]">{name.trim() || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Niveau</p>
            <p className="text-[#07080B]">{level ? `Niveau ${level}` : "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Description</p>
            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {description.trim() || "—"}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Critères</p>
            {criteria.some((c) => c.label.trim()) ? (
              <ol className="list-decimal space-y-2 pl-5 text-zinc-200">
                {criteria
                  .filter((c) => c.label.trim())
                  .map((criterion, index) => (
                    <li key={`preview-${criterion.id}-${index}`} className="leading-relaxed">
                      <span className="font-medium">{criterion.label}</span>
                      {criterion.description?.trim() ? (
                        <span className="mt-0.5 block text-zinc-400 text-xs">
                          {criterion.description}
                        </span>
                      ) : null}
                    </li>
                  ))}
              </ol>
            ) : criteriaMarkdown.trim() ? (
              <p className="text-zinc-300 whitespace-pre-wrap">{criteriaMarkdown}</p>
            ) : (
              <p className="text-zinc-500">—</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Date de création
            </p>
            <p className="text-zinc-300">
              {createdAt
                ? new Date(createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Disponible après enregistrement"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Épreuve
            </p>
            <p className="text-zinc-200">
              {evaluationMethods.length > 0
                ? formatEvaluationMethodsSummary(evaluationMethods)
                : "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-700 pt-4 text-xs text-zinc-500">
            <span>Statut</span>
            <Badge
              variant="outline"
              className={
                status === "ACTIVE"
                  ? "border-emerald-600/60 bg-emerald-950/40 text-emerald-200"
                  : status === "ARCHIVED"
                    ? "border-zinc-600 text-zinc-400"
                    : "border-amber-600/60 bg-amber-950/40 text-amber-200"
              }
            >
              {statusLabel(status)}
            </Badge>
            <span className="mx-1">·</span>
            <span>
              Émetteur :{" "}
              {formatOrganizationDisplayName(
                organizations.find((org) => org.id === organizationId)?.name ?? "—",
              )}
            </span>
          </div>
        </CardContent>
      </Card>

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
          <BadgeBuilderPreview
            name={name}
            description={description}
            level={level ? Number.parseInt(level, 10) : null}
            imageUrl={imageUrl}
            typeLabel={achievementLabel(builder.achievementType)}
            validityLabel={validityLabel(builder.validityMode, builder.validityMode === "custom" ? Number(customMonths) || null : builder.validityMonths)}
            criteriaCount={criteria.filter((item) => item.label.trim()).length}
            skills={builder.skills}
            methodsLabel={formatEvaluationMethodsSummary(evaluationMethods)}
            expertName={expertName}
            issuerName={issuerName}
            mode={previewMode}
            onMode={setPreviewMode}
          />
        </div>
      </div>
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
          <p className="text-sm text-[#8C94B2]">Étape {step} sur 4 · {badgeSteps[step - 1]?.label}</p>
          {step < 4 ? (
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
              disabled={loading || locked}
              className="bb-white rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {locked ? "Publié" : "Publier le badge"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
