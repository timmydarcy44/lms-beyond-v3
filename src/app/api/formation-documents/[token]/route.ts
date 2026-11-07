import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isLot4Kind } from "@/lib/formation-documents/constants";
import { loadDossierDocContext } from "@/lib/formation-documents/context";
import { buildFormationDocumentPdf } from "@/lib/formation-documents/pdf";
import { cancelDocRelances } from "@/lib/formation-documents/schedule";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { token } = await ctx.params;
  const { data: doc } = await service
    .from("formation_documents")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // Métadonnées pour la page publique enrichie (Lot 5)
  if (req.nextUrl.searchParams.get("meta") === "1") {
    const docCtx = await loadDossierDocContext(service, String(doc.dossier_id));
    return NextResponse.json({
      kind: doc.kind,
      title: doc.title,
      status: doc.status,
      signed_at: doc.signed_at,
      course_title: docCtx?.dossier.course_title ?? docCtx?.session?.title ?? null,
      organization_name: docCtx?.organization.name ?? null,
      of_name: docCtx?.of.legal_name ?? "Byound",
      amount_ht_cents: docCtx?.dossier.amount_ht_cents ?? null,
      amount_ttc_cents: docCtx?.dossier.amount_ttc_cents ?? null,
      signable: doc.kind === "devis" || doc.kind === "convention",
    });
  }

  const now = new Date().toISOString();
  if (doc.status === "sent" || doc.status === "to_generate") {
    await service
      .from("formation_documents")
      .update({
        status: "opened",
        opened_at: doc.opened_at || now,
        updated_at: now,
      })
      .eq("id", doc.id);
  }

  if (doc.file_url) {
    return NextResponse.redirect(String(doc.file_url), 302);
  }

  if (!isLot4Kind(String(doc.kind))) {
    return NextResponse.json({ error: "PDF indisponible" }, { status: 404 });
  }

  const docCtx = await loadDossierDocContext(service, String(doc.dossier_id));
  if (!docCtx) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const buffer = buildFormationDocumentPdf({
    ctx: docCtx,
    kind: doc.kind,
  });
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.kind}.pdf"`,
    },
  });
}

/** Acceptation devis / convention (signature légère Lot 4a ; UI enrichie Lot 5). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { token } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { accept_token?: string } | null;
  const acceptToken = String(body?.accept_token ?? "").trim();

  const { data: doc } = await service
    .from("formation_documents")
    .select("*")
    .eq("access_token", token)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  if (doc.kind !== "devis" && doc.kind !== "convention") {
    return NextResponse.json({ error: "Ce document n'est pas signable ici" }, { status: 400 });
  }
  if (!doc.accept_token || doc.accept_token !== acceptToken) {
    return NextResponse.json({ error: "Jeton d'acceptation invalide" }, { status: 403 });
  }

  const now = new Date().toISOString();
  await service
    .from("formation_documents")
    .update({
      status: "signed",
      signed_at: now,
      opened_at: doc.opened_at || now,
      updated_at: now,
    })
    .eq("id", doc.id);

  if (doc.kind === "devis" || doc.kind === "convention") {
    await cancelDocRelances(service, String(doc.dossier_id), doc.kind);
  }

  await service.from("formation_events").insert({
    dossier_id: doc.dossier_id,
    event_type: "document_signed",
    payload: { kind: doc.kind, via: "public_accept" },
  });

  return NextResponse.json({ ok: true, signed_at: now });
}
