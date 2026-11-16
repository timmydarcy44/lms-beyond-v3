import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  countFilledSections,
  PROCEDURE_SECTION_KEYS,
} from "@/lib/qualiopi/procedure-sections";
import { nextMajorVersion } from "@/lib/qualiopi/procedure-status";
import { buildProcedurePdf } from "@/lib/qualiopi/procedure-pdf";
import { formatFrDateShort } from "@/lib/qualiopi/reclamation-format";
import { sendEmail } from "@/lib/email/resend-client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

const BUCKET = "qualiopi-procedures";

function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const { data: proc, error: loadErr } = await supabase
    .from("crm_qualiopi_procedures")
    .select("*, sections:crm_qualiopi_procedure_sections(*)")
    .eq("id", id)
    .maybeSingle();
  if (loadErr) {
    if (/does not exist|schema cache/i.test(loadErr.message)) {
      return NextResponse.json(
        { error: "Migration procédures v2 requise pour valider et générer le PDF." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: loadErr.message }, { status: 400 });
  }
  if (!proc) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const sections = Array.isArray(proc.sections) ? proc.sections : [];
  if (countFilledSections(sections) < 7) {
    return NextResponse.json(
      { error: "Les 7 sections doivent être remplies (≥ 40 caractères hors espaces)." },
      { status: 400 },
    );
  }

  const effectiveDate =
    (typeof body.effective_date === "string" && body.effective_date.slice(0, 10)) ||
    new Date().toISOString().slice(0, 10);
  const nextReviewAt =
    (typeof body.next_review_at === "string" && body.next_review_at.slice(0, 10)) ||
    addMonths(effectiveDate, 12);
  const audiences = Array.isArray(body.audiences)
    ? body.audiences.map((a) => String(a))
    : ["formateurs", "equipe"];

  let authorName = "Équipe qualité";
  let authorId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    authorId = auth.user?.id ?? null;
    if (auth.user?.email) authorName = auth.user.email.split("@")[0] || authorName;
  } catch {
    /* ignore */
  }

  const version = nextMajorVersion(proc.current_version);
  const snapshot = {
    title: proc.title,
    version,
    sections: PROCEDURE_SECTION_KEYS.map((key) => {
      const s = sections.find((x: { key: string }) => x.key === key);
      return { key, content: s?.content ?? "", position: s?.position ?? 0 };
    }),
    audiences,
    effective_date: effectiveDate,
    next_review_at: nextReviewAt,
  };

  const pdf = await buildProcedurePdf({
    title: proc.title,
    version,
    effectiveDate: formatFrDateShort(effectiveDate),
    validatedByName: authorName,
    validatedAt: formatFrDateShort(new Date().toISOString()),
    nextReviewAt: formatFrDateShort(nextReviewAt),
    sections: snapshot.sections,
  });

  const pdfPath = `${proc.slug}/${version}-${Date.now()}.pdf`;
  await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => null);
  const upload = await supabase.storage.from(BUCKET).upload(pdfPath, pdf, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upload.error) {
    return NextResponse.json({ error: `PDF storage: ${upload.error.message}` }, { status: 502 });
  }

  const now = new Date().toISOString();
  const { error: verErr } = await supabase.from("crm_qualiopi_procedure_versions").insert({
    procedure_id: id,
    version,
    pdf_path: pdfPath,
    content_snapshot: snapshot,
    validated_by: authorId,
    validated_by_name: authorName,
    validated_at: now,
    effective_date: effectiveDate,
    next_review_at: nextReviewAt,
    audiences,
  });
  if (verErr) return NextResponse.json({ error: verErr.message }, { status: 400 });

  const { data: updated, error: upErr } = await supabase
    .from("crm_qualiopi_procedures")
    .update({
      status: "validated",
      current_version: version,
      validated_by: authorId,
      validated_by_name: authorName,
      validated_at: now,
      effective_date: effectiveDate,
      next_review_at: nextReviewAt,
      audiences,
      updated_at: now,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  // Diffusion : comptes de test uniquement (is_test ou e-mail +test / @byound.test)
  let recipients: Array<{ id: string; email?: string | null; full_name?: string | null; is_test?: boolean | null }> =
    [];
  const testQ = await supabase.from("profiles").select("id, email, full_name, is_test").eq("is_test", true).limit(50);
  if (!testQ.error) {
    recipients = (testQ.data ?? []) as typeof recipients;
  } else {
    const loose = await supabase.from("profiles").select("id, email, full_name").limit(80);
    recipients = ((loose.data ?? []) as typeof recipients).filter((u) =>
      /@byound\.test|\+test|@example\./i.test(String(u.email ?? "")),
    );
  }
  recipients = recipients.filter((u) => u.id && u.email);
  const readRows = recipients.map((u) => ({
    procedure_id: id,
    version,
    user_id: u.id,
    sent_at: now,
  }));
  if (readRows.length) {
    await supabase.from("crm_qualiopi_procedure_reads").upsert(readRows, {
      onConflict: "procedure_id,version,user_id",
    });
  }

  const isSignalements = proc.legal_obligation === true || proc.slug === "signalements";
  let emailsSent = 0;
  for (const u of recipients) {
    const to = String(u.email);
    if (!/@byound\.test|\+test|@example\./i.test(to) && u.is_test !== true) continue;
    const html = `
      <div style="font-family:system-ui,sans-serif;line-height:1.5">
        <p>Bonjour${u.full_name ? ` ${u.full_name}` : ""},</p>
        <p>Nouvelle procédure à lire : <strong>${proc.title}</strong> (v${version}).</p>
        ${
          isSignalements
            ? "<p>Ouvrez votre espace pour consulter le document (contenu non joint).</p>"
            : `<p><a href="https://edgebs.fr/super/crm/qualiopi/process?id=${id}">Ouvrir la procédure</a></p>`
        }
      </div>`;
    const sent = await sendEmail({
      to,
      subject: `Nouvelle procédure à lire : ${proc.title}`,
      html,
      text: `Nouvelle procédure à lire : ${proc.title} (v${version})`,
      skipBcc: true,
    });
    if (sent.success) emailsSent += 1;
  }

  return NextResponse.json({
    ok: true,
    procedure: updated,
    version,
    pdf_path: pdfPath,
    reads_created: readRows.length,
    emails_sent: emailsSent,
  });
}
