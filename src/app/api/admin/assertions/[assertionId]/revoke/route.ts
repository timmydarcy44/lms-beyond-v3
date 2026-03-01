import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";

type RouteParams = { assertionId: string };

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
) {
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const { assertionId } = await context.params;
  const payload = await request.json();
  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";

  const assertion = await prisma.assertion.findUnique({
    where: { id: assertionId },
    include: { badgeClass: { select: { orgId: true } } },
  });

  if (!assertion || assertion.badgeClass.orgId !== auth.user.orgId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (assertion.revokedAt) {
    return NextResponse.json({ ok: true, assertionId, revokedAt: assertion.revokedAt });
  }

  const revokedAt = new Date();
  const updated = await prisma.assertion.update({
    where: { id: assertionId },
    data: {
      revoked: true,
      revokedAt,
      revokedByUserId: auth.user.id,
      revocationReason: reason || null,
    },
  });

  return NextResponse.json({
    ok: true,
    assertionId,
    revokedAt: updated.revokedAt,
    revocationReason: updated.revocationReason,
  });
}
