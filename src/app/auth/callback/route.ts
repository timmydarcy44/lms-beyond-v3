import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import {
  defaultNextPathForEdgeFlow,
  resolveEdgeFlowFromNextPath,
  resolveEdgeSignupFlowFromMetadata,
} from "@/lib/auth/edge-signup-flow";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const type = url.searchParams.get("type");
  const flowParam = url.searchParams.get("flow");

  const decodedNext = nextParam ? decodeURIComponent(nextParam) : null;
  const fallbackPath = "/dashboard/apprenant";

  if (code) {
    const supabase = await getServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(new URL("/login?error=auth", url.origin));
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
      const isInvite =
        type === "invite" ||
        type === "signup" ||
        type === "magiclink" ||
        meta.needs_password_setup === true ||
        Boolean(user?.invited_at);

      const flowFromParam = flowParam === "entreprise" || flowParam === "particulier" ? flowParam : null;
      const flowFromNext = resolveEdgeFlowFromNextPath(decodedNext);
      const flowFromMeta = resolveEdgeSignupFlowFromMetadata(meta);
      const flow = flowFromParam ?? flowFromNext ?? flowFromMeta;

      const targetNext = decodedNext ?? defaultNextPathForEdgeFlow(flow);

      if (type === "recovery") {
        return NextResponse.redirect(new URL("/login?view=update_password", url.origin));
      }
      if (isInvite) {
        const setPasswordNext = `/auth/set-password?next=${encodeURIComponent(targetNext)}&flow=${flow}`;
        return NextResponse.redirect(new URL(setPasswordNext, url.origin));
      }
    }
  }

  const target = decodedNext ?? fallbackPath;
  return NextResponse.redirect(new URL(target, url.origin));
}
