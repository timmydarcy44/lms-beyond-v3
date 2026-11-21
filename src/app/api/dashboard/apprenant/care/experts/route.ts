import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import path from "node:path";

import { CARE_HERO_PHOTO_CANDIDATES } from "@/lib/apprenant/care-theme";
import { CARE_PUBLIC_ORIGIN } from "@/lib/care/host";
import { loadCareDirectoryRows } from "@/lib/care/load-directory";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type CareLmsPractitioner = {
  slug: string;
  displayName: string;
  title: string;
  avatarUrl: string | null;
  domains: string[];
  serviceNames: string[];
  city: string | null;
  offersVisio: boolean;
  offersCabinet: boolean;
  durationMin: number | null;
  formatLine: string;
  /** Jamais de créneau précis — uniquement un libellé général s’il existe en base (sinon null). */
  availabilityHint: string | null;
  profileUrl: string;
};

function formatDuration(minutes: number) {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} h`;
  if (minutes > 60) return `${Math.floor(minutes / 60)} h ${minutes % 60}`;
  return `${minutes} min`;
}

function buildFormatLine(input: {
  offersVisio: boolean;
  offersCabinet: boolean;
  city: string | null;
  durationMin: number | null;
}) {
  const duration = input.durationMin != null ? formatDuration(input.durationMin) : null;
  const city = input.city?.trim() || null;
  let place = "Accompagnement";
  if (input.offersVisio && input.offersCabinet) {
    place = city ? `Visio ou cabinet à ${city}` : "Visio ou cabinet";
  } else if (input.offersVisio) {
    place = "Visio";
  } else if (input.offersCabinet) {
    place = city ? `Cabinet à ${city}` : "Cabinet";
  }
  return duration ? `${place} · ${duration}` : place;
}

function isMinorFromBirthDate(value: string | null | undefined): boolean | null {
  if (!value) return null;
  const iso = String(value).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const born = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(born.getTime())) return null;
  const today = new Date();
  const cutoff = new Date(Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate()));
  return born > cutoff;
}

function resolveHeroPhotos() {
  const root = process.cwd();
  return CARE_HERO_PHOTO_CANDIDATES.filter((candidate) => {
    const absolute = path.join(root, "public", candidate.replace(/^\//, ""));
    return existsSync(absolute);
  });
}

/**
 * Annuaire public Care pour l’accueil LMS.
 * Aucun écriture, aucun log sujet/praticien lié à l’apprenant.
 * Le paramètre ?sujet= n’est pas lu ici : le filtre reste côté client (URL uniquement).
 */
export async function GET() {
  const authClient = await createSupabaseServerClient();
  if (!authClient) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const db = getServiceRoleClient() ?? authClient;
  const [{ data: profile }, rows] = await Promise.all([
    db.from("profiles").select("birth_date").eq("id", user.id).maybeSingle(),
    loadCareDirectoryRows(),
  ]);

  const expertIds = rows.map((row) => row.expert_id);
  const durationByExpert = new Map<string, number>();
  if (expertIds.length) {
    const { data: services } = await db
      .from("care_services")
      .select("expert_id, name, duration_min, active, price_cents")
      .in("expert_id", expertIds)
      .eq("active", true);
    const SESSION_NAME = /accompagnement|s[ée]ance|consultation|suivi/i;
    const grouped = new Map<string, { name: string; duration_min: number }[]>();
    for (const service of services ?? []) {
      const expertId = String(service.expert_id);
      const list = grouped.get(expertId) ?? [];
      list.push({
        name: String(service.name ?? ""),
        duration_min: Number(service.duration_min) || 0,
      });
      grouped.set(expertId, list);
    }
    for (const [expertId, list] of grouped) {
      const sessions = list.filter((item) => item.duration_min > 0 && SESSION_NAME.test(item.name));
      const pool = sessions.length ? sessions : list.filter((item) => item.duration_min > 0);
      if (!pool.length) continue;
      durationByExpert.set(
        expertId,
        Math.min(...pool.map((item) => item.duration_min)),
      );
    }
  }

  const practitioners: CareLmsPractitioner[] = rows.map((row) => {
    const durationMin = durationByExpert.get(row.expert_id) ?? null;
    const slug = row.slug;
    return {
      slug,
      displayName: row.display_name,
      title: row.title || "",
      avatarUrl: row.avatar_url,
      domains: (row.domains ?? []).map(String),
      serviceNames: row.service_names ?? [],
      city: row.city,
      offersVisio: row.offers_visio,
      offersCabinet: row.offers_cabinet,
      durationMin,
      formatLine: buildFormatLine({
        offersVisio: row.offers_visio,
        offersCabinet: row.offers_cabinet,
        city: row.city,
        durationMin,
      }),
      availabilityHint: null,
      profileUrl: `${CARE_PUBLIC_ORIGIN}/praticiens/${encodeURIComponent(slug)}?utm_source=byound-lms`,
    };
  });

  return NextResponse.json({
    practitioners,
    isMinor: isMinorFromBirthDate(
      profile && "birth_date" in profile ? (profile.birth_date as string | null) : null,
    ),
    heroPhotos: resolveHeroPhotos(),
    directoryUrl: `${CARE_PUBLIC_ORIGIN}/praticiens?utm_source=byound-lms`,
    careHomeUrl: `${CARE_PUBLIC_ORIGIN}/?utm_source=byound-lms`,
    source: "care_profiles",
  });
}
