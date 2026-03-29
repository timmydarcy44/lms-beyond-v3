import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const type = url.searchParams.get("type");
  const fallbackPath = "/dashboard";

  if (code) {
    const supabase = await getServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(new URL("/login?error=auth", url.origin));
      }
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/login?view=update_password", url.origin));
      }
    }
  }

  const target = nextParam ? decodeURIComponent(nextParam) : fallbackPath;
  return NextResponse.redirect(new URL(target, url.origin));
}
