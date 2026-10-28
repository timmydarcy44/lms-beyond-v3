"use server";

import { getSession } from "@/lib/auth/session";
import { careCompleteness, slugifyCareName } from "@/lib/care/completeness";
import { sendCareCancellationEmails } from "@/lib/care/booking-emails";
import { revalidateCarePublicProfile } from "@/lib/care/revalidate-profile";
import { CARE_DOMAIN_IDS, type CareDomain } from "@/lib/care/domains";
import { requireCarePage } from "@/lib/expert/care-page";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { CareSessionFormat } from "@/lib/care/available-slots";

type Result = { ok: true } | { ok: false; message: string };

async function actor() {
  await requireCarePage();
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) return null;
  return { id: session.id, db };
}

function asFormats(value: unknown): CareSessionFormat[] {
  return (Array.isArray(value) ? value : []).filter((item): item is CareSessionFormat => item === "cabinet" || item === "visio");
}

export async function saveCarePublicProfile(payload: {
  display_name: string;
  slug: string;
  title: string;
  tagline: string;
  headline: string;
  bio: string;
  approach: string;
  avatar_url: string | null;
  domains: string[];
  publics: string[];
  city: string;
  address: string;
  offers_cabinet: boolean;
  offers_visio: boolean;
  languages: string[];
  payment_methods: string[];
  cancellation_hours: number;
  published: boolean;
  services: Array<{
    id?: string;
    name: string;
    domain: string;
    description: string;
    duration_min: number;
    formats: string[];
    price_cents: number;
    active: boolean;
  }>;
  experiences: Array<{ id?: string; period_label: string; role: string; organization: string; description: string }>;
  trainings: Array<{ id?: string; year: string; title: string; organization: string }>;
}): Promise<Result> {
  const ctx = await actor();
  if (!ctx) return { ok: false, message: "Session expirée." };
  const domains = payload.domains.filter((item): item is CareDomain => CARE_DOMAIN_IDS.includes(item as CareDomain));
  const services = payload.services.map((item, index) => ({
    ...item,
    position: index,
    domain: (CARE_DOMAIN_IDS.includes(item.domain as CareDomain) ? item.domain : "famille") as CareDomain,
    formats: asFormats(item.formats),
    duration_min: Math.max(1, Number(item.duration_min) || 60),
    price_cents: Math.max(0, Math.round(Number(item.price_cents) || 0)),
  }));
  if (services.some((item) => !item.formats.length)) {
    return { ok: false, message: "Chaque prestation doit proposer au moins un format." };
  }
  const completeness = careCompleteness({
    avatar_url: payload.avatar_url,
    title: payload.title,
    tagline: payload.tagline,
    domains,
    services: services.map((item) => ({
      id: item.id ?? "new",
      expert_id: ctx.id,
      position: item.position,
      name: item.name,
      domain: item.domain,
      description: item.description,
      duration_min: item.duration_min,
      formats: item.formats,
      price_cents: item.price_cents,
      active: item.active,
    })),
  });
  if (payload.published && !completeness.canPublish) {
    return {
      ok: false,
      message: `Impossible de publier : ${completeness.missing.map((item) => item.label).join(", ")}.`,
    };
  }
  const { data: current } = await ctx.db.from("care_profiles").select("slug").eq("expert_id", ctx.id).maybeSingle();
  const previousSlug = String(current?.slug ?? "");
  let slug = slugifyCareName(payload.slug || payload.display_name);
  if (!slug) slug = previousSlug || "praticien";
  const { data: clash } = await ctx.db.from("care_profiles").select("expert_id").eq("slug", slug).maybeSingle();
  if (clash && String(clash.expert_id) !== ctx.id) {
    return { ok: false, message: "Ce slug est déjà utilisé." };
  }
  const { error: profileError } = await ctx.db.from("care_profiles").upsert({
    expert_id: ctx.id,
    slug,
    is_care: true,
    published: payload.published && completeness.canPublish,
    display_name: payload.display_name.trim(),
    title: payload.title.trim(),
    tagline: payload.tagline.trim().slice(0, 140),
    headline: payload.headline.trim(),
    bio: payload.bio.trim(),
    approach: payload.approach.trim(),
    avatar_url: payload.avatar_url,
    domains,
    publics: payload.publics.map(String),
    city: payload.city.trim() || null,
    address: payload.address.trim() || null,
    offers_cabinet: payload.offers_cabinet,
    offers_visio: payload.offers_visio,
    languages: payload.languages,
    payment_methods: payload.payment_methods,
    cancellation_hours: Math.max(0, Number(payload.cancellation_hours) || 24),
    updated_at: new Date().toISOString(),
  });
  if (profileError) return { ok: false, message: "Enregistrement du profil impossible." };

  const { data: existingServices } = await ctx.db.from("care_services").select("id").eq("expert_id", ctx.id);
  const keepIds = new Set(services.map((item) => item.id).filter(Boolean));
  const { data: booked } = await ctx.db.from("care_bookings").select("service_id").eq("expert_id", ctx.id);
  const bookedIds = new Set((booked ?? []).map((item) => String(item.service_id)));
  for (const row of existingServices ?? []) {
    const id = String(row.id);
    if (keepIds.has(id)) continue;
    if (bookedIds.has(id)) {
      await ctx.db.from("care_services").update({ active: false }).eq("id", id).eq("expert_id", ctx.id);
    } else {
      await ctx.db.from("care_services").delete().eq("id", id).eq("expert_id", ctx.id);
    }
  }
  for (const item of services) {
    const body = {
      expert_id: ctx.id,
      position: item.position,
      name: item.name.trim(),
      domain: item.domain,
      description: item.description.trim(),
      duration_min: item.duration_min,
      formats: item.formats,
      price_cents: item.price_cents,
      active: item.active,
    };
    if (item.id) {
      const updated = await ctx.db.from("care_services").update(body).eq("id", item.id).eq("expert_id", ctx.id).select("id");
      if (!updated.data?.length) await ctx.db.from("care_services").insert({ id: item.id, ...body });
    } else {
      await ctx.db.from("care_services").insert(body);
    }
  }

  await ctx.db.from("care_experiences").delete().eq("expert_id", ctx.id);
  if (payload.experiences.length) {
    await ctx.db.from("care_experiences").insert(
      payload.experiences.map((item, index) => ({
        expert_id: ctx.id,
        position: index,
        period_label: item.period_label.trim(),
        role: item.role.trim(),
        organization: item.organization.trim(),
        description: item.description.trim(),
      })),
    );
  }
  await ctx.db.from("care_trainings").delete().eq("expert_id", ctx.id);
  if (payload.trainings.length) {
    await ctx.db.from("care_trainings").insert(
      payload.trainings.map((item, index) => ({
        expert_id: ctx.id,
        position: index,
        year: item.year.trim(),
        title: item.title.trim(),
        organization: item.organization.trim(),
      })),
    );
  }
  revalidateCarePublicProfile(slug);
  if (previousSlug && previousSlug !== slug) revalidateCarePublicProfile(previousSlug);
  return { ok: true };
}

