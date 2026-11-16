import { NextRequest, NextResponse } from "next/server";
import { loadLearnerSuivi, type SuiviPeriod } from "@/lib/lms/learner-suivi-data";

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const period = (sp.get("period") as SuiviPeriod) || "30d";
  const includeHidden = sp.get("team") === "1";
  const q = (sp.get("q") ?? "").trim().toLowerCase();
  const filter = sp.get("filter") ?? "all";
  const formation = sp.get("formation") ?? "";
  const entreprise = sp.get("entreprise") ?? "";

  const { rows } = await loadLearnerSuivi({
    period: ["7d", "30d", "90d", "all"].includes(period) ? period : "30d",
    includeHidden,
  });

  let filtered = rows;
  if (q) {
    filtered = filtered.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.companyName ?? "").toLowerCase().includes(q),
    );
  }
  if (filter === "relance") filtered = filtered.filter((r) => r.needsRelance);
  if (formation) filtered = filtered.filter((r) => r.courseId === formation);
  if (entreprise) filtered = filtered.filter((r) => (r.companyName ?? "") === entreprise);

  const header = [
    "apprenant",
    "email",
    "role",
    "entreprise",
    "parcours",
    "chapitres_valides",
    "chapitres_total",
    "chapitre_en_cours",
    "derniere_activite",
    "premiere_connexion",
    "temps_actif_min",
    "temps_connecte_min",
    "seances",
    "notes",
    "transformations",
    "a_relancer",
  ];

  const lines = [header.join(";")];
  for (const r of filtered) {
    lines.push(
      [
        csvEscape(r.displayName),
        csvEscape(r.email),
        csvEscape(r.roleLabel),
        csvEscape(r.companyName),
        csvEscape(r.courseTitle),
        r.chaptersValidated,
        r.chaptersTotal,
        csvEscape(r.currentChapterTitle),
        csvEscape(r.lastActivityAt),
        csvEscape(r.firstSeenAt),
        Math.round(r.activeSeconds / 60),
        Math.round(r.connectedSeconds / 60),
        r.sessionCount,
        r.notes,
        r.transformations,
        r.needsRelance ? "oui" : "non",
      ].join(";"),
    );
  }

  const body = "\uFEFF" + lines.join("\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="suivi-apprenants.csv"`,
    },
  });
}
