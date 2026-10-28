import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CareBookingWizard } from "@/components/care/care-booking-wizard";
import { CareLink } from "@/components/care/care-host";
import { loadPublishedCareProfile } from "@/lib/care/profile";

export const metadata: Metadata = {
  title: "Réserver",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ service?: string; start?: string }> };

export default async function CareReservePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const profile = await loadPublishedCareProfile(slug);
  if (!profile) notFound();
  const service = profile.services.find((item) => item.id === query.service) ?? profile.services[0];
  const start = query.start ? String(query.start) : "";
  if (!service || !start || Number.isNaN(Date.parse(start))) {
    return (
      <div className="care-wrap care-section">
        <h1>Choisissez un horaire</h1>
        <p className="care-lead">Ce créneau n’est plus valide. Revenez à la fiche pour en choisir un autre.</p>
        <CareLink className="care-pill care-pill--accent" href={`/care/praticiens/${profile.slug}`}>
          Retour à la fiche
        </CareLink>
      </div>
    );
  }
  return <CareBookingWizard profile={profile} service={service} start={new Date(start).toISOString()} />;
}
