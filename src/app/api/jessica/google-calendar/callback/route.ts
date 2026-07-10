import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  exchangeGoogleCalendarCode,
  getJessicaGoogleCalendarId,
} from "@/lib/jessica-contentin/google-calendar";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_URL || "http://localhost:3001";

  if (!code || !state) {
    return NextResponse.redirect(`${base}/super/agenda?google=error`);
  }

  try {
    const tokens = await exchangeGoogleCalendarCode(code);
    const supabase = getServiceRoleClient();
    if (!supabase) throw new Error("Service indisponible");

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error } = await supabase.from("jessica_google_calendar_connections").upsert(
      {
        user_id: state,
        calendar_id: getJessicaGoogleCalendarId(),
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? "",
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) throw error;

    return NextResponse.redirect(`${base}/super/agenda?google=connected`);
  } catch (error) {
    console.error("[google-calendar/callback]", error);
    return NextResponse.redirect(`${base}/super/agenda?google=error`);
  }
}
