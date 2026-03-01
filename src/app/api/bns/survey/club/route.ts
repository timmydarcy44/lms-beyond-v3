import { NextResponse } from "next/server";

import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const HARD_SKILLS = [
  "negocier_grands_comptes",
  "sales_deck",
  "solution_complexe",
  "prospecter_comptes",
  "crm_pipeline",
] as const;

const VALIDATION_OPTIONS = ["audit_pdf", "video", "case_timed", "crm_analysis", "qcm"] as const;

const CONTACT_CHANNELS = ["email", "phone"] as const;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const rateLimitStore = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

export async function POST(request: Request) {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, code: "SUPABASE_UNAVAILABLE", details: "Missing server client" },
      { status: 500 },
    );
  }

  const ipHeader = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (ipHeader !== "unknown") {
    const now = Date.now();
    const entry = rateLimitStore.get(ipHeader);
    if (!entry || now - entry.ts > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.set(ipHeader, { count: 1, ts: now });
    } else {
      entry.count += 1;
      rateLimitStore.set(ipHeader, entry);
      if (entry.count > RATE_LIMIT_MAX) {
        return NextResponse.json(
          { ok: false, code: "RATE_LIMIT", details: "Too many submissions" },
          { status: 429 },
        );
      }
    }
  }

  const payload = await request.json();
  const website = payload?.website;
  if (isNonEmptyString(website)) {
    return NextResponse.json({ ok: true });
  }

  const club = payload?.club?.trim();
  const firstName = payload?.first_name?.trim();
  const lastName = payload?.last_name?.trim();

  if (!isNonEmptyString(club) || !isNonEmptyString(firstName) || !isNonEmptyString(lastName)) {
    return NextResponse.json(
      { ok: false, code: "MISSING_FIELDS", details: "club, first_name, last_name required" },
      { status: 400 },
    );
  }

  const hardSkills = payload?.hard_skills;
  const priorities = hardSkills?.priorities ?? hardSkills;
  const softSkills = Array.isArray(payload?.soft_skills) ? payload.soft_skills : [];
  const preferredValidation = payload?.preferred_validation;

  const hasAllHardSkills =
    priorities &&
    typeof priorities === "object" &&
    HARD_SKILLS.every((key) =>
      ["critique", "importante", "utile", "bonus"].includes(priorities[key]),
    );

  if (!hasAllHardSkills) {
    return NextResponse.json(
      { ok: false, code: "HARD_SKILLS_REQUIRED", details: "hard_skills incomplete" },
      { status: 400 },
    );
  }

  if (softSkills.length > 3) {
    return NextResponse.json(
      { ok: false, code: "SOFT_SKILLS_LIMIT", details: "soft_skills max 3" },
      { status: 400 },
    );
  }

  if (!VALIDATION_OPTIONS.includes(preferredValidation)) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_REQUIRED", details: "preferred_validation required" },
      { status: 400 },
    );
  }

  const optin = Boolean(payload?.beyond_connect_optin);
  const preferredContactChannel = payload?.preferred_contact_channel;
  const phone = payload?.phone?.trim();

  if (optin && !CONTACT_CHANNELS.includes(preferredContactChannel)) {
    return NextResponse.json(
      { ok: false, code: "CONTACT_CHANNEL_REQUIRED", details: "channel required" },
      { status: 400 },
    );
  }

  if (optin && preferredContactChannel === "phone" && !isNonEmptyString(phone)) {
    return NextResponse.json(
      { ok: false, code: "PHONE_REQUIRED", details: "phone required for opt-in" },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabase
      .from("bns_club_survey_responses")
      .insert({
        club,
        first_name: firstName,
        last_name: lastName,
        role: payload?.role ?? null,
        email: payload?.email ?? null,
        phone: payload?.phone ?? null,
        hard_skills: hardSkills,
        soft_skills: softSkills,
        preferred_validation: preferredValidation,
        market_gap: payload?.market_gap ?? null,
        beyond_connect_optin: optin,
        preferred_contact_channel: preferredContactChannel ?? null,
        user_agent: request.headers.get("user-agent"),
        source: payload?.source ?? "bns",
        version: payload?.version ?? "v1",
        website: null,
      })
      .select("id")
      .maybeSingle();

    if (error || !data) {
      console.error("[BNS] survey insert failed", {
        error,
        payloadKeys: Object.keys(payload ?? {}),
      });
      return NextResponse.json(
        {
          ok: false,
          code: "SUPABASE_INSERT_FAILED",
          details: error?.message ?? "Unknown insert error",
          hint: error?.hint ?? null,
          status: error?.code ?? null,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    console.error("[BNS] survey insert exception", {
      error,
      payloadKeys: Object.keys(payload ?? {}),
    });
    return NextResponse.json(
      {
        ok: false,
        code: "SUPABASE_INSERT_FAILED",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

