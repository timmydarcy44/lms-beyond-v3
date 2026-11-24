import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { loadLearnerSuiviDetail } from "@/lib/lms/learner-suivi-detail";
import { formatDurationCompact } from "@/lib/lms/lms-metrics";

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
  const detail = await loadLearnerSuiviDetail(userId);
  if (!detail) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const generatedAt = new Date().toISOString();
  const periodLabel = detail.firstSessionAt
    ? `${detail.firstSessionAt.slice(0, 10)} → ${new Date().toISOString().slice(0, 10)}`
    : "—";

  if (format === "pdf") {
    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/><title>Relevé de connexion — ${detail.displayName}</title>
<style>
  body{font-family:system-ui,sans-serif;color:#111;padding:32px;max-width:800px;margin:auto}
  h1{font-size:20px;margin:0 0 8px} .meta{color:#555;font-size:13px;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}
  th{color:#555;font-weight:600}
  .foot{margin-top:28px;font-size:11px;color:#777}
</style></head><body>
  <h1>Relevé de connexion Qualiopi</h1>
  <div class="meta">
    <div>Organisme : Byound</div>
    <div>Apprenant : ${detail.displayName} (${detail.email})</div>
    <div>Formation : ${detail.courseTitle ?? "—"}</div>
    <div>Période : ${periodLabel}</div>
    <div>Total temps actif : ${formatDurationCompact(detail.activeSeconds)}</div>
  </div>
  <table>
    <thead><tr><th>Date</th><th>Connecté</th><th>Actif</th><th>Activité</th></tr></thead>
    <tbody>
      ${detail.sessions
        .map(
          (s) =>
            `<tr><td>${s.startedAt.slice(0, 16).replace("T", " ")}</td><td>${formatDurationCompact(s.connectedSeconds)}</td><td>${formatDurationCompact(s.activeSeconds)}</td><td>${s.label}</td></tr>`,
        )
        .join("")}
    </tbody>
  </table>
  <p class="foot">Généré le ${generatedAt} — signature système Byound Control. Le relevé Qualiopi retient le temps actif.</p>
  <script>window.onload=()=>window.print()</script>
</body></html>`;
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="releve-${detail.userId.slice(0, 8)}.html"`,
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
