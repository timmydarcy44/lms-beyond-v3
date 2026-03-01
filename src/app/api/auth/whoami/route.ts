import { NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, hasSession: false }, { status: 404 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, hasSession: false, error: "Auth session missing!" },
      { status: 200 },
    );
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return NextResponse.json(
      { ok: false, hasSession: false, error: "Auth session missing!" },
      { status: 200 },
    );
  }

  const user = data.user;
  const role =
    (user.user_metadata && typeof user.user_metadata.role === "string"
      ? user.user_metadata.role
      : null) ??
    (user.app_metadata && typeof user.app_metadata.role === "string"
      ? user.app_metadata.role
      : null) ??
    null;

  return NextResponse.json({
    ok: true,
    hasSession: true,
    userId: user.id,
    role,
  });
}

