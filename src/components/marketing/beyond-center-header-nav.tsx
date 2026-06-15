import Link from "next/link";
import { cn } from "@/lib/utils";

const demoMail = "mailto:contact@beyondcenter.fr?subject=D%C3%A9mo%20Beyond";

export function BeyondCenterHeaderNav({
  variant = "dark",
}: {
  variant?: "dark" | "light" | "transparent";
}) {
  const isTransparent = variant === "transparent";
  const isDark = variant === "dark" || isTransparent;
  const linkHover = isDark ? "hover:text-white" : "hover:text-[#0F172A]";

  return (
    <header
      className={cn(
        "z-50 transition-colors",
        isTransparent
          ? "fixed inset-x-0 top-0 border-b border-white/[0.06] bg-[#071A2F]/20 backdrop-blur-md"
          : cn(
              "sticky top-0 backdrop-blur-xl",
              isDark
                ? "border-b border-white/[0.06] bg-[#071A2F]/80"
                : "border-b border-[#E2E8F0]/80 bg-white/80"
            )
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link
          href="/"
          className={cn(
            "text-[15px] font-semibold tracking-tight",
            isDark ? "text-white" : "text-[#0F172A]"
          )}
        >
          Beyond
        </Link>
        <nav
          className={cn(
            "flex items-center gap-6 text-[13px] font-medium",
            isDark ? "text-slate-400" : "text-[#64748B]"
          )}
        >
          <Link href="/beyond-index" className={linkHover}>
            Beyond Index
          </Link>
          <a href="/#studio" className={cn("hidden sm:inline", linkHover)}>
            Beyond Studio
          </a>
          <Link href="/prix" className={cn("hidden md:inline", linkHover)}>
            Prix
          </Link>
          <Link href="/login" className={linkHover}>
            Connexion
          </Link>
          <a
            href={demoMail}
            className={cn(
              "rounded-full px-4 py-2 text-[13px] font-semibold transition",
              isDark
                ? "bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                : "bg-[#071A2F] text-white hover:bg-[#0B2442]"
            )}
          >
            Démo
          </a>
        </nav>
      </div>
    </header>
  );
}
