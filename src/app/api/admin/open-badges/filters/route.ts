import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const auth = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const [badgeClasses, earners] = await Promise.all([
    prisma.badgeClass.findMany({
      where: { orgId: auth.user.orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { orgId: auth.user.orgId, role: "EARNER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    badgeClasses,
    earners: earners.map((earner) => ({
      id: earner.id,
      displayName: earner.name ?? null,
    })),
  });
}
