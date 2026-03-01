import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";

export type RequestUser = {
  id: string;
  orgId: string;
  role: UserRole;
};

export const getRequestUser = (request: Request): RequestUser | null => {
  const id = request.headers.get("x-user-id");
  const orgId = request.headers.get("x-org-id");
  const role = request.headers.get("x-user-role") as UserRole | null;

  if (!id || !orgId || !role) {
    return null;
  }

  return { id, orgId, role };
};

export const requireRole = (request: Request, roles: UserRole[]) => {
  const user = getRequestUser(request);
  if (!user || !roles.includes(user.role)) {
    return { ok: false as const, response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }
  return { ok: true as const, user };
};
