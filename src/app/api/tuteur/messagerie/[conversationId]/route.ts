import { NextRequest, NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { jadeThread } from "@/lib/demo/jade-tutor-pages";
import { relationMissing } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { conversationId } = await params;
  if (isJadeDemoEmail(auth.ctx.email)) return NextResponse.json(jadeThread(conversationId));
  const member = await auth.ctx.supabase
    .from("tutor_conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", auth.ctx.userId)
    .maybeSingle();
  if (!member.data) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  await auth.ctx.supabase.from("tutor_conversation_participants").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", auth.ctx.userId);
  const messages = await auth.ctx.supabase.from("tutor_messages").select("id, sender_id, body, created_at, mission_id, attachment_path, attachment_name, attachment_size").eq("conversation_id", conversationId).order("created_at");
  if (relationMissing(messages.error)) return NextResponse.json({ conversation: null, messages: [] });
  return NextResponse.json({
    conversation: { id: conversationId },
    messages: (messages.data ?? []).map((row) => ({
      id: String(row.id),
      mine: row.sender_id === auth.ctx.userId,
      body: row.body ? String(row.body) : "",
      at: new Date(String(row.created_at)).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      createdAt: row.created_at,
      mission: null,
      attachment: row.attachment_path ? { name: row.attachment_name ?? "Fichier", size: row.attachment_size ?? 0, path: row.attachment_path } : null,
    })),
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { conversationId } = await params;
  const body = await request.json().catch(() => null);
  const text = String(body?.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Message vide" }, { status: 400 });
  if (isJadeDemoEmail(auth.ctx.email)) {
    return NextResponse.json({ id: `local-${Date.now()}`, mine: true, body: text, at: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), mission: null });
  }
  const member = await auth.ctx.supabase.from("tutor_conversation_participants").select("conversation_id").eq("conversation_id", conversationId).eq("user_id", auth.ctx.userId).maybeSingle();
  if (!member.data) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  const inserted = await auth.ctx.supabase.from("tutor_messages").insert({
    conversation_id: conversationId,
    sender_id: auth.ctx.userId,
    body: text,
  }).select("id, created_at").single();
  if (inserted.error || !inserted.data) return NextResponse.json({ error: "Le message n'a pas pu être envoyé." }, { status: 500 });
  return NextResponse.json({
    id: inserted.data.id,
    mine: true,
    body: text,
    at: new Date(String(inserted.data.created_at)).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    mission: null,
  });
}
