import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getOpenBadgeClassByIdOnly } from "@/lib/openbadges/open-badges-table-store";
import {
  buildAdminLearnerAttemptsReport,
  resolveEarnerDisplayNames,
} from "@/lib/openbadges/badge-admin-learner-attempts";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const row = await getOpenBadgeClassByIdOnly(id);
  if (!row) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const evaluationConfig = row.evaluationConfig ?? row.evaluation_config ?? null;
  const attempts = buildAdminLearnerAttemptsReport(evaluationConfig);
  const earnerIds = [...new Set(attempts.map((a) => a.earnerId))];
  const earnerNames = await resolveEarnerDisplayNames(earnerIds);

  return NextResponse.json({
    ok: true,
    badgeClassId: id,
    badgeName: String(row.name ?? ""),
    attempts: attempts.map((a) => ({
      ...a,
      earnerName: earnerNames[a.earnerId] ?? a.earnerId,
    })),
  });
}
