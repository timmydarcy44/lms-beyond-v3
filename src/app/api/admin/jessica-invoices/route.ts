import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import {
  JESSICA_INVOICE_SECTION_TITLE_DEFAULT,
  type JessicaInvoiceLineItem,
  linesTotalCents,
} from "@/lib/jessica-contentin/jessica-invoice-shared";

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

function parseLineItems(raw: unknown): JessicaInvoiceLineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = item as Record<string, unknown>;
      const designation = String(row.designation ?? "").trim();
      const quantity = Number(row.quantity ?? 1);
      const unitCents = Math.round(Number(row.unit_price_cents ?? row.unitPriceCents ?? 0));
      const serviceDate = String(row.service_date ?? row.serviceDate ?? "").slice(0, 10);
      if (!designation || !Number.isFinite(quantity) || quantity <= 0 || unitCents <= 0) return null;
      return {
        prestation_type: String(row.prestation_type ?? "autre") as JessicaInvoiceLineItem["prestation_type"],
        designation,
        quantity,
        unit_price_cents: unitCents,
        service_date: serviceDate || new Date().toISOString().slice(0, 10),
        formation_id: row.formation_id ? String(row.formation_id) : null,
        custom_label: row.custom_label ? String(row.custom_label) : null,
      } satisfies JessicaInvoiceLineItem;
    })
    .filter(Boolean) as JessicaInvoiceLineItem[];
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
  const paymentMethod = String(body?.payment_method ?? "Carte bancaire").trim() || "Carte bancaire";
  const sectionTitle =
    String(body?.section_title ?? JESSICA_INVOICE_SECTION_TITLE_DEFAULT).trim() ||
    JESSICA_INVOICE_SECTION_TITLE_DEFAULT;

  let lineItems = parseLineItems(body?.line_items);
  if (lineItems.length === 0) {
    const amountRaw = Number(String(body?.amount ?? "").replace(",", "."));
    if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
      return NextResponse.json({ error: "Ajoutez au moins une prestation" }, { status: 400 });
    }
    const today = new Date().toISOString().slice(0, 10);
    lineItems = [
      {
        prestation_type: "consultation",
        designation: String(body?.designation ?? "Consultation").trim() || "Consultation",
        quantity: 1,
        unit_price_cents: Math.round(amountRaw * 100),
        service_date: today,
      },
    ];
  }

  if (!clientLabel) {
    return NextResponse.json({ error: "Client requis" }, { status: 400 });
  }

  const amountCents = linesTotalCents(lineItems);
  if (amountCents <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const firstDate = lineItems[0]?.service_date ?? today;

  const { data: last } = await supabase
    .from("jessica_invoices")
    .select("invoice_number")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let invoiceNumber = nextInvoiceNumber(last?.invoice_number);
  const payload: Record<string, unknown> = {
    invoice_number: invoiceNumber,
    client_label: clientLabel,
    client_email: clientEmail,
    client_user_id: clientUserId,
    amount_cents: amountCents,
    designation: lineItems.map((l) => l.designation).join(" + "),
    section_title: sectionTitle,
    line_items: lineItems,
    payment_method: paymentMethod,
    invoice_date: today,
    consultation_date: firstDate,
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
    const withoutExtras = { ...payload };
    delete withoutExtras.section_title;
    delete withoutExtras.line_items;
    ({ data, error } = await supabase
      .from("jessica_invoices")
      .insert(withoutExtras)
      .select("*")
      .single());
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ invoice: data });
}
