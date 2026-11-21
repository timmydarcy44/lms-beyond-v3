import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function publicOrigin(req: Request) {
  const env =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_URL ||
    "";
  if (env) return env.replace(/\/$/, "");
  return new URL(req.url).origin;
}

/** Crée ou renvoie le lien iCal personnel (jeton secret). */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });
  const db = getServiceRoleClient() ?? supabase;

  const { data: existing } = await db
    .from("learner_calendar_feeds")
    .select("token")
    .eq("learner_id", session.id)
    .is("revoked_at", null)
    .maybeSingle();

  let token = existing?.token ? String(existing.token) : null;
  if (!token) {
    token = randomBytes(24).toString("hex");
    const { error } = await db.from("learner_calendar_feeds").insert({
      learner_id: session.id,
      token,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = `${publicOrigin(req)}/api/calendar/${token}.ics`;
  return NextResponse.json({ url, token });
}

/** Régénère le jeton (révoque l'ancien). */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });
  const db = getServiceRoleClient() ?? supabase;

  await db
    .from("learner_calendar_feeds")
    .update({ revoked_at: new Date().toISOString() })
    .eq("learner_id", session.id)
    .is("revoked_at", null);

  const token = randomBytes(24).toString("hex");
  const { error } = await db.from("learner_calendar_feeds").insert({
    learner_id: session.id,
    token,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = `${publicOrigin(req)}/api/calendar/${token}.ics`;
  return NextResponse.json({ url, token });
}
