import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CandidateProfileEditPage } from "@/components/beyond-connect/candidate-profile-edit-page";

export const metadata: Metadata = {
  title: "Mon profil - Beyond Connect",
  description: "Gérez votre profil candidat",
};

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/beyond-connect/login?next=/beyond-connect-app/profile");
  }

  return <CandidateProfileEditPage userId={session.id} />;
}

