import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { BeyondConnectCandidatesAdminPage } from "@/components/beyond-connect/candidates-admin-page";

export const metadata: Metadata = {
  title: "Gestion des candidats - Beyond Connect",
  description: "Administration des profils candidats",
};

export default async function BeyondConnectCandidatesAdminPageRoute() {
  const session = await getSession();
  const hasAccess = await isSuperAdmin();

  if (!session || !hasAccess) {
    redirect("/dashboard");
  }

  return <BeyondConnectCandidatesAdminPage />;
}

