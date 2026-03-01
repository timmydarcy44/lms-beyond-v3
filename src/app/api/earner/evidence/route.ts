import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { EvidenceType, UserRole } from "@prisma/client";

export async function POST(request: Request) {
  const auth = requireRole(request, [UserRole.EARNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const payload = await request.json();
  const type = payload.type as EvidenceType;

  if (!Object.values(EvidenceType).includes(type)) {
    return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  }

  const evidence = await prisma.evidence.create({
    data: {
      assessmentId: payload.assessmentId ?? null,
      type,
      url: payload.url ?? null,
      fileKey: payload.fileKey ?? null,
      mime: payload.mime ?? null,
      title: payload.title ?? null,
      description: payload.description ?? null,
      submittedById: auth.user.id,
    },
  });

  return NextResponse.json({ ok: true, evidence });
}
