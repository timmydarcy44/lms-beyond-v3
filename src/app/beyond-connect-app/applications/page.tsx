import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CandidateApplicationsPage } from "@/components/beyond-connect/candidate-applications-page";

export const metadata: Metadata = {
  title: "Mes candidatures - Beyond Connect",
  description: "Liste de vos candidatures",
};

export default async function ApplicationsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/beyond-connect/login?next=/beyond-connect-app/applications");
  }

  return <CandidateApplicationsPage userId={session.id} />;
}

