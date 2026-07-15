import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";

async function assertJessicaAdmin() {
  if (!(await isSuperAdmin())) return null;
  const auth = await getServerClient();
  if (!auth) return null;
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user || user.email !== JESSICA_CONTENTIN_EMAIL) return null;
  return user;
}

function nextInvoiceNumber(lastNumber: string | null | undefined): string {
  const match = lastNumber?.match(/FAC(\d+)/i);
  const n = match ? Number(match[1]) + 1 : 1803;
  return `FAC${Number.isFinite(n) && n > 0 ? n : 1803}`;
}

export async function GET() {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await supabase
    .from("jessica_invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message, invoices: [] }, { status: 400 });
  }

  return NextResponse.json({ invoices: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const clientLabel = String(body?.client_label ?? "").trim();
  const clientEmail = body?.client_email ? String(body.client_email).trim() : null;
  const clientUserId = body?.client_user_id ? String(body.client_user_id).trim() : null;
  const amountRaw = Number(String(body?.amount ?? "").replace(",", "."));
  const paymentMethod = String(body?.payment_method ?? "Carte bancaire").trim() || "Carte bancaire";
  const designation = String(body?.designation ?? "Consultation").trim() || "Consultation";

  if (!clientLabel) {
    return NextResponse.json({ error: "Client requis" }, { status: 400 });
  }
  if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  const amountCents = Math.round(amountRaw * 100);
  const today = new Date().toISOString().slice(0, 10);

  const { data: last } = await supabase
    .from("jessica_invoices")
    .select("invoice_number")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let invoiceNumber = nextInvoiceNumber(last?.invoice_number);
  const payload = {
    invoice_number: invoiceNumber,
    client_label: clientLabel,
    client_email: clientEmail,
    client_user_id: clientUserId,
    amount_cents: amountCents,
    designation,
    payment_method: paymentMethod,
    invoice_date: today,
    consultation_date: today,
    created_by: user.id,
  };

  let { data, error } = await supabase.from("jessica_invoices").insert(payload).select("*").single();

  if (error?.code === "23505") {
    const match = invoiceNumber.match(/FAC(\d+)/i);
    invoiceNumber = `FAC${(match ? Number(match[1]) : 1803) + 1}`;
    ({ data, error } = await supabase
      .from("jessica_invoices")
      .insert({ ...payload, invoice_number: invoiceNumber })
      .select("*")
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ invoice: data });
}
