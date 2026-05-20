import { NextRequest, NextResponse } from "next/server";
import { readJsonBodyOptionalGzip } from "@/lib/api/read-json-body-optional-gzip";
import { buildPathsInsertRow, pathsWriteWithFallback } from "@/lib/paths/paths-write-row";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  let body: any = null;
  try {
    body = await readJsonBodyOptionalGzip(request);
  } catch (e) {
    console.error("[api/paths] invalid body", e);
    return NextResponse.json(
      { error: "Body JSON invalide", details: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }

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
            : "Parcours";

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
          : "draft";

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
    if (!orgId) {
      return NextResponse.json(
        { error: "org_id requis", details: "Un parcours doit être rattaché à une galaxie (org_id)." },
        { status: 400 },
      );
    }

    const insertRow = buildPathsInsertRow({
      creatorId,
      orgId,
      title,
      description,
      status,
      coverImage,
      snapshot,
    });

    const { data, error } = await pathsWriteWithFallback(
      (row) =>
        supabase.from("paths").insert(row).select("id, creator_id, title, status").single(),
      insertRow,
    );

    if (error) {
      console.error("[api/paths] insert error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { error: "Erreur insertion paths", details: error.message, hint: error.hint, code: error.code },
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

      if (learnerIds.length > 0) {
        const adminClient = await getServiceRoleClientOrFallback();
        if (adminClient) {
          // upsert expected enrollments
          const rows = learnerIds.map((uid) => ({ user_id: uid, path_id: data.id }));
          await adminClient.from("path_enrollments").upsert(rows, { onConflict: "user_id,path_id" });

          // remove enrollments no longer assigned (best-effort)
          const { data: existing } = await adminClient
            .from("path_enrollments")
            .select("user_id")
            .eq("path_id", data.id);
          const existingIds = Array.isArray(existing) ? existing.map((r: any) => String(r.user_id ?? "").trim()).filter(Boolean) : [];
          const toRemove = existingIds.filter((x) => !learnerIds.includes(x));
          if (toRemove.length) {
            await adminClient.from("path_enrollments").delete().eq("path_id", data.id).in("user_id", toRemove);
          }
        }
      }
    } catch (e) {
      console.warn("[api/paths] path_enrollments sync skipped:", e);
    }

    return NextResponse.json({ success: true, path: data });
  } catch (e) {
    console.error("[api/paths] unexpected:", {
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
    return NextResponse.json({ error: "Erreur serveur", details: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

