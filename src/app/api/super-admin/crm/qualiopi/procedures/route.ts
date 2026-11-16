import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  PROCEDURE_SECTION_KEYS,
  type ProcedureSectionKey,
} from "@/lib/qualiopi/procedure-sections";
import { listProceduresFallback } from "@/lib/qualiopi/procedures-fallback";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || `procedure-${Date.now()}`;
}

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await supabase
    .from("crm_qualiopi_procedures")
    .select("*, sections:crm_qualiopi_procedure_sections(*)")
    .neq("status", "archived")
    .order("title");

  if (error) {
    if (/does not exist|schema cache|crm_qualiopi_procedures/i.test(error.message)) {
      try {
        const procedures = await listProceduresFallback(supabase);
        return NextResponse.json({
          procedures,
          migration_required: true,
          migration_file: "20261116190000_qualiopi_procedures_v2.sql",
        });
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Fallback impossible" },
          { status: 400 },
        );
      }
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const procedures = (data ?? []).map((p) => ({
    ...p,
    sections: Array.isArray(p.sections)
      ? [...p.sections].sort(
          (a: { position: number }, b: { position: number }) => a.position - b.position,
        )
      : [],
  }));

  return NextResponse.json({ procedures });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const indicators = Array.isArray(body.indicators)
    ? body.indicators.map((n) => Number(n)).filter((n) => Number.isFinite(n))
    : [];
  const legal = body.legal_obligation === true;
  const slugBase = slugify(title);
  let slug = slugBase;
  for (let i = 0; i < 5; i++) {
    const trySlug = i === 0 ? slugBase : `${slugBase}-${i + 1}`;
    const { data: exists } = await supabase
      .from("crm_qualiopi_procedures")
      .select("id")
      .eq("slug", trySlug)
      .maybeSingle();
    if (!exists) {
      slug = trySlug;
      break;
    }
  }

  const { data: proc, error } = await supabase
    .from("crm_qualiopi_procedures")
    .insert({
      slug,
      title,
      status: "draft",
      current_version: "0.1",
      indicators,
      legal_obligation: legal,
      owner_name: String(body.owner_name ?? "").trim() || "Timmy Darcy",
    })
    .select("*")
    .single();

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json(
        {
          error:
            "Migration procédures v2 requise — coller 20261116190000_qualiopi_procedures_v2.sql",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = PROCEDURE_SECTION_KEYS.map((key, i) => ({
    procedure_id: proc.id,
    key: key as ProcedureSectionKey,
    position: i + 1,
    content: "",
  }));
  await supabase.from("crm_qualiopi_procedure_sections").insert(rows);

  const { data: sections } = await supabase
    .from("crm_qualiopi_procedure_sections")
    .select("*")
    .eq("procedure_id", proc.id)
    .order("position");

  return NextResponse.json({ procedure: { ...proc, sections: sections ?? [] } });
}
