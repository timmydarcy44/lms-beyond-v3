import { notFound } from "next/navigation";

import { buildJadeReviews, buildJadeSlots } from "@/lib/expert/jade-expert-space";
import { isEdgeCertified } from "@/lib/expert/expert-certification";
import { parseRegistrationMeta } from "@/lib/expert/expert-registration-meta";
import { slotKindFromRule, type SlotKind } from "@/lib/expert/space-model";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PublicSlot = { id: string; startsAt: string; endsAt: string; kind: SlotKind; location: string };
type PublicReview = { id: string; client: string; rating: number; body: string; mission: string };

export default async function PublicExpertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = id === "jade-demo" ? jadePublic() : await loadPublicExpert(id);
  if (!profile) notFound();
  const initials = profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-[#07080B] px-4 py-8 text-[#F4F5F7] sm:px-6 sm:py-12">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <header className="flex items-center justify-between">
            <p className="text-sm font-extrabold">Byound</p>
            <span className="rounded-full bg-[#3A1418] px-3 py-1 text-xs font-bold text-[#FFB4B8]">Profil expert</span>
          </header>
          <article className="rounded-[32px] bg-[#12141A] p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {profile.photoUrl ? (
                <span className="h-24 w-24 shrink-0 rounded-[24px] bg-cover bg-center" style={{ backgroundImage: `url(${profile.photoUrl})` }} />
              ) : (
                <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[24px] bg-[#FF4B4B] text-2xl font-extrabold text-[#04140C]">{initials}</span>
              )}
              <div>
                <h1 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{profile.name}</h1>
                <p className="mt-2 text-[#B5BAC6]">{[profile.headline, profile.regions.join(", ")].filter(Boolean).join(" · ")}</p>
                {profile.certified ? <p className="mt-4 inline-flex rounded-full bg-[#36301A] px-3 py-1 text-sm font-bold text-[#F2CF6B]">★ Byound Certified</p> : null}
              </div>
            </div>
          </article>
          <section className="rounded-[28px] bg-[#12141A] p-6">
            <p className="text-xs font-bold text-[#FFB4B8]">Présentation</p>
            <h2 className="mt-1 text-lg font-extrabold">Synthèse du profil</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#DADDE4]">{profile.bio || "Présentation à venir."}</p>
          </section>
          <section className="rounded-[28px] bg-[#12141A] p-6">
            <h2 className="text-lg font-extrabold">Spécialités</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.specialties.length ? profile.specialties.map((item) => (
                <span key={item} className="rounded-full bg-[#1E2130] px-3 py-1 text-sm font-semibold">{item}</span>
              )) : <p className="text-sm text-[#9096A3]">Aucune spécialité publiée.</p>}
            </div>
            {profile.formats.length ? <p className="mt-4 text-sm text-[#B5BAC6]">Formats : {profile.formats.join(" · ")}</p> : null}
          </section>
          <section className="rounded-[28px] bg-[#12141A] p-6">
            <h2 className="text-lg font-extrabold">Avis</h2>
            {profile.reviews.length === 0 ? <p className="mt-3 text-sm text-[#9096A3]">Aucun avis publié.</p> : (
              <ul className="mt-4 space-y-4">
                {profile.reviews.map((review) => (
                  <li key={review.id}>
                    <p className="text-sm font-extrabold">{review.client} · {"★".repeat(Math.max(1, Math.min(5, review.rating)))}</p>
                    <p className="mt-1 text-sm text-[#DADDE4]">{review.body}</p>
                    <p className="mt-1 text-xs text-[#9096A3]">{review.mission}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <aside className="space-y-6">
          <section className="rounded-[28px] bg-[#12141A] p-6">
            <h2 className="text-lg font-extrabold">Créneaux ouverts</h2>
            <p className="mt-1 text-xs text-[#9096A3]">Les créneaux indisponibles ne peuvent pas être réservés.</p>
            {profile.slots.length === 0 ? <p className="mt-4 text-sm text-[#B5BAC6]">Aucun créneau ouvert pour le moment.</p> : (
              <ul className="mt-4 space-y-3">
                {profile.slots.map((slot) => (
                  <li key={slot.id} className="rounded-2xl bg-[#1E2130] px-4 py-3">
                    <p className="text-sm font-extrabold">{slot.kind === "formation" ? "Formation" : "Rendez-vous"}</p>
                    <p className="text-sm text-[#DADDE4]">{new Date(slot.startsAt).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="text-xs text-[#9096A3]">{slot.location || "Visio"}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

function jadePublic() {
  const now = new Date();
  return {
    name: "Jade Martin",
    headline: "Experte commerciale",
    regions: ["Normandie", "Île-de-France"],
    specialties: ["Prospection", "Closing", "CRM"],
    formats: ["Visio", "Présentiel"],
    bio: "Accompagne les équipes sur la prospection et le closing.",
    photoUrl: null as string | null,
    certified: true,
    reviews: buildJadeReviews().map((review) => ({ id: review.id, client: review.client, rating: review.rating, body: review.body, mission: review.mission })),
    slots: openSlots(buildJadeSlots(now).map((slot) => ({ id: slot.id, startsAt: slot.startsAt, endsAt: slot.endsAt, kind: slot.kind, location: slot.location, missionId: slot.missionId }))),
  };
}

async function loadPublicExpert(id: string) {
  const service = getServiceRoleClient();
  if (!service) return null;
  const { data } = await service
    .from("experts")
    .select("id,first_name,last_name,headline,bio,avatar_url,photo_url,specialties,formats_supported,regions,references,review_status,is_certified_beyond,certification_status")
    .eq("id", id)
    .maybeSingle();
  if (!data || data.review_status !== "approved") return null;
  const meta = parseRegistrationMeta(data.references);
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Expert";
  const reviewQuery = await service.from("expert_reviews").select("id,client_name,rating,body,mission_label").eq("expert_id", id).order("created_at", { ascending: false }).limit(3);
  const reviews: PublicReview[] = reviewQuery.error ? [] : (reviewQuery.data ?? []).map((review) => ({
    id: String(review.id),
    client: String(review.client_name ?? "Client"),
    rating: Number(review.rating) || 0,
    body: String(review.body ?? ""),
    mission: String(review.mission_label ?? ""),
  }));
  let slotQuery = await service.from("expert_slots").select("id,starts_at,ends_at,location,mission_id,recurrence_rule").eq("expert_id", id);
  if (slotQuery.error) slotQuery = await service.from("expert_slots").select("id,starts_at,ends_at,location,mission_id").eq("expert_id", id);
  const slots = slotQuery.error ? [] : openSlots((slotQuery.data ?? []).map((slot) => ({
    id: String(slot.id),
    startsAt: String(slot.starts_at),
    endsAt: String(slot.ends_at),
    kind: slotKindFromRule("recurrence_rule" in slot ? slot.recurrence_rule : null),
    location: String(slot.location ?? ""),
    missionId: slot.mission_id ? String(slot.mission_id) : null,
  })));
  return {
    name,
    headline: String(data.headline ?? ""),
    regions: (Array.isArray(data.regions) ? data.regions : meta?.geographic_zones ?? []) as string[],
    specialties: (Array.isArray(data.specialties) ? data.specialties : []) as string[],
    formats: (Array.isArray(data.formats_supported) ? data.formats_supported : []) as string[],
    bio: String(data.bio ?? meta?.bio_long ?? ""),
    photoUrl: String(data.photo_url || data.avatar_url || meta?.photo_url || "") || null,
    certified: isEdgeCertified(data),
    reviews,
    slots,
  };
}

function openSlots(slots: Array<PublicSlot & { missionId: string | null }>) {
  const now = Date.now();
  return slots
    .filter((slot) => !slot.missionId && slot.kind !== "indisponible" && new Date(slot.startsAt).getTime() >= now)
    .slice(0, 8)
    .map(({ missionId: _missionId, ...slot }) => slot);
}
