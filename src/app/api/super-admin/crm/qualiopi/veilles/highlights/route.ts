import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { isVeilleKind, parseVeilleTheme } from "@/lib/qualiopi/veille-shared";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await supabase
    .from("crm_qualiopi_veille_highlights")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ highlights: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as {
    kind?: string;
    digest_id?: string | null;
    title?: string;
    excerpt?: string;
    note?: string;
    url?: string | null;
    theme?: string | null;
  };

  const kind = String(body.kind ?? "");
  if (!isVeilleKind(kind)) {
    return NextResponse.json({ error: "Type de veille invalide" }, { status: 400 });
  }
  const title = String(body.title ?? "").trim();
  const excerpt = String(body.excerpt ?? "").trim();
  if (!title || !excerpt) {
    return NextResponse.json({ error: "Titre et extrait requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crm_qualiopi_veille_highlights")
    .insert({
      kind,
      digest_id: body.digest_id || null,
      title,
      excerpt,
      note: String(body.note ?? "").trim() || null,
      url: body.url ? String(body.url) : null,
      theme: parseVeilleTheme(body.theme) ?? "transversal",
      status: "saved",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ highlight: data });
}
