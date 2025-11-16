import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

// GET - Vérifier le statut de connexion des apprenants
export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const learnerIds = searchParams.get("learnerIds");

    if (!learnerIds) {
      return NextResponse.json({ error: "learnerIds is required" }, { status: 400 });
    }

    const ids = learnerIds.split(",").filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ onlineStatus: {} });
    }

    // Utiliser le service role client pour contourner RLS
    const adminClient = await getServiceRoleClientOrFallback();
    const queryClient = adminClient ?? supabase;

    // Vérifier les sessions actives (sans ended_at)
    // On considère qu'un utilisateur est en ligne s'il a une session active (ended_at = null)
    // créée dans les 2 dernières heures (pour être plus permissif)
    // OU une session récemment mise à jour (même si ended_at est défini, cela indique une activité récente)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Requête 1: Sessions actives (sans ended_at) créées récemment
    const { data: activeSessions1, error: error1 } = await queryClient
      .from("learning_sessions")
      .select("user_id, started_at")
      .in("user_id", ids)
      .is("ended_at", null)
      .gte("started_at", twoHoursAgo);

    // Requête 2: Toutes les sessions créées très récemment (dans les 10 dernières minutes)
    // même si ended_at est défini, cela indique une activité récente
    const { data: recentSessions, error: error2 } = await queryClient
      .from("learning_sessions")
      .select("user_id, started_at")
      .in("user_id", ids)
      .gte("started_at", tenMinutesAgo);

    const error = error1 || error2;
    const allSessions = [...(activeSessions1 || []), ...(recentSessions || [])];
    
    // Dédupliquer par user_id
    const uniqueSessions = allSessions ? Array.from(
      new Map(allSessions.map((s) => [s.user_id, s])).values()
    ) : [];

    if (error) {
      console.error("[learners/online-status] Error fetching active sessions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Créer un map des utilisateurs en ligne
    const onlineStatus: Record<string, boolean> = {};
    ids.forEach((id) => {
      onlineStatus[id] = false;
    });

    if (uniqueSessions) {
      uniqueSessions.forEach((session) => {
        onlineStatus[session.user_id] = true;
      });
    }

    console.log("[learners/online-status] Online status:", {
      learnerIds: ids,
      activeSessions1: activeSessions1?.length || 0,
      recentSessions: recentSessions?.length || 0,
      uniqueSessions: uniqueSessions.length,
      onlineStatus,
      twoHoursAgo,
      tenMinutesAgo,
    });

    return NextResponse.json({ onlineStatus });
  } catch (error) {
    console.error("[learners/online-status] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

