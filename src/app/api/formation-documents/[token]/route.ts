import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isLot4Kind } from "@/lib/formation-documents/constants";
import { loadDossierDocContext } from "@/lib/formation-documents/context";
import { buildFormationDocumentPdf } from "@/lib/formation-documents/pdf";
import { cancelDocRelances } from "@/lib/formation-documents/schedule";
import { downloadFormationPdf } from "@/lib/formation-documents/storage";
import { resolveFormationPdfBuffer } from "@/lib/formation-documents/vault";

type Ctx = { params: Promise<{ token: string }> };

function pdfResponse(buffer: Buffer, filename: string) {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

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
      signable:
        (doc.kind === "devis" || doc.kind === "convention") && doc.status !== "signed",
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

  // Jamais de redirect vers une URL storage publique (énumérable).
  const fromPrivate = await downloadFormationPdf(service, {
    bucket: doc.storage_bucket,
    path: doc.storage_path,
    fileUrl: doc.file_url,
  });
  if (fromPrivate) {
    return pdfResponse(fromPrivate, `${doc.kind}.pdf`);
  }

  if (!isLot4Kind(String(doc.kind))) {
    return NextResponse.json({ error: "PDF indisponible" }, { status: 404 });
  }

  const docCtx = await loadDossierDocContext(service, String(doc.dossier_id));
  if (!docCtx) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const { buffer } = await resolveFormationPdfBuffer(service, {
    kind: doc.kind,
    ctx: docCtx,
    buildFallback: () =>
      buildFormationDocumentPdf({
        ctx: docCtx,
        kind: doc.kind,
      }),
  });
  return pdfResponse(buffer, `${doc.kind}.pdf`);
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

  // Passe le dossier au statut suivant
  if (doc.kind === "devis") {
    await service
      .from("formation_dossiers")
      .update({ status: "convention", updated_at: now })
      .eq("id", doc.dossier_id)
      .in("status", ["qualification", "devis"]);
  }
  if (doc.kind === "convention") {
    await service
      .from("formation_dossiers")
      .update({ status: "mise_en_place", updated_at: now })
      .eq("id", doc.dossier_id)
      .in("status", ["convention", "devis"]);
  }

  // Régénère le PDF avec la zone d'acceptation remplie
  try {
    const { generateFormationDocuments } = await import(
      "@/lib/formation-documents/generate"
    );
    await generateFormationDocuments(service, {
      dossierId: String(doc.dossier_id),
      kinds: [doc.kind],
    });
  } catch (err) {
    console.warn(
      "[formation-documents/accept] regenerate:",
      err instanceof Error ? err.message : err,
    );
  }

  try {
    const { notifyStaffDocumentAccepted } = await import(
      "@/lib/formation-documents/notify-acceptance"
    );
    await notifyStaffDocumentAccepted(service, {
      dossierId: String(doc.dossier_id),
      kind: doc.kind as "devis" | "convention",
      signedAt: now,
    });
  } catch (err) {
    console.warn(
      "[formation-documents/accept] notify:",
      err instanceof Error ? err.message : err,
    );
  }

  return NextResponse.json({ ok: true, signed_at: now });
}
