import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  interactiveGameContentType,
  INTERACTIVE_GAME_MAX_FILE_BYTES,
  sanitizeInteractiveGamePath,
} from "@/lib/course-builder/interactive-game";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const BUCKETS = ["Public", "public", "uploads"] as const;
const AUTHOR_ROLES = ["instructor", "formateur", "admin", "tutor", "super_admin"];

async function canPublishGame() {
  if (await isSuperAdmin()) return true;
  const supabase = await getServerClient();
  if (!supabase) return false;
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return false;
  const { data } = await supabase
    .from("org_memberships")
    .select("role")
    .eq("user_id", userId)
    .in("role", AUTHOR_ROLES)
    .limit(1);
  return Boolean(data?.length);
}

export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const userId = auth?.user?.id;
  if (!userId || !(await canPublishGame())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const packageId = String(form?.get("packageId") ?? "").trim();
  const relativePath = sanitizeInteractiveGamePath(String(form?.get("path") ?? ""));
  if (!(file instanceof File) || !relativePath || !/^[a-zA-Z0-9-]{8,80}$/.test(packageId)) {
    return NextResponse.json({ error: "Fichier de jeu invalide." }, { status: 400 });
  }
  if (file.size > INTERACTIVE_GAME_MAX_FILE_BYTES) {
    return NextResponse.json({ error: `« ${relativePath} » dépasse 4 Mo.` }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const storagePath = `interactive-games/${userId}/${packageId}/${relativePath}`;
  const body = new Uint8Array(await file.arrayBuffer());
  let bucketName: string | null = null;
  let lastError = "Bucket introuvable";
  for (const bucket of BUCKETS) {
    const uploaded = await db.storage.from(bucket).upload(storagePath, body, {
      contentType: interactiveGameContentType(relativePath),
      cacheControl: "3600",
      upsert: true,
    });
    if (!uploaded.error) {
      bucketName = bucket;
      break;
    }
    lastError = uploaded.error.message;
  }
  if (!bucketName) {
    return NextResponse.json({ error: lastError }, { status: 500 });
  }

  const { data } = db.storage.from(bucketName).getPublicUrl(storagePath);
  return NextResponse.json({ url: data.publicUrl, path: relativePath });
}
