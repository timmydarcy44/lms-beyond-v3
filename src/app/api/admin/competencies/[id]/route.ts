import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const payload = await request.json();
  const { id } = await params;
  const existing = await prisma.competency.findUnique({
    where: { id },
    select: { framework: { select: { orgId: true } } },
  });
  if (!existing || existing.framework.orgId !== auth.user.orgId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (payload.frameworkId) {
    const framework = await prisma.competencyFramework.findFirst({
      where: { id: payload.frameworkId, orgId: auth.user.orgId },
    });
    if (!framework) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }
  const competency = await prisma.competency.update({
    where: { id },
    data: {
      frameworkId: payload.frameworkId ?? undefined,
      name: payload.name ?? undefined,
      description: payload.description ?? null,
      category: payload.category ?? null,
      level: payload.level ?? null,
      tags: payload.tags ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, competency });
}
