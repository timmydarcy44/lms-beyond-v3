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
import { clearAcceptOtp, verifyAcceptOtp } from "@/lib/formation-documents/accept-otp";
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

  if (doc.kind === "devis" || doc.kind === "convention") {
    const { ensureSignedPdfBuffer } = await import(
      "@/lib/formation-documents/ensure-signed-pdf"
    );
    const stamped = await ensureSignedPdfBuffer(service, {
      id: String(doc.id),
      dossier_id: String(doc.dossier_id),
      kind: String(doc.kind),
      status: doc.status,
      signed_at: doc.signed_at,
      signer_name: doc.signer_name,
      signer_role: doc.signer_role,
      acceptance_method: doc.acceptance_method,
      accept_otp_sent_to: doc.accept_otp_sent_to,
      pdf_content_hash: doc.pdf_content_hash,
      file_url: doc.file_url,
      storage_bucket: doc.storage_bucket,
      storage_path: doc.storage_path,
      meta: (doc.meta as Record<string, unknown> | null) ?? null,
    });
    if (stamped?.length) {
      return pdfResponse(stamped, `${doc.kind}.pdf`);
    }
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
    otp_code?: string;
  } | null;
  const acceptToken = String(body?.accept_token ?? "").trim();
  const otpCode = String(body?.otp_code ?? "").trim();

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
      {
        error:
          doc.kind === "convention"
            ? "Cette convention a été remplacée par une nouvelle version"
            : "Ce devis a été remplacé par une nouvelle version",
      },
      { status: 409 },
    );
  }
  if (doc.valid_until && new Date(String(doc.valid_until)).getTime() < Date.now()) {
    return NextResponse.json(
      {
        error:
          doc.kind === "convention" ? "Cette convention a expiré" : "Ce devis a expiré",
      },
      { status: 410 },
    );
  }

  const otpCheck = await verifyAcceptOtp({
    service,
    documentId: String(doc.id),
    otpCode,
  });
  if (!otpCheck.ok) {
    const status =
      otpCheck.code === "otp_locked"
        ? 429
        : otpCheck.code === "otp_schema_missing"
          ? 503
          : 400;
    return NextResponse.json(
      { error: otpCheck.error, code: otpCheck.code },
      { status },
    );
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
  const { resolveAcceptanceSeal } = await import(
    "@/lib/formation-documents/acceptance-seal"
  );
  const prevMeta =
    doc.meta && typeof doc.meta === "object"
      ? (doc.meta as Record<string, unknown>)
      : {};
  const seal = resolveAcceptanceSeal(prevMeta, {
    documentId: String(doc.id),
    dossierId: String(doc.dossier_id),
    kind: String(doc.kind),
    signedAt: now,
    signerName: evidence.signer_name,
    pdfContentHash: doc.pdf_content_hash ? String(doc.pdf_content_hash) : null,
  });

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
    acceptance_method: "email_otp",
    pdf_content_hash: doc.pdf_content_hash || null,
    accept_otp_hash: null,
    accept_otp_expires_at: null,
    accept_otp_attempts: 0,
    meta: {
      ...prevMeta,
      acceptance_tracking_id: seal.trackingId,
      acceptance_seal_short: seal.sealShort,
      acceptance_seal_hash: seal.sealHash,
    },
  };

  let { error: updErr } = await service
    .from("formation_documents")
    .update(patch)
    .eq("id", doc.id)
    .neq("status", "signed");

  if (
    updErr &&
    /signer_|accepted_|cgv_version|acceptance_method|pdf_content_hash|accept_otp_|meta/i.test(
      updErr.message,
    )
  ) {
    const reduced = { ...patch };
    delete reduced.signer_name;
    delete reduced.signer_role;
    delete reduced.accepted_ip;
    delete reduced.accepted_user_agent;
    delete reduced.cgv_version;
    delete reduced.acceptance_method;
    delete reduced.pdf_content_hash;
    delete reduced.accept_otp_hash;
    delete reduced.accept_otp_expires_at;
    delete reduced.accept_otp_attempts;
    if (/meta/i.test(updErr.message)) delete reduced.meta;
    ({ error: updErr } = await service
      .from("formation_documents")
      .update(reduced)
      .eq("id", doc.id)
      .neq("status", "signed"));
    // Best-effort clear OTP même si colonnes evidence absentes
    await clearAcceptOtp(service, String(doc.id)).catch(() => undefined);
  }

  if (doc.kind === "devis" || doc.kind === "convention") {
    await cancelDocRelances(service, String(doc.dossier_id), doc.kind);
    try {
      const { archiveSignatureProof } = await import(
        "@/lib/formation-documents/signature-proof"
      );
      await archiveSignatureProof(service, {
        dossierId: String(doc.dossier_id),
        parentKind: doc.kind,
        parentDocumentId: String(doc.id),
        signerName: evidence.signer_name,
        signerRole: evidence.signer_role,
        acceptanceMethod: "email_otp",
        signedAt: now,
        emailedTo: doc.accept_otp_sent_to ? String(doc.accept_otp_sent_to) : null,
        acceptedIp: evidence.accepted_ip,
        acceptedUserAgent: evidence.accepted_user_agent,
        pdfContentHash: doc.pdf_content_hash ? String(doc.pdf_content_hash) : null,
        trackingId: seal.trackingId,
        sealShort: seal.sealShort,
      });
    } catch (err) {
      console.warn("[formation-documents/accept] signature proof:", err);
    }
  }

  await service.from("formation_events").insert({
    dossier_id: doc.dossier_id,
    event_type: "document_signed",
    payload: {
      kind: doc.kind,
      via: "public_accept",
      method: "email_otp",
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
        documentId: String(doc.id),
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
