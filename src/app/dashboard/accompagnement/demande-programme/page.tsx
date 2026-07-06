import { redirect } from "next/navigation";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { EdgeAccompagnementProgrammeClient } from "@/components/apprenant/edge-accompagnement-programme-client";

export default async function DemandeProgrammePage() {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.email) {
    redirect("/login?from=connect");
  }

  const defaultName =
    String(profile?.full_name ?? "").trim() ||
    `${String(profile?.first_name ?? "")} ${String(profile?.last_name ?? "")}`.trim() ||
    user.email.split("@")[0];

  return <EdgeAccompagnementProgrammeClient defaultName={defaultName} defaultEmail={user.email} />;
}
