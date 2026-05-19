import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSupabasePublicUrl } from "@/lib/supabase-public-url";
import type { CourseBuilderSnapshot } from "@/types/course-builder";
import { z } from "zod";

type Payload = {
  snapshot: CourseBuilderSnapshot;
  openBadgeId?: string | null;
  status?: "draft" | "published";
  courseId?: string | null;
  creator_id?: string | null;
  slug?: string | null;
  flashcards?: Array<{
    id?: string;
    chapterId?: string | null;
    chapter_id?: string | null;
    front?: string;
    back?: string;
    question?: string;
    answer?: string;
  }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => UUID_RE.test(String(value ?? "").trim());

const SaveCoursePayloadSchema = z
  .object({
    snapshot: z
      .object({
        general: z
          .object({
            title: z.string().min(1, "general.title est requis"),
            presentation: z.string().optional(),
            /**
             * Niveau tel qu’au menu : `z.string()` accepte UTF-8 (accents, majuscules) sans normalisation.
             * Chaîne vide / absente → géré côté upsert (`null` en base si vide).
             */
            level: z.string().max(200).optional().nullable(),
            /** Ne fait pas échouer la sauvegarde si l’UI envoie des entrées vides / non-UUID. */
            instructor_ids: z.preprocess(
              (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && isUuid(x)) : v),
              z.array(z.string().uuid()).optional(),
            ),
            validated_by_peer_id: z
              .preprocess((v) => (v === "" ? null : v), z.string().uuid().nullable().optional()),
          })
          .passthrough(),
      })
      .passthrough(),
    openBadgeId: z.string().optional().nullable(),
    status: z.enum(["draft", "published"]).optional(),
    courseId: z.string().optional().nullable(),
    creator_id: z.string().optional().nullable(),
    slug: z.string().optional().nullable(),
    flashcards: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();

/** Image hero : URL absolue ou chemin public storage (bucket Playmakers par défaut). */
function resolveHeroImageUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s) || s.startsWith("//")) return s;
  const path = s.replace(/^\/+/, "");
  const url = getSupabasePublicUrl("Playmakers", path);
  return url || null;
}

/**
 * Contrainte DB `check_course_level` : valeurs canonisées (ex. Débutant, Intermédiaire, Expert).
 * Le builder envoie souvent Beginner / Intermediate / Advanced : on normalise avant upsert.
 */
