import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { encryptJson } from "@/lib/ready/crypto";
import { logReadyEvent } from "@/lib/ready/events";
import { updateReadyProgress } from "@/lib/ready/fiche";
import { isReadyLinkAccessible, loadReadyLinkByToken } from "@/lib/ready/load-link";
import { readReadySessionFromRequest } from "@/lib/ready/session";
import type { ReadyCompanyFields, ReadyLearnerFields } from "@/lib/ready/types";

export const dynamic = "force-dynamic";

function securityHeaders(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const service = getServiceRoleClient();
  if (!service) {
    return securityHeaders(NextResponse.json({ error: "Indisponible" }, { status: 503 }));
  }

  const link = await loadReadyLinkByToken(service, token);
  if (!link) {
    return securityHeaders(NextResponse.json({ error: "Lien introuvable" }, { status: 404 }));
  }
  const access = isReadyLinkAccessible(link);
  if (!access.ok) {
    return securityHeaders(
      NextResponse.json({ error: "Ce lien a expiré.", code: access.reason }, { status: 410 }),
    );
  }

  const session = readReadySessionFromRequest(request);
  if (!session || session.linkId !== link.id || session.tokenHash !== link.token_hash) {
    return securityHeaders(
      NextResponse.json({ error: "Authentification requise", code: "auth_required" }, { status: 401 }),
    );
  }

  let body: {
    company?: Partial<ReadyCompanyFields>;
    payment_mode?: "subrogation" | "remboursement";
    learner?: { id: string; fields: Partial<ReadyLearnerFields> };
  };
  try {
    body = await request.json();
  } catch {
    return securityHeaders(NextResponse.json({ error: "JSON invalide" }, { status: 400 }));
  }

  if (body.payment_mode === "subrogation" || body.payment_mode === "remboursement") {
    await service
      .from("ready_links")
      .update({
        payment_mode: body.payment_mode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", link.id);
  }

  if (body.company) {
    const { data: current } = await service
      .from("ready_links")
      .select("company_fields_enc")
      .eq("id", link.id)
      .maybeSingle();
    const { bufferFromDb, decryptJson } = await import("@/lib/ready/crypto");
    const prev =
      decryptJson<ReadyCompanyFields>(bufferFromDb(current?.company_fields_enc)) || {
        siret: "",
        idcc: "",
        headcount: "",
        opco_name: "",
        member_number: "",
      };
    const next: ReadyCompanyFields = {
      siret: body.company.siret ?? prev.siret,
      idcc: body.company.idcc ?? prev.idcc,
      headcount: body.company.headcount ?? prev.headcount,
      opco_name: body.company.opco_name ?? prev.opco_name,
      member_number: body.company.member_number ?? prev.member_number,
    };
    await service
      .from("ready_links")
      .update({
        company_fields_enc: encryptJson(next),
        updated_at: new Date().toISOString(),
      })
      .eq("id", link.id);
  }

  if (body.learner?.id) {
    const { data: row } = await service
      .from("ready_learners")
      .select("id, fields_enc")
      .eq("id", body.learner.id)
      .eq("link_id", link.id)
      .maybeSingle();
    if (!row) {
      return securityHeaders(NextResponse.json({ error: "Stagiaire introuvable" }, { status: 404 }));
    }
    const { bufferFromDb, decryptJson } = await import("@/lib/ready/crypto");
    const prev =
      decryptJson<ReadyLearnerFields>(bufferFromDb(row.fields_enc)) || {
        sex: "",
        date_of_birth: "",
        contract_type: "",
        csp: "",
        entry_date: "",
        diploma_level: "",
        hours: "",
        on_work_time: null,
      };
    const f = body.learner.fields || {};
    const next: ReadyLearnerFields = {
      sex: f.sex ?? prev.sex,
      date_of_birth: f.date_of_birth ?? prev.date_of_birth,
      contract_type: f.contract_type ?? prev.contract_type,
      csp: f.csp ?? prev.csp,
      entry_date: f.entry_date ?? prev.entry_date,
      diploma_level: f.diploma_level ?? prev.diploma_level,
      hours: f.hours ?? prev.hours,
      on_work_time:
        f.on_work_time === undefined ? prev.on_work_time : f.on_work_time,
    };
    await service
      .from("ready_learners")
      .update({
        fields_enc: encryptJson(next),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  }

  await updateReadyProgress(service, link.id);
  await logReadyEvent(service, link.id, "updated", {
    has_company: Boolean(body.company),
    has_learner: Boolean(body.learner?.id),
    payment_mode: body.payment_mode || null,
  });

  return securityHeaders(NextResponse.json({ ok: true }));
}
