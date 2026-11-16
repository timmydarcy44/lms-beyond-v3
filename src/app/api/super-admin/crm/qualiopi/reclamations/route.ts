import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { DEFAULT_RECLAMATION_DEADLINES } from "@/lib/qualiopi/reclamation-deadlines";
import { deriveReclamationSource, parseReclamationSource } from "@/lib/qualiopi/reclamation-sources";
import { parseReclamationTheme } from "@/lib/qualiopi/reclamation-themes";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const OF_SETTINGS_ID = "00000000-0000-4000-8000-000000000001";

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const includeTest = req.nextUrl.searchParams.get("include_test") === "1";
  const theme = parseReclamationTheme(req.nextUrl.searchParams.get("theme"));

  let query = supabase
    .from("crm_qualiopi_reclamations")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(200);
  if (theme) query = query.eq("theme", theme);
  if (!includeTest) query = query.or("is_test.is.null,is_test.eq.false");

  const [{ data, error }, settingsRes, templatesRes] = await Promise.all([
    query,
    supabase
      .from("of_settings")
      .select("reclamation_ack_business_days, reclamation_reply_business_days")
      .eq("id", OF_SETTINGS_ID)
      .maybeSingle(),
    supabase.from("crm_qualiopi_reply_templates").select("id, key, label, body, sort_order").order("sort_order"),
  ]);

  if (error) {
    // Fallback colonnes absentes (migration pas encore appliquée)
    if (/is_test|source|answered_at|column/i.test(error.message)) {
      let legacy = supabase
        .from("crm_qualiopi_reclamations")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(200);
      if (theme) legacy = legacy.eq("theme", theme);
      const legacyRes = await legacy;
      if (legacyRes.error) {
        return NextResponse.json({ error: legacyRes.error.message }, { status: 400 });
      }
      return NextResponse.json({
        reclamations: legacyRes.data ?? [],
        settings: {
          ackBusinessDays:
            Number(settingsRes.data?.reclamation_ack_business_days) ||
            DEFAULT_RECLAMATION_DEADLINES.ackBusinessDays,
          replyBusinessDays:
            Number(settingsRes.data?.reclamation_reply_business_days) ||
            DEFAULT_RECLAMATION_DEADLINES.replyBusinessDays,
        },
        templates: templatesRes.data ?? [],
        migration_required: true,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    reclamations: data ?? [],
    settings: {
      ackBusinessDays:
        Number(settingsRes.data?.reclamation_ack_business_days) ||
        DEFAULT_RECLAMATION_DEADLINES.ackBusinessDays,
      replyBusinessDays:
        Number(settingsRes.data?.reclamation_reply_business_days) ||
        DEFAULT_RECLAMATION_DEADLINES.replyBusinessDays,
    },
    templates: templatesRes.error ? [] : (templatesRes.data ?? []),
  });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const subject = String(body.subject ?? "").trim();
  if (!subject) return NextResponse.json({ error: "Objet requis" }, { status: 400 });

  const channel = ["email", "satisfaction", "formulaire", "dashboard", "autre"].includes(
    String(body.channel),
  )
    ? String(body.channel)
    : "autre";
  const theme = parseReclamationTheme(body.theme) ?? "autre";
  const source =
    parseReclamationSource(body.source) ??
    deriveReclamationSource({ channel, audience: String(body.audience ?? "") });
  const isTest = body.is_test === true;

  const payload: Record<string, unknown> = {
    subject,
    requester_name: String(body.requester_name ?? "").trim() || null,
    requester_email: String(body.requester_email ?? "").trim() || null,
    requester_role: String(body.requester_role ?? "").trim() || null,
    requester_company: String(body.requester_company ?? "").trim() || null,
    channel,
    theme,
    source,
    description: String(body.description ?? "").trim(),
    session_id: body.session_id ? String(body.session_id) : null,
    status: "received",
    is_test: isTest,
    received_at: new Date().toISOString(),
  };

  let { data, error } = await supabase
    .from("crm_qualiopi_reclamations")
    .insert(payload)
    .select("*")
    .single();

  if (error && /status|is_test|source|requester_role|column|check/i.test(error.message)) {
    const legacy = {
      subject: payload.subject,
      requester_name: payload.requester_name,
      requester_email: payload.requester_email,
      channel,
      theme,
      description: payload.description,
      session_id: payload.session_id,
      status: "open",
    };
    ({ data, error } = await supabase.from("crm_qualiopi_reclamations").insert(legacy).select("*").single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Message initial demandeur
  if (data?.id) {
    await supabase.from("crm_qualiopi_reclamation_messages").insert({
      reclamation_id: data.id,
      kind: "requester",
      body: String(payload.description || subject),
      author_name: payload.requester_name,
    });
  }

  return NextResponse.json({ reclamation: data });
}
