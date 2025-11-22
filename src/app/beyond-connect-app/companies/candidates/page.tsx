import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CandidatesSearchPage } from "@/components/beyond-connect/candidates-search-page";

export const metadata: Metadata = {
  title: "Rechercher un candidat - Beyond Connect",
  description: "Trouvez les candidats qui correspondent à vos critères",
};

export default async function CandidatesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/beyond-connect/login?next=/beyond-connect-app/companies/candidates");
  }

  return <CandidatesSearchPage userId={session.id} />;
}

