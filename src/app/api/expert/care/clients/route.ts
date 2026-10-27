import { NextRequest, NextResponse } from "next/server";
import { CARE_SQL_HINT, missingRelation, requireCareExpert } from "@/lib/expert/care-auth";

export async function GET() {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const { data, error } = await gate.db
    .from("expert_care_clients")
    .select("id,first_name,last_name,email,phone,notes,created_at")
    .eq("expert_id", gate.expertId)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: missingRelation(error) ? CARE_SQL_HINT : error.message, clients: [] }, { status: missingRelation(error) ? 200 : 500 });
  }
  return NextResponse.json({ clients: data ?? [] });
}

export async function POST(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  if (!email.includes("@")) return NextResponse.json({ error: "Email requis" }, { status: 400 });
  const { data, error } = await gate.db
    .from("expert_care_clients")
    .insert({
      expert_id: gate.expertId,
      first_name: body?.first_name?.trim() || "",
      last_name: body?.last_name?.trim() || "",
      email,
      phone: body?.phone?.trim() || null,
      notes: body?.notes?.trim() || null,
    })
    .select("id,first_name,last_name,email,phone,notes,created_at")
    .single();
  if (error) {
    return NextResponse.json({ error: missingRelation(error) ? CARE_SQL_HINT : error.message }, { status: 500 });
  }
  return NextResponse.json({ client: data });
}
