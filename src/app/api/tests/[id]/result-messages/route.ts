import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: testId } = await params;
    const supabase = await getServerClient();
    
    if (!supabase || !testId) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: messages, error } = await supabase
      .from("test_result_messages")
      .select("*")
      .eq("test_id", testId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("[api/tests/result-messages] Erreur:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("[api/tests/result-messages] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: testId } = await params;
    const supabase = await getServerClient();
    
    if (!supabase || !testId) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le test appartient au formateur
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("id, created_by, owner_id")
      .eq("id", testId)
      .single();

    if (testError || !test) {
      return NextResponse.json({ error: "Test introuvable" }, { status: 404 });
    }

    const isOwner = (test.created_by === user.id) || (test.owner_id === user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { messages } = body as { messages: Array<{
      id?: string;
      minScore: number;
      maxScore: number;
      title: string;
      message: string;
      aiGenerated?: boolean;
    }> };

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages invalides" }, { status: 400 });
    }

    // Supprimer les anciens messages
    await supabase
      .from("test_result_messages")
      .delete()
      .eq("test_id", testId);

    // Insérer les nouveaux messages
    const messagesToInsert = messages.map((msg, index) => ({
      test_id: testId,
      min_score: msg.minScore,
      max_score: msg.maxScore,
      title: msg.title,
      message: msg.message,
      ai_generated: msg.aiGenerated || false,
      order_index: index,
    }));

    const { error: insertError } = await supabase
      .from("test_result_messages")
      .insert(messagesToInsert);

    if (insertError) {
      console.error("[api/tests/result-messages] Erreur insertion:", insertError);
      return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/tests/result-messages] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}








