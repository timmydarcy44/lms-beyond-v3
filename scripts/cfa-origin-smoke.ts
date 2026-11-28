/**
 * Vérifs CFA origin — e-mails +test uniquement. Ne touche pas les fiches réelles.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || "";
if (!url || !key) {
  console.log("SKIP: pas de service role local");
  process.exit(0);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const TEST_A = "cfa.origin.brochure+test@example.com";
const TEST_B = "cfa.origin.prescriber+test@example.com";

async function main() {
  const probe = await db.from("cfa_applications").select("id, source_channel, status").limit(1);
  if (probe.error) {
    console.log("PROBE_ERROR", probe.error.message);
    return;
  }
  const hasOrigin = probe.data?.[0] ? "source_channel" in (probe.data[0] as object) || true : true;
  const unknown = await db
    .from("cfa_applications")
    .select("id", { count: "exact", head: true })
    .neq("status", "prospect")
    .is("source_channel", null);
  console.log("UNKNOWN_CANDIDATES", unknown.count ?? unknown.error?.message ?? "n/a");
  const prospectsNew = await db
    .from("cfa_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "prospect")
    .eq("prospect_status", "new");
  console.log("PROSPECTS_NEW", prospectsNew.count ?? prospectsNew.error?.message ?? "n/a");
  const incoming = await db
    .from("formation_dossiers")
    .select("id", { count: "exact", head: true })
    .eq("status", "qualification")
    .in("source", ["dashboard_request", "site_request"]);
  console.log("BUSINESS_INCOMING", incoming.count ?? incoming.error?.message ?? "n/a");

  if (!hasOrigin) return;

  await db.from("cfa_applications").delete().in("email", [TEST_A, TEST_B]);

  const brochure = await db.from("cfa_applications").insert({
    status: "prospect",
    prospect_status: "new",
    first_name: "Léa",
    last_name: "Test",
    email: TEST_A,
    phone: "0600000001",
    specialization: "ai_business",
    source_family: "web",
    source_channel: "web_brochure",
    first_touch: "web_brochure",
    last_touch: "web_brochure",
    utm_source: "instagram",
    utm_medium: "paid",
    utm_campaign: "jpo-decembre",
    contact_consent: true,
    contact_consent_at: new Date().toISOString(),
    is_test: true,
    follow_up_at: new Date(Date.now() + 48 * 36e5).toISOString(),
  }).select("id, first_touch, status").single();
  console.log("BROCHURE", brochure.error?.message ?? brochure.data);

  if (brochure.data?.id) {
    const promote = await db
      .from("cfa_applications")
      .update({
        status: "challenge",
        last_touch: "web_preregistration",
        source_channel: "web_preregistration",
        prospect_status: null,
      })
      .eq("id", brochure.data.id)
      .eq("email", TEST_A)
      .select("id, status, first_touch, source_channel")
      .single();
    console.log("PROMOTE", promote.error?.message ?? promote.data);
  }

  const prescriber = await db.from("cfa_applications").insert({
    status: "profile",
    first_name: "Yanis",
    last_name: "Test",
    email: TEST_B,
    phone: "0600000002",
    specialization: "ai_business",
    source_family: "human",
    source_channel: "prescriber",
    first_touch: "prescriber",
    last_touch: "prescriber",
    prescriber_type: "mission_locale",
    contact_consent: true,
    is_test: true,
  }).select("id, source_channel, prescriber_type").single();
  console.log("PRESCRIBER", prescriber.error?.message ?? prescriber.data);

  const dup = await db.from("cfa_applications").select("id, email").ilike("email", TEST_B);
  console.log("DUP_COUNT", dup.data?.length ?? dup.error?.message);

  await db.from("cfa_applications").delete().in("email", [TEST_A, TEST_B]);
  console.log("CLEANED_TEST_ROWS");
}

void main();
