import { CareBookingsBoard } from "@/components/expert/care-bookings-board";
import { loadCareExpertWorkspace } from "@/lib/care/expert-workspace";

export const dynamic = "force-dynamic";

export default async function CareRendezVousPage() {
  const workspace = await loadCareExpertWorkspace();
  return <CareBookingsBoard bookings={workspace.bookings} />;
}
