import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary-dark" | "secondary-light" | "outline-red" | "inverted";

const variants: Record<Variant, string> = {
  primary: "bg-edge-red text-white border border-edge-red hover:opacity-90",
  "secondary-dark":
    "bg-transparent text-white border border-white/30 hover:border-white/50",
  "secondary-light":
    "bg-transparent text-edge-black border border-black/20 hover:border-black/35",
  "outline-red": "bg-transparent text-edge-red border border-edge-red hover:bg-edge-red/5",
  inverted: "bg-white text-edge-red border border-white hover:opacity-90",
};

type Props = {
  variant?: Variant;
  href?: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  type?: "button" | "submit";
  onClick?: () => void;
};

export function EdgeButton({
  variant = "primary",
  href,
  children,
  className,
  ariaLabel,
  type = "button",
  onClick,
}: Props) {
  const base = cn(
    "inline-flex items-center justify-center rounded-full px-7 py-[11px] text-[13px] font-medium transition-opacity duration-200",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={base} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={base} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  );
}
