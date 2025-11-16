import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * GET - Récupère les tâches de l'utilisateur filtrées par rôle
 */
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role_filter"); // learner, instructor, tutor, admin
    const status = searchParams.get("status"); // todo, in_progress, done, archived (peut être plusieurs valeurs séparées par des virgules)

    let query = supabase
      .from("todo_tasks")
      .select("*")
      .or(`user_id.eq.${userId},assigned_to_user_id.eq.${userId}`)
      .order("kanban_position", { ascending: true })
      .order("created_at", { ascending: false });

    if (roleFilter) {
      query = query.eq("role_filter", roleFilter);
    }

    if (status) {
      // Gérer plusieurs statuts séparés par des virgules
      const statuses = status.split(",").map(s => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        query = query.eq("status", statuses[0]);
      } else if (statuses.length > 1) {
        query = query.in("status", statuses);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("[todo-tasks] Error fetching tasks:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("[todo-tasks] Unexpected error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST - Crée une nouvelle tâche
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Récupérer la position maximale pour le statut donné
    const { data: maxPositionData } = await supabase
      .from("todo_tasks")
      .select("kanban_position")
      .eq("user_id", userId)
      .eq("status", body.status || "todo")
      .order("kanban_position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const newTask = {
      user_id: userId,
      title: body.title,
      description: body.description || null,
      due_date: body.due_date || null,
      priority: body.priority || "normal",
      status: body.status || "todo",
      task_type: body.task_type,
      role_filter: body.role_filter,
      linked_content_type: body.linked_content_type || null,
      linked_content_id: body.linked_content_id || null,
      assigned_to_user_id: body.assigned_to_user_id || null,
      assigned_to_group_id: body.assigned_to_group_id || null,
      estimated_duration_minutes: body.estimated_duration_minutes || null,
      tags: body.tags || [],
      subtasks: body.subtasks || [],
      attachments: body.attachments || [],
      comments: body.comments || [],
      kanban_position: (maxPositionData?.kanban_position ?? -1) + 1,
    };

    const { data, error } = await supabase
      .from("todo_tasks")
      .insert(newTask)
      .select()
      .single();

    if (error) {
      console.error("[todo-tasks] Error creating task:", error);
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[todo-tasks] Unexpected error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

