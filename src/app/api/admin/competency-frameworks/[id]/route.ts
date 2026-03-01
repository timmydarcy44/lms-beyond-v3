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
  const existing = await prisma.competencyFramework.findUnique({
    where: { id },
    select: { orgId: true },
  });
  if (!existing || existing.orgId !== auth.user.orgId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const framework = await prisma.competencyFramework.update({
    where: { id },
    data: {
      name: payload.name ?? undefined,
      description: payload.description ?? null,
      url: payload.url ?? null,
      version: payload.version ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, framework });
}
