import { KanbanBoard } from "@/components/todo/kanban-board";
import { getSession } from "@/lib/auth/session";

export default async function AdminTodoPage() {
  const session = await getSession();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">To-Do List</h1>
        <p className="text-sm text-white/60">Organisez vos tâches avec un Kanban</p>
      </div>
      <KanbanBoard role="admin" />
    </div>
  );
}

