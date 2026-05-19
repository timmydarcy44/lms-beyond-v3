"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CourseBuilderWorkspace } from "@/components/formateur/course-builder/course-builder-workspace";
import { BadgeCreatorOverlay } from "@/components/studio/badge-creator-overlay";
import type { OpenBadgeSavePayload } from "@/components/super-admin/open-badge-types";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import type { CourseBuilderSnapshot } from "@/types/course-builder";
import { COURSE_LEVEL_BUILDER_OPTIONS } from "@/lib/course-level-options";
import { COURSE_TOOL_OPTIONS, normalizeCourseTools } from "@/lib/course-tools";
import {
  getEdgeLabThematicBuilderOptions,
  isExactEdgeLabLabel,
  resolveThematicSelectValue,
  shouldUseEdgeLabThematicList,
  tryMatchEdgeLabCategoryName,
} from "@/lib/edge-lab-course-categories";
import {
  getPlaymakersThematicBuilderOptions,
  isExactPlaymakersLabel,
  shouldUsePlaymakersThematicList,
  tryMatchPlaymakersCategoryName,
} from "@/lib/playmakers-course-categories";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type OpenBadgeRow = {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  image_url?: string | null;
  issuer?: string | null;
};

function isCoverVideoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const u = url.trim().toLowerCase();
  if (u.startsWith("data:video/")) return true;
  let path: string;
  try {
    path = new URL(u).pathname.toLowerCase();
  } catch {
    path = u;
  }
  return path.endsWith(".mp4");
}

type ProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
};

type ValidatorRow = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

/** ~120 ko de base64 dans le JSON suffisent déjà à alourdir fortement la requête. */
const MAX_BASE64_COVER_CHARS = 120_000;

/**
 * Clone JSON-safe (rejette références circulaires) et retire les data-URL géantes
 * (couverture uploadée en base64) pour éviter timeout / 500 côté API.
 */
function prepareSnapshotForSaveApi(snapshot: CourseBuilderSnapshot): CourseBuilderSnapshot {
  let copy: CourseBuilderSnapshot;
  try {
    copy = JSON.parse(JSON.stringify(snapshot)) as CourseBuilderSnapshot;
  } catch {
    throw new Error("Snapshot invalide : contenu non sérialisable (références circulaires ?).");
  }

  const stripHugeDataUrl = (value: string | undefined | null): string | null | undefined => {
    if (typeof value !== "string") return value ?? undefined;
    if (value.startsWith("data:") && value.length > MAX_BASE64_COVER_CHARS) return null;
    return value;
  };

  const hadHugeCover =
    typeof snapshot.general.cover_image === "string" &&
    snapshot.general.cover_image.startsWith("data:") &&
    snapshot.general.cover_image.length > MAX_BASE64_COVER_CHARS;
  const hadHugeHero =
    typeof snapshot.general.heroImage === "string" &&
    snapshot.general.heroImage.startsWith("data:") &&
    snapshot.general.heroImage.length > MAX_BASE64_COVER_CHARS;

  const nextCover = stripHugeDataUrl(copy.general.cover_image ?? null);
  const nextHero = stripHugeDataUrl(copy.general.heroImage ?? null);
  copy.general = {
    ...copy.general,
    cover_image: nextCover === null ? undefined : nextCover,
    heroImage: nextHero === null ? "" : (nextHero ?? copy.general.heroImage),
  };

  if (hadHugeCover || hadHugeHero) {
    toast.warning("Couverture trop lourde pour l’enregistrement", {
      description:
        "L’image base64 a été retirée du snapshot envoyé au serveur. Utilisez une URL (https://…) ou un upload vers le stockage pour conserver la couverture.",
    });
  }

  return copy;
}

