import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  title?: string | null;
  name?: string | null;
  objectives?: unknown;
  duration?: unknown;
  prerequisites?: unknown;
  price?: unknown;
  accessibility?: unknown;
};

function parseObjectives(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((o) => String(o).trim()).filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed.map((o) => String(o).trim()).filter(Boolean);
    } catch {
      return raw
        .split(/\n|;/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

/** Liste des formations avec preuve objectifs / accessibilité pour dossier auditeur. */
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const [trainingRes, coursesRes, expertsRes] = await Promise.all([
    supabase.from("training_courses").select("*").limit(200),
    supabase.from("courses").select("id, title, name, objectives").limit(200),
    supabase
      .from("experts")
      .select("id, first_name, last_name, headline, review_status")
      .eq("review_status", "approved")
      .limit(50),
  ]);

  const rows: Array<{
    id: string;
    source: "training_courses" | "courses";
    title: string;
    objectives: string[];
    objectivesOk: boolean;
    onePager: string;
  }> = [];

  for (const row of (trainingRes.data ?? []) as CourseRow[]) {
    const objectives = parseObjectives(row.objectives);
    const title = String(row.title || row.name || "Formation");
    rows.push({
      id: String(row.id),
      source: "training_courses",
      title,
      objectives,
      objectivesOk: objectives.length >= 3,
      onePager: [
        `# ${title}`,
        "",
        "## Objectifs pédagogiques",
        ...objectives.map((o, i) => `${i + 1}. ${o}`),
        "",
        "## Accessibilité",
        "Référent handicap : referent-handicap@byound.fr — étude personnalisée de chaque situation.",
        "",
        `Source: training_courses/${row.id}`,
      ].join("\n"),
    });
  }

  for (const row of (coursesRes.data ?? []) as CourseRow[]) {
    if (rows.some((r) => r.id === String(row.id))) continue;
    const objectives = parseObjectives(row.objectives);
    const title = String(row.title || row.name || "Formation");
    rows.push({
      id: String(row.id),
      source: "courses",
      title,
      objectives,
      objectivesOk: objectives.length >= 3,
      onePager: [
        `# ${title}`,
        "",
        "## Objectifs pédagogiques",
        ...(objectives.length ? objectives.map((o, i) => `${i + 1}. ${o}`) : ["(à compléter)"]),
        "",
        "## Accessibilité",
        "Référent handicap : referent-handicap@byound.fr — étude personnalisée de chaque situation.",
      ].join("\n"),
    });
  }

  const withObjectives = rows.filter((r) => r.objectivesOk).length;

  return NextResponse.json({
    summary: {
      coursesTotal: rows.length,
      withObjectives,
      approvedExperts: (expertsRes.data ?? []).length,
      expertsOk: (expertsRes.data ?? []).length >= 2,
    },
    courses: rows,
    experts: expertsRes.data ?? [],
  });
}
