import { NextRequest, NextResponse } from "next/server";
import { BYOUND_COMPANY } from "@/lib/company";
import { isLot4Kind } from "@/lib/formation-documents/constants";
import { loadDossierDocContext } from "@/lib/formation-documents/context";
import { buildFormationDocumentPdf } from "@/lib/formation-documents/pdf";
import {
  buildPublicDocMeta,
  loadAccountManager,
} from "@/lib/formation-documents/public-meta";
import { cancelDocRelances } from "@/lib/formation-documents/schedule";
import { getDefaultSignatureProvider } from "@/lib/formation-documents/signature-provider";
import { downloadFormationPdf } from "@/lib/formation-documents/storage";
import { resolveFormationPdfBuffer } from "@/lib/formation-documents/vault";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ token: string }> };

function clientIp(req: NextRequest): string | null {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}

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

  if (req.nextUrl.searchParams.get("meta") === "1") {
    const docCtx = await loadDossierDocContext(service, String(doc.dossier_id));
    const accountManager = await loadAccountManager(
      service,
      docCtx?.organization.id ?? null,
    );
    return NextResponse.json(buildPublicDocMeta(doc, docCtx, accountManager));
  }

  // Consultation après expiration : PDF encore lisible si déjà accepté (+ marge)
  const expired =
    doc.valid_until &&
    new Date(String(doc.valid_until)).getTime() < Date.now() &&
    doc.status !== "signed";
  if (expired && req.nextUrl.searchParams.get("force") !== "1") {
    // Toujours servir le PDF en lecture ; l'UI bloque l'acceptation via meta.
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

/** Acceptation devis / convention — preuve simple + idempotence. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { token } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    accept_token?: string;
    signer_name?: string;
    signer_role?: string | null;
    cgv_accepted?: boolean;
  } | null;
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

  // Idempotent : déjà signé → OK sans double effet
  if (doc.status === "signed" && doc.signed_at) {
    return NextResponse.json({
      ok: true,
      signed_at: doc.signed_at,
      already_signed: true,
    });
  }

  if (doc.superseded_by) {
    return NextResponse.json(
      { error: "Ce devis a été remplacé par une nouvelle version" },
      { status: 409 },
    );
  }
  if (doc.valid_until && new Date(String(doc.valid_until)).getTime() < Date.now()) {
    return NextResponse.json({ error: "Ce devis a expiré" }, { status: 410 });
  }

  let evidence: {
    signer_name: string;
    signer_role: string | null;
    accepted_ip: string | null;
    accepted_user_agent: string | null;
    cgv_version: string;
  };
  let now: string;
  try {
    const provider = getDefaultSignatureProvider();
    const result = await provider.accept({
      documentId: String(doc.id),
      acceptToken,
      signerName: String(body?.signer_name || "").trim(),
      signerRole: body?.signer_role,
      cgvAccepted: Boolean(body?.cgv_accepted),
      cgvVersion: String(doc.cgv_version || BYOUND_COMPANY.cgv_version),
      ip: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });
    evidence = result.evidence;
    now = result.signedAt;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Acceptation impossible" },
      { status: 400 },
    );
  }
  const patch: Record<string, unknown> = {
    status: "signed",
    signed_at: now,
    opened_at: doc.opened_at || now,
    updated_at: now,
    signer_name: evidence.signer_name,
    signer_role: evidence.signer_role,
    accepted_ip: evidence.accepted_ip,
    accepted_user_agent: evidence.accepted_user_agent,
    cgv_version: evidence.cgv_version,
    acceptance_method: "simple_checkbox",
    pdf_content_hash: doc.pdf_content_hash || null,
  };

  let { error: updErr } = await service
    .from("formation_documents")
    .update(patch)
    .eq("id", doc.id)
    .neq("status", "signed");

  if (updErr && /signer_|accepted_|cgv_version|acceptance_method|pdf_content_hash/i.test(updErr.message)) {
    ({ error: updErr } = await service
      .from("formation_documents")
      .update({
        status: "signed",
        signed_at: now,
        opened_at: doc.opened_at || now,
        updated_at: now,
      })
      .eq("id", doc.id)
      .neq("status", "signed"));
  }

  if (doc.kind === "devis" || doc.kind === "convention") {
    await cancelDocRelances(service, String(doc.dossier_id), doc.kind);
  }

  await service.from("formation_events").insert({
    dossier_id: doc.dossier_id,
    event_type: "document_signed",
    payload: {
      kind: doc.kind,
      via: "public_accept",
      method: "simple_checkbox",
      signer_name: evidence.signer_name,
    },
  });

  if (doc.kind === "devis") {
    try {
      const { transitionFormationDossier } = await import(
        "@/lib/formation-dossier/transition-server"
      );
      await transitionFormationDossier(service, {
        dossierId: String(doc.dossier_id),
        toStatus: "convention",
        actorUserId: null,
      });
    } catch {
      await service
        .from("formation_dossiers")
        .update({ status: "convention", updated_at: now })
        .eq("id", doc.dossier_id)
        .in("status", ["qualification", "devis"]);
    }

    // Deal CRM → gagné si lié
    const { data: dossier } = await service
      .from("formation_dossiers")
      .select("deal_id")
      .eq("id", doc.dossier_id)
      .maybeSingle();
    if (dossier?.deal_id) {
      const { data: deal } = await service
        .from("crm_pipeline_deals")
        .select("id, stage_slug")
        .eq("id", dossier.deal_id)
        .maybeSingle();
      const won = new Set([
        "gagne",
        "reussi",
        "proposition_signee",
        "client_actif",
      ]);
      if (deal && !won.has(String(deal.stage_slug || ""))) {
        await service
          .from("crm_pipeline_deals")
          .update({ stage_slug: "gagne", updated_at: now })
          .eq("id", deal.id);
      }
    }
  }

  if (doc.kind === "convention") {
    await service
      .from("formation_dossiers")
      .update({ status: "mise_en_place", updated_at: now })
      .eq("id", doc.dossier_id)
      .in("status", ["convention", "devis"]);
  }

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
      "[formation-documents/accept] notify staff:",
      err instanceof Error ? err.message : err,
    );
  }

  if (doc.kind === "devis") {
    try {
      const { notifyClientDevisAccepted } = await import(
        "@/lib/formation-documents/notify-acceptance"
      );
      await notifyClientDevisAccepted(service, {
        dossierId: String(doc.dossier_id),
        signedAt: now,
        signerName: evidence.signer_name,
        accessToken: String(doc.access_token),
      });
    } catch (err) {
      console.warn(
        "[formation-documents/accept] notify client:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return NextResponse.json({ ok: true, signed_at: now });
}
