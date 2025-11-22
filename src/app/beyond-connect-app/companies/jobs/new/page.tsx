import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { JobOfferFormPage } from "@/components/beyond-connect/job-offer-form-page";

export const metadata: Metadata = {
  title: "Créer une offre d'emploi - Beyond Connect",
  description: "Publiez une nouvelle offre d'emploi",
};

export default async function NewJobOfferPage() {
  const session = await getSession();

  if (!session) {
    redirect("/beyond-connect/login?next=/beyond-connect-app/companies/jobs/new");
  }

  return <JobOfferFormPage userId={session.id} />;
}

