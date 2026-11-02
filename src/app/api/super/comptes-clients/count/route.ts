import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) return NextResponse.json({ count: 0 }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ count: 0 });
  const { count } = await db.from("organizations").select("id", { count: "exact", head: true });
  return NextResponse.json({ count: count ?? 0 });
}
