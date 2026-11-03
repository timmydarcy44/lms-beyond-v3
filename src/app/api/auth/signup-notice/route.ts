import { NextRequest, NextResponse } from "next/server";
import { isRecentAccount, isSignupKind, notifyOwnerOfSignup } from "@/lib/email/signup-notice";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function clip(value: unknown, max = 200): string {
  return String(value ?? "").trim().slice(0, max);
}

/** Appelé après une inscription faite dans le navigateur. N’envoie rien si le compte n’est pas tout juste créé. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = clip(body?.email, 320).toLowerCase();
  const kind = body?.kind;
  if (!email.includes("@") || !isSignupKind(kind)) {
    return NextResponse.json({ error: "Inscription incomplète." }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  let createdAt: string | undefined;
  try {
    const { data, error } = await db.auth.admin.getUserByEmail(email);
    createdAt = data?.user?.created_at;
    if (error || !createdAt) return NextResponse.json({ ok: true, skipped: true });
  } catch {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (!isRecentAccount(createdAt)) return NextResponse.json({ ok: true, skipped: true });

  await notifyOwnerOfSignup({
    kind,
    email,
    firstName: clip(body?.firstName),
    lastName: clip(body?.lastName),
    detail: clip(body?.detail),
  });
  return NextResponse.json({ ok: true });
}
