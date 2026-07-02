import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary-dark" | "secondary-light" | "white" | "outline-white";
type Shape = "pill" | "revolut";

const variants: Record<Variant, string> = {
  primary:
    "bg-edge-accent text-white hover:bg-edge-accent-light hover:shadow-[0_0_32px_rgba(99,91,255,0.35)]",
  "secondary-dark":
    "border border-white/30 bg-transparent text-white hover:border-white/60 hover:bg-white/[0.04]",
  "secondary-light":
    "border border-black/15 bg-transparent text-edge-black-deep hover:border-black/30 hover:bg-black/[0.02]",
  white: "bg-white text-edge-black-deep hover:bg-white/90 hover:shadow-lg",
  "outline-white":
    "border border-white/30 bg-transparent text-white hover:border-white/60 hover:bg-white/[0.04]",
};

type Props = {
  variant?: Variant;
  shape?: Shape;
  href?: string;
  children: React.ReactNode;
  className?: string;
  showArrow?: boolean;
  ariaLabel?: string;
  type?: "button" | "submit";
  onClick?: () => void;
};

export function EdgePremiumButton({
  variant = "primary",
  shape = "pill",
  href,
  children,
  className,
  showArrow = false,
  ariaLabel,
  type = "button",
  onClick,
}: Props) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300",
    shape === "pill" ? "rounded-full px-7 py-3.5" : "rounded-2xl px-6 py-3",
    variants[variant],
    className,
  );

  const content = (
    <>
      {children}
      {showArrow ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={base} aria-label={ariaLabel} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={base} aria-label={ariaLabel} onClick={onClick}>
      {content}
    </button>
  );
}
