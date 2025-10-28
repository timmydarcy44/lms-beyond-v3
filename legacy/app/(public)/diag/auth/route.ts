import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  const sb = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await sb.auth.getUser();
  return NextResponse.json({ user, error, ts: new Date().toISOString() });
}



