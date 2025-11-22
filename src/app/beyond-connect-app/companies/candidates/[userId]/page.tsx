import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CandidateProfilePage } from "@/components/beyond-connect/candidate-profile-page";

export const metadata: Metadata = {
  title: "Profil candidat - Beyond Connect",
  description: "Détails du profil candidat",
};

export default async function CandidateProfileDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ job_offer_id?: string }>;
}) {
  const session = await getSession();
  const { userId } = await params;
  const resolvedSearchParams = await searchParams;

  if (!session) {
    redirect(`/beyond-connect/login?next=/beyond-connect-app/companies/candidates/${userId}`);
  }

  return (
    <CandidateProfilePage
      candidateUserId={userId}
      jobOfferId={resolvedSearchParams.job_offer_id}
      viewerUserId={session.id}
    />
  );
}

