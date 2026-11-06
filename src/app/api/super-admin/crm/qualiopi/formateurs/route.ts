import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: experts } = await supabase
    .from("experts")
    .select("id, first_name, last_name, headline, review_status")
    .eq("review_status", "approved")
    .order("last_name")
    .limit(100);

  const { data: plans, error } = await supabase
    .from("crm_qualiopi_formateur_plans")
    .select("*, crm_qualiopi_formateur_actions(*)")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    experts: experts ?? [],
    plans: plans ?? [],
  });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as {
    expert_id?: string;
    year?: number;
    needs?: string;
    skills?: Record<string, number>;
  };

  const expertId = String(body.expert_id ?? "").trim();
  if (!expertId) return NextResponse.json({ error: "expert_id requis" }, { status: 400 });
  const year = Number(body.year) || new Date().getFullYear();

  const { data, error } = await supabase
    .from("crm_qualiopi_formateur_plans")
    .upsert(
      {
        expert_id: expertId,
        year,
        needs: String(body.needs ?? "").trim() || null,
        skills: body.skills && typeof body.skills === "object" ? body.skills : {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "expert_id,year" },
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ plan: data });
}
