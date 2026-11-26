import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { loadLearnerSuiviDetail } from "@/lib/lms/learner-suivi-detail";
import { formatDurationCompact } from "@/lib/lms/lms-metrics";
import { buildSuiviReleveHtml } from "@/lib/lms/suivi-releve-pdf";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ userId: string }> };

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "NO_DB" }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { userId } = await ctx.params;
  const format = (request.nextUrl.searchParams.get("format") || "csv").toLowerCase();
  const courseId = request.nextUrl.searchParams.get("courseId");
  const detail = await loadLearnerSuiviDetail(userId, courseId);
  if (!detail) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const generatedAt = new Date().toISOString();
  const periodLabel = detail.firstSessionAt
    ? `${detail.firstSessionAt.slice(0, 10)} → ${new Date().toISOString().slice(0, 10)}`
    : "—";

  if (format === "pdf") {
    const html = buildSuiviReleveHtml(detail, generatedAt);
    const safeName = detail.displayName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="releve-lms-${safeName || detail.userId.slice(0, 8)}.html"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const header = [
    "organisme",
    "apprenant",
    "email",
    "formation",
    "periode",
    "total_actif",
    "date_debut",
    "date_fin",
    "connecte",
    "actif",
    "activite",
    "genere_le",
  ];
  const lines = [header.join(";")];
  for (const s of detail.sessions) {
    lines.push(
      [
        csvEscape("Byound"),
        csvEscape(detail.displayName),
        csvEscape(detail.email),
        csvEscape(detail.courseTitle),
        csvEscape(periodLabel),
        csvEscape(formatDurationCompact(detail.activeSeconds)),
        csvEscape(s.startedAt),
        csvEscape(s.endedAt),
        csvEscape(formatDurationCompact(s.connectedSeconds)),
        csvEscape(formatDurationCompact(s.activeSeconds)),
        csvEscape(s.label),
        csvEscape(generatedAt),
      ].join(";"),
    );
  }
  if (detail.sessions.length === 0) {
    lines.push(
      [
        csvEscape("Byound"),
        csvEscape(detail.displayName),
        csvEscape(detail.email),
        csvEscape(detail.courseTitle),
        csvEscape(periodLabel),
        csvEscape(formatDurationCompact(0)),
        "",
        "",
        "",
        "",
        "",
        csvEscape(generatedAt),
      ].join(";"),
    );
  }

  return new NextResponse("\uFEFF" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="releve-${detail.userId.slice(0, 8)}.csv"`,
    },
  });
}
