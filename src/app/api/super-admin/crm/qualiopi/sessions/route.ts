import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  // Plus de backfill de coquilles « Formation à programmer » (Lot 1 dossiers).
  let sessionsQuery = supabase
    .from("crm_qualiopi_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  // archived_at ajouté par migration Lot 1 — fallback si colonne absente
  const withArchive = await sessionsQuery.is("archived_at", null);
  const sessionsResult =
    withArchive.error && /archived_at/i.test(withArchive.error.message)
      ? await supabase.from("crm_qualiopi_sessions").select("*").order("created_at", { ascending: false })
      : withArchive;

  const { data: sessions, error } = sessionsResult;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const ids = (sessions ?? []).map((row) => row.id);
  const dealIds = Array.from(new Set((sessions ?? []).map((row) => String(row.deal_id))));

  const [{ data: attendees }, { data: documents }, { data: deals }] = await Promise.all([
    ids.length
      ? supabase.from("crm_qualiopi_attendees").select("*").in("session_id", ids)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    ids.length
      ? supabase.from("crm_qualiopi_documents").select("*").in("session_id", ids)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    dealIds.length
      ? supabase
          .from("crm_pipeline_deals")
          .select("id, company_name, email, quoted_course_ids, stage_slug")
          .in("id", dealIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const attendeesBySession = new Map<string, Record<string, unknown>[]>();
  for (const row of attendees ?? []) {
    const key = String(row.session_id);
    attendeesBySession.set(key, [...(attendeesBySession.get(key) ?? []), row]);
  }
  const docsBySession = new Map<string, Record<string, unknown>[]>();
  for (const row of documents ?? []) {
    const key = String(row.session_id);
    docsBySession.set(key, [...(docsBySession.get(key) ?? []), row]);
  }
  const dealById = new Map((deals ?? []).map((deal) => [String(deal.id), deal]));

  return NextResponse.json({
    sessions: (sessions ?? []).map((session) => {
      const deal = dealById.get(String(session.deal_id));
      return {
        ...session,
        company_name: deal?.company_name ?? "Client",
        contact_email: deal?.email ?? null,
        quoted_course_ids: deal?.quoted_course_ids ?? [],
        attendees: attendeesBySession.get(String(session.id)) ?? [],
        documents: docsBySession.get(String(session.id)) ?? [],
      };
    }),
  });
}

export async function POST(_req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Lot 1 : plus de coquilles Qualiopi vides — utiliser POST /api/super-admin/crm/formation-dossiers
  return NextResponse.json(
    {
      error:
        "Utilisez les Dossiers formation (Programmation). La création de sessions Qualiopi vides est désactivée.",
      code: "use_formation_dossiers",
    },
    { status: 410 },
  );
}
