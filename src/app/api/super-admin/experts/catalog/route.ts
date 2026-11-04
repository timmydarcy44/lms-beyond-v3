import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ badges: [] });

  const full = await db.from("open_badges").select("id,name,image_url,domain").order("name", { ascending: true }).limit(300);
  const fallback = full.error ? await db.from("open_badges").select("id,name").order("name", { ascending: true }).limit(300) : full;
  if (fallback.error) return NextResponse.json({ badges: [] });
  return NextResponse.json({
    badges: (fallback.data ?? []).map((badge) => ({
      id: String(badge.id),
      name: String((badge as { name?: string }).name ?? "Open badge"),
      imageUrl: String((badge as { image_url?: string }).image_url ?? "") || null,
      domain: String((badge as { domain?: string }).domain ?? "") || null,
    })),
  });
}
