import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * PUT - Met à jour une tâche
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = authData.user.id;
    const { taskId } = await params;
    const body = await request.json();

    // Vérifier que l'utilisateur peut modifier cette tâche
    const { data: existingTask } = await supabase
      .from("todo_tasks")
      .select("user_id, assigned_to_user_id")
      .eq("id", taskId)
      .single();

    if (!existingTask) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }

    if (existingTask.user_id !== userId && existingTask.assigned_to_user_id !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.task_type !== undefined) updateData.task_type = body.task_type;
    if (body.linked_content_type !== undefined) updateData.linked_content_type = body.linked_content_type;
    if (body.linked_content_id !== undefined) updateData.linked_content_id = body.linked_content_id;
    if (body.assigned_to_user_id !== undefined) updateData.assigned_to_user_id = body.assigned_to_user_id;
    if (body.estimated_duration_minutes !== undefined) updateData.estimated_duration_minutes = body.estimated_duration_minutes;
    if (body.actual_duration_minutes !== undefined) updateData.actual_duration_minutes = body.actual_duration_minutes;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.subtasks !== undefined) updateData.subtasks = body.subtasks;
    if (body.attachments !== undefined) updateData.attachments = body.attachments;
    if (body.comments !== undefined) updateData.comments = body.comments;
    if (body.kanban_position !== undefined) updateData.kanban_position = body.kanban_position;

    const { data, error } = await supabase
      .from("todo_tasks")
      .update(updateData)
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("[todo-tasks] Error updating task:", error);
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[todo-tasks] Unexpected error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE - Supprime une tâche
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = authData.user.id;
    const { taskId } = await params;

    // Vérifier que l'utilisateur peut supprimer cette tâche
    const { data: existingTask } = await supabase
      .from("todo_tasks")
      .select("user_id")
      .eq("id", taskId)
      .single();

    if (!existingTask) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }

    if (existingTask.user_id !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error } = await supabase
      .from("todo_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      console.error("[todo-tasks] Error deleting task:", error);
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[todo-tasks] Unexpected error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}








