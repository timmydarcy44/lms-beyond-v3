import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { WelcomePageContent } from "@/components/beyond-connect/welcome-page";

export const metadata: Metadata = {
  title: "Bienvenue - Beyond Connect",
  description: "Bienvenue sur Beyond Connect",
};

export default async function WelcomePage() {
  const session = await getSession();

  if (!session || !session.id) {
    redirect("/beyond-connect/login");
  }

  return <WelcomePageContent userId={session.id} />;
}

