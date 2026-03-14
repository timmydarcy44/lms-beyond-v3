import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const body = await request.json();
    const { text, title } = body || {};

    if (typeof text !== "string") {
      return NextResponse.json({ error: "Texte requis" }, { status: 400 });
    }

    const dateLabel = new Date().toISOString().slice(0, 10);
    const fileName = title && typeof title === "string" && title.trim().length > 0
      ? title.trim()
      : `Dictee du ${dateLabel}`;

    const { data: document, error } = await supabase
      .from("beyond_note_documents")
      .insert({
        user_id: session.id,
        file_name: fileName,
        file_url: "",
        file_type: "text/plain",
        extracted_text: text,
        extraction_status: "done",
        source_type: "dictation",
        file_size: text.length,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
