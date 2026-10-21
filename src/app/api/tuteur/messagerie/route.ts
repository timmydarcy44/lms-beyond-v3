import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { jadeConversations } from "@/lib/demo/jade-tutor-pages";
import { relationMissing } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET() {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (isJadeDemoEmail(auth.ctx.email)) return NextResponse.json({ conversations: jadeConversations(), peers: [] });

  const parts = await auth.ctx.supabase.from("tutor_conversation_participants").select("conversation_id, last_read_at").eq("user_id", auth.ctx.userId);
  if (relationMissing(parts.error)) return NextResponse.json({ conversations: [], peers: await peersOf(auth.ctx.supabase, auth.ctx.userId) });
  const ids = (parts.data ?? []).map((row) => String(row.conversation_id));
  const others = ids.length
    ? await auth.ctx.supabase.from("tutor_conversation_participants").select("conversation_id, user_id").in("conversation_id", ids).neq("user_id", auth.ctx.userId)
    : { data: [] };
  const peerIds = [...new Set((others.data ?? []).map((row) => String(row.user_id)))];
  const profiles = peerIds.length
    ? await auth.ctx.supabase.from("profiles").select("id, first_name, last_name, full_name, poste_actuel").in("id", peerIds)
    : { data: [] };
  const names = new Map((profiles.data ?? []).map((row) => {
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || String(row.full_name ?? "Contact");
    return [String(row.id), name];
  }));
  const conversations = [];
  for (const part of parts.data ?? []) {
    const peer = (others.data ?? []).find((row) => String(row.conversation_id) === String(part.conversation_id));
    const last = await auth.ctx.supabase
      .from("tutor_messages")
      .select("body, created_at, sender_id")
      .eq("conversation_id", part.conversation_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const since = part.last_read_at ?? "1970-01-01T00:00:00.000Z";
    const unread = await auth.ctx.supabase
      .from("tutor_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", part.conversation_id)
      .neq("sender_id", auth.ctx.userId)
      .gt("created_at", since);
    const peerId = peer ? String(peer.user_id) : "";
    const name = names.get(peerId) ?? "Contact";
    conversations.push({
      id: String(part.conversation_id),
      name,
      role: "Conversation",
      kind: "alternant",
      initials: name.split(" ").slice(0, 2).map((item) => item[0]?.toUpperCase() ?? "").join(""),
      learnerId: peerId,
      preview: last.data?.body ? String(last.data.body) : "",
      at: last.data?.created_at ? new Date(String(last.data.created_at)).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "",
      unread: unread.count ?? 0,
      sort: last.data?.created_at ? String(last.data.created_at) : "",
    });
  }
  conversations.sort((a, b) => String(b.sort).localeCompare(String(a.sort)));
  return NextResponse.json({ conversations, peers: await peersOf(auth.ctx.supabase, auth.ctx.userId) });
}

async function peersOf(supabase: SupabaseClient, tutorId: string) {
  const assignments = await supabase.from("tutor_assignments").select("learner_id").eq("tutor_id", tutorId).in("status", ["active", "paused"]);
  const learnerIds = (assignments.data ?? []).map((row) => String(row.learner_id));
  const booklets = learnerIds.length
    ? await supabase.from("apprenticeship_booklets").select("cfa_referent_id, student_id").eq("tutor_id", tutorId).in("student_id", learnerIds)
    : { data: [] };
  const referentIds = (booklets.data ?? []).map((row) => row.cfa_referent_id).filter(Boolean).map(String);
  const ids = [...new Set([...learnerIds, ...referentIds])];
  if (!ids.length) return [];
  const profiles = await supabase.from("profiles").select("id, first_name, last_name, full_name").in("id", ids);
  return (profiles.data ?? []).map((row) => {
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || String(row.full_name ?? "Contact");
    const kind = learnerIds.includes(String(row.id)) ? "alternant" : "cfa";
    return { id: String(row.id), name, kind };
  });
}
