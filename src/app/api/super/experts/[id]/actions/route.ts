import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action as string;

    const { data: expert, error: fetchError } = await supabase
      .from("experts")
      .select("id,is_active,references,certification_status,is_certified_beyond")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !expert) {
      return NextResponse.json({ error: "Expert introuvable" }, { status: 404 });
    }

    let patch: Record<string, unknown> = {};
    let references = Array.isArray(expert.references) ? [...expert.references] : [];

    if (action === "toggle_active") {
      patch.is_active = !expert.is_active;
    } else if (action === "set_certified") {
      patch.certification_status = "certified";
      patch.is_certified_beyond = true;
    } else if (action === "add_note") {
      const note = typeof body.note === "string" ? body.note.trim() : "";
      if (!note) {
        return NextResponse.json({ error: "Note vide" }, { status: 400 });
      }
      references = [
        ...references,
        { _type: "edge_review_note", action: "internal_note", message: note, at: new Date().toISOString() },
      ];
      patch.references = references;
    } else {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const { error: updateError } = await supabase.from("experts").update(patch).eq("id", id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    revalidatePath("/super/experts");
    revalidatePath(`/super/experts/${id}`);
    revalidatePath("/admin/experts");
    revalidatePath(`/admin/experts/${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/super/experts/actions] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
