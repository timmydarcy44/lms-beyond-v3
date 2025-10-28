export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/dashboard";
  const code = url.searchParams.get("code");

  const supabase = createRouteHandlerClient({ cookies });

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(next, url.origin));
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { event, session } = await req.json();
    
    if (event === "SIGNED_IN" && session) {
      // La session est déjà gérée par Supabase, on retourne juste OK
      return NextResponse.json({ success: true });
    }
    
    if (event === "SIGNED_OUT") {
      // La déconnexion est déjà gérée par Supabase, on retourne juste OK
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
