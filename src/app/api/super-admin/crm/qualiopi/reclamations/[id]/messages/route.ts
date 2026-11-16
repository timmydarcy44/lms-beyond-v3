import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await ctx.params;

  const { data, error } = await supabase
    .from("crm_qualiopi_reclamation_messages")
    .select("*")
    .eq("reclamation_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    if (/schema cache|does not exist|reclamation_messages/i.test(error.message)) {
      // Fallback : synthétiser depuis la réclamation
      const { data: rec } = await supabase
        .from("crm_qualiopi_reclamations")
        .select("subject, description, response, requester_name, received_at, answered_at, closed_at, updated_at")
        .eq("id", id)
        .maybeSingle();
      const messages = [];
      if (rec) {
        messages.push({
          id: `legacy-req-${id}`,
          reclamation_id: id,
          kind: "requester",
          body: rec.description || rec.subject,
          author_name: rec.requester_name,
          created_at: rec.received_at,
        });
        if (rec.response) {
          messages.push({
            id: `legacy-reply-${id}`,
            reclamation_id: id,
            kind: "reply",
            body: rec.response,
            author_name: "Équipe qualité",
            created_at: rec.answered_at || rec.closed_at || rec.updated_at,
          });
        }
      }
      return NextResponse.json({ messages, migration_required: true });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const kind = String(body.kind ?? "note_interne");
  if (!["note_interne", "system_step"].includes(kind)) {
    return NextResponse.json({ error: "Utilisez /reply pour les réponses e-mail" }, { status: 400 });
  }
  const text = String(body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Message vide" }, { status: 400 });

  let authorName = "Équipe qualité";
  let authorId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    authorId = auth.user?.id ?? null;
    if (auth.user?.email) authorName = auth.user.email.split("@")[0] || authorName;
  } catch {
    /* ignore */
  }

  const { data, error } = await supabase
    .from("crm_qualiopi_reclamation_messages")
    .insert({
      reclamation_id: id,
      kind,
      body: text,
      author_user_id: authorId,
      author_name: authorName,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: data });
}
