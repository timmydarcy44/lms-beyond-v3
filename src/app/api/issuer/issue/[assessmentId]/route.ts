import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";
import { issueBadge } from "@/lib/openbadges/issue";

type RouteParams = { assessmentId: string };

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const auth = requireRole(request, [UserRole.SUPER_ADMIN, UserRole.ADMIN]);
  if (!auth.ok) return auth.response;

  const { assessmentId } = await context.params;

  try {
    const result = await issueBadge(request, assessmentId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "ISSUE_FAILED" },
      { status: 400 },
    );
  }
}
