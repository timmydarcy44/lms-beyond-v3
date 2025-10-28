import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: uerr } = await supabase.auth.getUser();
    
    if (uerr || !user) {
      return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
    }

    const body = await request.json();
    const { kind, targetId, formationId } = body;

    // Validation des paramètres
    if (!kind || !targetId || !formationId) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing required parameters: kind, targetId, formationId" 
      }, { status: 400 });
    }

    if (!["user", "group", "pathway"].includes(kind)) {
      return NextResponse.json({ 
        ok: false, 
        error: "Invalid kind. Must be 'user', 'group', or 'pathway'" 
      }, { status: 400 });
    }

    // TODO: Implémenter la logique d'assignation selon vos tables
    // Pour l'instant, on simule une assignation réussie
    
    console.log(`Assigning formation ${formationId} to ${kind} ${targetId} by user ${user.id}`);
    
    // Simulation d'une assignation réussie
    const assignment = {
      id: `assign_${Date.now()}`,
      formation_id: formationId,
      target_type: kind,
      target_id: targetId,
      assigned_by: user.id,
      assigned_at: new Date().toISOString()
    };

    return NextResponse.json({ 
      ok: true, 
      assignment,
      message: `Formation assignée avec succès à ${kind} ${targetId}` 
    });

  } catch (error) {
    console.error("Assignment error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}



