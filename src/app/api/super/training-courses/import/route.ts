import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  normalizeCatalogImportItem,
  parseCatalogImportExcel,
  parseCatalogImportJson,
  type CatalogImportResult,
} from "@/lib/training-courses/import-catalog";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SELECT_SLUG = "id, slug";

/**
 * Import 1..N formations (JSON ou Excel).
 * - JSON : application/json body OU fichier .json
 * - Excel : multipart fichier .xlsx / .xls
 * Upsert sur `slug`. Ne force pas cover_url à null.
 */
export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let items: ReturnType<typeof parseCatalogImportJson>;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Fichier manquant (champ file)" }, { status: 400 });
      }
      const name = file.name.toLowerCase();
      const buf = Buffer.from(await file.arrayBuffer());
      if (name.endsWith(".json")) {
        const text = buf.toString("utf8");
        items = parseCatalogImportJson(JSON.parse(text));
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
        items = parseCatalogImportExcel(buf);
      } else {
        return NextResponse.json(
          { error: "Format non supporté — utilisez .json, .xlsx ou .xls" },
          { status: 400 },
        );
      }
    } else {
      const body = await request.json();
      items = parseCatalogImportJson(body);
    }

    if (!items.length) {
      return NextResponse.json({ error: "Aucune formation dans le fichier" }, { status: 400 });
    }
    if (items.length > 200) {
      return NextResponse.json({ error: "Maximum 200 formations par import" }, { status: 400 });
    }

    const result: CatalogImportResult = {
      upserted: 0,
      created: 0,
      updated: 0,
      errors: [],
      slugs: [],
    };

    for (let i = 0; i < items.length; i++) {
      const normalized = normalizeCatalogImportItem(items[i], i);
      if (!normalized.ok) {
        result.errors.push({ index: i, error: normalized.error });
        continue;
      }
      const row = normalized.row;
      const slug = String(row.slug);

      const existing = await supabase
        .from("training_courses")
        .select(SELECT_SLUG)
        .eq("slug", slug)
        .maybeSingle();

      if (existing.error) {
        result.errors.push({
          index: i,
          slug,
          title: String(row.title),
          error: existing.error.message,
        });
        continue;
      }

      if (existing.data?.id) {
        // Update : ne pas écraser avec null les champs absents du fichier
        const patch: Record<string, unknown> = { updated_at: row.updated_at };
        for (const [k, v] of Object.entries(row)) {
          if (k === "updated_at") continue;
          if (v !== null && v !== undefined) patch[k] = v;
        }
        const { error } = await supabase
          .from("training_courses")
          .update(patch)
          .eq("id", existing.data.id);
        if (error) {
          result.errors.push({
            index: i,
            slug,
            title: String(row.title),
            error: error.message,
          });
          continue;
        }
        result.updated += 1;
      } else {
        const { error } = await supabase.from("training_courses").insert(row);
        if (error) {
          result.errors.push({
            index: i,
            slug,
            title: String(row.title),
            error: error.message,
          });
          continue;
        }
        result.created += 1;
      }
      result.upserted += 1;
      result.slugs.push(slug);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[training-courses/import]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import impossible" },
      { status: 400 },
    );
  }
}
