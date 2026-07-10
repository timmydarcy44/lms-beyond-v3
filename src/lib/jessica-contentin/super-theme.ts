/**
 * Design system /super Jessica — Apple / Revolut
 * Dominante blanc & noir, CTA bleu nuit + overlay violet.
 */

export const JESSICA_SUPER = {
  bg: "#FFFFFF",
  bgMuted: "#F5F5F7",
  bgSubtle: "#FAFAFA",
  text: "#000000",
  textSecondary: "#6E6E73",
  textMuted: "#86868B",
  border: "rgba(0,0,0,0.06)",
  borderStrong: "rgba(0,0,0,0.10)",
  ctaFrom: "#0B1426",
  ctaVia: "#1E1B4B",
  ctaTo: "#5B21B6",
  accent: "#6366F1",
  accentViolet: "#8B5CF6",
} as const;

export const jessicaSuper = {
  page: "min-h-screen bg-white",
  container: "mx-auto max-w-7xl px-6 py-10 md:py-12",
  title: "text-3xl font-semibold tracking-tight text-black md:text-4xl",
  subtitle: "mt-1.5 text-base text-neutral-500",
  card: "rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
  cardHover:
    "rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-black/[0.10] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
  statLabel: "text-sm font-medium text-neutral-500",
  statValue: "text-3xl font-semibold tracking-tight text-black",
  statValueAccent:
    "text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[#0B1426] via-[#3730A3] to-[#7C3AED]",
  input:
    "w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-black placeholder:text-neutral-400 transition focus:border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/15",
  inputRounded:
    "w-full rounded-full border border-black/[0.08] bg-white py-3 pl-12 pr-4 text-sm text-black placeholder:text-neutral-400 transition focus:border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/15",
  cta: "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#0B1426] via-[#1E1B4B] to-[#5B21B6] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(30,27,75,0.30)] transition hover:brightness-110 hover:shadow-[0_6px_22px_rgba(91,33,182,0.35)] active:scale-[0.98] disabled:opacity-50",
  ctaSm: "inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-[#0B1426] via-[#1E1B4B] to-[#5B21B6] px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(30,27,75,0.25)] transition hover:brightness-110 active:scale-[0.98]",
  ctaOutline:
    "inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-50 active:scale-[0.98]",
  ghost:
    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-black",
  navItem:
    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-black",
  navItemActive:
    "flex items-center gap-2 rounded-full bg-gradient-to-br from-[#0B1426] via-[#1E1B4B] to-[#5B21B6] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(30,27,75,0.25)]",
  iconBox: "flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700",
  iconBoxAccent:
    "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700",
  badge: "inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700",
  badgeAccent:
    "inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700",
  avatar:
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1426] via-[#312E81] to-[#6D28D9] text-sm font-semibold text-white",
  rowMuted: "rounded-xl bg-neutral-50 px-4 py-3",
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
} as const;
