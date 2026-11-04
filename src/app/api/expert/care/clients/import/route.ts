import { NextRequest, NextResponse } from "next/server";
import { CARE_SQL_HINT, missingRelation, requireCareExpert } from "@/lib/expert/care-auth";
import { parseCareClientCsv, type CareClientCsvSkip } from "@/lib/expert/care-client-csv";

export async function POST(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as { csv?: string } | null;
  const parsed = parseCareClientCsv(typeof body?.csv === "string" ? body.csv : "");
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!parsed.rows.length && !parsed.skipped.length) {
    return NextResponse.json({ error: "Aucune ligne à importer." }, { status: 400 });
  }

  const existing = await gate.db.from("expert_care_clients").select("email").eq("expert_id", gate.expertId);
  if (existing.error) {
    return NextResponse.json({ error: missingRelation(existing.error) ? CARE_SQL_HINT : existing.error.message }, { status: 500 });
  }
  const known = new Set((existing.data ?? []).map((row) => String(row.email ?? "").trim().toLowerCase()).filter(Boolean));
  const skipped: CareClientCsvSkip[] = [...parsed.skipped];
  const fresh = parsed.rows.filter((row) => {
    if (!known.has(row.email)) return true;
    skipped.push({ line: row.line, email: row.email, reason: "Déjà dans le CRM." });
    return false;
  });

  if (!fresh.length) return NextResponse.json({ imported: 0, skipped });

  const payload = fresh.map((row) => ({
    expert_id: gate.expertId,
    first_name: row.first_name.trim(),
    last_name: row.last_name.trim(),
    email: row.email,
    phone: row.phone.trim(),
    address_line: row.address_line.trim(),
    postal_code: row.postal_code.trim(),
    city: row.city.trim(),
    follow_up: row.follow_up,
    child_one_first_name: row.child_one_first_name.trim() || null,
    child_one_last_name: row.child_one_last_name.trim() || null,
    child_two_first_name: row.child_two_first_name.trim() || null,
    child_two_last_name: row.child_two_last_name.trim() || null,
    notes: row.notes.trim() || null,
  }));

  const inserted = await gate.db.from("expert_care_clients").insert(payload).select("id");
  if (inserted.error) {
    return NextResponse.json(
      { error: missingRelation(inserted.error) ? CARE_SQL_HINT : inserted.error.message, skipped },
      { status: 500 },
    );
  }
  return NextResponse.json({ imported: inserted.data?.length ?? fresh.length, skipped });
}
