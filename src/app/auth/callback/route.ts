import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const type = url.searchParams.get("type");
  const fallbackPath = "/dashboard/apprenant";

  const apprenantNext = nextParam ? decodeURIComponent(nextParam) : fallbackPath;
  const setPasswordNext = `/auth/set-password?next=${encodeURIComponent(apprenantNext)}`;

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
      if (type === "invite" || type === "signup" || type === "magiclink") {
        return NextResponse.redirect(new URL(setPasswordNext, url.origin));
      }
    }
  }

  const target = nextParam ? decodeURIComponent(nextParam) : fallbackPath;
  return NextResponse.redirect(new URL(target, url.origin));
}
