import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { getRequestUser } from "@/lib/auth/require-role";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export type EarnerSessionContext = {
  userId: string;
  orgId: string;
  orgIds: string[];
  role: UserRole;
};

export async function resolveEarnerContextFromSession(): Promise<EarnerSessionContext | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) return null;

  const orgClient = (await getServiceRoleClientOrFallback()) ?? supabase;
  const { data: memberships } = await orgClient
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", userId);

  const orgIds = Array.from(
    new Set(
      (memberships ?? [])
        .map((row) => String((row as { org_id?: string }).org_id ?? "").trim())
        .filter(Boolean),
    ),
  );
  if (orgIds.length === 0) return null;

  return {
    userId,
    orgId: orgIds[0],
    orgIds,
    role: UserRole.EARNER,
  };
}

export async function requireEarnerSession(request: NextRequest) {
  const session = await resolveEarnerContextFromSession();
  const headerUser = getRequestUser(request);

  if (session) {
    return {
      ok: true as const,
      user: {
        id: session.userId,
        orgId:
          headerUser?.orgId && session.orgIds.includes(headerUser.orgId)
            ? headerUser.orgId
            : session.orgId,
        role: session.role,
      },
      orgIds: session.orgIds,
    };
  }

  if (headerUser) {
    return {
      ok: true as const,
      user: headerUser,
      orgIds: [headerUser.orgId].filter(Boolean),
    };
  }

  return {
    ok: false as const,
    response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
  };
}
