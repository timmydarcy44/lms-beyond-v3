import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { cleanSiret, isValidSiret } from "@/lib/cfa/siret";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (query.length < 2) return NextResponse.json({ organizations: [] });
  const siret = cleanSiret(query);
  const search = isValidSiret(siret)
    ? db.from("organizations").select("id, name, siret").eq("siret", siret).limit(8)
    : db.from("organizations").select("id, name, siret").ilike("name", `%${query.replace(/[%_]/g, "")}%`).limit(8);
  const result = await search;
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.json({ organizations: result.data ?? [] });
}
