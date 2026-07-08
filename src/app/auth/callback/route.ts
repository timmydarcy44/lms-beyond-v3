import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import {
  defaultNextPathForEdgeFlow,
  resolveEdgeFlowFromNextPath,
  resolveEdgeSignupFlowFromMetadata,
} from "@/lib/auth/edge-signup-flow";
import {
  COLLABORATOR_DASHBOARD_PATH,
  COLLABORATOR_INVITE_FLOW,
  isCollaboratorInviteMetadata,
} from "@/lib/entreprise/collaborator-invite";
import { env } from "@/lib/env";
import { isJessicaMarketingHostname } from "@/lib/jessica-contentin/studio-config";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const type = url.searchParams.get("type");
  const flowParam = url.searchParams.get("flow");

  const decodedNext = nextParam ? decodeURIComponent(nextParam) : null;
  const fallbackPath = isJessicaMarketingHostname(url.hostname) ? "/mon-compte" : "/dashboard/apprenant";

  if (code && env.supabaseUrl && env.supabaseAnonKey) {
    const cookieCarrier = NextResponse.next();

    const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieCarrier.cookies.set(name, value, options);
          });
        },
      },
    });

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

    const flowFromParam =
      flowParam === "entreprise" || flowParam === "particulier" || flowParam === "expert" ? flowParam : null;
    const flowFromNext = resolveEdgeFlowFromNextPath(decodedNext);
    const flowFromMeta = resolveEdgeSignupFlowFromMetadata(meta);
    const isCollaboratorInvite = isCollaboratorInviteMetadata(meta);
    const flow = isCollaboratorInvite
      ? COLLABORATOR_INVITE_FLOW
      : (flowFromParam ?? flowFromNext ?? flowFromMeta);

    const targetNext = isCollaboratorInvite
      ? COLLABORATOR_DASHBOARD_PATH
      : (decodedNext ?? defaultNextPathForEdgeFlow(flowFromParam ?? flowFromNext ?? flowFromMeta));

    let redirectPath = targetNext;
    if (type === "recovery") {
      redirectPath = "/login?view=update_password";
    } else if (isInvite) {
      redirectPath = `/auth/set-password?next=${encodeURIComponent(targetNext)}&flow=${flow}`;
    }

    const response = NextResponse.redirect(new URL(redirectPath, url.origin));
    cookieCarrier.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });
    return response;
  }

  const target = decodedNext ?? fallbackPath;
  return NextResponse.redirect(new URL(target, url.origin));
}
