import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { channelMeta } from "@/lib/cfa/person-origin";
import { findCfaPersonByEmail } from "@/lib/cfa/upsert-cfa-person";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) return NextResponse.json({ exists: false });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const person = await findCfaPersonByEmail(db, email);
  if (!person || person.status === "rejected") return NextResponse.json({ exists: false });
  const stage = person.status === "prospect" ? "prospect" : "candidate";
  const meta = channelMeta(String(person.source_channel ?? ""));
  return NextResponse.json({
    exists: true,
    id: person.id,
    stage,
    stageLabel: stage === "prospect" ? "Futurs candidats" : "Admissions",
    name: `${person.first_name} ${person.last_name}`.trim(),
    channel: person.source_channel ?? null,
    channelLabel: meta.label,
    createdAt: person.created_at ?? null,
  });
}
