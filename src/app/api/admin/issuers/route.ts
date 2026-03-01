import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  const headerOrgId = request.headers.get("x-org-id")?.trim() || null;
  if (!headerOrgId) {
    return NextResponse.json({ ok: false, error: "MISSING_ORG_ID" }, { status: 400 });
  }

  const auth = requireRole(request, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  const payload = await request.json();
  const bodyOrgId = typeof payload.organizationId === "string" ? payload.organizationId.trim() : null;
  if (bodyOrgId && bodyOrgId !== headerOrgId) {
    return NextResponse.json({ ok: false, error: "ORG_MISMATCH" }, { status: 400 });
  }

  const existing = await prisma.issuerProfile.findFirst({
    where: {
      orgId: headerOrgId,
      name: { equals: payload.name, mode: "insensitive" },
    },
  });
  if (existing) {
    return NextResponse.json({ ok: true, item: existing, issuer: existing });
  }

  const issuer = await prisma.issuerProfile.create({
    data: {
      orgId: headerOrgId,
      name: payload.name,
      url: payload.url,
      email: payload.email,
      description: payload.description ?? null,
      imageUrl: payload.imageUrl ?? null,
      publicKeys: payload.publicKeys ?? null,
    },
  });

  return NextResponse.json({ ok: true, item: issuer, issuer });
}

export async function GET(request: NextRequest) {
  const headerOrgId = request.headers.get("x-org-id")?.trim() || null;
  const queryOrgId =
    new URL(request.url).searchParams.get("organizationId")?.trim()
    ?? new URL(request.url).searchParams.get("orgId")?.trim()
    ?? null;
  const orgId = headerOrgId ?? queryOrgId;

  if (!orgId) {
    return NextResponse.json({ ok: false, error: "MISSING_ORG_ID" }, { status: 400 });
  }

  if (headerOrgId && queryOrgId && headerOrgId !== queryOrgId) {
    return NextResponse.json(
      { ok: false, error: "ORG_MISMATCH", details: { headerOrgId, queryOrgId } },
      { status: 400 },
    );
  }

  const authRequest = headerOrgId
    ? request
    : new NextRequest(request.url, {
        headers: new Headers({ ...Object.fromEntries(request.headers.entries()), "x-org-id": orgId }),
      });

  const auth = requireRole(authRequest, [UserRole.SUPER_ADMIN]);
  if (!auth.ok) return auth.response;

  try {
    const items = await prisma.issuerProfile.findMany({
      where: { orgId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        url: true,
        email: true,
        description: true,
        imageUrl: true,
      },
    });

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (error) {
    console.error("[issuers] GET failed", { orgId, err: error });
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        ...(process.env.NODE_ENV !== "production"
          ? { message: error instanceof Error ? error.message : String(error) }
          : {}),
      },
      { status: 500 },
    );
  }
}
