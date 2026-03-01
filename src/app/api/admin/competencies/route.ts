import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const payload = await request.json();
  const framework = await prisma.competencyFramework.findFirst({
    where: { id: payload.frameworkId, orgId: auth.user.orgId },
  });
  if (!framework) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const competency = await prisma.competency.create({
    data: {
      frameworkId: payload.frameworkId,
      name: payload.name,
      description: payload.description ?? null,
      category: payload.category ?? null,
      level: payload.level ?? null,
      tags: payload.tags ?? [],
    },
  });

  return NextResponse.json({ ok: true, competency });
}
