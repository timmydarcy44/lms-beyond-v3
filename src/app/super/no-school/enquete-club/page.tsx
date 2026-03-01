import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import ClubSurveyAdminView from "./view";

export default function SuperAdminClubSurveyPage() {
  return (
    <SuperAdminShell
      title="Enquête Clubs — Réponses"
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "No School", href: "/super/catalogue" },
        { label: "Enquête Clubs" },
      ]}
    >
      <ClubSurveyAdminView />
    </SuperAdminShell>
  );
}

