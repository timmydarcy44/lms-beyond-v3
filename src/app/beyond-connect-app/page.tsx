import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { BeyondConnectPageContent } from "@/components/beyond-connect/beyond-connect-page";

export const metadata: Metadata = {
  title: "Beyond Connect - Votre CV numérique",
  description: "Gérez votre CV numérique, vos compétences et trouvez des opportunités professionnelles.",
};

export default async function BeyondConnectAppPage() {
  const session = await getSession();

  if (!session) {
    redirect("/beyond-connect/login?next=/beyond-connect-app");
  }

  return <BeyondConnectPageContent userId={session.id} />;
}

