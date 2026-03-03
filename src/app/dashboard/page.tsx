import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, BriefcaseBusiness, HeartPulse, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";

type ProfileAccessRow = {
  id: string;
  email: string | null;
  role: string | null;
  role_type: string | null;
  access_lms: boolean | null;
  access_connect: boolean | null;
  access_care: boolean | null;
  access_pro: boolean | null;
  school_id: string | null;
};

const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

export default async function DashboardPage() {
  const session = await requireSession();

  const service = await getServiceRoleClientOrFallback();
  if (!service) {
    redirect("/login");
  }

  const profileSelect =
    "id, email, role, role_type, access_lms, access_connect, access_care, access_pro, school_id";
  const { data: byId } = await service
    .from("profiles")
    .select(profileSelect)
    .eq("id", session.id)
    .maybeSingle();

  let profile = (byId as ProfileAccessRow | null) ?? null;
  if (!profile && session.email) {
    const { data: byEmail } = await service
      .from("profiles")
      .select(profileSelect)
      .eq("email", session.email)
      .limit(10);
    const rows = (byEmail as ProfileAccessRow[] | null) ?? [];
    profile = rows.find((row) => row.id === session.id) ?? rows[0] ?? null;
  }

  const role = normalize(profile?.role || profile?.role_type);
  const isAdmin = role === "admin" || role === "super_admin";
  const isMentor = role === "mentor";
  const hasLms = profile?.access_lms === true;
  const hasConnect = profile?.access_connect !== false;
  const hasCare = profile?.access_care === true;
  const hasPro = profile?.access_pro === true;
  const sessionRole = normalize(session.role);
  const lmsHref =
    sessionRole === "admin" || sessionRole === "formateur"
      ? "/dashboard/formateur"
      : sessionRole === "tuteur"
        ? "/dashboard/tuteur"
        : "/dashboard/student/learning";
  const connectHref =
    sessionRole === "tuteur" || sessionRole === "entreprise"
      ? "/dashboard/entreprise"
      : sessionRole === "admin" || sessionRole === "formateur" || sessionRole === "ecole"
        ? "/dashboard/ecole"
        : "/dashboard/apprenant";

  const sidebarLinks = [
    { label: "Mon profil Beyond", href: "/dashboard/apprenant" },
    { label: "Mes tests", href: "/dashboard/apprenant" },
    ...(hasLms ? [{ label: "Ma formation", href: lmsHref }] : []),
    ...(hasLms && (isAdmin || isMentor) ? [{ label: "Studio", href: "/dashboard/formateur" }] : []),
    ...(hasCare ? [{ label: "Mon suivi", href: "/dashboard/formateur/beyond-care" }] : []),
  ];

  const cards = [
    {
      key: "connect",
      title: "Beyond Connect",
      href: connectHref,
      enabled: hasConnect,
      description: "Profil, tests de personnalite et matching.",
    },
    {
      key: "lms",
      title: "Beyond LMS",
      href: lmsHref,
      enabled: hasLms,
      description: "Parcours de formation, progression et contenus pedagogiques.",
    },
    {
      key: "care",
      title: "Beyond Care",
      href: "/dashboard/formateur/beyond-care",
      enabled: hasCare,
      description: "Suivi d accompagnement et indicateurs care.",
    },
    {
      key: "pro",
      title: "Beyond Pro",
      href: "/dashboard/entreprise",
      enabled: hasPro,
      description: "Gestion entreprise et suivi pro.",
    },
  ];

  const firstName =
    session.fullName?.trim().split(/\s+/)[0] ||
    session.email?.split("@")[0] ||
    "utilisateur";
  const productVisuals: Record<
    string,
    { icon: ComponentType<{ className?: string }>; glow: string; ring: string }
  > = {
    connect: {
      icon: Sparkles,
      glow: "from-amber-400/35 via-orange-500/10 to-transparent",
      ring: "hover:border-amber-300/50 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_24px_60px_-24px_rgba(251,146,60,0.55)]",
    },
    lms: {
      icon: BookOpen,
      glow: "from-cyan-400/35 via-blue-500/10 to-transparent",
      ring: "hover:border-cyan-300/50 hover:shadow-[0_0_0_1px_rgba(103,232,249,0.35),0_24px_60px_-24px_rgba(56,189,248,0.55)]",
    },
    care: {
      icon: HeartPulse,
      glow: "from-emerald-400/35 via-green-500/10 to-transparent",
      ring: "hover:border-emerald-300/50 hover:shadow-[0_0_0_1px_rgba(110,231,183,0.35),0_24px_60px_-24px_rgba(16,185,129,0.55)]",
    },
    pro: {
      icon: BriefcaseBusiness,
      glow: "from-purple-400/35 via-violet-500/10 to-transparent",
      ring: "hover:border-purple-300/50 hover:shadow-[0_0_0_1px_rgba(196,181,253,0.35),0_24px_60px_-24px_rgba(139,92,246,0.55)]",
    },
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold tracking-[0.24em] text-white">BEYOND</span>
            <nav className="hidden items-center gap-4 text-xs text-white/70 md:flex">
              {cards.map((card) =>
                card.enabled ? (
                  <Link key={`top-${card.key}`} href={card.href} className="transition hover:text-white">
                    {card.title.replace("Beyond ", "")}
                  </Link>
                ) : (
                  <span key={`top-${card.key}`} className="text-white/35">
                    {card.title.replace("Beyond ", "")}
                  </span>
                ),
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">
              {firstName.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-sm text-white/80">{firstName}</span>
          </div>
        </div>
      </header>

      <div className="px-4 pb-8 pt-20">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {[
            { label: "Mon profil", href: "/dashboard/apprenant" },
            { label: "Mes tests", href: "/dashboard/apprenant" },
            ...(hasLms ? [{ label: "Ma formation", href: lmsHref }] : []),
          ].map((item) => (
            <Link
              key={`quick-${item.label}-${item.href}`}
              href={item.href}
              className="shrink-0 rounded-full bg-white/10 px-4 py-1 text-sm text-white/85 transition hover:bg-white/15"
            >
              {item.label}
            </Link>
          ))}
          {sidebarLinks
            .filter((item) =>
              item.label !== "Mon profil Beyond" &&
              item.label !== "Mes tests" &&
              item.label !== "Ma formation",
            )
            .map((item) => (
              <Link
                key={`quick-extra-${item.label}-${item.href}`}
                href={item.href}
                className="shrink-0 rounded-full bg-white/10 px-4 py-1 text-sm text-white/70 transition hover:bg-white/15 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
        </div>

        <main className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {cards.map((card, index) => {
            const visual = productVisuals[card.key] ?? productVisuals.connect;
            const Icon = visual.icon;
            const dramaticGradient =
              card.key === "connect"
                ? "from-orange-900 to-black"
                : card.key === "lms"
                  ? "from-blue-900 to-black"
                  : card.key === "care"
                    ? "from-emerald-900 to-black"
                    : "from-violet-900 to-black";

            if (!card.enabled) {
              return (
                <div
                  key={card.key}
                  className={`relative min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${dramaticGradient} p-6 opacity-40`}
                  style={{ animation: "fadeUp 600ms ease-out forwards", animationDelay: `${index * 100}ms`, opacity: 0 }}
                >
                  <span className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                    BIENTOT
                  </span>
                  <Icon className="h-9 w-9 text-white/70" />
                  <p className="mt-10 text-4xl font-black leading-none text-white">{card.title}</p>
                  <p className="mt-3 max-w-md text-sm text-white/70">{card.description}</p>
                </div>
              );
            }

            return (
              <Link
                key={card.key}
                href={card.href}
                className={`group relative min-h-[280px] cursor-pointer overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br ${dramaticGradient} p-6 transition-all duration-300 hover:scale-[1.02] hover:brightness-110`}
                style={{ animation: "fadeUp 600ms ease-out forwards", animationDelay: `${index * 100}ms`, opacity: 0 }}
              >
                <span className="absolute right-4 top-4 rounded-full bg-emerald-500/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  ACTIF
                </span>
                <Icon className="h-10 w-10 text-white" />
                <p className="mt-10 text-4xl font-black leading-none text-white">{card.title}</p>
                <p className="mt-3 max-w-md text-sm text-white/70">{card.description}</p>
                <span className="mt-8 inline-flex items-center gap-1 text-sm text-white/80 transition group-hover:text-white">
                  Ouvrir <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </main>
      </div>
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
