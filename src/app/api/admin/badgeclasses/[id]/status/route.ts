import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { BadgeClassStatus, UserRole } from "@prisma/client";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const payload = await request.json();
  const { id } = await params;
  const status = payload.status as BadgeClassStatus;
  const allowed: readonly BadgeClassStatus[] = [
    BadgeClassStatus.DRAFT,
    BadgeClassStatus.ACTIVE,
    BadgeClassStatus.ARCHIVED,
  ];

  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  const existing = await prisma.badgeClass.findUnique({
    where: { id },
    select: { orgId: true },
  });
  if (!existing || existing.orgId !== auth.user.orgId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const badgeClass = await prisma.badgeClass.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ ok: true, badgeClass });
}
