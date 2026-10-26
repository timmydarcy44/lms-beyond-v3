import type { SupabaseClient } from "@supabase/supabase-js";
import { ANONYMITY_MESSAGE, publicSlug, scanOfferAnonymity, type AnonymityQuestion } from "@/lib/offres/anonymity";

type Diffusion = { byound?: boolean; linkedin?: boolean } | null;

function text(value: unknown) {
  return String(value ?? "").trim();
}

function questionsOf(value: unknown): AnonymityQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item as { id?: unknown; prompt?: unknown };
      return { id: text(row.id), prompt: text(row.prompt) };
    })
    .filter((item) => item.prompt);
}

async function companyNames(db: SupabaseClient, schoolId: string) {
  const names: string[] = [];
  const org = await db.from("organizations").select("name").eq("id", schoolId).maybeSingle();
  const orgName = text((org.data as { name?: string | null } | null)?.name);
  if (orgName) names.push(orgName);
  const companies = await db
    .from("cfa_companies")
    .select("company_name, trade_name")
    .eq("organization_id", schoolId);
  if (!companies.error) {
    for (const row of companies.data ?? []) {
      const item = row as { company_name?: string | null; trade_name?: string | null };
      if (text(item.company_name)) names.push(text(item.company_name));
      if (text(item.trade_name)) names.push(text(item.trade_name));
    }
  }
  return names;
}

export async function publicPublicationPatch(
  db: SupabaseClient,
  input: {
    offerId: string;
    schoolId: string;
    publishing: boolean;
    current: Record<string, unknown>;
    next: Record<string, unknown>;
  },
) {
  const pick = (key: string) => (key in input.next ? input.next[key] : input.current[key]);
  const diffusion = (pick("diffusion") as Diffusion) ?? null;
  const wantsPublic = diffusion?.byound !== false;
  const names = await companyNames(db, input.schoolId);
  const benefits = Array.isArray(pick("benefits"))
    ? (pick("benefits") as Array<{ label?: string }>).map((item) => text(item.label)).filter(Boolean)
    : [];
  const scanned = scanOfferAnonymity({
    names,
    title: text(pick("title")),
    description: text(pick("description")),
    requirements: text(pick("requirements")),
    diploma: text(pick("diploma_prepared")),
    city: text(pick("city")),
    benefits,
    questions: questionsOf(pick("screening_questions")),
  });

  const patch: Record<string, unknown> = {
    public_listing: wantsPublic,
    anonymity_flags: scanned.flags,
  };

  if (!input.publishing) {
    if (scanned.flags.length && wantsPublic) patch.public_status = "blocked";
    return { patch, block: null, pending: false, flags: scanned.flags, rewrite: scanned.rewrite };
  }

  if (!wantsPublic) {
    patch.public_listing = false;
    return { patch, block: null, pending: false, flags: [], rewrite: scanned.rewrite };
  }

  if (scanned.flags.length) {
    patch.public_status = "blocked";
    return {
      patch,
      block: { error: ANONYMITY_MESSAGE, flags: scanned.flags, rewrite: scanned.rewrite },
      pending: false,
      flags: scanned.flags,
      rewrite: scanned.rewrite,
    };
  }

  const currentStatus = text(input.current.public_status);
  const existingSlug = text(input.current.public_slug);
  const weakSlug = !existingSlug || /^offre-[a-z0-9]{4}$/i.test(existingSlug);
  patch.public_slug = weakSlug
    ? publicSlug(text(pick("title")), text(pick("city")), input.offerId)
    : existingSlug;

  if (currentStatus === "published" || currentStatus === "pending_review") {
    patch.public_status = currentStatus;
    return {
      patch,
      block: null,
      pending: currentStatus === "pending_review",
      flags: [],
      rewrite: scanned.rewrite,
    };
  }

  const previous = await db
    .from("job_offers")
    .select("id", { count: "exact", head: true })
    .eq("school_id", input.schoolId)
    .eq("public_status", "published")
    .neq("id", input.offerId);
  const first = previous.error ? true : (previous.count ?? 0) === 0;
  patch.public_status = first ? "pending_review" : "published";
  return {
    patch,
    block: null,
    pending: first,
    flags: [],
    rewrite: scanned.rewrite,
  };
}
