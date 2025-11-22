import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { BeyondConnectCompaniesPageContent } from "@/components/beyond-connect/companies-page";

export const metadata: Metadata = {
  title: "Espace Entreprises - Beyond Connect",
  description: "Gérez vos offres d'emploi, votre CVthèque et vos matchings",
};

export default async function BeyondConnectCompaniesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/beyond-connect/login?next=/beyond-connect-app/companies");
  }

  return <BeyondConnectCompaniesPageContent userId={session.id} />;
}

