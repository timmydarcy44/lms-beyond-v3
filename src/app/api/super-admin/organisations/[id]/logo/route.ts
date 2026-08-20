import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"]);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const allowed = await isSuperAdmin();
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id: orgId } = await context.params;
  if (!orgId) return NextResponse.json({ error: "MISSING_ORG_ID" }, { status: 400 });

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "INVALID_FORM" }, { status: 400 });

  const remove = String(form.get("remove") ?? "") === "1";
  if (remove) {
    const { error } = await supabase
      .from("organizations")
      .update({ logo_url: null, logo: null })
      .eq("id", orgId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, logo_url: null });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
  }
  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "INVALID_FILE_TYPE" }, { status: 400 });
  }

  const extension = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `org-logos/${orgId}/${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, buffer, {
    contentType: file.type || `image/${extension}`,
    upsert: true,
  });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const logoUrl = pub?.publicUrl ?? null;
  if (!logoUrl) return NextResponse.json({ error: "PUBLIC_URL_FAILED" }, { status: 500 });

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ logo_url: logoUrl, logo: logoUrl })
    .eq("id", orgId);

  if (updateError) {
    // Fallback si logo_url n'existe pas encore
    if (updateError.message?.includes("logo_url") || updateError.code === "42703") {
      const { error: fallback } = await supabase
        .from("organizations")
        .update({ logo: logoUrl })
        .eq("id", orgId);
      if (fallback) return NextResponse.json({ error: fallback.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, logo_url: logoUrl });
}
