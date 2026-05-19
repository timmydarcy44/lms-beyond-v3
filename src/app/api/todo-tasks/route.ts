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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const roleFilter = searchParams.get("role_filter");

    let query = supabase
      .from("todo_tasks")
      .select(
        "id, title, description, status, priority, school_id, due_date, task_type, role_filter, tags, subtasks, kanban_position, created_at, updated_at",
      )
      .eq("school_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (roleFilter) {
      query = query.or(`role_filter.eq.${roleFilter},role_filter.is.null`);
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

    const body = await request.json();
    const newTask = {
      title: body.title,
      description: body.description || null,
      status: body.status || "todo",
      priority: body.priority || "normal",
      school_id: authData.user.id,
      task_type: body.task_type ?? "student_followup",
      due_date: body.due_date || null,
      role_filter: body.role_filter ?? null,
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

