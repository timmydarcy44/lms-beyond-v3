import { NextRequest, NextResponse } from "next/server";
import { CARE_SQL_HINT, missingRelation, requireCareExpert } from "@/lib/expert/care-auth";

const SELECT_FULL =
  "id,first_name,last_name,email,phone,address_line,postal_code,city,follow_up,child_one_first_name,child_one_last_name,child_two_first_name,child_two_last_name,notes,created_at";
const SELECT_BASIC = "id,first_name,last_name,email,phone,notes,created_at";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const id = (await params).id?.trim();
  if (!id) return NextResponse.json({ error: "Membre requis" }, { status: 400 });

  let clientQuery = await gate.db
    .from("expert_care_clients")
    .select(SELECT_FULL)
    .eq("id", id)
    .eq("expert_id", gate.expertId)
    .maybeSingle();
  if (clientQuery.error) {
    clientQuery = await gate.db
      .from("expert_care_clients")
      .select(SELECT_BASIC)
      .eq("id", id)
      .eq("expert_id", gate.expertId)
      .maybeSingle();
  }
  if (clientQuery.error) {
    return NextResponse.json({ error: missingRelation(clientQuery.error) ? CARE_SQL_HINT : clientQuery.error.message }, { status: 500 });
  }
  if (!clientQuery.data) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const [responses, invites] = await Promise.all([
    gate.db
      .from("expert_care_responses")
      .select("id,test_slug,score,score_label,synthesis,answers,submitted_at")
      .eq("expert_id", gate.expertId)
      .eq("client_id", id)
      .order("submitted_at", { ascending: false }),
    gate.db
      .from("expert_care_invites")
      .select("id,test_slug,sent_at,opened_at,completed_at,created_at")
      .eq("expert_id", gate.expertId)
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    client: clientQuery.data,
    responses: responses.data ?? [],
    invites: invites.data ?? [],
    error: responses.error?.message || invites.error?.message || null,
  });
}
