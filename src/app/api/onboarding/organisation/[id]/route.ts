import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const { profile } = await getCurrentProfileWithAccess();

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await service
    .from("organizations")
    .select("id, name, slug, onboarding_step, estimated_users")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (profile?.company_id && profile.company_id !== id && profile.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { count } = await service
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("company_id", id);

  return NextResponse.json({
    ...data,
    employee_count: count ?? 0,
  });
}
