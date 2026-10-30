import { NextRequest, NextResponse } from "next/server";
import {
  notifyCollaboratorTestComplete,
  type CollaboratorTestKind,
} from "@/lib/entreprise/notify-test-complete";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TESTS = new Set<CollaboratorTestKind>(["disc", "idmc", "soft_skills"]);

export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { test?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const test = String(body.test ?? "") as CollaboratorTestKind;
  if (!TESTS.has(test)) return NextResponse.json({ error: "Test inconnu" }, { status: 400 });

  await notifyCollaboratorTestComplete({ userId: user.id, email: user.email, test });
  return NextResponse.json({ ok: true });
}
