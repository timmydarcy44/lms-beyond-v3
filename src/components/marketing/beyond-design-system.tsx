import { cn } from "@/lib/utils";

export const beyondColors = {
  navy: "#071A2F",
  offWhite: "#F8FAFC",
  white: "#FFFFFF",
  textDark: "#0F172A",
  textSecondary: "#475569",
  cyan: "#06B6D4",
  violet: "#7C3AED",
  borderLight: "#E2E8F0",
  cardDark: "#102A43",
} as const;

export type BeyondSectionTheme = "dark" | "light" | "offWhite";

const sectionThemes: Record<BeyondSectionTheme, string> = {
  dark: "bg-[#071A2F] text-slate-100",
  light: "bg-white text-[#0F172A]",
  offWhite: "bg-[#F8FAFC] text-[#0F172A]",
};

const subtitleThemes: Record<BeyondSectionTheme, string> = {
  dark: "text-slate-400",
  light: "text-[#475569]",
  offWhite: "text-[#475569]",
};

export function BeyondSection({
  id,
  theme = "dark",
  className,
  children,
  bleed = false,
}: {
  id?: string;
  theme?: BeyondSectionTheme;
  className?: string;
  children: React.ReactNode;
  bleed?: boolean;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24", sectionThemes[theme])}>
      <div
        className={cn(
          "mx-auto w-full",
          bleed ? "max-w-none px-0" : "max-w-6xl px-5 py-20 md:px-8 md:py-28 lg:py-32",
          className
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function beyondSubtitleClass(theme: BeyondSectionTheme): string {
  return subtitleThemes[theme];
}

export function BeyondKicker({
  theme = "dark",
  children,
}: {
  theme?: BeyondSectionTheme;
  children: React.ReactNode;
}) {
  const colors: Record<BeyondSectionTheme, string> = {
    dark: "text-cyan-400/80",
    light: "text-[#7C3AED]",
    offWhite: "text-[#7C3AED]",
  };
  return (
    <p className={cn("text-xs font-medium uppercase tracking-[0.2em]", colors[theme])}>
      {children}
    </p>
  );
}

export const beyondBtnPrimary =
  "inline-flex items-center justify-center rounded-full bg-[#0F172A] px-8 py-3.5 text-sm font-medium text-white transition hover:bg-[#1e293b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06B6D4] dark:bg-white dark:text-[#0F172A] dark:hover:bg-[#F8FAFC]";

export const beyondBtnPrimaryOnDark =
  "inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-medium text-[#0F172A] transition hover:bg-[#F8FAFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export const beyondBtnSecondaryDark =
  "inline-flex items-center justify-center rounded-full border border-white/25 px-8 py-3.5 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50";

export const beyondBtnSecondaryLight =
  "inline-flex items-center justify-center rounded-full border border-[#E2E8F0] bg-transparent px-8 py-3.5 text-sm font-medium text-[#0F172A] transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06B6D4]";

export const beyondHeading =
  "font-semibold tracking-tight text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.08]";

export const beyondDisplay =
  "font-semibold tracking-tight text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.15]";
