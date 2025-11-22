import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { BeyondConnectPageContent } from "@/components/beyond-connect/beyond-connect-page";

export const metadata: Metadata = {
  title: "Mon CV - Beyond Connect",
  description: "Gérez votre CV numérique complet",
};

export default async function BeyondConnectCVPage() {
  const session = await getSession();

  if (!session) {
    redirect("/beyond-connect/login?next=/beyond-connect-app/cv");
  }

  return <BeyondConnectPageContent userId={session.id} />;
}

