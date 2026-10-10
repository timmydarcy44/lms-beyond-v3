import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ badges: [] });

  const { data, error } = await db.from("open_badges").select("id,name").order("name", { ascending: true }).limit(300);
  if (error) return NextResponse.json({ badges: [] });
  return NextResponse.json({
    badges: (data ?? []).map((badge) => ({ id: String(badge.id), name: String(badge.name ?? "Open badge") })),
  });
}
