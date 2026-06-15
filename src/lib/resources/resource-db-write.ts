import type { SupabaseClient } from "@supabase/supabase-js";

function extractMissingColumn(message: string): string | null {
  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] ?? null;
}

function isMissingColumnError(code: string | undefined, message: string): boolean {
  const lower = message.toLowerCase();
  return (
    code === "42703" ||
    code === "PGRST204" ||
    lower.includes("could not find") ||
    (lower.includes("column") && lower.includes("schema cache"))
  );
}

function isTypeConstraintError(code: string | undefined, message: string): boolean {
  const lower = message.toLowerCase();
  return code === "23514" || lower.includes("resources_type_check") || lower.includes("resource_type_check");
}

function pruneUndefined(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function extractResourceHtml(resource: Record<string, unknown> | null | undefined): string | null {
  if (!resource) return null;
  const direct = String(resource.html_content ?? "").trim();
  if (direct) return direct;

  const raw = resource.content;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as { html?: string };
      const fromJson = String(parsed?.html ?? "").trim();
      if (fromJson) return fromJson;
    } catch {
      // content peut être du HTML brut
      if (raw.trim().startsWith("<")) return raw.trim();
    }
  }

  if (raw && typeof raw === "object" && "html" in raw) {
    const fromObj = String((raw as { html?: string }).html ?? "").trim();
    if (fromObj) return fromObj;
  }

  return null;
}

export function buildResourceContentMeta(options: {
  published: boolean;
  html?: string | null;
}): string {
  return JSON.stringify({
    v: 1,
    published: options.published,
    ...(options.html?.trim() ? { html: options.html.trim() } : {}),
  });
}

export function slugifyResourceTitle(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return `${base || "ressource"}-${Date.now()}`;
}

export async function insertRowWithColumnFallback(
  client: SupabaseClient,
  table: string,
  row: Record<string, unknown>,
  maxAttempts = 24,
): Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }> {
  const payload = pruneUndefined({ ...row });

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await client.from(table).insert(payload).select().single();
    if (!result.error && result.data) {
      return { data: result.data as Record<string, unknown>, error: null };
    }

    const message = result.error?.message ?? "";
    const code = result.error?.code;

    if (isTypeConstraintError(code, message)) {
      payload.type = "autre";
      if ("resource_type" in payload) payload.resource_type = "autre";
      continue;
    }

    if (!isMissingColumnError(code, message)) {
      return { data: null, error: { message, code } };
    }

    const missing = extractMissingColumn(message);
    if (missing && missing in payload) {
      delete payload[missing];
      continue;
    }

    return { data: null, error: { message, code } };
  }

  return { data: null, error: { message: "Impossible d'insérer la ressource (colonnes incompatibles)" } };
}

export async function updateRowWithColumnFallback(
  client: SupabaseClient,
  table: string,
  id: string,
  row: Record<string, unknown>,
  maxAttempts = 16,
): Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }> {
  const payload = pruneUndefined({ ...row });

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await client.from(table).update(payload).eq("id", id).select().single();
    if (!result.error && result.data) {
      return { data: result.data as Record<string, unknown>, error: null };
    }

    const message = result.error?.message ?? "";
    const code = result.error?.code;
    if (!isMissingColumnError(code, message)) {
      return { data: null, error: { message, code } };
    }

    const missing = extractMissingColumn(message);
    if (missing && missing in payload) {
      delete payload[missing];
      continue;
    }

    return { data: null, error: { message, code } };
  }

  return { data: null, error: { message: "Impossible de mettre à jour la ressource" } };
}
