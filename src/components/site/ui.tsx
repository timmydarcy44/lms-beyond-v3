import { cn } from "@/lib/utils";

export function Band({
  id,
  dark = false,
  children,
  className,
  innerClassName,
}: {
  id?: string;
  dark?: boolean;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <section id={id} className={cn(dark ? "bg-[#070C1C] text-white" : "bg-[#F4F4F1] text-[#0B0D14]", className)}>
      <div className={cn("mx-auto w-full max-w-[1240px] px-6 py-16 md:py-[104px]", innerClassName)}>{children}</div>
    </section>
  );
}

export function H2({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h2 className={cn("text-[36px] font-extrabold leading-[1.05] tracking-[-2px] md:text-[52px]", light ? "text-white" : "text-[#0B0D14]")}>
      {children}
    </h2>
  );
}

export const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E5BFF]";

export function Pill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "green" | "violet" | "muted" | "yellow" | "glass";
}) {
  const tones = {
    green: "bg-[#6BE39B] text-[#0B0D14]",
    violet: "bg-[#6E5BFF] text-white",
    yellow: "bg-[#F5C85C] text-[#0B0D14]",
    muted: "bg-[#E6E4DE] text-[#4A4F5C]",
    glass: "border border-white/20 text-white",
  } as const;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-[13px] font-extrabold ${tones[tone]}`}>
      {children}
    </span>
  );
}
