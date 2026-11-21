import { MonPlanningClient } from "@/components/apprenant/mon-planning-client";
import { APPRENANT_PAGE_SHELL } from "@/lib/apprenant/connect-nav";

export default function ApprenantPlanningPage() {
  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <MonPlanningClient />
    </div>
  );
}
