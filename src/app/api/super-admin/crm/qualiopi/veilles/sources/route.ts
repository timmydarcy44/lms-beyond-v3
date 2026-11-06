import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { VEILLE_KIND, isVeilleKind, normalizeUrl } from "@/lib/qualiopi/veille-shared";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await supabase
    .from("crm_qualiopi_veille_sources")
    .select("*")
    .order("kind")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ sources: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as {
    kind?: string;
    url?: string;
    title?: string;
    is_priority?: boolean;
  };

  const kind = String(body.kind ?? VEILLE_KIND);
  if (!isVeilleKind(kind)) {
    return NextResponse.json({ error: "Type de veille invalide" }, { status: 400 });
  }
  const url = normalizeUrl(String(body.url ?? ""));
  if (!url) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crm_qualiopi_veille_sources")
    .upsert(
      {
        kind,
        url,
        title: String(body.title ?? "").trim() || null,
        is_priority: body.is_priority !== false,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "kind,url" },
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ source: data });
}
