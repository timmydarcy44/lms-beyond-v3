import { NextRequest, NextResponse } from "next/server";

import { parseRegistrationMeta } from "@/lib/expert/expert-registration-meta";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ sent: 0 });
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const docs = await service
    .from("expert_documents")
    .select("id,expert_id,name,expires_at")
    .eq("folder", "attestation")
    .gte("expires_at", today)
    .lte("expires_at", in30);
  const due: Array<{ expertId: string; name: string; expiresAt: string }> = [];
  if (!docs.error) {
    for (const doc of docs.data ?? []) {
      if (doc.expert_id && doc.expires_at) due.push({ expertId: doc.expert_id, name: doc.name, expiresAt: String(doc.expires_at).slice(0, 10) });
    }
  }
  const experts = await service.from("experts").select("id,references");
  for (const expert of experts.data ?? []) {
    const meta = parseRegistrationMeta(expert.references);
    for (const doc of meta?.documents ?? []) {
      const folder = doc.folder ?? (doc.category === "certificates" || doc.category === "diplomas" ? "attestation" : null);
      const expiresAt = doc.expires_at?.slice(0, 10);
      if (folder !== "attestation" || !expiresAt || expiresAt < today || expiresAt > in30) continue;
      due.push({ expertId: expert.id, name: doc.name, expiresAt });
    }
  }
  const seen = new Set<string>();
  let sent = 0;
  for (const doc of due) {
    const key = `${doc.expertId}:${doc.name}:${doc.expiresAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const message = `${doc.name} expire le ${doc.expiresAt}.`;
    const existing = await service
      .from("notifications")
      .select("id")
      .eq("user_id", doc.expertId)
      .eq("title", "Attestation bientôt expirée")
      .eq("message", message)
      .eq("read", false)
      .limit(1);
    if (existing.data?.length) continue;
    const note = await service.from("notifications").insert({
      user_id: doc.expertId,
      type: "info",
      title: "Attestation bientôt expirée",
      message,
      read: false,
    });
    if (!note.error) sent += 1;
  }
  return NextResponse.json({ sent });
}
