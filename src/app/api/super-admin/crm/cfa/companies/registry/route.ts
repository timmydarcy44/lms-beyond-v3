import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { searchRegistry } from "@/lib/cfa/registry-company";

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const query = request.nextUrl.searchParams.get("q") ?? "";
  try {
    const result = await searchRegistry(query);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "L'annuaire des entreprises est indisponible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
