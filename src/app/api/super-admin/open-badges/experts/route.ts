import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { resolveValidatorId } from "@/lib/lms/resolve-validator";
import { getServiceRoleClient } from "@/lib/supabase/server";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function isTestAccount(email: string, name: string): boolean {
  return /test|demo|jade|example\.com|famille|localhost|seed|formateur test/i.test(`${email} ${name}`);
}

function habilitated(domain: string, specialties: string[], headline: string): boolean {
  const expected = normalize(domain);
  if (expected.length < 3) return false;
  const haystack = normalize([headline, ...specialties].join(" "));
  if (!haystack) return false;
  if (haystack.includes(expected) || expected.includes(haystack)) return true;
  return expected.split(/[^a-z0-9]+/).filter((token) => token.length > 4).some((token) => haystack.includes(token));
}

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const domain = request.nextUrl.searchParams.get("domain")?.trim() ?? "";
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ experts: [] });
  const { data, error } = await supabase
    .from("experts")
    .select("id, first_name, last_name, email, photo_url, avatar_url, headline, specialties, review_status, is_active");
  if (error) return NextResponse.json({ experts: [], error: error.message });
  const matches = (data ?? []).filter((row) => {
    if (row.review_status !== "approved" || row.is_active !== true) return false;
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
    if (isTestAccount(String(row.email ?? ""), name)) return false;
    const specialties = Array.isArray(row.specialties) ? row.specialties.map(String) : [];
    return habilitated(domain, specialties, String(row.headline ?? ""));
  });
  const { data: badges } = await supabase.from("open_badges").select("evaluation_config").limit(400);
  const load = new Map<string, number>();
  for (const row of badges ?? []) {
    const config = row.evaluation_config && typeof row.evaluation_config === "object" ? row.evaluation_config as { validatorExpertId?: string } : {};
    const id = String(config.validatorExpertId ?? "");
    if (id) load.set(id, (load.get(id) ?? 0) + 1);
  }
  const experts = [];
  for (const row of matches) {
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "Expert";
    const id = await resolveValidatorId(supabase, String(row.id), name);
    if (!id) continue;
    experts.push({
      id,
      full_name: name,
      description: domain ? `Expert habilité · ${domain}` : "Expert habilité",
      photo_url: row.photo_url || row.avatar_url || null,
      openCount: load.get(id) ?? 0,
    });
  }
  experts.sort((left, right) => left.openCount - right.openCount || left.full_name.localeCompare(right.full_name, "fr"));
  return NextResponse.json({ experts });
}
