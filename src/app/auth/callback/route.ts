import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const isNevo = siteUrl.includes("nevo");
  const fallbackPath = isNevo ? "/app-landing/complete-profile" : "/library";

  if (code) {
    const supabase = await getServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(new URL("/app-landing/login?error=auth", url.origin));
      }
    }
  }

  const target = nextParam ? decodeURIComponent(nextParam) : fallbackPath;
  return NextResponse.redirect(new URL(target, url.origin));
}
