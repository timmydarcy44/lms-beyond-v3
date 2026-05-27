"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { resolveValidatorPhotoUrl } from "@/lib/validators/photo-url";
import { getBaseUrl } from "@/lib/openbadges/urls";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Sparkles } from "lucide-react";

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
type CourseOption = { id: string; title: string };
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
  const [level, setLevel] = useState<string>("");
  const [evaluationMethods, setEvaluationMethods] = useState<string[]>([]);
  const [methodConfigs, setMethodConfigs] = useState<BadgeMethodConfig[]>([]);
  const [validatorExpertId, setValidatorExpertId] = useState("");
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configDialogMethod, setConfigDialogMethod] = useState<BadgeEvaluationMethodId | null>(null);
  const [status, setStatus] = useState<BadgeClassRecord["status"]>("DRAFT");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [requiresEnrollment, setRequiresEnrollment] = useState(false);
  const [requiredCourseId, setRequiredCourseId] = useState<string | null>(null);
  const [failureRemediationCourseId, setFailureRemediationCourseId] = useState<string | null>(null);
  const [visibleInLearnerDashboard, setVisibleInLearnerDashboard] = useState(false);
  const [receivabilityReviewMode, setReceivabilityReviewMode] = useState<"HUMAN" | "AI" | "MIXED">("HUMAN");
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      if (typeof badge.level === "number") setLevel(String(badge.level));
      if (Array.isArray(badge.criteria) && badge.criteria.length > 0) {
        setCriteria(
          badge.criteria.map((c: { label?: string; description?: string }, i: number) => ({
            id: crypto.randomUUID(),
            label: String(c.label ?? ""),
            description: c.description ? String(c.description) : "",
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
      const res = await fetch("/api/super-admin/organisations");
      const json = await res.json();
      setOrganizations(json.organizations ?? []);
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

  const qcmConfig = methodConfigs.find((c) => c.methodId === "qcm");
  const qcmThresholdMissing =
    evaluationMethods.includes("qcm") &&
    qcmConfig &&
    !hasExplicitQcmPassingScore(qcmConfig);


  useEffect(() => {
    if (!organizationId) return;
    const loadCourses = async () => {
      const res = await fetch(`/api/admin/courses?organizationId=${organizationId}`, {
        headers: createHeaders(auth, organizationId),
      });
      const json = await res.json();
      setCourses(json.courses ?? []);
    };
    loadCourses();
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
      hydratingBadgeRef.current = false;
    };
    void loadBadge();
  }, [badgeClassId]);

  const handleOrganizationChange = (nextOrgId: string) => {
    setOrganizationId(nextOrgId);
    setErrors({});
    setName("");
    setDescription("");
    setImageUrl("");
    setCriteriaUrl("");
    setCriteriaMarkdown("");
    setCriteria([emptyCriteria()]);
    setLevel("");
    setEvaluationMethods([]);
    setValidatorExpertId("");
    setMethodConfigs([]);
    setReceivabilityReviewMode("HUMAN");
    setStatus("DRAFT");
    setCreatedAt(null);
    setRequiresEnrollment(false);
    setRequiredCourseId(null);
    setFailureRemediationCourseId(null);
    setUploadFile(null);
  };

  useEffect(() => {
    if (!organizationId) return;
    if (hydratingBadgeRef.current) {
      previousOrgId.current = organizationId;
      return;
    }
    if (previousOrgId.current && previousOrgId.current !== organizationId) {
      setName("");
      setDescription("");
      setImageUrl("");
      setCriteriaUrl("");
      setCriteriaMarkdown("");
      setCriteria([emptyCriteria()]);
      setLevel("");
      setEvaluationMethods([]);
      setValidatorExpertId("");
      setMethodConfigs([]);
      setReceivabilityReviewMode("HUMAN");
      setRequiresEnrollment(false);
      setRequiredCourseId(null);
      setErrors({});
      setUploadFile(null);
    }
    previousOrgId.current = organizationId;
  }, [organizationId]);

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
        const message =
          (json?.error as string | undefined)
          ?? (json?.message as string | undefined)
          ?? raw
          ?? "Unknown error";
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
      toast.success("Image uploadée");
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[badgeclass][upload] exception", error);
      }
      toast.error(String(error));
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

  const serializePayload = (nextStatus?: BadgeClassRecord["status"]): BadgeClassPayload => ({
    organizationId,
    name,
    description,
    imageUrl,
    criteriaUrl: criteriaUrl || null,
    criteriaMarkdown: criteriaMarkdown || null,
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
    if (!imageUrl) nextErrors.imageUrl = "Image requise.";
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
        const target = document.getElementById(`field-${firstKey}`);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          if ("focus" in target) {
            (target as HTMLElement).focus();
          }
        }
      }
      toast.error("Merci de compléter les champs obligatoires.");
      return false;
    }
    return true;
  };

  const saveBadge = async (nextStatus?: BadgeClassRecord["status"]) => {
    if (!validateForm()) return;
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
          toast.error("Configurez chaque méthode d’évaluation.");
          return;
        }
        if (errorCode === "REQUIRED_COURSE_ID" || errorCode === "REQUIRED_COURSE_MISSING") {
          setErrors((prev) => ({ ...prev, requiredCourseId: "Formation requise." }));
          toast.error("Formation requise.");
          return;
        }
        if (errorCode === "COURSE_NOT_FOUND") {
          setErrors((prev) => ({ ...prev, requiredCourseId: "Formation introuvable." }));
          toast.error("Formation introuvable.");
          return;
        }
        if (errorCode === "CONFLICT") {
          const field = (json?.field as string | undefined) ?? undefined;
          if (field === "name") {
            setErrors((prev) => ({ ...prev, name: "Un badge avec ce nom existe déjà." }));
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

  return (
    <div className="space-y-6 text-slate-900">
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50/80 to-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Créer avec l’IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Décrivez le badge en langage naturel : l’IA remplit le nom, la description, les critères et
            suggère les méthodes d’évaluation.
          </p>
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={3}
            placeholder="Ex. : Badge niveau 2 « Analyse vidéo tactique » pour valider la capacité à décrypter un match de foot…"
            className="border-violet-200 bg-white"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={aiGenerating}
            onClick={() => void generateFromAiPrompt()}
          >
            {aiGenerating ? "Génération…" : "Générer le badge"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Informations principales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-900">Club / Organisation</Label>
              <Select value={organizationId} onValueChange={handleOrganizationChange}>
                <SelectTrigger
                  id="field-organizationId"
                  className={`border-slate-300 bg-white text-slate-900 ${
                    errors.organizationId ? "border-destructive" : ""
                  }`}
                  aria-invalid={Boolean(errors.organizationId)}
                  aria-describedby={errors.organizationId ? "error-organizationId" : undefined}
                >
                  <SelectValue placeholder="Sélectionner un club" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {formatOrganizationDisplayName(org.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choisissez le club (PSG, OM, etc.) pour lequel ce badge est disponible.
              </p>
              {errors.organizationId ? (
                <p id="error-organizationId" className="text-sm text-destructive">
                  {errors.organizationId}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label className="text-slate-900">Émetteur</Label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-sm text-slate-900">
                  {formatOrganizationDisplayName(
                    organizations.find((org) => org.id === organizationId)?.name ?? "—",
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  L’émetteur est automatiquement le club/organisation sélectionné.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-900">Nom du badge</Label>
            <Input
              id="field-name"
              className={`border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 ${
                errors.name ? "border-destructive" : ""
              }`}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearFieldError("name");
              }}
              placeholder="Ex : Analyse vidéo – Niveau 1"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "error-name" : undefined}
            />
            <p className="text-sm text-muted-foreground">
              Le titre affiché dans le badge (ex : “Analyse vidéo – Niveau 1”).
            </p>
            {errors.name ? (
              <p id="error-name" className="text-sm text-destructive">
                {errors.name}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-900">Description</Label>
            <Textarea
              id="field-description"
              className={`border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 ${
                errors.description ? "border-destructive" : ""
              }`}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                clearFieldError("description");
              }}
              rows={4}
              placeholder="Décrivez en 1 ou 2 phrases ce que valide ce badge."
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "error-description" : undefined}
            />
            <p className="text-sm text-muted-foreground">
              Expliquez en une ou deux phrases ce que valide ce badge.
            </p>
            {errors.description ? (
              <p id="error-description" className="text-sm text-destructive">
                {errors.description}
              </p>
            ) : null}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-slate-900">Formation obligatoire avant de postuler</Label>
                <p className="text-sm text-muted-foreground">
                  Activez si l’apprenant doit suivre une formation avant d’envoyer une preuve.
                </p>
              </div>
              <Switch
                checked={requiresEnrollment}
                onCheckedChange={(checked) => {
                  setRequiresEnrollment(checked);
                  if (!checked) {
                    setRequiredCourseId(null);
                  } else {
                    setVisibleInLearnerDashboard(false);
                  }
                }}
              />
            </div>
            {requiresEnrollment ? (
              <div className="mt-4 space-y-2">
                <Label className="text-slate-900">Formation requise</Label>
                <Select
                  value={requiredCourseId ?? ""}
                  onValueChange={(value) => {
                    setRequiredCourseId(value);
                    clearFieldError("requiredCourseId");
                  }}
                >
                  <SelectTrigger
                    id="field-requiredCourseId"
                    className={`border-slate-300 bg-white text-slate-900 ${
                      errors.requiredCourseId ? "border-destructive" : ""
                    }`}
                    aria-invalid={Boolean(errors.requiredCourseId)}
                    aria-describedby={errors.requiredCourseId ? "error-requiredCourseId" : undefined}
                  >
                    <SelectValue placeholder="Sélectionner une formation" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  L’apprenant doit être inscrit à cette formation avant de postuler.
                </p>
                {errors.requiredCourseId ? (
                  <p id="error-requiredCourseId" className="text-sm text-destructive">
                    {errors.requiredCourseId}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                <div>
                  <Label className="text-slate-900">Visible dans le dashboard apprenant</Label>
                  <p className="text-sm text-muted-foreground">
                    Affiche le badge sur l&apos;accueil apprenant avec la pastille « Disponible pour
                    vous ».
                  </p>
                </div>
                <Switch
                  checked={visibleInLearnerDashboard}
                  onCheckedChange={setVisibleInLearnerDashboard}
                />
              </div>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <Label className="text-slate-900">Formation à proposer si échec</Label>
              <Select
                value={failureRemediationCourseId ?? "__none__"}
                onValueChange={(value) => {
                  setFailureRemediationCourseId(value === "__none__" ? null : value);
                }}
              >
                <SelectTrigger
                  id="field-failureRemediationCourseId"
                  className="border-slate-300 bg-white text-slate-900"
                >
                  <SelectValue placeholder="Aucune (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucune</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Affichée sur l&apos;écran de résultat en cas d&apos;échec. Distincte de la formation
                obligatoire avant de postuler.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-900">Image du badge</Label>
            <div className="flex items-center gap-3">
              <Input
                id="field-imageUrl"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className={`border-slate-300 bg-white text-slate-900 ${
                  errors.imageUrl ? "border-destructive" : ""
                }`}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setUploadFile(file);
                    handleImageUpload(file);
                  }
                }}
                disabled={!organizationId || imageUploading}
                aria-invalid={Boolean(errors.imageUrl)}
                aria-describedby={errors.imageUrl ? "error-imageUrl" : undefined}
              />
              {imageUploading ? <Badge>Upload...</Badge> : null}
            </div>
            {process.env.NODE_ENV !== "production" ? (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImageDryRun}
                  disabled={!uploadFile || imageUploading}
                >
                  Tester l’upload
                </Button>
              </div>
            ) : null}
            {imageUrl ? (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>URL:</span>
                <Link href={imageUrl} className="underline" target="_blank">
                  {imageUrl}
                </Link>
              </div>
            ) : null}
            <p className="text-sm text-muted-foreground">
              L’image officielle du badge (PNG ou SVG). Elle servira de “recto”.
            </p>
            {errors.imageUrl ? (
              <p id="error-imageUrl" className="text-sm text-destructive">
                {errors.imageUrl}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-900">Lien public des critères (auto)</Label>
            <Input
              className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
              value={criteriaUrlDisplay}
              readOnly
              placeholder="Sera disponible après création"
            />
            <p className="text-sm text-muted-foreground">
              Ce lien est généré automatiquement. Il sert à la vérification externe (wallets).
              En local, l’URL affiche{" "}
              <span className="font-mono text-xs">{getBaseUrl().replace(/\/$/, "")}</span> ; en
              production, définissez <span className="font-mono text-xs">NEXT_PUBLIC_BASE_URL</span>{" "}
              (ex. https://edgebs.fr) pour obtenir le domaine public.
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-900">Critères (en texte)</Label>
            <Textarea
              id="field-criteria"
              className={`border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 ${
                errors.criteria ? "border-destructive" : ""
              }`}
              value={criteriaMarkdown}
              onChange={(event) => {
                setCriteriaMarkdown(event.target.value);
                clearFieldError("criteria");
              }}
              rows={4}
              placeholder="Décrivez les critères en langage simple."
              aria-invalid={Boolean(errors.criteria)}
              aria-describedby={errors.criteria ? "error-criteria" : undefined}
            />
            <p className="text-sm text-muted-foreground">
              Décrivez ce qu’il faut faire pour obtenir le badge, en langage simple.
            </p>
            {errors.criteria ? (
              <p id="error-criteria" className="text-sm text-destructive">
                {errors.criteria}
              </p>
            ) : null}
          </div>
          {createdAt ? (
            <div className="text-xs text-slate-500">Créé le: {new Date(createdAt).toLocaleString()}</div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Critères détaillés (optionnel)</CardTitle>
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
                Personne chargée de valider les preuves (table validators).
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
            <Label className="text-slate-900">Qui valide la recevabilité ?</Label>
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

      <Card className="border border-zinc-700 bg-zinc-800 shadow-lg text-zinc-100">
        <CardHeader className="border-b border-zinc-700/80 pb-4">
          <CardTitle className="text-lg font-semibold text-white">
            Aperçu (informations du badge)
          </CardTitle>
          <p className="text-sm text-zinc-400">
            Résumé du verso du badge tel qu&apos;il sera présenté.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pt-6 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Nom du badge</p>
            <p className="text-base font-semibold text-white">{name.trim() || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Niveau</p>
            <p className="text-white">{level ? `Niveau ${level}` : "—"}</p>
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
              Méthodes d&apos;évaluation (certification)
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

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => saveBadge("DRAFT")} disabled={loading || imageUploading}>
          Enregistrer (brouillon)
        </Button>
        <Button
          variant="secondary"
          onClick={() => saveBadge("ACTIVE")}
          disabled={loading || imageUploading || status === "ACTIVE"}
        >
          {status === "ACTIVE" ? "Publié" : "Publier"}
        </Button>
        <Button
          variant="outline"
          onClick={() => saveBadge("ARCHIVED")}
          disabled={loading || imageUploading}
        >
          Archiver
        </Button>
      </div>
    </div>
  );
}
