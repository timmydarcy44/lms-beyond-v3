import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function loadByToken(token: string) {
  const service = getServiceRoleClient();
  if (!service) return { error: "Service indisponible", status: 503 as const };
  const { data } = await service
    .from("employee_hr_documents")
    .select("id, title, document_date, document_type, notes, employee_id")
    .ilike("notes", `%${token}%`)
    .limit(1)
    .maybeSingle();
  if (!data) return { error: "Lien introuvable ou expiré", status: 404 as const };
  let details: Record<string, unknown> = {};
  try {
    details = JSON.parse(String(data.notes ?? "")) as Record<string, unknown>;
  } catch {
    return { error: "Synthèse illisible", status: 400 as const };
  }
  if (String(details.signature_token ?? "") !== token) {
    return { error: "Lien introuvable ou expiré", status: 404 as const };
  }
  return { service, data, details };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!UUID_RE.test(token)) return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
  const loaded = await loadByToken(token);
  if ("error" in loaded && loaded.error) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }
  const { data, details } = loaded;
  return NextResponse.json({
    title: data.title,
    document_date: data.document_date,
    document_type: data.document_type,
    hr_feedback: String(details.hr_feedback ?? ""),
    employee_feedback: String(details.employee_feedback ?? ""),
    extra_notes: String(details.extra_notes ?? ""),
    signed_at: details.signed_at ? String(details.signed_at) : null,
    signed_name: details.signed_name ? String(details.signed_name) : null,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!UUID_RE.test(token)) return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
  let body: { name?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  if (name.length < 2) return NextResponse.json({ error: "Indiquez votre nom" }, { status: 400 });

  const loaded = await loadByToken(token);
  if ("error" in loaded && loaded.error) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }
  const { service, data, details } = loaded;
  if (details.signed_at) return NextResponse.json({ ok: true, already: true });

  details.signed_at = new Date().toISOString();
  details.signed_name = name;
  const { error } = await service
    .from("employee_hr_documents")
    .update({ notes: JSON.stringify(details) })
    .eq("id", data.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