export function FormateurFormationBuilderWhite({ initialCourseId }: { initialCourseId?: string }) {
  const router = useRouter();
  const updateGeneral = useCourseBuilder((s) => s.updateGeneral);
  const snapshot = useCourseBuilder((s) => s.snapshot);
  const hydrateFromSnapshot = useCourseBuilder((s) => s.hydrateFromSnapshot);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const isTimmy = String(userEmail ?? "").trim().toLowerCase() === "timmydarcy44@gmail.com";

  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; slug?: string }>>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [thematics, setThematics] = useState<Array<{ id: string; name: string }> | null>(null);
  const [thematicSourceSlug, setThematicSourceSlug] = useState<string | null>(null);
  const [availablePaths, setAvailablePaths] = useState<Array<{ id: string; title: string; status?: string | null }>>([]);
  const [availablePathsLoading, setAvailablePathsLoading] = useState(false);

  const [openBadges, setOpenBadges] = useState<OpenBadgeRow[]>([]);
  const [openBadgesLoading, setOpenBadgesLoading] = useState(false);
  const [selectedOpenBadgeId, setSelectedOpenBadgeId] = useState<string>("none");
  const [isCreateBadgeOpen, setIsCreateBadgeOpen] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [instructors, setInstructors] = useState<ProfileRow[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(false);

  const [validators, setValidators] = useState<ValidatorRow[]>([]);
  const [validatorsLoading, setValidatorsLoading] = useState(false);
  const [createValidatorOpen, setCreateValidatorOpen] = useState(false);
  const [createValidatorFirstName, setCreateValidatorFirstName] = useState("");
  const [createValidatorLastName, setCreateValidatorLastName] = useState("");
  const [createValidatorDescription, setCreateValidatorDescription] = useState("");
  const [createValidatorPhotoUrl, setCreateValidatorPhotoUrl] = useState("");
  const [createValidatorSubmitting, setCreateValidatorSubmitting] = useState(false);

  const [isBeyondIAOpen, setIsBeyondIAOpen] = useState(false);
  const [iaPrompt, setIaPrompt] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isPersisting, setIsPersisting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);
  const [successOverlayStatus, setSuccessOverlayStatus] = useState<"draft" | "published">("draft");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);

  const badgeById = useMemo(() => {
    const map = new Map<string, OpenBadgeRow>();
    openBadges.forEach((b) => map.set(String(b.id), b));
    return map;
  }, [openBadges]);

  const selectedTools = useMemo(() => normalizeCourseTools(snapshot.general.tools), [snapshot.general.tools]);
  const toolsSummary = selectedTools.length
    ? `${selectedTools.length} outil${selectedTools.length > 1 ? "s" : ""}`
    : "—";

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (ignore) return;
        setUserEmail(data?.user?.email ?? null);
      } catch {
        if (ignore) return;
        setUserEmail(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (organizationsLoading || organizations.length) return;
    setOrganizationsLoading(true);
    fetch("/api/formateur/organizations", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          console.warn("[formations/new] /api/formateur/organizations HTTP", r.status);
          return { organizations: [] };
        }
        return r.json();
      })
      .then((data) => {
        const list = Array.isArray(data?.organizations) ? data.organizations : [];
        setOrganizations(list);
      })
      .catch(() => setOrganizations([]))
      .finally(() => setOrganizationsLoading(false));
  }, [organizations.length, organizationsLoading]);

  useEffect(() => {
    let cancelled = false;
    const orgId = String((snapshot.general as any)?.assigned_organization_id ?? "").trim();
    // Sync : vider + recharger dès que la galaxie change.
    setThematics(null);
    setThematicSourceSlug(null);
    if (!orgId) {
      setThematics([]);
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const res = await fetch(`/api/course-categories?orgId=${encodeURIComponent(orgId)}`, {
          credentials: "include",
        });
        const json = (await res.json().catch(() => ({}))) as {
          categories?: unknown;
          organizationSlug?: string | null;
        };
        const list = Array.isArray(json?.categories) ? json.categories : [];
        const fromApi = String(json.organizationSlug ?? "").trim();
        const fromOrgList = String(organizations.find((o) => o.id === orgId)?.slug ?? "").trim();
        const orgSlug = (fromApi || fromOrgList) || null;
        const useEdge = shouldUseEdgeLabThematicList(orgSlug);
        const usePlaymakers = shouldUsePlaymakersThematicList(orgSlug);
        const cleaned: Array<{ id: string; name: string }> = list
          .map((x: unknown) => {
            if (x && typeof x === "object" && "id" in (x as object) && "name" in (x as object)) {
              const o = x as { id: unknown; name: unknown };
              return { id: String(o.id ?? "").trim(), name: String(o.name ?? "").trim() };
            }
            if (typeof x === "string" && x.trim()) {
              return { id: "", name: x.trim() };
            }
            return null;
          })
          .filter((x): x is { id: string; name: string } => Boolean(x?.name));
        const next = useEdge
          ? getEdgeLabThematicBuilderOptions()
          : usePlaymakers
            ? getPlaymakersThematicBuilderOptions()
            : cleaned;
        if (cancelled) return;
        setThematics(next);
        setThematicSourceSlug(orgSlug);
        if (!useEdge && !usePlaymakers) {
          const currentId = String(snapshot.general.category_id ?? "").trim();
          if (currentId && !cleaned.some((c) => c.id === currentId)) {
            updateGeneral({ category_id: null, category: "" });
          }
        }
      } catch {
        if (!cancelled) {
          setThematics([]);
          setThematicSourceSlug(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [(snapshot.general as any)?.assigned_organization_id, updateGeneral, organizations]);

  useEffect(() => {
    let cancelled = false;
    const orgId = String((snapshot.general as any)?.assigned_organization_id ?? "").trim();
    if (!orgId) {
      setAvailablePaths([]);
      return () => {
        cancelled = true;
      };
    }
    setAvailablePathsLoading(true);
    fetch(`/api/formateur/paths?orgId=${encodeURIComponent(orgId)}`, { credentials: "include" })
      .then(async (r) => {
        const json = (await r.json().catch(() => ({}))) as { paths?: unknown; error?: unknown; details?: unknown };
        if (!r.ok) {
          const msg =
            typeof json?.error === "string" && json.error.trim()
              ? json.error.trim()
              : `HTTP ${r.status}`;
          const detail =
            typeof json?.details === "string" && json.details.trim()
              ? json.details.trim()
              : "";
          throw new Error(detail ? `${msg} — ${detail}` : msg);
        }
        return json;
      })
      .then((json) => {
        const list = Array.isArray(json?.paths) ? json.paths : [];
        const cleaned = list
          .map((p: any) => ({
            id: String(p?.id ?? "").trim(),
            title: String(p?.title ?? "").trim(),
            status: p?.status ? String(p.status) : null,
          }))
          .filter((p: any) => p.id && p.title);
        if (cancelled) return;
        setAvailablePaths(cleaned);
        if (!cleaned.length) {
          toast.message("Aucun parcours listé pour cette galaxie", {
            description:
              "Soit il n’existe pas encore de parcours `org_id`, soit les politiques RLS ne renvoient rien pour votre compte.",
          });
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setAvailablePaths([]);
        const msg = e instanceof Error ? e.message : "Impossible de charger les parcours";
        toast.error("Parcours introuvables", { description: msg });
      })
      .finally(() => {
        if (cancelled) return;
        setAvailablePathsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [(snapshot.general as any)?.assigned_organization_id]);

  useEffect(() => {
    if (!thematics?.length) return;
    if (!thematicSourceSlug || !shouldUseEdgeLabThematicList(thematicSourceSlug)) return;
    const raw = String(snapshot.general.category ?? "").trim();
    if (raw) {
      const canon = tryMatchEdgeLabCategoryName(raw) ?? (isExactEdgeLabLabel(raw) ? raw : null);
      if (!canon) {
        updateGeneral({ category_id: null, category: "" });
        return;
      }
      const opt = getEdgeLabThematicBuilderOptions().find((c) => c.name === canon);
      if (opt) {
        const id = String(snapshot.general.category_id ?? "").trim();
        if (String(snapshot.general.category) !== canon || id !== opt.id) {
          updateGeneral({ category: canon, category_id: opt.id });
        }
      }
    }
  }, [thematics, thematicSourceSlug, snapshot.general.category, snapshot.general.category_id, updateGeneral]);

  useEffect(() => {
    if (!thematics?.length) return;
    if (!thematicSourceSlug || !shouldUsePlaymakersThematicList(thematicSourceSlug)) return;
    const raw = String(snapshot.general.category ?? "").trim();
    if (raw) {
      const canon = tryMatchPlaymakersCategoryName(raw) ?? (isExactPlaymakersLabel(raw) ? raw : null);
      if (!canon) {
        updateGeneral({ category_id: null, category: "" });
        return;
      }
      const opt = getPlaymakersThematicBuilderOptions().find((c) => c.name === canon);
      if (opt) {
        const id = String(snapshot.general.category_id ?? "").trim();
        if (String(snapshot.general.category) !== canon || id !== opt.id) {
          updateGeneral({ category: canon, category_id: opt.id });
        }
      }
    }
  }, [thematics, thematicSourceSlug, snapshot.general.category, snapshot.general.category_id, updateGeneral]);

  useEffect(() => {
    if (!thematics?.length) return;
    if (
      thematicSourceSlug &&
      (shouldUseEdgeLabThematicList(thematicSourceSlug) ||
        shouldUsePlaymakersThematicList(thematicSourceSlug))
    ) {
      return;
    }
    const id = String(snapshot.general.category_id ?? "").trim();
    const name = String(snapshot.general.category ?? "").trim();
    if (id) return;
    if (!name) return;
    const found = thematics.find((c) => c.id && c.name === name);
    if (found) updateGeneral({ category_id: found.id });
  }, [thematics, snapshot.general.category, snapshot.general.category_id, thematicSourceSlug, updateGeneral]);

  const generatePresentationWithIA = async () => {
    const objectifs = (snapshot.general.objectifs ?? []).map((x) => String(x ?? "").trim()).filter(Boolean);
    const chapterTitles = (snapshot.sections ?? [])
      .map((s: any) => String(s?.title ?? "").trim())
      .filter(Boolean);

    setIsGeneratingPresentation(true);
    try {
      // Simulation locale (remplaçable par un call API plus tard)
      const focus = objectifs.slice(0, 4).join(", ");
      const chapters = chapterTitles.slice(0, 6).join(", ");
      const base =
        `Cette formation vous plonge dans une expérience concrète, structurée et orientée résultats. ` +
        `Vous allez progresser autour d’objectifs clairs (${focus || "développer des compétences clés"}) ` +
        `à travers une progression en séquences courtes et actionnables. ` +
        `Au fil des chapitres (${chapters || "un parcours complet en plusieurs étapes"}), ` +
        `vous alternerez apports essentiels, mises en situation et outils directement réutilisables au quotidien.`;

      const closing =
        `À l’issue du parcours, vous saurez appliquer des méthodes simples, mesurer vos progrès, ` +
        `et gagner en confiance pour passer à l’action immédiatement.`;

      const presentation = `${base}\n\n${closing}`.trim();
      updateGeneral({ presentation });
    } finally {
      setIsGeneratingPresentation(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setOpenBadgesLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("open_badges")
          .select("*");
        if (ignore) return;
        if (error) {
          console.warn("[open_badges] fetch failed", error);
          setOpenBadges([]);
          return;
        }
        const rows = ((data ?? []) as any[]).filter((row) => Boolean(row?.id));
        // Tri côté client: certaines colonnes peuvent varier, on prend title > name > id
        rows.sort((a, b) => {
          const la = String(a?.title ?? a?.name ?? a?.id ?? "");
          const lb = String(b?.title ?? b?.name ?? b?.id ?? "");
          return la.localeCompare(lb, "fr", { sensitivity: "base" });
        });
        setOpenBadges(rows as OpenBadgeRow[]);
      } finally {
        if (!ignore) setOpenBadgesLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setInstructorsLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.from("profiles").select("*");
        if (ignore) return;
        if (error) {
          console.warn("[profiles] fetch failed", error);
          setInstructors([]);
          return;
        }
        const rows = ((data ?? []) as any[])
          .filter((p) => Boolean(p?.id))
          .map((p) => ({
            id: String(p.id),
            email: p.email ?? null,
            full_name: p.full_name ?? p.display_name ?? null,
            role: p.role ?? null,
          })) as ProfileRow[];

        // Filtrer si possible : on ne garde que les rôles formateur/instructor.
        const filtered = rows.filter((p) => {
          const r = String(p.role ?? "").toLowerCase();
          return r === "instructor" || r === "formateur";
        });
        setInstructors(filtered.length > 0 ? filtered : rows);
      } finally {
        if (!ignore) setInstructorsLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setValidatorsLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.from("validators").select("*");
        if (ignore) return;
        if (error) {
          console.warn("[validators] fetch failed", error);
          setValidators([]);
          return;
        }
        const rows = ((data ?? []) as any[])
          .filter((r) => Boolean(r?.id))
          .map((r) => {
            const first = String(r?.first_name ?? "").trim();
            const last = String(r?.last_name ?? "").trim();
            const derived = `${first} ${last}`.trim();
            const name =
              String(r?.full_name ?? r?.display_name ?? r?.name ?? derived ?? r?.email ?? r?.id ?? "").trim() ||
              String(r?.id);
            const avatarUrl = String(r?.photo_url ?? "").trim() || null;
            return {
              id: String(r.id),
              name,
              avatarUrl,
            } satisfies ValidatorRow;
          }) as ValidatorRow[];

        rows.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
        setValidators(rows);
      } finally {
        if (!ignore) setValidatorsLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, []);

  const refreshValidators = async (): Promise<ValidatorRow[]> => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.from("validators").select("*");
    if (error) throw error;
    const rows = ((data ?? []) as any[])
      .filter((r) => Boolean(r?.id))
      .map((r) => {
        const first = String(r?.first_name ?? "").trim();
        const last = String(r?.last_name ?? "").trim();
        const derived = `${first} ${last}`.trim();
        const name =
          String(r?.full_name ?? r?.display_name ?? r?.name ?? derived ?? r?.email ?? r?.id ?? "").trim() ||
          String(r?.id);
            const avatarUrl = String(r?.photo_url ?? "").trim() || null;
        return {
          id: String(r.id),
          name,
          avatarUrl,
        } satisfies ValidatorRow;
      }) as ValidatorRow[];
    rows.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
    setValidators(rows);
    return rows;
  };

  const selectedBadge = selectedOpenBadgeId !== "none" ? badgeById.get(selectedOpenBadgeId) : null;

  useEffect(() => {
    if (!selectedBadge) return;
    updateGeneral({
      badgeLabel: selectedBadge.title ?? selectedBadge.name ?? "Open Badge",
      badgeDescription: selectedBadge.description ?? "",
      badgeImage: selectedBadge.image_url ?? undefined,
    });
  }, [selectedBadge, updateGeneral]);

  useEffect(() => {
    if (!initialCourseId) return;
    let ignore = false;

    const run = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("courses")
          .select("id, builder_snapshot, level, validated_by_peer_id, category_id, category, category_name")
          .eq("id", initialCourseId)
          .maybeSingle();

        if (ignore) return;
        if (error || !data) {
          console.warn("[builder] unable to load course for edit", { initialCourseId, error });
          return;
        }

        setCourseId(String(data.id));
        if (data.builder_snapshot && typeof data.builder_snapshot === "object") {
          const raw = data.builder_snapshot as CourseBuilderSnapshot;
          const levelFromDb =
            typeof (data as { level?: unknown }).level === "string"
              ? String((data as { level: string }).level).trim()
              : "";
          const validatorFromDb =
            typeof (data as { validated_by_peer_id?: unknown }).validated_by_peer_id === "string"
              ? String((data as { validated_by_peer_id: string }).validated_by_peer_id).trim()
              : "";
          const catIdFromDb =
            typeof (data as { category_id?: unknown }).category_id === "string"
              ? String((data as { category_id: string }).category_id).trim()
              : "";
          const catNameFromDb =
            String((data as { category_name?: unknown }).category_name ?? "").trim() ||
            String((data as { category?: unknown }).category ?? "").trim();
          const snap: CourseBuilderSnapshot = {
            ...raw,
            general: {
              ...raw.general,
              ...(levelFromDb ? { level: levelFromDb } : {}),
              ...(validatorFromDb ? { validated_by_peer_id: validatorFromDb } : {}),
              ...(catIdFromDb ? { category_id: catIdFromDb } : {}),
              ...(catNameFromDb ? { category: catNameFromDb } : {}),
            },
          };
          hydrateFromSnapshot(snap);
        }
      } catch (e) {
        if (!ignore) {
          console.warn("[builder] edit hydration failed", e);
        }
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [hydrateFromSnapshot, initialCourseId]);

  const handleGenerateWithBeyondIA = () => {
    const latestSnapshot = useCourseBuilder.getState().snapshot;
    if (!latestSnapshot.general.title?.trim()) {
      toast.error("Titre requis", {
        description: "Saisissez d'abord un titre avant de générer la structure.",
      });
      return;
    }
    if (!iaPrompt.trim() || iaPrompt.trim().length < 10) {
      toast.error("Prompt trop court", {
        description: "Décrivez la structure attendue (au moins 10 caractères).",
      });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/beyond-ia/generate-course-structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: latestSnapshot.general.title.trim(),
            prompt: iaPrompt.trim(),
            openBadgeId: selectedOpenBadgeId !== "none" ? selectedOpenBadgeId : null,
          }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Erreur lors de la génération Beyond IA");
        }

        const objectifs = Array.isArray(data?.structure?.objectifs) ? data.structure.objectifs : [];
        if (objectifs.length) {
          const safe = objectifs
            .map((x: any) => String(x ?? "").trim())
            .filter((x: string) => x.length > 0)
            .slice(0, 12);
          if (safe.length) {
            updateGeneral({
              objectifs: safe,
            });
          }
        }

        const sections = Array.isArray(data?.structure?.sections) ? data.structure.sections : [];
        if (!sections.length) {
          throw new Error("Aucune section générée.");
        }

        hydrateFromSnapshot({
          ...latestSnapshot,
          sections: sections.map((section: any, sectionIndex: number) => ({
            id: `section-${Date.now()}-${sectionIndex}`,
            title: String(section.title ?? `Section ${sectionIndex + 1}`),
            description: String(section.description ?? ""),
            chapters: Array.isArray(section.chapters)
              ? section.chapters.map((chapter: any, chapterIndex: number) => ({
                  id: `chapter-${Date.now()}-${sectionIndex}-${chapterIndex}`,
                  title: String(chapter.title ?? `Chapitre ${chapterIndex + 1}`),
                  duration: "",
                  type: "text" as const,
                  summary: String(chapter.summary ?? ""),
                  content: "",
                  // Accept both formats:
                  // - legacy: subchapters: [{title, ...}]
                  // - required schema: subChapters: string[]
                  subchapters: Array.isArray(chapter.subchapters)
                    ? chapter.subchapters.map((sub: any, subIndex: number) => ({
                        id: `subchapter-${Date.now()}-${sectionIndex}-${chapterIndex}-${subIndex}`,
                        title: String(sub.title ?? `Sous-chapitre ${subIndex + 1}`),
                        duration: "",
                        type: "text" as const,
                        summary: String(sub.summary ?? ""),
                        content: String(sub.content ?? ""),
                      }))
                    : Array.isArray(chapter.subChapters)
                      ? chapter.subChapters.map((title: any, subIndex: number) => ({
                          id: `subchapter-${Date.now()}-${sectionIndex}-${chapterIndex}-${subIndex}`,
                          title: String(title ?? `Sous-chapitre ${subIndex + 1}`),
                          duration: "",
                          type: "text" as const,
                          summary: "",
                          content: "",
                        }))
                      : [],
                }))
              : [],
          })),
        });

        toast.success("Structure générée", {
          description: "La structure a été injectée dans le builder. Vous pouvez réorganiser et enrichir.",
        });
        setIsBeyondIAOpen(false);
      } catch (e) {
        toast.error("Beyond IA", {
          description: e instanceof Error ? e.message : "Impossible de générer la structure.",
        });
      }
    });
  };

  const handlePersistBeyondIA = async () => {
    if (!snapshot.general.title?.trim()) {
      toast.error("Titre requis", {
        description: "Saisissez un titre avant d'enregistrer.",
      });
      return;
    }
    if (Boolean((snapshot.general as any)?.parcours_only) && !String((snapshot.general as any)?.parcours_only_path_id ?? "").trim()) {
      toast.error("Parcours requis", {
        description: "Choisissez le parcours de la galaxie (Paramètres généraux) pour une formation uniquement visible dans un parcours.",
      });
      return;
    }
    setIsPersisting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const snapshotForApi = prepareSnapshotForSaveApi(snapshot);
      // Normaliser validated_by_peer_id (évite "" côté API)
      if ((snapshotForApi.general as any)?.validated_by_peer_id === "") {
        (snapshotForApi.general as any).validated_by_peer_id = null;
      }
      console.log("Payload de sauvegarde:", snapshotForApi);
      // Inclure les flashcards locales dans le payload global (best-effort)
      const flashcardsPayload = (() => {
        try {
          if (typeof window === "undefined") return [];
          const cid = String(courseId ?? "").trim();
          if (!cid) return [];
          const rows: any[] = [];
          for (let i = 0; i < localStorage.length; i += 1) {
            const k = localStorage.key(i);
            if (!k) continue;
            if (!k.startsWith(`flashcards-${cid}-`)) continue;
            const chapterKey = k.slice(`flashcards-${cid}-`.length);
            const raw = localStorage.getItem(k);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) continue;
            for (const f of parsed) {
              const front = String(f?.front ?? f?.question ?? "").trim();
              const back = String(f?.back ?? f?.answer ?? "").trim();
              if (!front || !back) continue;
              rows.push({
                id: f?.id ? String(f.id) : undefined,
                chapterId: chapterKey,
                front,
                back,
                question: front,
                answer: back,
              });
            }
          }
          return rows;
        } catch {
          return [];
        }
      })();
      const response = await fetch("/api/beyond-ia/save-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshot: snapshotForApi,
          openBadgeId: selectedOpenBadgeId !== "none" ? selectedOpenBadgeId : null,
          courseId,
          creator_id: user?.id ?? null,
          flashcards: flashcardsPayload,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        const msg =
          typeof data?.error === "string" && data.error.trim()
            ? data.error.trim()
            : `Erreur HTTP ${response.status}`;
        const detail =
          typeof data?.details === "string" && data.details.trim()
            ? data.details.trim()
            : typeof data?.message === "string" && data.message.trim()
              ? data.message.trim()
              : "";
        toast.error(detail ? `${msg} — ${detail}` : msg);
        return;
      }
      if (data?.courseId && !courseId) {
        const id = String(data.courseId);
        setCourseId(id);
        router.replace(`/dashboard/formateur/formations/${id}`);
        // On navigue → overlay inutile ici.
        toast.success("Enregistré", {
          description: data?.message || "Le cours a été sauvegardé.",
        });
        return;
      }
      // Succès : afficher l'overlay Apple-style (même pour draft) pour feedback immédiat.
      setSuccessOverlayStatus(data?.status === "published" ? "published" : "draft");
      setPublishSuccessOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Impossible d'enregistrer.";
      toast.error(msg);
    } finally {
      setIsPersisting(false);
    }
  };

  const handleBadgeCreatorSave = async (badge: OpenBadgeSavePayload) => {
    const title = badge.name.trim();
    if (!title) {
      toast.error("Titre requis", { description: "Donnez un titre à votre Open Badge." });
      throw new Error("Titre requis");
    }

    updateGeneral({
      badgeLabel: badge.name,
      badgeDescription: badge.description,
      badgeImage: badge.imageUrl || snapshot.general.badgeImage || "",
      badge_modalities_obtention: badge.modalitiesObtention,
      badge_competencies_text: badge.competenciesText,
      badge_criteria_html: badge.criteriaHtml,
      badge_modalities_keys: badge.modalitiesKeys,
      badge_oral_ia_evaluation_prompt: badge.oralIaEvaluationPrompt || undefined,
      badge_technical_json_endpoint: badge.technicalJsonEndpoint || undefined,
      badge_evaluation_type: badge.evaluationType,
      badge_quiz_test_id: badge.quizTestId || undefined,
      badge_case_prompt: badge.casePrompt || undefined,
      badge_audio_presentation_scenario: badge.audioPresentationScenario || undefined,
      badge_audio_negotiation_scenario: badge.audioNegotiationScenario || undefined,
      badge_file_upload_instructions: badge.fileUploadInstructions || undefined,
      badge_video_presentation_url: badge.videoPresentationUrl || undefined,
      badge_ai_qa_topic: badge.aiQaTopic,
    });

    const loadingId = toast.loading("Sauvegarde du badge…");
    try {
      const supabase = createSupabaseBrowserClient();
      const linkedCourseId = String(initialCourseId ?? courseId ?? "").trim() || null;
      const expectedProofs =
        badge.criteriaHtml?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "";
      const defaultAnalyzerPrompt =
        "Tu es un expert en évaluation pédagogique. Examine le livrable de l'apprenant en fonction des 'Preuves attendues' suivantes : {expected_proofs}. Si le livrable démontre l'acquisition des compétences, valide le badge. Sinon, donne 3 conseils précis pour s'améliorer.".replace(
          "{expected_proofs}",
          expectedProofs || "À préciser",
        );
      const analyzerPrompt = badge.description.trim() || defaultAnalyzerPrompt;

      const attempt1: Record<string, unknown> = {
        ...(linkedCourseId ? { course_id: linkedCourseId } : {}),
        title,
        description: badge.description.trim() || undefined,
        image_url: badge.imageUrl?.trim() ? badge.imageUrl.trim() : undefined,
        criteria: badge.criteriaHtml?.trim() ? badge.criteriaHtml.trim() : undefined,
        objectives: badge.competenciesText.trim() || undefined,
        expected_proofs: expectedProofs || undefined,
        ai_analysis_prompt: { prompt: analyzerPrompt, expected_proofs: expectedProofs || undefined },
      };

      const { data: inserted1, error: error1 } = await supabase
        .from("open_badges")
        .insert(attempt1 as never)
        .select("*")
        .single();

      let inserted = inserted1 as Record<string, unknown> | null;
      if (error1) {
        const combined = `${error1.message ?? ""} ${error1.details ?? ""} ${error1.hint ?? ""}`.toLowerCase();
        const attempt2: Record<string, unknown> = {
          ...(linkedCourseId ? { course_id: linkedCourseId } : {}),
          title,
          description:
            (badge.competenciesText.trim() ? `Objectifs:\n${badge.competenciesText.trim()}\n\n` : "") +
            (expectedProofs ? `Preuves attendues:\n${expectedProofs}\n\n` : "") +
            `Prompt analyse IA:\n${analyzerPrompt}\n`,
        };
        if (combined.includes("title") && combined.includes("column")) throw error1;

        const { data: inserted2, error: error2 } = await supabase
          .from("open_badges")
          .insert(attempt2 as never)
          .select("*")
          .single();
        if (error2) throw error2;
        inserted = inserted2 as Record<string, unknown> | null;
      }

      if (!inserted?.id) throw new Error("Open Badge créé mais ID manquant.");

      const row: OpenBadgeRow = {
        id: String(inserted.id),
        title: (inserted.title as string) ?? (inserted.name as string) ?? title,
        name: (inserted.name as string) ?? null,
        description: (inserted.description as string) ?? null,
        image_url: (inserted.image_url as string) ?? null,
        issuer: (inserted.issuer as string) ?? null,
      };

      setOpenBadges((prev) => {
        const next = [...prev, row];
        next.sort((a, b) =>
          String(a.title ?? a.name ?? a.id).localeCompare(String(b.title ?? b.name ?? b.id), "fr", {
            sensitivity: "base",
          }),
        );
        return next;
      });
      setSelectedOpenBadgeId(String(inserted.id));

      toast.dismiss(loadingId);
    } catch (e) {
      toast.dismiss(loadingId);
      toast.error("Erreur", { description: e instanceof Error ? e.message : "Impossible de créer l'Open Badge." });
      throw e;
    }
  };

  const handlePublishBeyondIA = async () => {
    if (!snapshot.general.title?.trim()) {
      toast.error("Titre requis", {
        description: "Saisissez un titre avant de publier.",
      });
      return;
    }
    if (Boolean((snapshot.general as any)?.parcours_only) && !String((snapshot.general as any)?.parcours_only_path_id ?? "").trim()) {
      toast.error("Parcours requis", {
        description: "Choisissez le parcours de la galaxie (Paramètres généraux) pour une formation uniquement visible dans un parcours.",
      });
      return;
    }
    setIsPublishing(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const snapshotForApi = prepareSnapshotForSaveApi(snapshot);
      if ((snapshotForApi.general as any)?.validated_by_peer_id === "") {
        (snapshotForApi.general as any).validated_by_peer_id = null;
      }
      console.log("Payload de sauvegarde:", snapshotForApi);
      const flashcardsPayload = (() => {
        try {
          if (typeof window === "undefined") return [];
          const cid = String(courseId ?? "").trim();
          if (!cid) return [];
          const rows: any[] = [];
          for (let i = 0; i < localStorage.length; i += 1) {
            const k = localStorage.key(i);
            if (!k) continue;
            if (!k.startsWith(`flashcards-${cid}-`)) continue;
            const chapterKey = k.slice(`flashcards-${cid}-`.length);
            const raw = localStorage.getItem(k);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) continue;
            for (const f of parsed) {
              const front = String(f?.front ?? f?.question ?? "").trim();
              const back = String(f?.back ?? f?.answer ?? "").trim();
              if (!front || !back) continue;
              rows.push({
                id: f?.id ? String(f.id) : undefined,
                chapterId: chapterKey,
                front,
                back,
                question: front,
                answer: back,
              });
            }
          }
          return rows;
        } catch {
          return [];
        }
      })();
      const response = await fetch("/api/beyond-ia/save-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshot: snapshotForApi,
          openBadgeId: selectedOpenBadgeId !== "none" ? selectedOpenBadgeId : null,
          status: "published",
          courseId,
          creator_id: user?.id ?? null,
          flashcards: flashcardsPayload,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        const msg =
          typeof data?.error === "string" && data.error.trim()
            ? data.error.trim()
            : `Erreur HTTP ${response.status}`;
        const detail =
          typeof data?.details === "string" && data.details.trim()
            ? data.details.trim()
            : typeof data?.message === "string" && data.message.trim()
              ? data.message.trim()
              : "";
        toast.error(detail ? `${msg} — ${detail}` : msg);
        return;
      }
      if (data?.courseId && !courseId) {
        setCourseId(String(data.courseId));
      }
      if (data?.status === "published") {
        setSuccessOverlayStatus("published");
        setPublishSuccessOpen(true);
      } else {
        toast.success("Publié", {
          description: "La formation est maintenant publiée.",
        });
      }
    } catch (e) {
      toast.error("Erreur", {
        description: e instanceof Error ? e.message : "Impossible de publier.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <DashboardShell
      title="Création de formation"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Formations", href: "/dashboard/formateur/formations" },
        { label: "Nouvelle formation" },
      ]}
      initialCollapsed
      forcedTheme="light"
      className="bg-white text-slate-950"
      mainClassName="bg-white px-0 pb-0 pt-0"
      hideSidebar
      hideHeader
    >
      <div className="sticky top-0 z-20 pt-4">
        <div className="mx-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] shadow-lg backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-8">
            <a
              href="/dashboard/formateur"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              ← Retour au Dashboard
            </a>
            <div className="truncate text-sm font-semibold text-white/85">
              {snapshot.general.title?.trim() ? snapshot.general.title.trim() : "Nouvelle formation"}
            </div>
            <div className="flex items-center gap-2">
              <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 w-10 rounded-full bg-white/15 p-0 text-white/90 hover:bg-white/25"
                    aria-label="Paramètres généraux"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[420px] max-w-[92vw] bg-white text-slate-950">
                  <SheetHeader className="px-6 pt-6">
                    <SheetTitle className="text-lg font-extrabold tracking-tight text-slate-950">
                      Paramètres généraux
                    </SheetTitle>
                    <SheetDescription className="text-slate-600">
                      Réglez les règles d’accès et le mode de progression.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-6 px-6 pb-8">
                    <div className="space-y-2">
                      <Label className="text-slate-950 font-bold">Dates d’accès</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Début
                          </p>
                          <Input
                            type="date"
                            value={snapshot.general.access_start_date || ""}
                            onChange={(e) => updateGeneral({ access_start_date: e.target.value || null })}
                            className="rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Fin
                          </p>
                          <Input
                            type="date"
                            value={snapshot.general.access_end_date || ""}
                            onChange={(e) => updateGeneral({ access_end_date: e.target.value || null })}
                            className="rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Laissez vide pour ne pas restreindre l’accès.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-950">Uniquement dans un parcours</p>
                        <p className="text-xs text-slate-600">
                          Masque la formation de la bibliothèque ; elle reste visible uniquement via les parcours qui
                          l’incluent.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean((snapshot.general as any)?.parcours_only)}
                        onCheckedChange={(checked) => {
                          const v = Boolean(checked);
                          updateGeneral({
                            parcours_only: v,
                            parcours_only_path_id: v ? (snapshot.general as any)?.parcours_only_path_id ?? null : null,
                          } as any);
                        }}
                      />
                    </div>

                    {Boolean((snapshot.general as any)?.parcours_only) ? (
                      <div className="space-y-2">
                        <Label className="text-slate-950 font-bold">Parcours</Label>
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300/40 disabled:opacity-60"
                          value={String((snapshot.general as any)?.parcours_only_path_id ?? "")}
                          onChange={(e) => updateGeneral({ parcours_only_path_id: e.target.value || null } as any)}
                          disabled={
                            availablePathsLoading ||
                            !String((snapshot.general as any)?.assigned_organization_id ?? "").trim()
                          }
                        >
                          <option value="">
                            {String((snapshot.general as any)?.assigned_organization_id ?? "").trim()
                              ? availablePathsLoading
                                ? "Chargement…"
                                : "—"
                              : "Choisissez d’abord une galaxie"}
                          </option>
                          {availablePaths.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-500">
                          Ce parcours doit appartenir à la galaxie de la formation.
                        </p>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-950">Progression linéaire</p>
                        <p className="text-xs text-slate-600">
                          Force un parcours séquentiel (déblocage étape par étape).
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(snapshot.general.linear_progression)}
                        onCheckedChange={(checked) => updateGeneral({ linear_progression: checked })}
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Button
                type="button"
                onClick={handlePersistBeyondIA}
                disabled={isPersisting || isPublishing}
                className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-950 shadow-sm hover:bg-white/95"
              >
                {isPersisting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enregistrer
              </Button>
              <Button
                type="button"
                onClick={handlePublishBeyondIA}
                disabled={isPersisting || isPublishing}
                className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-950 shadow-sm hover:bg-white/95"
              >
                {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Publier
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="space-y-8 bg-white pb-16"
        style={{
          fontFamily:
            '"SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif',
        }}
      >
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="border-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-xl font-extrabold tracking-tight text-slate-950">Identité</CardTitle>
                <p className="text-sm font-normal text-slate-600">
                  Donnez un titre, des objectifs pédagogiques et reliez un Open Badge.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setIsBeyondIAOpen(true)}
                className="rounded-full bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] px-5 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Beyond IA
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-950 font-bold">Titre de la formation</Label>
              <Input
                value={snapshot.general.title}
                onChange={(e) => updateGeneral({ title: e.target.value })}
                placeholder="Ex : Négociation avancée pour managers"
                className="rounded-2xl border-0 bg-slate-50 text-slate-950 placeholder:text-slate-400 shadow-sm"
              />
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                {isTimmy ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                      Assigner à une Galaxie
                    </label>
                    <select
                      className="w-full rounded-xl border border-slate-200/90 bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300/40 disabled:opacity-60"
                      value={String((snapshot.general as any)?.assigned_organization_id ?? "")}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateGeneral({ assigned_organization_id: v || null } as any);
                      }}
                      disabled={organizationsLoading}
                    >
                      <option value="">{organizationsLoading ? "Chargement…" : "—"}</option>
                      {organizations.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">Thématique</label>
                  <select
                    className="w-full rounded-xl border border-slate-200/90 bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300/40"
                    value={resolveThematicSelectValue(
                      snapshot.general.category_id,
                      snapshot.general.category,
                      thematics ?? [],
                    )}
                    onChange={(e) => {
                      const v = e.target.value;
                      const t = (thematics ?? []).find((c) => c.id === v);
                      updateGeneral({
                        category_id: v || null,
                        category: t?.name ?? "",
                      });
                    }}
                  >
                    <option value="">
                      {String((snapshot.general as any)?.assigned_organization_id ?? "").trim()
                        ? thematics === null
                          ? "Chargement…"
                          : "—"
                        : "Choisissez une galaxie"}
                    </option>
                    {(thematics ?? [])
                      .filter((c) => c.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">Niveau</label>
                  <select
                    className="w-full rounded-xl border border-slate-200/90 bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300/40"
                    value={snapshot.general.level ?? ""}
                    onChange={(e) => updateGeneral({ level: e.target.value })}
                  >
                    <option value="">—</option>
                    {COURSE_LEVEL_BUILDER_OPTIONS.map((lvl) => (
                      <option key={lvl.value} value={lvl.value}>
                        {lvl.label}
                      </option>
                    ))}
                  </select>
                </div>
                {isTimmy ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">Validé par</label>
                    <select
                      className="w-full rounded-xl border border-slate-200/90 bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300/40 disabled:opacity-60"
                      value={String((snapshot.general as any)?.validated_by_peer_id ?? "")}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "__create__") {
                          setCreateValidatorFirstName("");
                          setCreateValidatorLastName("");
                          setCreateValidatorDescription("");
                          setCreateValidatorPhotoUrl("");
                          setCreateValidatorOpen(true);
                          return;
                        }
                        updateGeneral({ validated_by_peer_id: v } as any);
                      }}
                      disabled={validatorsLoading}
                    >
                      <option value="">{validatorsLoading ? "Chargement…" : "—"}</option>
                      <option value="__create__">+ Créer un pair</option>
                      {validators.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">Les outils</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full max-w-md items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300/40"
                      aria-label="Choisir les outils utilisés"
                    >
                      <span className="truncate text-left">{toolsSummary}</span>
                      <span className="text-slate-500">▾</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[280px]">
                    <DropdownMenuLabel>Sélectionner les outils</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {COURSE_TOOL_OPTIONS.map((tool) => (
                      <DropdownMenuCheckboxItem
                        key={tool}
                        checked={selectedTools.includes(tool)}
                        onCheckedChange={(checked) => {
                          const next = new Set(selectedTools);
                          if (checked) next.add(tool);
                          else next.delete(tool);
                          updateGeneral({ tools: Array.from(next) });
                        }}
                      >
                        {tool}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedTools.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTools.map((tool) => (
                      <Badge
                        key={tool}
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-700"
                      >
                        {tool}
                        <button
                          type="button"
                          onClick={() => {
                            const next = selectedTools.filter((t) => t.toLowerCase() !== tool.toLowerCase());
                            updateGeneral({ tools: next });
                          }}
                          className="text-slate-400 transition hover:text-slate-800"
                          aria-label={`Retirer ${tool}`}
                        >
                          ✕
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label className="text-slate-950 font-bold">Présentation de la formation</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePresentationWithIA}
                  disabled={
                    isGeneratingPresentation ||
                    (snapshot.general.objectifs ?? []).filter((x) => String(x ?? "").trim()).length < 2 ||
                    (snapshot.sections ?? []).filter((s: any) => String(s?.title ?? "").trim()).length < 3
                  }
                  className="rounded-full"
                >
                  {isGeneratingPresentation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Générer avec l’IA
                </Button>
              </div>
              <Textarea
                value={snapshot.general.presentation ?? ""}
                onChange={(e) => updateGeneral({ presentation: e.target.value })}
                placeholder="200 mots captivants qui donnent envie de lancer la formation…"
                className="min-h-[120px] rounded-2xl border-0 bg-slate-50 text-slate-950 placeholder:text-slate-400 shadow-sm"
              />
              <p className="text-xs text-slate-500">
                Cette présentation sera affichée sur la page catalogue et servira de base pour le teaser du Hero
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-950 font-bold">Photo de couverture</Label>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[240px_1fr] md:items-start">
                  <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-100">
                    {coverPreview || snapshot.general.cover_image ? (
                      isCoverVideoUrl(coverPreview || snapshot.general.cover_image) ? (
                        <video
                          src={coverPreview || snapshot.general.cover_image || undefined}
                          className="h-full w-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverPreview || snapshot.general.cover_image}
                          alt="Aperçu couverture"
                          className="h-full w-full object-cover"
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                        Aperçu 16:9
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Image ou vidéo <strong>.mp4</strong> en <strong>16:9</strong> (object-cover). Les vidéos sont lues en boucle sans son.
                    </p>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                      Uploader une image ou une vidéo (.mp4)
                      <input
                        type="file"
                        accept="image/*,.mp4,video/mp4"
                        className="hidden"
                        onChange={async (e) => {
                          const input = e.currentTarget;
                          const f = input.files?.[0];
                          if (!f) return;
                          try {
                            const form = new FormData();
                            form.append("file", f);
                            form.append("bucket", "Public");
                            form.append("folder", "covers");

                            const res = await fetch("/api/upload/cover", { method: "POST", body: form });
                            const json = await res.json().catch(() => null);
                            if (!res.ok) {
                              const msg = String(json?.error ?? `Erreur upload (${res.status})`);
                              throw new Error(msg);
                            }
                            const url = String(json?.url ?? "").trim();
                            if (!url) throw new Error("URL manquante après upload.");
                            setCoverPreview(url);
                            updateGeneral({ cover_image: url });
                            toast.success("Couverture uploadée", { description: "L’image a été envoyée au stockage et liée à la formation." });
                          } catch (err) {
                            toast.error("Upload impossible", {
                              description: err instanceof Error ? err.message : "Une erreur est survenue.",
                            });
                          } finally {
                            if (input) input.value = "";
                          }
                        }}
                      />
                    </label>
                    <Input
                      value={snapshot.general.cover_image || ""}
                      onChange={(e) => {
                        setCoverPreview(null);
                        updateGeneral({ cover_image: e.target.value });
                      }}
                      placeholder="Ou collez une URL (https://...)"
                      className="rounded-2xl border-0 bg-slate-50 text-slate-950 placeholder:text-slate-400 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-950 font-bold">Formateur(s)</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm text-slate-950 shadow-sm"
                  >
                    <span className="truncate">
                      {(snapshot.general.instructor_ids?.length ?? 0) > 0
                        ? `${snapshot.general.instructor_ids?.length} sélectionné(s)`
                        : instructorsLoading
                          ? "Chargement..."
                          : "Choisir un ou plusieurs formateurs"}
                    </span>
                    <span className="text-slate-400">▾</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[min(520px,92vw)]">
                  {(instructors.length > 0 ? instructors : []).map((p) => {
                    const checked = (snapshot.general.instructor_ids ?? []).includes(p.id);
                    const label = p.full_name || p.email || p.id;
                    return (
                      <DropdownMenuCheckboxItem
                        key={p.id}
                        checked={checked}
                        onCheckedChange={(next) => {
                          const current = snapshot.general.instructor_ids ?? [];
                          const updated = next
                            ? Array.from(new Set([...current, p.id]))
                            : current.filter((id) => id !== p.id);
                          updateGeneral({ instructor_ids: updated });
                        }}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                  {instructorsLoading ? (
                    <div className="px-2 py-2 text-sm text-slate-600">Chargement…</div>
                  ) : null}
                  {!instructorsLoading && instructors.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-slate-600">Aucun formateur trouvé.</div>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-slate-600">
                Les IDs sélectionnés sont sauvegardés dans le snapshot (`general.instructor_ids`).
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-950 font-bold">Objectifs pédagogiques</Label>
                  <div className="rounded-3xl bg-white p-4 shadow-sm">
                    <ObjectivesList
                      value={snapshot.general.objectifs ?? []}
                      onChange={(next) => updateGeneral({ objectifs: next })}
                    />
                  </div>
                  <p className="text-xs text-slate-600">
                    Chaque ligne met à jour instantanément `general.objectifs`.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-extrabold tracking-tight text-slate-950">Vos objectifs</p>
                  <div className="rounded-3xl bg-slate-50 p-6 shadow-sm">
                    <ObjectivesMirror objectifs={snapshot.general.objectifs ?? []} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <CourseBuilderWorkspace
          previewHref="/dashboard/formateur/formations/new/preview"
          theme="light"
          courseId={initialCourseId}
        />

        <Dialog open={isBeyondIAOpen} onOpenChange={setIsBeyondIAOpen}>
          <DialogContent className="border-0 bg-white text-slate-950 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-slate-950 font-extrabold tracking-tight">Beyond IA</DialogTitle>
              <DialogDescription className="text-slate-600">
                Décrivez la structure attendue. Nous générons une proposition Sections/Chapitres.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label className="text-slate-950 font-bold">Prompt</Label>
              <Textarea
                value={iaPrompt}
                onChange={(e) => setIaPrompt(e.target.value)}
                placeholder="Ex : Construis une formation de 3 sections sur la négociation..."
                className="min-h-[140px] rounded-2xl border-0 bg-slate-50 text-slate-950 placeholder:text-slate-400 shadow-sm"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full bg-slate-100 px-5 text-slate-700 hover:bg-slate-200"
                onClick={() => setIsBeyondIAOpen(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <p className="mr-auto text-xs font-semibold text-orange-600">
                ⚠️ Avant de générer, assurez-vous d'avoir donné un titre à votre formation pour guider l'IA.
              </p>
              <Button
                type="button"
                onClick={handleGenerateWithBeyondIA}
                className="relative z-[999] pointer-events-auto rounded-full bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] px-5 font-bold text-white hover:opacity-95"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Générer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={createValidatorOpen} onOpenChange={setCreateValidatorOpen}>
          <DialogContent className="border-0 bg-white text-slate-950 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-950 font-extrabold tracking-tight">Créer un pair</DialogTitle>
              <DialogDescription className="text-slate-600">
                Ajoutez un validateur (pair) qui pourra apparaître sur les cartes apprenant.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-950 font-bold">Prénom</Label>
                <Input
                  value={createValidatorFirstName}
                  onChange={(e) => setCreateValidatorFirstName(e.target.value)}
                  placeholder="Ex: Alice"
                  className="rounded-2xl border-0 bg-slate-50 text-slate-950 placeholder:text-slate-400 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-950 font-bold">Nom</Label>
                <Input
                  value={createValidatorLastName}
                  onChange={(e) => setCreateValidatorLastName(e.target.value)}
                  placeholder="Ex: Martin"
                  className="rounded-2xl border-0 bg-slate-50 text-slate-950 placeholder:text-slate-400 shadow-sm"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-slate-950 font-bold">Description</Label>
                <Textarea
                  value={createValidatorDescription}
                  onChange={(e) => setCreateValidatorDescription(e.target.value)}
                  placeholder="Courte description (optionnel)."
                  className="min-h-[90px] rounded-2xl border-0 bg-slate-50 text-slate-950 placeholder:text-slate-400 shadow-sm"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-slate-950 font-bold">URL de la photo</Label>
                <Input
                  value={createValidatorPhotoUrl}
                  onChange={(e) => setCreateValidatorPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="rounded-2xl border-0 bg-slate-50 text-slate-950 placeholder:text-slate-400 shadow-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full bg-slate-100 px-5 text-slate-700 hover:bg-slate-200"
                onClick={() => setCreateValidatorOpen(false)}
                disabled={createValidatorSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="rounded-full bg-black px-5 text-white hover:bg-black/85 disabled:opacity-50"
                disabled={createValidatorSubmitting}
                onClick={async () => {
                  const first = createValidatorFirstName.trim();
                  const last = createValidatorLastName.trim();
                  if (!first || !last) {
                    toast.error("Champs requis", { description: "Prénom et Nom sont requis." });
                    return;
                  }
                  setCreateValidatorSubmitting(true);
                  try {
                    const res = await fetch("/api/validators", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        first_name: first,
                        last_name: last,
                        description: createValidatorDescription.trim() || null,
                        photo_url: createValidatorPhotoUrl.trim() || null,
                      }),
                    });
                    const json = await res.json().catch(() => null);
                    if (!res.ok || !json?.id) {
                      throw new Error(String(json?.error ?? `Erreur (${res.status})`));
                    }
                    const id = String(json.id);
                    await refreshValidators();
                    updateGeneral({ validated_by_peer_id: id } as any);
                    setCreateValidatorOpen(false);
                    toast.success("Pair créé", { description: "Le validateur a été ajouté et sélectionné." });
                  } catch (e) {
                    toast.error("Création impossible", { description: e instanceof Error ? e.message : "Erreur" });
                  } finally {
                    setCreateValidatorSubmitting(false);
                  }
                }}
              >
                {createValidatorSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Section "Open Badge & Certification" retirée (refonte UI). */}
      </div>

      {publishSuccessOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-6 backdrop-blur-xl"
          onClick={() => setPublishSuccessOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="w-full max-w-sm rounded-[2rem] border border-white/20 bg-white/92 p-10 text-center shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.05 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
            >
              <Check className="h-9 w-9" strokeWidth={2.5} />
            </motion.div>
            <p className="mt-8 text-xl font-semibold tracking-tight text-slate-900">
              {successOverlayStatus === "published" ? "Votre cours est en ligne" : "Cours enregistré"}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {successOverlayStatus === "published"
                ? "Votre formation est visible pour les apprenants."
                : "Vos modifications ont été sauvegardées."}
            </p>
            <Button
              type="button"
              className="mt-10 h-12 w-full rounded-full bg-slate-950 text-sm font-semibold text-white hover:bg-slate-900"
              onClick={() => {
                setPublishSuccessOpen(false);
                router.push("/dashboard/formateur/formations");
              }}
            >
              {successOverlayStatus === "published" ? "Accéder au catalogue" : "Retour au catalogue"}
            </Button>
          </motion.div>
        </div>
      ) : null}
    </DashboardShell>
  );
}

export default function FormateurNewFormationPage() {
  return <FormateurFormationBuilderWhite />;
}

function ObjectivesMirror({ objectifs }: { objectifs: string[] }) {
  const items = objectifs.map((x) => String(x ?? "").trim()).filter(Boolean);
  if (!items.length) {
    return (
      <p className="text-sm text-slate-500">
        Commencez à écrire vos objectifs à gauche. Ils apparaîtront ici instantanément.
      </p>
    );
  }

  return (
    <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
      {items.map((item, idx) => (
        <li key={`${idx}-${item.slice(0, 16)}`}>{item}</li>
      ))}
    </ul>
  );
}

function ObjectivesList({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const rows = value.length ? value : [""];
  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {rows.map((row, idx) => (
          <motion.div
            key={`obj-${idx}`}
            layout
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className="flex items-center gap-2"
          >
            <Input
              value={row}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = e.target.value;
                onChange(next);
              }}
              placeholder={`Objectif ${idx + 1}`}
              className="rounded-2xl border-0 bg-slate-50 text-slate-950 placeholder:text-slate-400 shadow-sm"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const next = rows.filter((_, i) => i !== idx);
                onChange(next.length ? next : [""]);
              }}
              className="h-10 w-10 rounded-full bg-slate-100 p-0 text-slate-700 hover:bg-slate-200"
              aria-label="Supprimer"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
      <motion.div whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 520, damping: 22 }}>
        <Button
          type="button"
          onClick={() => onChange([...rows, ""])}
          className="rounded-full bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] px-5 py-2 text-sm font-medium text-white hover:opacity-95"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une ligne
        </Button>
      </motion.div>
    </div>
  );
}

