import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { looksLikeTestAccount } from "@/lib/control/test-account";

/**
 * Enregistre une relance dans le suivi.
 * Si testOnly=true (défaut en tests), refuse si le destinataire n’est pas un compte de test.
 */
export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    learnerId?: string;
    subject?: string;
    courseId?: string | null;
    leafTitle?: string | null;
    testOnly?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const learnerId = body.learnerId?.trim();
  if (!learnerId) return NextResponse.json({ error: "learnerId required" }, { status: 400 });

  const db = (await getServiceRoleClientOrFallback()) ?? supabase;

  const { data: learner } = await db
    .from("profiles")
    .select("id, email, role, is_test")
    .eq("id", learnerId)
    .maybeSingle();

  if (!learner) return NextResponse.json({ error: "Apprenant introuvable" }, { status: 404 });

  const testOnly = body.testOnly !== false;
  const isTest =
    (learner as { is_test?: boolean }).is_test === true ||
    looksLikeTestAccount({ email: (learner as { email?: string }).email, role: (learner as { role?: string }).role });

  if (testOnly && !isTest) {
    return NextResponse.json(
      {
        error: "Relance bloquée : destinataire hors compte de test. Désactivez testOnly uniquement pour un envoi réel validé.",
        logged: false,
      },
      { status: 403 },
    );
  }

  const insert = await db.from("learner_relances").insert({
    learner_id: learnerId,
    sent_by: user.id,
    subject: body.subject ?? "On continue ?",
    course_id: body.courseId ?? null,
    leaf_title: body.leafTitle ?? null,
    channel: "email",
  });

  if (insert.error && /schema cache|does not exist|relation/i.test(insert.error.message)) {
    // Table absente tant que la migration n’est pas appliquée — on ne bloque pas le composeur
    return NextResponse.json({ ok: true, logged: false, pendingMigration: true });
  }
  if (insert.error) {
    return NextResponse.json({ error: insert.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, logged: true });
}
