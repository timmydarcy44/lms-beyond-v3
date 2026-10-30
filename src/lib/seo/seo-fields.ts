import { z } from "zod";
import { defaultCanonicalUrl, type SeoPageRecord } from "@/lib/seo/byound-seo";
import { seoDraftFromPage, type SeoDraftFields } from "@/lib/seo/draft";

export const seoFaqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const seoFieldsSchema = z.object({
  path: z.string().min(1),
  title: z.string().optional(),
  meta_description: z.string().optional(),
  h1: z.string().optional(),
  h2: z.array(z.string()).optional(),
  og_title: z.string().optional(),
  og_description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  focus_keyword: z.string().optional(),
  canonical_url: z.string().optional(),
  og_image_url: z.string().optional(),
  jsonld_types: z.array(z.string()).optional(),
  ai_summary: z.string().optional(),
  faq: z.array(seoFaqSchema).optional(),
  noindex: z.boolean().optional(),
});

export function draftFromBody(path: string, body: z.infer<typeof seoFieldsSchema>, fallback?: SeoPageRecord): SeoDraftFields {
  const base = fallback ? seoDraftFromPage(fallback) : seoDraftFromPage({
    title: "",
    meta_description: "",
    h1: "",
    h2: [],
    og_title: "",
    og_description: "",
    keywords: [],
    focus_keyword: "",
    canonical_url: defaultCanonicalUrl(path),
    og_image_url: "",
    jsonld_types: [],
    ai_summary: "",
    faq: [],
    noindex: false,
  });
  return {
    title: body.title ?? base.title,
    meta_description: body.meta_description ?? base.meta_description,
    h1: body.h1 ?? base.h1,
    h2: Array.isArray(body.h2) ? body.h2.map((item) => item.trim()).filter(Boolean) : base.h2,
    og_title: body.og_title ?? base.og_title,
    og_description: body.og_description ?? base.og_description,
    keywords: Array.isArray(body.keywords) ? body.keywords.map((item) => item.trim()).filter(Boolean) : base.keywords,
    focus_keyword: body.focus_keyword ?? base.focus_keyword,
    canonical_url: body.canonical_url ?? base.canonical_url,
    og_image_url: body.og_image_url ?? base.og_image_url,
    jsonld_types: Array.isArray(body.jsonld_types) ? body.jsonld_types.map((item) => item.trim()).filter(Boolean) : base.jsonld_types,
    ai_summary: body.ai_summary ?? base.ai_summary,
    faq: Array.isArray(body.faq) ? body.faq.filter((item) => item.question.trim() && item.answer.trim()) : base.faq,
    noindex: body.noindex ?? base.noindex,
  };
}

export function liveRowFromDraft(path: string, draft: SeoDraftFields, updatedBy: string | null) {
  return {
    path,
    title: draft.title.trim() || null,
    meta_description: draft.meta_description.trim() || null,
    h1: draft.h1.trim() || null,
    h2: draft.h2,
    og_title: draft.og_title.trim() || null,
    og_description: draft.og_description.trim() || null,
    keywords: draft.keywords,
    focus_keyword: draft.focus_keyword.trim() || null,
    canonical_url: draft.canonical_url.trim() || defaultCanonicalUrl(path),
    og_image_url: draft.og_image_url.trim() || null,
    jsonld_types: draft.jsonld_types,
    ai_summary: draft.ai_summary.trim() || null,
    faq: draft.faq,
    noindex: draft.noindex === true,
    draft: null,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };
}
