import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadEmployeeTestResults } from "@/lib/entreprise/employee-profile-diagnostics";
import { buildExpertBilanHtml } from "@/lib/expert/expert-bilan-pdf";
import { getAdminExpertById } from "@/lib/queries/admin-experts";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const expert = await getAdminExpertById(id);
  if (!expert) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "NO_DB" }, { status: 503 });

  const results = await loadEmployeeTestResults(service, id);
  const generatedAtIso = new Date().toISOString();
  const html = buildExpertBilanHtml({ expert, results, generatedAtIso });

  const safeName = [expert.first_name, expert.last_name]
    .filter(Boolean)
    .join("-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="bilans-expert-${safeName || id.slice(0, 8)}.html"`,
      "Cache-Control": "no-store",
    },
  });
}
