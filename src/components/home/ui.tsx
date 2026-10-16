import Link from "next/link";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("px-6 py-[clamp(72px,9vw,120px)]", className)}>
      <div className="relative mx-auto w-full max-w-[1240px]">{children}</div>
    </section>
  );
}

const buttonClass = {
  white: "bg-white text-[#07080B]",
  dark: "bg-[#07080B] text-white",
  "outline-light": "border border-white/30 bg-[rgba(7,12,28,0.4)] text-white",
  "outline-dark": "border border-[#E3E0D8] bg-transparent text-[#07080B]",
  translucent: "bg-white/20 text-white",
} as const;

export function ButtonPill({
  href,
  children,
  variant = "dark",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof buttonClass;
  className?: string;
}) {
  const tall = variant === "white" || variant === "dark";
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-6 text-[15px] font-extrabold no-underline",
        tall ? "h-14" : "h-12 font-bold",
        buttonClass[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Pill({
  children,
  href,
  featured = false,
  onDark = true,
}: {
  children: React.ReactNode;
  href?: string;
  featured?: boolean;
  onDark?: boolean;
}) {
  const className = cn(
    "inline-flex min-h-9 items-center rounded-full px-3.5 text-[13px] font-bold no-underline",
    featured
      ? "bg-white text-[#07080B]"
      : onDark
        ? "bg-white/10 text-white"
        : "bg-[#07080B]/5 text-[#07080B]",
  );
  if (!href) return <span className={className}>{children}</span>;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function BigTile({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-[560px] flex-col overflow-hidden rounded-[36px] p-[clamp(28px,3vw,44px)] text-white no-underline transition-transform duration-200 hover:-translate-y-1",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function StatTile({
  value,
  label,
  source,
  light = false,
}: {
  value: string;
  label: string;
  source: string;
  light?: boolean;
}) {
  return (
    <article className={cn("rounded-[28px] p-7", light ? "bg-[#6E5BFF] text-white" : "bg-white text-[#07080B]")}>
      <p className="text-[clamp(48px,5vw,68px)] font-extrabold leading-none tracking-[-2px]">{value}</p>
      <p className="mt-3 text-base font-bold">{label}</p>
      <p className={cn("mt-2 text-[13px]", light ? "text-white/80" : "text-[#6B6F7A]")}>{source}</p>
    </article>
  );
}
