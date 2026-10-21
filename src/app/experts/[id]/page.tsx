import { notFound } from "next/navigation";

import { buildJadeReviews } from "@/lib/expert/jade-expert-space";
import { isEdgeCertified } from "@/lib/expert/expert-certification";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PublicExpertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "jade-demo") {
    return <PublicCard name="Jade Martin" headline="Experte commerciale" regions={["Normandie", "Île-de-France"]} specialties={["Prospection", "Closing", "CRM"]} certified reviews={buildJadeReviews().length} />;
  }
  const service = getServiceRoleClient();
  if (!service) notFound();
  const { data } = await service
    .from("experts")
    .select("id,first_name,last_name,headline,specialties,regions,review_status,is_certified_beyond,certification_status")
    .eq("id", id)
    .maybeSingle();
  if (!data || data.review_status !== "approved") notFound();
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Expert";
  return (
    <PublicCard
      name={name}
      headline={String(data.headline ?? "")}
      regions={(data.regions as string[] | null) ?? []}
      specialties={(data.specialties as string[] | null) ?? []}
      certified={isEdgeCertified(data)}
    />
  );
}

function PublicCard({
  name,
  headline,
  regions,
  specialties,
  certified,
  reviews,
}: {
  name: string;
  headline: string;
  regions: string[];
  specialties: string[];
  certified: boolean;
  reviews?: number;
}) {
  return (
    <main className="min-h-screen bg-[#07080B] px-4 py-16 text-[#F4F5F7]">
      <article className="mx-auto max-w-xl rounded-[32px] bg-[#12141A] p-8">
        <p className="text-sm text-[#9096A3]">Profil public</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em]">{name}</h1>
        <p className="mt-2 text-[#B5BAC6]">{[headline, regions.join(", ")].filter(Boolean).join(" · ")}</p>
        {certified ? <p className="mt-4 inline-flex rounded-full bg-[#36301A] px-3 py-1 text-sm font-bold text-[#F2CF6B]">★ Byound Certified</p> : null}
        {specialties.length ? <p className="mt-6 text-sm">{specialties.join(" · ")}</p> : null}
        {reviews ? <p className="mt-4 text-sm text-[#9096A3]">{reviews} avis</p> : null}
      </article>
    </main>
  );
}
