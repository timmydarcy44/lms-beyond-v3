import { NextRequest, NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { jadeResources } from "@/lib/demo/jade-tutor-pages";
import { relationMissing } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET(request: NextRequest) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (isJadeDemoEmail(auth.ctx.email)) return NextResponse.json(jadeResources());
  const category = new URL(request.url).searchParams.get("cat");
  const rows = await auth.ctx.supabase.from("tutor_resources").select("id, category, title, description, format, url, external, is_featured, sort_order").eq("published", true).order("sort_order");
  if (relationMissing(rows.error)) {
    return NextResponse.json({ featured: null, badge: { done: 0, total: 4, steps: [] }, resources: [], referent: null });
  }
  const list = (rows.data ?? []).filter((row) => !category || category === "tout" || row.category === category);
  const featured = (rows.data ?? []).find((row) => row.is_featured) ?? null;
  const views = await auth.ctx.supabase.from("tutor_resource_views").select("resource_id").eq("user_id", auth.ctx.userId);
  const guideSeen = Boolean(featured && (views.data ?? []).some((row) => String(row.resource_id) === String(featured.id)));
  const now = new Date().toISOString();
  const onboarding = await auth.ctx.supabase.from("tutor_appointments").select("id").eq("tutor_id", auth.ctx.userId).eq("type", "onboarding").lt("ends_at", now).limit(1);
  const tripartite = await auth.ctx.supabase.from("tutor_appointments").select("id").eq("tutor_id", auth.ctx.userId).eq("type", "tripartite").lt("ends_at", now).limit(1);
  const booklets = await auth.ctx.supabase.from("apprenticeship_booklets").select("id").eq("tutor_id", auth.ctx.userId);
  const bookletIds = (booklets.data ?? []).map((row) => String(row.id));
  const periods = bookletIds.length
    ? await auth.ctx.supabase.from("booklet_periods").select("id").in("booklet_id", bookletIds)
    : { data: [] };
  const periodIds = (periods.data ?? []).map((row) => String(row.id));
  const signed = periodIds.length
    ? await auth.ctx.supabase.from("booklet_signatures").select("period_id").eq("signer_role", "tutor").in("period_id", periodIds)
    : { data: [] };
  const signedCount = new Set((signed.data ?? []).map((row) => String(row.period_id))).size;
  const steps = [
    { id: "guide", label: "Lire le guide du tuteur", done: guideSeen },
    { id: "onboarding", label: "Réaliser l'entretien d'intégration", done: Boolean(onboarding.data?.length) },
    { id: "tripartite", label: "Participer à une visite tripartite", done: Boolean(tripartite.data?.length) },
    { id: "periods", label: "Signer 2 périodes du livret", done: signedCount >= 2 },
  ];
  const actionOf = (categoryName: string, external: boolean) => {
    if (external) return "Ouvrir";
    if (categoryName === "video") return "Regarder";
    if (categoryName === "template") return "Télécharger";
    return "Lire";
  };
  return NextResponse.json({
    featured: featured
      ? { id: featured.id, title: featured.title, description: featured.description, action: "Télécharger le PDF", url: featured.url }
      : null,
    badge: { done: steps.filter((step) => step.done).length, total: 4, steps },
    resources: list.filter((row) => !row.is_featured).map((row) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      description: row.description,
      format: row.format,
      action: actionOf(String(row.category), Boolean(row.external)),
      external: Boolean(row.external),
      url: row.url,
    })),
    referent: null,
  });
}
