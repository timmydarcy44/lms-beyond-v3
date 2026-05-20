import { NextRequest, NextResponse } from "next/server";
import { readJsonBodyOptionalGzip } from "@/lib/api/read-json-body-optional-gzip";
import { buildPathsUpdateRow, pathsWriteWithFallback } from "@/lib/paths/paths-write-row";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  let body: any = null;
  try {
    body = await readJsonBodyOptionalGzip(request);
  } catch (e) {
    console.error("[api/paths/[id]] invalid body", e);
    return NextResponse.json(
      { error: "Body JSON invalide", details: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }

  const mergeStepsSafely = (existingSnap: any, incomingSnap: any) => {
    const existingSteps = Array.isArray(existingSnap?.steps) ? (existingSnap.steps as any[]) : [];
    const incomingSteps = Array.isArray(incomingSnap?.steps) ? (incomingSnap.steps as any[]) : [];
    if (!existingSteps.length || !incomingSteps.length) return incomingSnap;

    // Empêcher la perte d'actions déjà présentes en DB (ex: auto-attach depuis le builder formation).
    const keyOf = (s: any) => {
      const type = String(s?.type ?? "").trim();
      if (type === "action") {
        const kind = String(s?.content_kind ?? "").trim();
        const id = String(s?.content_id ?? "").trim();
        return kind && id ? `a:${kind}:${id}` : null;
      }
      return null;
    };

    const existingActionKeys = new Set<string>();
    for (const s of existingSteps) {
      const k = keyOf(s);
      if (k) existingActionKeys.add(k);
    }

    const incomingActionKeys = new Set<string>();
    for (const s of incomingSteps) {
      const k = keyOf(s);
      if (k) incomingActionKeys.add(k);
    }

    const missingActions: any[] = [];
    for (const s of existingSteps) {
      const k = keyOf(s);
      if (k && !incomingActionKeys.has(k)) {
        missingActions.push(s);
      }
    }

    if (!missingActions.length) return incomingSnap;

    const merged = [...incomingSteps];
    for (const action of missingActions) {
      // Maintenir l'alternance: si on finit par une action, on insère un trigger par défaut.
      const last = merged[merged.length - 1];
      if (last && String(last?.type ?? "") === "action") {
        const prevKind = String(last?.content_kind ?? "").trim();
        const defaultTrigger =
          prevKind === "test"
            ? { type: "trigger", trigger_condition: "evaluation_passed" }
            : prevKind === "resource"
              ? { type: "trigger", trigger_condition: "resource_link_clicked" }
              : { type: "trigger", trigger_condition: "formation_completed" };
        merged.push({
          id: `merge-trigger-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          position: { x: 0, y: merged.length * 120 },
          trigger_quiz_min_score: null,
          trigger_quiz_test_id: null,
          trigger_evaluation_passed: null,
          ...defaultTrigger,
        });
      }
      merged.push({
        ...action,
        id: String(action?.id ?? `merge-action-${Date.now()}-${Math.random().toString(16).slice(2)}`),
        position: action?.position ?? { x: 0, y: merged.length * 120 },
      });
    }

    return { ...(incomingSnap ?? {}), steps: merged };
  };

  try {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth?.user) {
      return NextResponse.json({ error: "Non authentifié", details: authError?.message }, { status: 401 });
    }

    const creatorId = auth.user.id;
    const snapshot = body?.pathSnapshot ?? body?.builderSnapshot ?? body?.path_snapshot ?? body?.pathSnapshotV2 ?? null;
    if (!snapshot || typeof snapshot !== "object") {
      return NextResponse.json({ error: "path_snapshot requis", details: "Snapshot JSON manquant ou invalide." }, { status: 400 });
    }

    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim()
        : typeof body?.name === "string" && body.name.trim()
          ? body.name.trim()
          : typeof snapshot?.title === "string" && snapshot.title.trim()
            ? snapshot.title.trim()
            : null;

    const description =
      typeof body?.description === "string"
        ? body.description
        : typeof snapshot?.presentation === "string"
          ? snapshot.presentation
          : typeof snapshot?.objective === "string"
            ? snapshot.objective
            : typeof snapshot?.description === "string"
              ? snapshot.description
              : null;

    const status =
      typeof body?.status === "string" && body.status.trim().length > 0
        ? body.status.trim()
        : typeof snapshot?.status === "string" && snapshot.status.trim().length > 0
          ? snapshot.status.trim()
          : null;

    const coverImage =
      typeof body?.cover_image === "string" && body.cover_image.trim()
        ? body.cover_image.trim()
        : typeof body?.coverImage === "string" && body.coverImage.trim()
          ? body.coverImage.trim()
          : typeof body?.image_url === "string" && body.image_url.trim()
            ? body.image_url.trim()
            : typeof body?.imageUrl === "string" && body.imageUrl.trim()
              ? body.imageUrl.trim()
              : typeof snapshot?.cover_image === "string" && snapshot.cover_image.trim()
                ? snapshot.cover_image.trim()
                : typeof snapshot?.image_url === "string" && snapshot.image_url.trim()
                  ? snapshot.image_url.trim()
                  : typeof snapshot?.imageUrl === "string" && snapshot.imageUrl.trim()
                    ? snapshot.imageUrl.trim()
                    : null;

    const orgIdRaw = String(body?.orgId ?? body?.org_id ?? "").trim();
    const orgId = orgIdRaw && isUuid(orgIdRaw) ? orgIdRaw : null;

    // RLS doit protéger l'update; on ajoute un garde-fou côté API.
    const { data: existing, error: existingError } = await supabase
      .from("paths")
      .select("id, creator_id, org_id, path_snapshot")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error("[api/paths/[id]] read error:", {
        message: existingError.message,
        details: existingError.details,
        hint: existingError.hint,
        code: existingError.code,
      });
      return NextResponse.json({ error: "Erreur lecture paths", details: existingError.message }, { status: 500 });
    }

    if (!existing) return NextResponse.json({ error: "Parcours introuvable" }, { status: 404 });
    if (existing.creator_id !== creatorId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    // Empêche les parcours "orphelins" (sans galaxie).
    // - si le parcours n'a pas encore d'org_id, il faut en fournir un.
    // - sinon, on conserve l'org_id existant si non fourni.
    if (!existing.org_id && !orgId) {
      return NextResponse.json(
        { error: "org_id requis", details: "Ce parcours n'est rattaché à aucune galaxie. Veuillez en sélectionner une." },
        { status: 400 },
      );
    }

    const mergedSnapshot =
      existing?.path_snapshot && typeof existing.path_snapshot === "object"
        ? mergeStepsSafely(existing.path_snapshot, snapshot)
        : snapshot;

    const updateRow = buildPathsUpdateRow({
      title,
      description,
      status,
      coverImage,
      snapshot: mergedSnapshot,
      orgId,
    });

    const { data, error } = await pathsWriteWithFallback(
      (row) =>
        supabase
          .from("paths")
          .update(row as never)
          .eq("id", id)
          .select("id, creator_id, title, status")
          .single(),
      updateRow,
    );

    if (error) {
      console.error("[api/paths/[id]] update error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { error: "Erreur update paths", details: error.message, hint: error.hint, code: error.code },
        { status: 500 },
      );
    }

    // Sync inscriptions apprenants -> path_enrollments (pivot table)
    // Note: la table peut ne pas exister dans certains environnements; on ignore alors.
    try {
      const learnerIds = Array.isArray((snapshot as any)?.assignment?.learnerIds)
        ? ((snapshot as any).assignment.learnerIds as any[])
            .map((x) => String(x ?? "").trim())
            .filter(Boolean)
        : [];

      const adminClient = learnerIds.length ? await getServiceRoleClientOrFallback() : null;
      if (adminClient) {
        const rows = learnerIds.map((uid) => ({ user_id: uid, path_id: data.id }));
        await adminClient.from("path_enrollments").upsert(rows, { onConflict: "user_id,path_id" });

        const { data: existing } = await adminClient
          .from("path_enrollments")
          .select("user_id")
          .eq("path_id", data.id);
        const existingIds = Array.isArray(existing)
          ? existing.map((r: any) => String(r.user_id ?? "").trim()).filter(Boolean)
          : [];
        const toRemove = existingIds.filter((x) => !learnerIds.includes(x));
        if (toRemove.length) {
          await adminClient.from("path_enrollments").delete().eq("path_id", data.id).in("user_id", toRemove);
        }
      }
    } catch (e) {
      console.warn("[api/paths/[id]] path_enrollments sync skipped:", e);
    }

    return NextResponse.json({ success: true, path: data });
  } catch (e) {
    console.error("[api/paths/[id]] unexpected:", {
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
    return NextResponse.json({ error: "Erreur serveur", details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

