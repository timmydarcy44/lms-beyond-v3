import { Metadata } from "next";
import { getServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BeyondCenterDashboard } from "@/components/beyond-center/beyond-center-dashboard";

export const metadata: Metadata = {
  title: "Beyond Center - Mon espace de formation",
  description: "Développez vos compétences et certifiez votre expertise avec Beyond Center.",
};

export default async function BeyondCenterAppPage() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/beyond-center/login?next=/beyond-center-app");
  }

  return <BeyondCenterDashboard />;
}

