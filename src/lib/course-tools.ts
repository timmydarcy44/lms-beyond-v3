export type CourseTool =
  | "Airtable"
  | "Slack"
  | "Notion"
  | "Lovable"
  | "Glide"
  | "Zapier"
  | "Make"
  | "Claude"
  | "ChatGPT"
  | "Kling AI"
  | "Gemini"
  | "Webflow"
  | "n8n"
  | "OpenClaw"
  | "Figma";

export const COURSE_TOOL_OPTIONS: readonly CourseTool[] = [
  "Airtable",
  "Slack",
  "Notion",
  "Lovable",
  "Glide",
  "Zapier",
  "Make",
  "Claude",
  "ChatGPT",
  "Kling AI",
  "Gemini",
  "Webflow",
  "n8n",
  "OpenClaw",
  "Figma",
] as const;

/**
 * Logos officiels (bucket Supabase) fournis par le métier.
 * Si un outil n’a pas de logo ici, on affiche l’initiale côté UI.
 */
const COURSE_TOOL_LOGO_URL_BY_KEY: Readonly<Record<string, string>> = {
  airtable: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Logos/airtable.jpg",
  chatgpt:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Logos/chatgpt_logo.png",
  figma:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Logos/figma-logo_brandlogos.net_6n1pb-512x512.png",
  gemini:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Logos/Google_Gemini_icon_2025.svg.png",
  claude: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Logos/images.png",
  "kling ai":
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Logos/kling-color.png",
  make: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Logos/make-color.png",
  n8n: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Logos/n8n-color.png",
  notion:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Logos/Notion-logo.svg.png",
  slack:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Logos/Slack_icon_2019.svg.png",
  webflow:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Logos/webflow_logo_icon_169218.webp",
  zapier:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Logos/zapier_logo_icon_169680.png",
};

/**
 * URL du logo : prioritaire = mapping Supabase.
 * Fallback optionnel via env si vous souhaitez externaliser sans changer le code.
 */
export function getCourseToolLogoUrl(tool: string): string | null {
  const t = String(tool ?? "").trim();
  if (!t) return null;

  const direct = COURSE_TOOL_LOGO_URL_BY_KEY[t.toLowerCase()];
  if (direct) return direct;

  const ext =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_COURSE_TOOL_LOGOS_EXT?.trim()) || ".svg";
  const extSafe = ext.startsWith(".") ? ext : `.${ext}`;

  const base = (
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_COURSE_TOOL_LOGOS_BASE_URL) ||
    ""
  )
    .trim()
    .replace(/\/$/, "");

  if (base) {
    // Convention: base + '/' + slug (kebab-case conseillé) + ext
    const slug = t.toLowerCase().replace(/\s+/g, "-");
    return `${base}/${slug}${extSafe}`;
  }

  // Optionnel : assets versionnés dans /public (pas de requête si le fichier n’existe pas — le composant gère l’erreur)
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_COURSE_TOOL_LOGOS_USE_PUBLIC === "1"
  ) {
    const slug = t.toLowerCase().replace(/\s+/g, "-");
    return `/course-tool-logos/${slug}${extSafe}`;
  }

  return null;
}

export function normalizeCourseTools(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const cleaned = input
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);
  // Uniques, conserver l’ordre
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of cleaned) {
    const k = item.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(item);
  }
  return unique;
}