function mapCourseLevelForDb(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (n === "beginner" || n === "debutant") return "Débutant";
  if (n === "intermediate" || n === "intermediaire") return "Intermédiaire";
  if (n === "advanced" || n === "expert") return "Expert";
  if (n === "acquisition") return "Acquisition";
  if (n === "specialist" || n === "specialiste") return "Spécialiste";

  // Valeur non reconnue -> null (évite une violation de contrainte DB).
  return null;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Mode debug temporaire : upsert minimal + logs payload / erreur Supabase.
 * Réintroduire insert/update + sync modules quand le 500 est résolu.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as Payload;
  const bodyAny = body as unknown as Record<string, unknown>;

  console.log("=== DEBUG SAVE-COURSE ===");
  console.log("1. Payload reçu:", JSON.stringify(body, null, 2));
  console.log("2. Org ID résolu:", (bodyAny.org_id as string) || (bodyAny.orgId as string) || "MANQUANT");
  console.log("3. Hero Image URL:", (bodyAny.hero_image_url as string) || "VIDE");
  console.log("=========================");

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ success: false, error: "Supabase non configuré" }, { status: 500 });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
  console.log("Saving with user ID:", user.id);

  try {
    console.log("START_SAVE_PROCESS");
    console.log("Payload reçu pour sauvegarde:", JSON.stringify(body, null, 2));
    console.log("PAYLOAD_SIZE:", JSON.stringify(body).length);

    const parsed = SaveCoursePayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur de validation",
          validation: {
            issues: parsed.error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
              code: issue.code,
            })),
          },
        },
        { status: 400 },
      );
    }

    const snapshot = parsed.data.snapshot as CourseBuilderSnapshot;
    const title = String(snapshot?.general?.title ?? "").trim();
    if (!title) return NextResponse.json({ success: false, error: "Titre requis" }, { status: 400 });

    const providedSlug = typeof parsed.data.slug === "string" ? String(parsed.data.slug).trim() : "";
    const autoSlug = slugify(title);
    const slug = providedSlug || autoSlug || `course-${Date.now()}`;

    const rawPrice = snapshot.general.price;
    const parsedPrice =
      typeof rawPrice === "number" && Number.isFinite(rawPrice)
        ? rawPrice
        : Number.parseFloat(String(rawPrice ?? "0"));
    const price = Number.isFinite(parsedPrice) ? parsedPrice : 0;

    const now = new Date().toISOString();

    const resolveOrgIdBySlug = async (slug: string): Promise<string | null> => {
      const s = String(slug ?? "").trim();
      if (!s) return null;
      const { data } = await supabase.from("organizations").select("id").eq("slug", s).maybeSingle();
      return String((data as { id?: string } | null)?.id ?? "").trim() || null;
    };

    const bodyAny = parsed.data as Payload & Record<string, unknown>;
    const bodyOrgIdRaw = String(bodyAny.org_id ?? bodyAny.orgId ?? "").trim();
    const bodyOrgSlug = String(bodyAny.orgSlug ?? bodyAny.galaxySlug ?? "").trim();

    let orgId: string | null = null;

    if (bodyOrgIdRaw && isUuid(bodyOrgIdRaw)) {
      orgId = bodyOrgIdRaw;
    }

    const assignedFromSnapshot = String((snapshot.general as { assigned_organization_id?: string }).assigned_organization_id ?? "").trim();
    if (!orgId && assignedFromSnapshot && isUuid(assignedFromSnapshot)) {
      orgId = assignedFromSnapshot;
    }

    const slugFromSnapshot = String((snapshot.general as { assigned_organization_slug?: string }).assigned_organization_slug ?? "").trim();
    if (!orgId && bodyOrgSlug) {
      orgId = await resolveOrgIdBySlug(bodyOrgSlug);
    }
    if (!orgId && slugFromSnapshot) {
      orgId = await resolveOrgIdBySlug(slugFromSnapshot);
    }

    // Liaison EDGE Lab : si aucune org résolue mais le slug explicite pointe vers EDGE Lab, tenter les slugs canoniques.
    if (!orgId) {
      const hint = `${bodyOrgSlug} ${slugFromSnapshot}`.toLowerCase();
      if (hint.includes("edge")) {
        orgId =
          (await resolveOrgIdBySlug("edge-lab")) ||
          (await resolveOrgIdBySlug("edgelab")) ||
          (await resolveOrgIdBySlug("edge-lab-beyond"));
      }
    }

    // 1) Si le profil a déjà un org_id, l'utiliser en priorité (évite de créer une org d'urgence).
    if (!orgId) {
      const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).maybeSingle();
      orgId = profile?.org_id ? String(profile.org_id) : null;
    }
    // 2) Sinon, chercher une membership existante.
    if (!orgId) {
      const { data: membership } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      orgId = membership?.org_id ? String(membership.org_id) : null;
    }
    if (!orgId) {
      console.warn("[beyond-ia/save-course] org_id missing; creating emergency organization");
      const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", user.id).maybeSingle();
      const orgName = profile?.full_name || profile?.email || `Organisation ${user.id.substring(0, 8)}`;

      const { getServiceRoleClient } = await import("@/lib/supabase/server");
      const serviceClient = getServiceRoleClient();
      const clientToUse = serviceClient || supabase;

      let emergencyOrgResult = await clientToUse
        .from("organizations")
        .insert({ name: orgName, description: "Organisation créée automatiquement" } as Record<string, unknown>)
        .select()
        .single();

      if (
        emergencyOrgResult.error &&
        (emergencyOrgResult.error.message?.includes("description") || emergencyOrgResult.error.code === "42703")
      ) {
        emergencyOrgResult = await clientToUse
          .from("organizations")
          .insert({ name: orgName } as Record<string, unknown>)
          .select()
          .single();
      }

      const { data: emergencyOrg, error: emergencyError } = emergencyOrgResult;
      if (emergencyError || !emergencyOrg?.id) throw emergencyError || new Error("ORG_CREATE_FAILED");
      orgId = String(emergencyOrg.id);

      const { error: membershipError } = await supabase.from("org_memberships").insert({
        org_id: orgId,
        user_id: user.id,
        role: "admin",
      } as Record<string, unknown>);
      if (membershipError) throw membershipError;
    }

    const finalOrgId = orgId;
    console.log("Final org_id for course:", finalOrgId);
    if (!finalOrgId) {
      return NextResponse.json(
        { success: false, error: "org_id introuvable (profil + memberships + emergency org ont échoué)" },
        { status: 400 },
      );
    }

    const status: "draft" | "published" = body.status === "published" ? "published" : "draft";

    const levelRaw = String(snapshot.general.level ?? "").trim();
    /**
     * Contrainte DB `check_course_level` : la colonne `courses.level` doit être normalisée.
     * On force un mapping safe (et "" -> null) avant l'upsert pour éviter un 23514.
     */
    const levelForDb = mapCourseLevelForDb(levelRaw);
    if (snapshot.general) {
      (snapshot.general as { level?: string | null }).level = levelForDb;
    }
    const validatedByPeerIdRaw = String((snapshot.general as any)?.validated_by_peer_id ?? "").trim();
    const validatedByPeerId =
      validatedByPeerIdRaw === "" ? null : isUuid(validatedByPeerIdRaw) ? validatedByPeerIdRaw : null;
    const coverImageRaw = String(snapshot.general.cover_image ?? "").trim();
    const cover_image_for_row =
      coverImageRaw && !coverImageRaw.startsWith("data:") ? coverImageRaw : null;

    const heroImageRaw = String(
      (snapshot.general as { hero_image_url?: string }).hero_image_url ??
        snapshot.general.heroImage ??
        snapshot.general.cover_image ??
        "",
    ).trim();
    const hero_image_url = resolveHeroImageUrl(heroImageRaw || null);

    const categoryIdRaw = String((snapshot.general as { category_id?: string | null }).category_id ?? "").trim();
    const categoryIdForDb = categoryIdRaw && isUuid(categoryIdRaw) ? categoryIdRaw : null;
    const categoryNameForDb = String(snapshot.general.category ?? "").trim() || "Formation";

    const upsertRow: Record<string, unknown> = {
      title,
      slug,
      builder_snapshot: snapshot,
      category: categoryNameForDb,
      category_id: categoryIdForDb,
      category_name: categoryNameForDb,
      level: levelForDb,
      validated_by_peer_id: validatedByPeerId,
      price,
      owner_id: user.id,
      creator_id: user.id,
      status,
      updated_at: now,
      org_id: finalOrgId,
      description: snapshot.general.subtitle || null,
      presentation: snapshot.general.presentation || null,
      hero_image_url: hero_image_url,
      cover_image: cover_image_for_row,
    };

    const existingId = body.courseId ? String(body.courseId) : null;
    if (existingId) {
      upsertRow.id = existingId;
    }

    const upsertWithFallback = async (row: Record<string, unknown>) => {
      const currentRow = { ...row };
      for (let attempt = 0; attempt < 6; attempt += 1) {
        if (attempt === 0) {
          console.log("Niveau envoyé à la DB :", currentRow.level);
        }
        const { data, error } = await supabase
          .from("courses")
          .upsert(currentRow as never, { onConflict: "id" })
          .select("id")
          .maybeSingle();
        if (error) {
          console.error("--- ERREUR SUPABASE ---", JSON.stringify(error, null, 2));
        }
        if (!error) return { data, error: null as unknown, rowUsed: currentRow };
        const errObj = error as unknown as { code?: unknown; message?: unknown };
        const code = errObj?.code ? String(errObj.code) : "";
        const msg = String(errObj?.message ?? "");
        if (code === "42703" || /column .* does not exist/i.test(msg)) {
          const m = msg.match(/column \"([^\"]+)\"/i);
          const col = m?.[1];
          if (col && col in currentRow) {
            delete (currentRow as Record<string, unknown>)[col];
            continue;
          }
        }
        return { data: null, error, rowUsed: currentRow };
      }
      return { data: null, error: new Error("UPSERT_FALLBACK_EXHAUSTED"), rowUsed: currentRow };
    };

    const { data, error } = await upsertWithFallback(upsertRow);

    if (error) {
      console.error("SUPABASE_ERROR_DETAIL:", error);
      const errObj = error as unknown as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
      const code = errObj?.code ? String(errObj.code) : "";
      const message =
        code === "42501" || /row level security|rls|permission denied/i.test(String(errObj?.message ?? ""))
          ? "Erreur de permissions (RLS)"
          : String((error as unknown as { message?: unknown })?.message ?? "Erreur Supabase");
      return NextResponse.json(
        { success: false, error: message, details: errObj?.details, hint: errObj?.hint, code },
        { status: 400 },
      );
    }

    const courseId = data?.id ? String(data.id) : null;
    if (!courseId) {
      return NextResponse.json({ success: false, error: "Aucun id retourné après upsert" }, { status: 500 });
    }

    // Si formation "uniquement dans un parcours": l'ajouter automatiquement au parcours sélectionné.
    try {
      const generalAny = snapshot.general as unknown as Record<string, unknown>;
      const parcoursOnly = Boolean(generalAny?.parcours_only);
      const targetPathId = String(generalAny?.parcours_only_path_id ?? "").trim();
      if (parcoursOnly && targetPathId) {
        const { getServiceRoleClientOrFallback } = await import("@/lib/supabase/server");
        const admin = await getServiceRoleClientOrFallback();
        const clientToUse = admin || supabase;

        const { data: pathRow, error: pathErr } = await clientToUse
          .from("paths")
          .select("id, org_id, path_snapshot, title")
          .eq("id", targetPathId)
          .maybeSingle();

        if (!pathErr && pathRow) {
          // Sécurité: le parcours doit appartenir à la même galaxie que le module.
          const pathOrg = String((pathRow as any).org_id ?? "").trim();
          if (!pathOrg || pathOrg !== String(finalOrgId)) {
            console.warn("[save-course] parcours_only: path org mismatch", { pathOrg, finalOrgId });
          } else {
            const snap = (pathRow as any).path_snapshot;
            const version = Number((snap as any)?.version ?? 0);
            const steps = Array.isArray((snap as any)?.steps) ? ([...(snap as any).steps] as any[]) : [];
            const already = steps.some(
              (s) => s && typeof s === "object" && s.type === "action" && s.content_kind === "course" && String(s.content_id ?? "") === courseId,
            );
            if (!already) {
              const id =
                typeof (globalThis as any)?.crypto?.randomUUID === "function"
                  ? (globalThis as any).crypto.randomUUID()
                  : `step-${Date.now()}-${Math.random().toString(16).slice(2)}`;
              const nextStep = {
                id,
                type: "action",
                content_kind: "course",
                content_id: courseId,
                position: { x: 0, y: steps.length * 120 },
              };
              const nextSnapshot =
                version === 2
                  ? { ...(snap as any), steps: [...steps, nextStep], updatedAt: new Date().toISOString() }
                  : snap; // si ce n'est pas V2, on ne touche pas

              if (version === 2) {
                // `paths.updated_at` peut ne pas exister selon le schéma → fallback.
                const updateAttempts: Array<Record<string, unknown>> = [
                  { path_snapshot: nextSnapshot, updated_at: now },
                  { path_snapshot: nextSnapshot },
                ];
                let updated = false;
                for (const payload of updateAttempts) {
                  const { error: updErr } = await clientToUse.from("paths").update(payload as any).eq("id", targetPathId);
                  if (!updErr) {
                    updated = true;
                    break;
                  }
                  const code = String((updErr as any)?.code ?? "");
                  const msg = String((updErr as any)?.message ?? "");
                  if (code !== "42703" && !/column .* does not exist/i.test(msg)) {
                    console.warn("[save-course] parcours_only: failed to update path_snapshot", updErr.message);
                    break;
                  }
                }
                if (!updated) {
                  console.warn("[save-course] parcours_only: update skipped (schema mismatch or RLS)");
                }
              }
            }
          }
        } else if (pathErr) {
          console.warn("[save-course] parcours_only: cannot read path", pathErr.message);
        }
      }
    } catch (e) {
      console.warn("[save-course] parcours_only: auto-attach skipped", e);
    }

    // Beyond: sauvegarder les données open_badges à part (table dédiée), sans polluer courses.
    const general = snapshot.general as unknown as Record<string, unknown>;
    const badgeTitle = String(general?.badgeLabel ?? "").trim();
    const badgeDescription = String(general?.badgeDescription ?? "").trim();
    const badgeConfig = general?.badge_modalities_config ?? null;
    const badgeLevel = String(general?.badge_level ?? "").trim();
    const shouldUpsertBadge = Boolean(badgeTitle || badgeDescription || badgeConfig || badgeLevel);

    if (shouldUpsertBadge) {
      const { getServiceRoleClient } = await import("@/lib/supabase/server");
      const service = getServiceRoleClient();
      const clientToUse = service || supabase;

      const badgeRow: Record<string, unknown> = {
        course_id: courseId,
        title: badgeTitle || title,
        description: badgeDescription || null,
        objectives: Array.isArray(snapshot.objectives) ? snapshot.objectives : [],
        modalities: badgeConfig && typeof badgeConfig === "object" ? badgeConfig : {},
        updated_at: now,
      };

      const { error: badgeError } = await clientToUse
        .from("open_badges")
        .upsert(badgeRow as never, { onConflict: "course_id" });

      if (badgeError) {
        console.warn("[save-course] open_badges upsert failed:", badgeError.message);
      }
    }

    // Beyond: sync flashcards payload -> table flashcards (best-effort)
    const flashcardsInput = Array.isArray((body as Payload)?.flashcards)
      ? ((body as Payload).flashcards as Payload["flashcards"])
      : [];
    if (flashcardsInput && flashcardsInput.length > 0) {
      const { getServiceRoleClient } = await import("@/lib/supabase/server");
      const service = getServiceRoleClient();
      const clientToUse = service || supabase;

      const isUuid = (value: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

      const rowsWithId: Array<Record<string, unknown>> = [];
      const rowsWithoutId: Array<Record<string, unknown>> = [];

      for (const raw of flashcardsInput) {
        const id = raw?.id ? String(raw.id) : "";
        const chapterId = raw?.chapterId ? String(raw.chapterId) : raw?.chapter_id ? String(raw.chapter_id) : null;
        const front = String(raw?.front ?? raw?.question ?? "").trim();
        const back = String(raw?.back ?? raw?.answer ?? "").trim();

        if (!front || !back) continue;

        const uuidChapter = chapterId && isUuid(chapterId) ? chapterId : null;
        const localChapterRef = chapterId && !isUuid(chapterId) ? chapterId : null;

        const baseRow: Record<string, unknown> = {
          course_id: courseId,
          chapter_id: uuidChapter,
          local_chapter_ref: localChapterRef,
          front,
          back,
          question: front,
          answer: back,
          updated_at: now,
        };

        if (id && isUuid(id)) rowsWithId.push({ ...baseRow, id });
        else rowsWithoutId.push(baseRow);
      }

      try {
        if (rowsWithId.length > 0) {
          const { error: upsertErr } = await clientToUse
            .from("flashcards")
            .upsert(rowsWithId as never, { onConflict: "id" });
          if (upsertErr) console.warn("[save-course] flashcards upsert(id) failed:", upsertErr.message);
        }

        if (rowsWithoutId.length > 0) {
          const { error: insertErr } = await clientToUse.from("flashcards").insert(rowsWithoutId as never);
          if (insertErr) console.warn("[save-course] flashcards insert failed:", insertErr.message);
        }
      } catch (e) {
        console.warn("[save-course] flashcards sync exception:", e);
      }
    }

    return NextResponse.json({
      success: true,
      courseId,
      data,
      status,
      message: "Cours sauvegardé (mode debug upsert).",
      warnings: [] as string[],
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("SERVER_CRASH_LOG:", e);
    return NextResponse.json({ success: false, error: "Server Crash", message }, { status: 500 });
  }
}
