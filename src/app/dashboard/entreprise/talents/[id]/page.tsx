import { notFound } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import TalentProfileClient from "@/components/beyond-connect/TalentProfileClient";

type TalentPageProps = {
  params: { id: string };
};

export default async function TalentProfilePage({ params }: TalentPageProps) {
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: talent } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!talent) {
    notFound();
  }

  return <TalentProfileClient talent={talent} />;
}
