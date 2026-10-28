import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadSeoTemplates, seedSeoTemplatesIfEmpty } from "@/lib/seo/resolve-generated";
import { validateSeoTemplate, type SeoTemplateType } from "@/lib/seo/templates";
import { getServiceRoleClient } from "@/lib/supabase/server";

const schema = z.object({
  type: z.enum(["job_offer", "training", "article"]),
  title_template: z.string().min(1).max(200),
  description_template: z.string().min(1).max(500),
  jsonld_type: z.string().max(80).optional(),
  og_image_url: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const type = parsed.data.type as SeoTemplateType;
  const invalid = validateSeoTemplate(type, parsed.data.title_template, parsed.data.description_template);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  await seedSeoTemplatesIfEmpty();
  const { error } = await db.from("seo_templates").upsert(
    {
      type,
      title_template: parsed.data.title_template,
      description_template: parsed.data.description_template,
      jsonld_type: parsed.data.jsonld_type ?? null,
      og_image_url: parsed.data.og_image_url ?? "",
    },
    { onConflict: "type" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, templates: await loadSeoTemplates() });
}
