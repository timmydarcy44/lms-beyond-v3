"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
import { getBaseUrl } from "@/lib/openbadges/urls";

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

type BadgeCriteriaInput = {
  id: string;
  label: string;
  description?: string | null;
  sortOrder: number;
};

type ReceivabilityInput = {
  expectedModalities: string;
  aiEvaluationPrompt: string;
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
  receivabilityReviewMode?: "HUMAN" | "AI" | "MIXED";
  createdAt: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
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

export function BadgeClassForm({
  auth,
  badgeClassId,
}: {
  auth: AuthHeaders;
  badgeClassId?: string;
}) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [criteriaUrl, setCriteriaUrl] = useState("");
  const [criteriaMarkdown, setCriteriaMarkdown] = useState("");
  const [criteria, setCriteria] = useState<BadgeCriteriaInput[]>([emptyCriteria()]);
  const [expectedModalities, setExpectedModalities] = useState("");
  const [aiEvaluationPrompt, setAiEvaluationPrompt] = useState("");
  const [status, setStatus] = useState<BadgeClassRecord["status"]>("DRAFT");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [requiresEnrollment, setRequiresEnrollment] = useState(false);
  const [requiredCourseId, setRequiredCourseId] = useState<string | null>(null);
  const [receivabilityReviewMode, setReceivabilityReviewMode] = useState<"HUMAN" | "AI" | "MIXED">("HUMAN");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const previousOrgId = useRef<string | null>(null);

  useEffect(() => {
    const loadOrganizations = async () => {
      const res = await fetch("/api/super-admin/organizations");
      const json = await res.json();
      setOrganizations(json.organizations ?? []);
    };
    loadOrganizations();
  }, []);


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
    if (!badgeClassId || !organizationId) return;
    const loadBadge = async () => {
      const res = await fetch(`/api/admin/badgeclasses/${badgeClassId}`, {
        headers: createHeaders(auth, organizationId),
      });
      if (!res.ok) {
        toast.error("Impossible de charger le badge");
        return;
      }
      const json = await res.json();
      const badge: BadgeClassRecord = json.badgeClass;
      setOrganizationId(badge.orgId);
      setName(badge.name);
      setDescription(badge.description);
      setImageUrl(badge.imageUrl ?? badge.imageTemplateUrl);
      setCriteriaUrl(badge.criteriaUrl ?? "");
      setCriteriaMarkdown(badge.criteriaMarkdown ?? "");
      setCriteria(badge.criteria.length ? badge.criteria : [emptyCriteria()]);
      setExpectedModalities(badge.receivability?.expectedModalities ?? "");
      setAiEvaluationPrompt(badge.receivability?.aiEvaluationPrompt ?? "");
      setReceivabilityReviewMode(badge.receivabilityReviewMode ?? "HUMAN");
      setStatus(badge.status);
      setCreatedAt(badge.createdAt);
      setRequiresEnrollment(Boolean(badge.requiresEnrollment));
      setRequiredCourseId(badge.requiredCourseId ?? null);
    };
    loadBadge();
  }, [badgeClassId, organizationId, auth]);

  const handleOrganizationChange = (nextOrgId: string) => {
    setOrganizationId(nextOrgId);
    setErrors({});
    setName("");
    setDescription("");
    setImageUrl("");
    setCriteriaUrl("");
    setCriteriaMarkdown("");
    setCriteria([emptyCriteria()]);
    setExpectedModalities("");
    setAiEvaluationPrompt("");
    setReceivabilityReviewMode("HUMAN");
    setStatus("DRAFT");
    setCreatedAt(null);
    setRequiresEnrollment(false);
    setRequiredCourseId(null);
    setUploadFile(null);
  };

  useEffect(() => {
    if (!organizationId) return;
    if (previousOrgId.current && previousOrgId.current !== organizationId) {
      setName("");
      setDescription("");
      setImageUrl("");
      setCriteriaUrl("");
      setCriteriaMarkdown("");
      setCriteria([emptyCriteria()]);
      setExpectedModalities("");
      setAiEvaluationPrompt("");
      setReceivabilityReviewMode("HUMAN");
      setRequiresEnrollment(false);
      setRequiredCourseId(null);
      setErrors({});
      setUploadFile(null);
    }
    previousOrgId.current = organizationId;
  }, [organizationId]);

  useEffect(() => {
    if (receivabilityReviewMode !== "HUMAN") return;
    setErrors((prev) => {
      if (!prev.aiEvaluationPrompt) return prev;
      const next = { ...prev };
      delete next.aiEvaluationPrompt;
      return next;
    });
  }, [receivabilityReviewMode]);

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
      expectedModalities,
      aiEvaluationPrompt,
    },
    receivabilityReviewMode,
    status: nextStatus ?? status,
    requiresEnrollment,
    requiredCourseId: requiresEnrollment ? requiredCourseId : null,
  });

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedCriteriaMarkdown = criteriaMarkdown.trim();
    const hasCriteriaLabel = criteria.some((item) => item.label.trim().length > 0);
    const trimmedExpectedModalities = expectedModalities.trim();
    const trimmedPrompt = aiEvaluationPrompt.trim();

    if (!organizationId) nextErrors.organizationId = "Organisation requise.";
    if (!trimmedName) nextErrors.name = "Nom requis.";
    if (!trimmedDescription) nextErrors.description = "Description requise.";
    if (!trimmedCriteriaMarkdown && !hasCriteriaLabel) {
      nextErrors.criteria = "Ajoutez au moins un critère.";
    }
    if (!imageUrl) nextErrors.imageUrl = "Image requise.";
    if (!trimmedExpectedModalities) nextErrors.expectedModalities = "Modalités requises.";
    if (
      (receivabilityReviewMode === "AI" || receivabilityReviewMode === "MIXED")
      && trimmedPrompt.length === 0
    ) {
      nextErrors.aiEvaluationPrompt = "Prompt IA requis.";
    }
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
        expectedModalities: "Recevabilité",
        aiEvaluationPrompt: "Prompt IA",
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
        "expectedModalities",
        "aiEvaluationPrompt",
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
          setErrors((prev) => ({ ...prev, aiEvaluationPrompt: "Prompt IA requis." }));
          toast.error("Prompt IA requis.");
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
      toast.success("Badge enregistré");
      if (nextStatus && badgeClassId) {
        await fetch(`/api/admin/badgeclasses/${badgeClassId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...createHeaders(auth, organizationId) },
          body: JSON.stringify({ status: nextStatus }),
        });
        setStatus(nextStatus);
      }
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
                      {org.name}
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
                  {organizations.find((org) => org.id === organizationId)?.name ?? "—"}
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
            ) : null}
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
            <div key={criterion.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
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
        <CardHeader>
          <CardTitle className="text-slate-900">Recevabilité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-900">Ce que l’on attend comme preuve</Label>
            <Textarea
              id="field-expectedModalities"
              className={`border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 ${
                errors.expectedModalities ? "border-destructive" : ""
              }`}
              value={expectedModalities}
              onChange={(event) => {
                setExpectedModalities(event.target.value);
                clearFieldError("expectedModalities");
              }}
              rows={4}
              placeholder="Ex : lien vidéo, document PDF, capture, commentaire..."
              aria-invalid={Boolean(errors.expectedModalities)}
              aria-describedby={errors.expectedModalities ? "error-expectedModalities" : undefined}
            />
            <p className="text-sm text-muted-foreground">
              Exemples : lien vidéo, document PDF, capture, commentaire, etc.
            </p>
            {errors.expectedModalities ? (
              <p id="error-expectedModalities" className="text-sm text-destructive">
                {errors.expectedModalities}
              </p>
            ) : null}
          </div>
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
                <SelectItem value="AI">IA</SelectItem>
                <SelectItem value="MIXED">IA + humain</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Indiquez qui valide la recevabilité des preuves.
            </p>
          </div>
          {receivabilityReviewMode === "HUMAN" ? (
            <p className="text-sm text-muted-foreground">
              L’évaluateur se base sur les preuves et les modalités attendues.
            </p>
          ) : (
            <div className="space-y-2">
              <Label className="text-slate-900">
                Consignes pour l’IA (évaluation) <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="field-aiEvaluationPrompt"
                className={`border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 ${
                  errors.aiEvaluationPrompt ? "border-destructive" : ""
                }`}
                value={aiEvaluationPrompt}
                onChange={(event) => {
                  setAiEvaluationPrompt(event.target.value);
                  clearFieldError("aiEvaluationPrompt");
                }}
                rows={6}
                placeholder="Expliquez à l’IA comment vérifier la preuve."
                aria-invalid={Boolean(errors.aiEvaluationPrompt)}
                aria-describedby={errors.aiEvaluationPrompt ? "error-aiEvaluationPrompt" : undefined}
              />
              <p className="text-sm text-muted-foreground">
                Expliquez à l’IA comment vérifier la preuve (score, critères, points à contrôler).
              </p>
              {errors.aiEvaluationPrompt ? (
                <p id="error-aiEvaluationPrompt" className="text-sm text-destructive">
                  {errors.aiEvaluationPrompt}
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Aperçu (informations du badge)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p className="text-sm text-muted-foreground">
            Résumé de ce qui sera visible en “verso” : émetteur, critères, etc.
          </p>
          <div>Status: <Badge>{status}</Badge></div>
          <div>
            Issuer: {organizations.find((org) => org.id === organizationId)?.name ?? "—"}
          </div>
          {hostedBadgeUrl ? (
            <div>
              JSON-LD:{" "}
              <Link href={hostedBadgeUrl} className="underline" target="_blank">
                {hostedBadgeUrl}
              </Link>
            </div>
          ) : null}
          {criteriaMarkdown ? <div>Criteria narrative: {criteriaMarkdown}</div> : null}
          {criteria.length ? (
            <div className="space-y-1">
              <div className="font-semibold">Critères</div>
              <ul className="list-disc pl-4">
                {criteria.map((criterion) => (
                  <li key={criterion.id}>{criterion.label}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => saveBadge("DRAFT")} disabled={loading}>
          Enregistrer (brouillon)
        </Button>
        <Button variant="secondary" onClick={() => saveBadge("ACTIVE")} disabled={loading}>
          Publier
        </Button>
        <Button variant="outline" onClick={() => saveBadge("ARCHIVED")} disabled={loading}>
          Archiver
        </Button>
      </div>
    </div>
  );
}
