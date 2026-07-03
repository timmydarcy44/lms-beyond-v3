import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireEdgeAdmin } from "@/lib/auth/require-edge-admin";
import {
  getExpertApprovedEmail,
  getExpertNeedsInfoEmail,
  getExpertRejectedEmail,
} from "@/lib/emails/templates/expert-review-emails";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { EXPERT_NEXT_PATH } from "@/lib/expert/signup-redirect";
import { publicAppUrl } from "@/lib/env";
import { getServiceRoleClient } from "@/lib/supabase/server";

type ReviewAction = "approve" | "reject" | "needs_info";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireEdgeAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const action = body?.action as ReviewAction;
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!action || !["approve", "reject", "needs_info"].includes(action)) {
    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  }

  if ((action === "reject" || action === "needs_info") && !message) {
    return NextResponse.json({ error: "Un message est requis pour cette action." }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: expert, error: fetchError } = await supabase
    .from("experts")
    .select("id,email,first_name,last_name,references")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !expert) {
    return NextResponse.json({ error: "Expert introuvable." }, { status: 404 });
  }

  const firstName = expert.first_name?.trim() || "";
  const email = expert.email?.trim().toLowerCase() || "";

  if (!email) {
    return NextResponse.json({ error: "Email expert manquant." }, { status: 400 });
  }

  const origin = publicAppUrl()?.replace(/\/$/, "") || request.nextUrl.origin.replace(/\/$/, "");
  const dashboardLink = `${origin}${EXPERT_NEXT_PATH}`;

  let review_status: string;
  let is_active: boolean;
  let references = Array.isArray(expert.references) ? [...expert.references] : [];

  if (action === "approve") {
    review_status = "approved";
    is_active = true;

    await supabase.from("profiles").upsert({ id: expert.id, email, role: "expert" }, { onConflict: "id" });

    const template = getExpertApprovedEmail({ firstName, dashboardLink });
    await sendEmail({ to: email, subject: template.subject, html: template.html, from: EDGE_COCKPIT_FROM });
  } else if (action === "reject") {
    review_status = "rejected";
    is_active = false;
    references = [
      ...references.filter((r) => !(r && typeof r === "object" && (r as { _type?: string })._type === "edge_review_note")),
      { _type: "edge_review_note", action: "rejected", message, at: new Date().toISOString() },
    ];
    const template = getExpertRejectedEmail({ firstName, reason: message });
    await sendEmail({ to: email, subject: template.subject, html: template.html, from: EDGE_COCKPIT_FROM });
  } else {
    review_status = "needs_info";
    is_active = false;
    references = [
      ...references.filter((r) => !(r && typeof r === "object" && (r as { _type?: string })._type === "edge_review_note")),
      { _type: "edge_review_note", action: "needs_info", message, at: new Date().toISOString() },
    ];
    const template = getExpertNeedsInfoEmail({ firstName, message });
    await sendEmail({ to: email, subject: template.subject, html: template.html, from: EDGE_COCKPIT_FROM });
  }

  const { error: updateError } = await supabase
    .from("experts")
    .update({ review_status, is_active, references })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  revalidatePath("/admin/experts");
  revalidatePath(`/admin/experts/${id}`);
  revalidatePath("/dashboard/expert");

  return NextResponse.json({ success: true, review_status, is_active });
}
