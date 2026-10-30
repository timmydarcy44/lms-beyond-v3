import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

const querySchema = z.object({ path: z.string().min(1) });

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = querySchema.safeParse({ path: req.nextUrl.searchParams.get("path") ?? "" });
  if (!parsed.success || !parsed.data.path.startsWith("/")) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ versions: [] });
  const { data, error } = await db
    .from("site_seo_versions")
    .select("id, path, published_at, published_by")
    .eq("path", parsed.data.path)
    .order("published_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ versions: [] });
  return NextResponse.json({ versions: data ?? [] });
}
