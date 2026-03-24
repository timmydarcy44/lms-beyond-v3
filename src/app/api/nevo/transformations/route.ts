import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const document_id = searchParams.get("document_id");
  if (!document_id) return NextResponse.json({ error: "document_id requis" }, { status: 400 });

  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("beyond_note_transformations")
    .select("*")
    .eq("document_id", document_id)
    .eq("user_id", session.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transformations: data });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { document_id, action, input_text, result, page_id } = await request.json();

  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("beyond_note_transformations")
    .insert({
      document_id,
      user_id: session.id,
      action,
      input_text,
      result,
      page_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const preview = typeof result === "string" ? result.slice(0, 200) : "";
    const { error: logError } = await supabase.from("activity_logs").insert({
      user_id: session.id,
      action_type: "transformation",
      transformation_type: action,
      document_id,
      result_preview: preview,
      metadata: { page_id },
    });
    if (logError && logError.code !== "42P01") {
      console.error("[activity_logs] insert error:", logError);
    }
  } catch (logError) {
    console.error("[activity_logs] insert failed:", logError);
  }

  return NextResponse.json({ transformation: data });
}
