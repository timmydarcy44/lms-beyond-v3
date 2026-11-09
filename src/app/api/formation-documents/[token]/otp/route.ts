import { NextRequest, NextResponse } from "next/server";
import { loadDossierDocContext } from "@/lib/formation-documents/context";
import { issueAcceptOtp, maskEmail } from "@/lib/formation-documents/accept-otp";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { token } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { accept_token?: string } | null;
  const acceptToken = String(body?.accept_token ?? "").trim();

  const { data: doc } = await service
    .from("formation_documents")
    .select("id, kind, status, accept_token, dossier_id, superseded_by, valid_until")
    .eq("access_token", token)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  if (doc.kind !== "devis" && doc.kind !== "convention") {
    return NextResponse.json({ error: "Ce document n'est pas signable ici" }, { status: 400 });
  }
  if (!doc.accept_token || doc.accept_token !== acceptToken) {
    return NextResponse.json({ error: "Jeton d'acceptation invalide" }, { status: 403 });
  }
  if (doc.status === "signed") {
    return NextResponse.json({ error: "Document déjà signé", code: "already_signed" }, { status: 409 });
  }
  if (doc.superseded_by) {
    return NextResponse.json({ error: "Document remplacé par une nouvelle version" }, { status: 409 });
  }
  if (doc.valid_until && new Date(String(doc.valid_until)).getTime() < Date.now()) {
    return NextResponse.json({ error: "Document expiré" }, { status: 410 });
  }

  const docCtx = await loadDossierDocContext(service, String(doc.dossier_id));
  const toEmail = String(docCtx?.dossier.contact_email || "").trim().toLowerCase();
  if (!toEmail.includes("@")) {
    return NextResponse.json(
      {
        error:
          "Aucun e-mail contact sur ce dossier. Demandez à Byound de le renseigner avant signature.",
        code: "no_contact_email",
      },
      { status: 400 },
    );
  }

  const issued = await issueAcceptOtp({
    service,
    documentId: String(doc.id),
    toEmail,
    recipientName: docCtx?.dossier.contact_name,
    kind: doc.kind as "devis" | "convention",
    courseTitle: docCtx?.dossier.course_title || docCtx?.session?.title,
  });

  if (!issued.ok) {
    const status =
      issued.code === "otp_cooldown"
        ? 429
        : issued.code === "otp_schema_missing"
          ? 503
          : 400;
    return NextResponse.json(
      { error: issued.error, code: issued.code, emailed_to: maskEmail(toEmail) },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    emailed_to: issued.emailed_to,
    expires_in_seconds: 600,
  });
}
