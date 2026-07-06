import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { getBookableOffer } from "@/lib/particulier/accompagnement-booking";
import { EdgeAccompagnementReserverClient } from "@/components/apprenant/edge-accompagnement-reserver-client";

type PageProps = {
  searchParams: Promise<{ offer?: string; cancelled?: string }>;
};

export default async function ReserverAccompagnementPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const offer = getBookableOffer(params.offer);

  if (!offer?.bookable) {
    redirect("/dashboard/apprenant/coaching");
  }

  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.email) {
    redirect("/login?from=connect");
  }

  const defaultName =
    String(profile?.full_name ?? "").trim() ||
    `${String(profile?.first_name ?? "")} ${String(profile?.last_name ?? "")}`.trim() ||
    user.email.split("@")[0];

  return (
    <EdgeAccompagnementReserverClient
      offer={offer}
      defaultName={defaultName}
      defaultEmail={user.email}
      defaultPhone={String(profile?.phone ?? "")}
      cancelled={params.cancelled === "1"}
    />
  );
}
