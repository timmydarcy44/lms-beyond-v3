import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { KanbanBoard } from "@/components/todo/kanban-board";
import { getSession } from "@/lib/auth/session";

export default async function ApprenantTodoPage() {
  const session = await getSession();

  return (
    <DashboardShell
      title="To-Do List"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Apprenant", href: "/dashboard/apprenant" },
        { label: "To-Do List" },
      ]}
      firstName={session?.fullName ?? null}
      email={session?.email ?? null}
    >
      <KanbanBoard role="apprenant" />
    </DashboardShell>
  );
}

