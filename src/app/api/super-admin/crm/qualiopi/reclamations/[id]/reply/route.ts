import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { sendEmail } from "@/lib/email/resend-client";
import { sentenceCaseName } from "@/lib/qualiopi/reclamation-format";
import { normalizeReclamationBody } from "@/lib/qualiopi/reclamation-text";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Envoie une réponse (Resend) + met à jour le statut.
 * Refuse l'envoi si is_test=false et email non-test en mode forcé — les tests doivent passer is_test.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const text = normalizeReclamationBody(String(body.body ?? "")).trim();
  if (!text) return NextResponse.json({ error: "Message vide" }, { status: 400 });

  const templateKey = body.template_key ? String(body.template_key) : null;
  const closeAfter = body.close_after === true;
  const resolutionNote =
    typeof body.resolution_note === "string" ? body.resolution_note.trim() : null;

  const { data: rec, error: loadErr } = await supabase
    .from("crm_qualiopi_reclamations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (loadErr || !rec) {
    return NextResponse.json({ error: loadErr?.message || "Réclamation introuvable" }, { status: 404 });
  }

  const to = String(rec.requester_email ?? "").trim();
  const isTest = rec.is_test === true;
  const looksTestEmail = /@(example\.|byound\.test|test\.|mailinator\.)|\+test/i.test(to);

  let authorName = "Équipe qualité";
  let authorId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    authorId = auth.user?.id ?? null;
    if (authorId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, full_name, email")
        .eq("id", authorId)
        .maybeSingle();
      const full =
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
        String(profile?.full_name ?? "").trim();
      if (full) {
        authorName = sentenceCaseName(full);
      } else if (auth.user?.user_metadata) {
        const meta = auth.user.user_metadata as Record<string, unknown>;
        const metaName =
          [meta.first_name, meta.last_name].filter(Boolean).join(" ").trim() ||
          String(meta.full_name ?? meta.name ?? "").trim();
        if (metaName) authorName = sentenceCaseName(metaName);
      }
    }
  } catch {
    /* ignore */
  }

  // Garde-fou : pas d'e-mail vers un vrai client hors is_test / email test
  let emailSent: { ok: boolean; skipped?: boolean; error?: string } = { ok: true, skipped: true };
  if (to && (isTest || looksTestEmail || body.force_send === true)) {
    if (!isTest && !looksTestEmail && body.force_send !== true) {
      return NextResponse.json(
        { error: "Envoi bloqué : réclamation non-test. Marquez is_test ou utilisez une adresse de test." },
        { status: 400 },
      );
    }
    const html = `
      <div style="font-family:system-ui,sans-serif;line-height:1.55;color:#111">
        <p>${text.replace(/\n/g, "<br/>")}</p>
        <p style="color:#666;font-size:13px;margin-top:24px">
          ${authorName}<br/>Byound — Qualité
        </p>
      </div>`;
    const sent = await sendEmail({
      to,
      subject: `Votre réclamation : ${rec.subject}`,
      html,
      text,
      skipBcc: isTest || looksTestEmail,
    });
    emailSent = !sent.success
      ? { ok: false, error: sent.error ?? "Envoi impossible" }
      : { ok: true, skipped: false };
    if (!emailSent.ok) {
      return NextResponse.json({ error: emailSent.error || "E-mail non envoyé" }, { status: 502 });
    }
  } else if (to && !isTest && !looksTestEmail) {
    // Enregistre la réponse sans envoyer (prod réel) — l'UI peut forcer plus tard
    emailSent = { ok: true, skipped: true };
  }

  const now = new Date().toISOString();
  const isAckTemplate = templateKey === "ack";
  const hadAck = Boolean(rec.ack_at);
  const patch: Record<string, unknown> = {
    response: text,
    updated_at: now,
  };

  if (!hadAck) {
    patch.ack_at = now;
    patch.status = isAckTemplate ? "acknowledged" : "answered";
  } else if (isAckTemplate) {
    patch.status = "acknowledged";
  } else {
    patch.status = "answered";
    patch.answered_at = now;
  }

  if (closeAfter) {
    patch.status = "closed";
    patch.closed_at = now;
    if (resolutionNote) patch.resolution_note = resolutionNote;
  }

  const { data: updated, error: upErr } = await supabase
    .from("crm_qualiopi_reclamations")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (upErr) {
    // Legacy : anciens codes status + colonnes v2 absentes
    const legacyPatch: Record<string, unknown> = {
      response: text,
      updated_at: now,
      status: closeAfter ? "closed" : "in_progress",
    };
    if (!hadAck) legacyPatch.ack_at = now;
    if (closeAfter) legacyPatch.closed_at = now;
    const retry = await supabase
      .from("crm_qualiopi_reclamations")
      .update(legacyPatch)
      .eq("id", id)
      .select("*")
      .single();
    if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 });
  }

  await supabase.from("crm_qualiopi_reclamation_messages").insert({
    reclamation_id: id,
    kind: "reply",
    body: text,
    author_user_id: authorId,
    author_name: authorName,
    template_key: templateKey,
    email_sent_at: emailSent.skipped ? null : now,
  });

  if (closeAfter) {
    await supabase.from("crm_qualiopi_reclamation_messages").insert({
      reclamation_id: id,
      kind: "system_step",
      body: "Étape : clôturée",
      author_name: authorName,
    });
  } else if (!hadAck && isAckTemplate) {
    await supabase.from("crm_qualiopi_reclamation_messages").insert({
      reclamation_id: id,
      kind: "system_step",
      body: "Étape : accusé de réception",
      author_name: authorName,
    });
  } else if (!isAckTemplate) {
    await supabase.from("crm_qualiopi_reclamation_messages").insert({
      reclamation_id: id,
      kind: "system_step",
      body: "Étape : réponse",
      author_name: authorName,
    });
  }

  return NextResponse.json({
    ok: true,
    reclamation: updated,
    email: emailSent,
  });
}