export async function saveCareAvailability(payload: {
  rules: Array<{ weekday: number; start_time: string; end_time: string; format: string }>;
  exceptions: Array<{ date: string; is_closed: boolean; start_time: string | null; end_time: string | null }>;
}): Promise<Result> {
  const ctx = await actor();
  if (!ctx) return { ok: false, message: "Session expirée." };
  await ctx.db.from("care_availability_rules").delete().eq("expert_id", ctx.id);
  if (payload.rules.length) {
    const { error } = await ctx.db.from("care_availability_rules").insert(
      payload.rules.map((item, index) => ({
        expert_id: ctx.id,
        position: index,
        weekday: item.weekday,
        start_time: item.start_time,
        end_time: item.end_time,
        format: item.format === "cabinet" || item.format === "both" ? item.format : "visio",
      })),
    );
    if (error) return { ok: false, message: "Vérifiez les horaires (fin après début)." };
  }
  await ctx.db.from("care_availability_exceptions").delete().eq("expert_id", ctx.id);
  if (payload.exceptions.length) {
    const { error } = await ctx.db.from("care_availability_exceptions").insert(
      payload.exceptions.map((item, index) => ({
        expert_id: ctx.id,
        position: index,
        date: item.date,
        is_closed: item.is_closed,
        start_time: item.is_closed ? null : item.start_time,
        end_time: item.is_closed ? null : item.end_time,
      })),
    );
    if (error) return { ok: false, message: "Exception invalide." };
  }
  const { data: profile } = await ctx.db.from("care_profiles").select("slug").eq("expert_id", ctx.id).maybeSingle();
  if (profile?.slug) revalidateCarePublicProfile(String(profile.slug));
  return { ok: true };
}

export async function updateCareExpertBookingStatus(id: string, status: "cancelled_expert" | "completed"): Promise<Result> {
  const ctx = await actor();
  if (!ctx) return { ok: false, message: "Session expirée." };
  const { data: row } = await ctx.db.from("care_bookings").select("*").eq("id", id).eq("expert_id", ctx.id).maybeSingle();
  if (!row || String(row.status) !== "confirmed") return { ok: false, message: "Rendez-vous introuvable." };
  const { error } = await ctx.db.from("care_bookings").update({ status }).eq("id", id).eq("expert_id", ctx.id);
  if (error) return { ok: false, message: "Mise à jour impossible." };
  if (status === "cancelled_expert") {
    const { data: profile } = await ctx.db.from("care_profiles").select("display_name").eq("expert_id", ctx.id).maybeSingle();
    const { data: service } = await ctx.db.from("care_services").select("name").eq("id", row.service_id).maybeSingle();
    await sendCareCancellationEmails({
      clientEmail: String(row.client_email),
      clientFirstName: String(row.client_first_name),
      practitionerEmail: null,
      practitionerName: String(profile?.display_name ?? ""),
      serviceName: String(service?.name ?? ""),
      startsAt: String(row.starts_at),
      byExpert: true,
    });
  }
  return { ok: true };
}
