import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ entries: [], aliases: [] });

  const [additionsRes, aliasesRes] = await Promise.all([
    service.from("skill_catalog_additions").select("label, category"),
    service.from("skill_catalog_aliases").select("alias, canonical"),
  ]);

  return NextResponse.json({
    entries: (additionsRes.data ?? []).map((row) => ({
      name: String(row.label ?? ""),
      category: String(row.category ?? "Autre"),
      aliases: [] as string[],
    })),
    aliases: (aliasesRes.data ?? []).map((row) => ({
      alias: String(row.alias ?? ""),
      canonical: String(row.canonical ?? ""),
    })),
  });
}
