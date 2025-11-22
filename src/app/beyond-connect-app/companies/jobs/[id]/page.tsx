import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { JobOfferDetailPage } from "@/components/beyond-connect/job-offer-detail-page";

export const metadata: Metadata = {
  title: "Détail de l'offre - Beyond Connect",
  description: "Détails de l'offre d'emploi",
};

export default async function JobOfferDetailPageRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;

  if (!session) {
    redirect("/beyond-connect/login?next=/beyond-connect-app/companies/jobs/" + id);
  }

  return <JobOfferDetailPage jobOfferId={id} userId={session.id} />;
}

