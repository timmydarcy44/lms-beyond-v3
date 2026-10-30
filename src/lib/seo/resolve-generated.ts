import { loadSeoOverrides, toNextMetadata } from "@/lib/seo/byound-seo";
import {
  DEFAULT_SEO_TEMPLATE_ROWS,
  fillGeneratedFields,
  type SeoTemplateRecord,
  type SeoTemplateType,
} from "@/lib/seo/templates";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { posts as staticBlogPosts } from "@/app/blog/content";
import type { Metadata } from "next";

export type SeoTemplateExample = {
  path: string;
  vars: Record<string, string>;
  sourceDescription: string;
};

export async function loadSeoTemplateExamples(): Promise<Record<SeoTemplateType, SeoTemplateExample | null>> {
  const db = getServiceRoleClient();
  const empty = { job_offer: null, training: null, article: null } as Record<SeoTemplateType, SeoTemplateExample | null>;
  const articleFallback: SeoTemplateExample | null = staticBlogPosts[0]
    ? {
        path: `/blog/${staticBlogPosts[0].slug}`,
        vars: { titre: staticBlogPosts[0].title, chapô: staticBlogPosts[0].description },
        sourceDescription: staticBlogPosts[0].description,
      }
    : null;
  if (!db) return { ...empty, article: articleFallback };

  const [job, training, article] = await Promise.all([
    db.from("public_job_offers").select("slug, title, city, contract_type, diploma_prepared, description").limit(1).maybeSingle(),
    db.from("training_courses").select("slug, title, level, formats, duration, short_description").eq("is_active", true).limit(1).maybeSingle(),
    db.from("blog_posts").select("slug, title, excerpt, meta_description").eq("is_published", true).limit(1).maybeSingle(),
  ]);

  const jobRow = job.data as Record<string, unknown> | null;
  const trainingRow = training.data as Record<string, unknown> | null;
  const articleRow = article.data as Record<string, unknown> | null;
  const rythme = Array.isArray(trainingRow?.formats) ? (trainingRow.formats as string[]).filter(Boolean).join(", ") : String(trainingRow?.duration ?? "");

  return {
    job_offer: jobRow
      ? {
          path: `/offres/${String(jobRow.slug ?? "")}`,
          vars: {
            intitulé: String(jobRow.title ?? ""),
            contrat: String(jobRow.contract_type ?? ""),
            ville: String(jobRow.city ?? ""),
            cursus: String(jobRow.diploma_prepared ?? ""),
          },
          sourceDescription: String(jobRow.description ?? ""),
        }
      : null,
    training: trainingRow
      ? {
          path: `/business/formations/${String(trainingRow.slug ?? "")}`,
          vars: {
            formation: String(trainingRow.title ?? ""),
            niveau: String(trainingRow.level ?? ""),
            rythme,
          },
          sourceDescription: String(trainingRow.short_description ?? ""),
        }
      : null,
    article: articleRow
      ? {
          path: `/blog/${String(articleRow.slug ?? "")}`,
          vars: {
            titre: String(articleRow.title ?? ""),
            chapô: String(articleRow.excerpt ?? articleRow.meta_description ?? ""),
          },
          sourceDescription: String(articleRow.excerpt ?? articleRow.meta_description ?? ""),
        }
      : articleFallback,
  };
}

export async function loadSeoTemplates(): Promise<SeoTemplateRecord[]> {
  const db = getServiceRoleClient();
  if (!db) return DEFAULT_SEO_TEMPLATE_ROWS;
  const { data, error } = await db.from("seo_templates").select("type, title_template, description_template, jsonld_type, og_image_url");
  if (error || !data?.length) return DEFAULT_SEO_TEMPLATE_ROWS;
  const map = new Map(DEFAULT_SEO_TEMPLATE_ROWS.map((item) => [item.type, item]));
  for (const row of data) {
    const type = row.type as SeoTemplateType;
    if (!map.has(type)) continue;
    map.set(type, {
      type,
      title_template: String(row.title_template ?? map.get(type)!.title_template),
      description_template: String(row.description_template ?? map.get(type)!.description_template),
      jsonld_type: String(row.jsonld_type ?? map.get(type)!.jsonld_type),
      og_image_url: String(row.og_image_url ?? ""),
    });
  }
  return [...map.values()];
}

export async function seedSeoTemplatesIfEmpty() {
  const db = getServiceRoleClient();
  if (!db) return;
  const { count } = await db.from("seo_templates").select("type", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;
  await db.from("seo_templates").upsert(DEFAULT_SEO_TEMPLATE_ROWS, { onConflict: "type" });
}

export async function resolveGeneratedMetadata(opts: {
  type: SeoTemplateType;
  path: string;
  vars: Record<string, string>;
  sourceDescription?: string;
  companyNames?: string[];
}): Promise<Metadata> {
  const templates = await loadSeoTemplates();
  const template = templates.find((item) => item.type === opts.type) ?? DEFAULT_SEO_TEMPLATE_ROWS.find((item) => item.type === opts.type)!;
  const overrides = await loadSeoOverrides();
  const override = overrides.get(opts.path);
  let { title, description } = fillGeneratedFields(template, opts.vars, opts.sourceDescription ?? "", opts.companyNames ?? []);
  if (override?.title) title = override.title;
  if (override?.meta_description) description = override.meta_description;
  const og = override?.og_image_url || template.og_image_url;
  const jsonld = override?.jsonld_types?.length ? override.jsonld_types : [template.jsonld_type];
  return toNextMetadata({
    path: opts.path,
    title,
    meta_description: description,
    h1: "",
    h2: [],
    og_title: title,
    og_description: description,
    keywords: [],
    focus_keyword: "",
    canonical_url: "",
    og_image_url: og,
    jsonld_types: jsonld.filter(Boolean),
    ai_summary: "",
    faq: [],
    noindex: override?.noindex === true,
    score: null,
    headings_cache: null,
    headings_cached_at: null,
    draft: null,
    published_at: null,
    updated_at: null,
  });
}
