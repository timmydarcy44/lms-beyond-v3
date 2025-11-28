import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isUserAdminWithFeature } from "@/lib/queries/organization-features";

export default async function BeyondCareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session?.id) {
    redirect("/login");
  }

  // Vérifier si l'utilisateur est admin dans au moins une organisation avec Beyond Care
  const isAdmin = await isUserAdminWithFeature("beyond_care");
  
  if (!isAdmin) {
    redirect("/admin");
  }

  // Retourner les enfants sans wrapper pour éviter le layout admin
  return <>{children}</>;
}

