import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { KanbanBoard } from "@/components/todo/kanban-board";
import { getSession } from "@/lib/auth/session";

export default async function FormateurTodoPage() {
  const session = await getSession();

  return (
    <DashboardShell
      title="To-Do List"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "To-Do List" },
      ]}
      firstName={session?.fullName ?? null}
      email={session?.email ?? null}
    >
      <div className="space-y-12">
        <section className="space-y-3 rounded-3xl border border-white/12 bg-slate-950/80 px-6 py-8 md:px-10">
          <h1 className="text-3xl font-semibold text-white md:text-[2.4rem] md:leading-tight">To-Do List</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-white/70 md:text-base">
            Vos actions prioritaires pour piloter vos formations et accompagner vos apprenants. Les tâches sont organisées par
            état pour vous aider à identifier ce qui nécessite votre attention dès maintenant.
          </p>
        </section>

        <KanbanBoard role="formateur" />
      </div>
    </DashboardShell>
  );
}








