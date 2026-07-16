import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendJessicaInvoiceEmail } from "@/lib/jessica-contentin/jessica-invoice-email";
import type { JessicaStoredInvoice } from "@/lib/jessica-contentin/jessica-invoice-shared";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

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

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const overrideEmail = body?.email ? String(body.email).trim() : null;

  const { data: invoice, error } = await supabase
    .from("jessica_invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !invoice) {
    return NextResponse.json({ error: error?.message ?? "Facture introuvable" }, { status: 404 });
  }

  const recipient = overrideEmail || invoice.client_email?.trim();
  if (!recipient) {
    return NextResponse.json(
      { error: "Ce client n'a pas d'adresse email — ajoutez-en une ou choisissez un autre client." },
      { status: 400 },
    );
  }

  const result = await sendJessicaInvoiceEmail(invoice as JessicaStoredInvoice, recipient);
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Envoi impossible" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    messageId: result.messageId,
    sentTo: recipient,
  });
}
