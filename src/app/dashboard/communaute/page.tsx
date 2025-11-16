import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getLearnerConversations } from "@/lib/queries/messaging";
import { getAvailableContacts } from "@/lib/queries/contacts";
import { getSession } from "@/lib/auth/session";

import CommunityView from "./community-view";

export default async function CommunityPage() {
  const [conversations, contacts] = await Promise.all([
    getLearnerConversations(),
    getAvailableContacts(),
  ]);
  const session = await getSession();

  return (
    <DashboardShell
      title="Messagerie"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Messagerie" },
      ]}
      firstName={session?.fullName ?? null}
      email={session?.email ?? null}
    >
      <CommunityView initialConversations={conversations} availableContacts={contacts} />
    </DashboardShell>
  );
}

