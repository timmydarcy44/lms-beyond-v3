import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { EdgeAccompagnementConfirmationClient } from "@/components/apprenant/edge-accompagnement-confirmation-client";

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function AccompagnementConfirmationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { user } = await getCurrentProfileWithAccess();
  if (!user?.id) redirect("/login?from=connect");

  return (
    <Suspense fallback={null}>
      <EdgeAccompagnementConfirmationClient sessionId={params.session_id} />
    </Suspense>
  );
}
