import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const payload = await request.json();
  const framework = await prisma.competencyFramework.create({
    data: {
      orgId: auth.user.orgId,
      name: payload.name,
      description: payload.description ?? null,
      url: payload.url ?? null,
      version: payload.version ?? 1,
    },
  });

  return NextResponse.json({ ok: true, framework });
}
