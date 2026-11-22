import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { resolveDashboardSpaces } from "@/lib/auth/dashboard-routing";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { listEvaluations, listTutorMissions, missionBucket, relationMissing } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";
import { getServiceRoleClient } from "@/lib/supabase/server";

function spaceSwitchLabel(href: string): string | null {
  if (href === "/dashboard/entreprise") return "Accès à mon dashboard RH";
  if (href === "/dashboard/salarie") return "Accès à mon dashboard salarié";
  return null;
}

export async function GET() {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ missions: 0, evaluations: 0, livrets: 0, messages: 0, switches: [] });
  if (isJadeDemoEmail(auth.ctx.email)) {
    return NextResponse.json({
      tutorName: "Jade Martin",
      missions: 2,
      evaluations: 1,
      livrets: 1,
      messages: 3,
      switches: [{ href: "/dashboard/entreprise", label: "Accès à mon dashboard RH" }],
    });
  }
  const missions = await listTutorMissions(auth.ctx.supabase, auth.ctx.userId);
  const evaluations = await listEvaluations(auth.ctx.supabase, auth.ctx.userId);
  const livrets = await auth.ctx.supabase
    .from("booklet_periods")
    .select("id, booklet_id, status")
    .eq("status", "awaiting_tutor");
  let livretCount = 0;
  if (!relationMissing(livrets.error)) {
    const bookletIds = [...new Set((livrets.data ?? []).map((row) => String(row.booklet_id)))];
    if (bookletIds.length) {
      const owned = await auth.ctx.supabase.from("apprenticeship_booklets").select("id").eq("tutor_id", auth.ctx.userId).in("id", bookletIds);
      const mine = new Set((owned.data ?? []).map((row) => String(row.id)));
      livretCount = (livrets.data ?? []).filter((row) => mine.has(String(row.booklet_id))).length;
    }
  }
  const messages = await unreadForTutor(auth.ctx.supabase, auth.ctx.userId);

  let switches: Array<{ href: string; label: string }> = [];
  const service = getServiceRoleClient();
  if (service) {
    const { data: profile } = await service
      .from("profiles")
      .select("id, email, role, role_type, school_id, company_id")
      .eq("id", auth.ctx.userId)
      .maybeSingle();
    const { spaces } = await resolveDashboardSpaces(
      service,
      auth.ctx.userId,
      auth.ctx.email,
      (profile as {
        id: string;
        email?: string | null;
        role?: string | null;
        role_type?: string | null;
        school_id?: string | null;
        company_id?: string | null;
      } | null) ?? { id: auth.ctx.userId, email: auth.ctx.email },
    );
    switches = spaces
      .filter((s) => s.href !== "/dashboard/tuteur")
      .map((s) => {
        const label = spaceSwitchLabel(s.href);
        return label ? { href: s.href, label } : null;
      })
      .filter((row): row is { href: string; label: string } => Boolean(row));
  }

  return NextResponse.json({
    tutorName: auth.ctx.tutorName,
    missions: missions.filter((row) => missionBucket(row) === "a_valider").length,
    evaluations: evaluations.filter((row) => row.status === "to_fill").length,
    livrets: livretCount,
    messages,
    switches,
  });
}

async function unreadForTutor(supabase: SupabaseClient, userId: string) {
  const parts = await supabase.from("tutor_conversation_participants").select("conversation_id, last_read_at").eq("user_id", userId);
  if (relationMissing(parts.error) || !parts.data?.length) return 0;
  let total = 0;
  for (const part of parts.data as Array<{ conversation_id: string; last_read_at: string | null }>) {
    const since = part.last_read_at ?? "1970-01-01T00:00:00.000Z";
    const result = await supabase
      .from("tutor_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", part.conversation_id)
      .neq("sender_id", userId)
      .gt("created_at", since);
    if (relationMissing(result.error)) return 0;
    total += result.count ?? 0;
  }
  return total;
}
