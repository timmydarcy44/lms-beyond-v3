import { getCareListingSettings } from "@/app/dashboard/expert/space-actions";
import { ExpertProfileEditor } from "@/components/expert/expert-profile-editor";
import { ProfileView } from "@/components/expert/space/profile-view";
import { loadExpertSpace } from "@/lib/expert/space-server";

export const dynamic = "force-dynamic";

export default async function ExpertProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const listing = await getCareListingSettings();
  if (params.edit === "1") return <ExpertProfileEditor careListing={listing} />;
  const space = await loadExpertSpace();
  return <ProfileView profile={space.profile} careListing={listing} />;
}
