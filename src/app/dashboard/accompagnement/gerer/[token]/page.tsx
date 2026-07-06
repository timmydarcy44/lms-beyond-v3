import { redirect } from "next/navigation";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { EdgeAccompagnementManageClient } from "@/components/apprenant/edge-accompagnement-manage-client";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function GererReservationPage({ params }: PageProps) {
  const { token } = await params;
  const { user } = await getCurrentProfileWithAccess();
  if (!user?.id) redirect("/login?from=connect");

  return <EdgeAccompagnementManageClient manageToken={token} />;
}
