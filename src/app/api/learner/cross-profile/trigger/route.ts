import { NextResponse } from "next/server";

import { maybeTriggerCrossProfileCompletion } from "@/lib/learner/cross-profile-completion";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const authClient = await createSupabaseServerClient();
  if (!authClient) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const result = await maybeTriggerCrossProfileCompletion(user.id);
  return NextResponse.json(result);
}
