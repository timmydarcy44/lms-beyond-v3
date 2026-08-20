import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/gif", ""]);
const BUCKET_CANDIDATES = ["avatars", "Avatar"] as const;

async function updateOrgLogo(
  supabase: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  orgId: string,
  logoUrl: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Essayer logo_url + logo, puis chaque colonne seule
  const attempts: Record<string, string | null>[] = [
    { logo_url: logoUrl, logo: logoUrl },
    { logo_url: logoUrl },
    { logo: logoUrl },
  ];

  let lastError = "UPDATE_FAILED";
  for (const payload of attempts) {
    const { error } = await supabase.from("organizations").update(payload).eq("id", orgId);
    if (!error) return { ok: true };
    lastError = error.message;
    if (error.code !== "42703" && !/column .* does not exist/i.test(error.message)) {
      return { ok: false, error: lastError };
    }
  }
  return { ok: false, error: lastError };
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const allowed = await isSuperAdmin();
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id: orgId } = await context.params;
  if (!orgId) return NextResponse.json({ error: "MISSING_ORG_ID" }, { status: 400 });

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SERVICE_UNAVAILABLE", details: "SUPABASE_SERVICE_ROLE_KEY manquante" },
      { status: 503 },
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "INVALID_FORM" }, { status: 400 });

  const remove = String(form.get("remove") ?? "") === "1";
  if (remove) {
    const result = await updateOrgLogo(supabase, orgId, null);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, logo_url: null });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE", details: "Max 2 Mo" }, { status: 400 });
  }
  const mime = (file.type || "").toLowerCase();
  if (mime && !ALLOWED.has(mime)) {
    return NextResponse.json({ error: "INVALID_FILE_TYPE", details: mime }, { status: 400 });
  }

  const extension =
    (file.name.split(".").pop() || (mime.includes("png") ? "png" : "jpg"))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "png";
  const path = `org-logos/${orgId}/${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = mime || `image/${extension === "jpg" ? "jpeg" : extension}`;

  let uploadErrorMsg: string | null = null;
  let usedBucket: (typeof BUCKET_CANDIDATES)[number] | null = null;

  for (const bucket of BUCKET_CANDIDATES) {
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });
    if (!uploadError) {
      usedBucket = bucket;
      break;
    }
    uploadErrorMsg = `${bucket}: ${uploadError.message}`;
    // Continuer si bucket introuvable
    if (!/not found|does not exist|Bucket not found/i.test(uploadError.message)) {
      // Autre erreur (policy, mime…) : tenter le bucket suivant quand même
      continue;
    }
  }

  if (!usedBucket) {
    return NextResponse.json(
      {
        error: "UPLOAD_FAILED",
        details:
          uploadErrorMsg ??
          "Impossible d'uploader vers le bucket avatars. Exécutez la migration 20260820220000_org_features_logo_storage.sql",
      },
      { status: 500 },
    );
  }

  const { data: pub } = supabase.storage.from(usedBucket).getPublicUrl(path);
  const logoUrl = pub?.publicUrl ?? null;
  if (!logoUrl) return NextResponse.json({ error: "PUBLIC_URL_FAILED" }, { status: 500 });

  const result = await updateOrgLogo(supabase, orgId, logoUrl);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: "DB_UPDATE_FAILED",
        details:
          result.error +
          " — Vérifiez que organizations.logo_url existe (migration 20260820220000 / 20260422).",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, logo_url: logoUrl, bucket: usedBucket });
}
