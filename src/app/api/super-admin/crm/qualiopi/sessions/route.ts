import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  copyTemplateDocsToSession,
  newAttendeeToken,
  syncSignedDealsIntoFormations,
} from "@/lib/crm/qualiopi-sessions";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  await syncSignedDealsIntoFormations(supabase);

  const { data: sessions, error } = await supabase
    .from("crm_qualiopi_sessions")
    .select("*")
    .order("created_at", { ascending: false });
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

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const dealId = String(body?.deal_id ?? "").trim();
  if (!dealId) return NextResponse.json({ error: "Client manquant" }, { status: 400 });

  const { data: deal } = await supabase.from("crm_pipeline_deals").select("*").eq("id", dealId).maybeSingle();
  if (!deal) return NextResponse.json({ error: "Fiche client introuvable" }, { status: 404 });

  const courseName = String(body?.course_name ?? "").trim() || "Formation à programmer";
  const { data: session, error } = await supabase
    .from("crm_qualiopi_sessions")
    .insert({
      deal_id: dealId,
      course_id: body?.course_id ? String(body.course_id) : null,
      course_name: courseName,
      scheduled_at: body?.scheduled_at ? String(body.scheduled_at) : null,
      status: "scheduled",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await copyTemplateDocsToSession(supabase, session.id);

  const attendeesRaw = Array.isArray(body?.attendees) ? body.attendees : [];
  const attendees = attendeesRaw
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        full_name: String(row.full_name ?? row.name ?? "").trim(),
        email: String(row.email ?? "").trim().toLowerCase(),
      };
    })
    .filter((item) => item.full_name && item.email.includes("@"));
  if (attendees.length) {
    await supabase.from("crm_qualiopi_attendees").insert(
      attendees.map((item) => ({
        session_id: session.id,
        full_name: item.full_name,
        email: item.email,
        token: newAttendeeToken(),
        satisfaction_token: newAttendeeToken(),
      }))
    );
  }

  return NextResponse.json({ session });
}
