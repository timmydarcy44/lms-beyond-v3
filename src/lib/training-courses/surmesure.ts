import type { TrainingProgramSection } from "@/lib/training-courses/cms-types";
import type { TrainingCourseRow } from "@/lib/training-courses/types";

export const SURMESURE_SELECT =
  "id,slug,title,short_description,long_description,domain,cover_url,duration,level,formats,objectives,skills,program,program_structure,prerequisites,audience,intra_price,inter_price,max_intra_participants,badge_name,specific_needs,organization_id,source,is_active,created_at,updated_at";

export type SurMesureCourse = Pick<
  TrainingCourseRow,
  | "id"
  | "slug"
  | "title"
  | "short_description"
  | "long_description"
  | "domain"
  | "duration"
  | "level"
  | "formats"
  | "objectives"
  | "skills"
  | "prerequisites"
  | "audience"
  | "intra_price"
  | "inter_price"
  | "max_intra_participants"
  | "badge_name"
  | "is_active"
  | "created_at"
  | "updated_at"
> & {
  organization_id: string;
  source: "surmesure";
  specific_needs: string | null;
  program_structure: TrainingProgramSection[] | null;
};

export function slugifySurMesure(title: string, orgId: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const org = orgId.replace(/-/g, "").slice(0, 8);
  return `sm-${org}-${base || "formation"}-${Date.now().toString(36)}`;
}

export function splitLines(value: string): string[] {
  return value
    .split(/\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}
