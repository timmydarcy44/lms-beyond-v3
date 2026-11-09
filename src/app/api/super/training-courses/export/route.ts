import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { buildTrainingCatalogExport } from "@/lib/training-courses/export-catalog";
import type { TrainingCourseRow } from "@/lib/training-courses/types";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const SELECT_COLS_BASE =
  "id,slug,title,short_description,long_description,domain,cover_url,duration,level,formats,objectives,skills,program,program_structure,prerequisites,audience,intra_price,inter_price,max_intra_participants,badge_name,badge_class_id,meta_description,seo_tags,faq,why_choose,instructors,page_blocks,sessions,benefits,case_studies,deliverables,methodology,illustrations,trainer_id,trainer_name,trainer_headline,trainer_photo_url,is_active,created_at,updated_at";
const SELECT_COLS = `${SELECT_COLS_BASE},lms_course_id`;

/** Export Excel du catalogue formations (multi-onglets). */
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  let { data, error } = await supabase
    .from("training_courses")
    .select(SELECT_COLS)
    .order("title", { ascending: true });

  if (error && /lms_course_id/i.test(error.message)) {
    ({ data, error } = await supabase
      .from("training_courses")
      .select(SELECT_COLS_BASE)
      .order("title", { ascending: true }));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const courses = (data ?? []) as TrainingCourseRow[];
  const sheets = buildTrainingCatalogExport(courses);

  const book = XLSX.utils.book_new();
  const add = (name: string, rows: Array<Record<string, unknown>>) => {
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ info: "Aucune donnée" }]);
    XLSX.utils.book_append_sheet(book, sheet, name.slice(0, 31));
  };

  add("Catalogue", sheets.catalogue);
  add("Programme", sheets.programme);
  add("Sessions", sheets.sessions);
  add("FAQ", sheets.faq);
  add("Formateurs", sheets.formateurs);

  const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `catalogue-formations-byound-${stamp}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
