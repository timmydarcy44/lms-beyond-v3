import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, BriefcaseBusiness, HeartPulse, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import {
  collectProfileRoleKeys,
  resolveDashboardSpaces,
  type DashboardSpace,
} from "@/lib/auth/dashboard-routing";
import { resolveDestinationFromProfile } from "@/lib/auth/post-login-redirect";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";

type ProfileAccessRow = {
  id: string;
  email: string | null;
  school_id: string | null;
  company_id: string | null;
  role: string | null;
  role_type: string | null;
  logo: string | null;
  name: string | null;
};

export default async function DashboardPage() {
  const session = await requireSession();

  const service = await getServiceRoleClientOrFallback();
  if (!service) {
    redirect("/login");
  }

  const profileSelect = "id, email, school_id, company_id, role, role_type, logo, name";
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

  const roleKeys = collectProfileRoleKeys(profile);
  const isDemoOnly = roleKeys.length === 1 && roleKeys[0] === "demo";

  const roleDestination = resolveDestinationFromProfile(profile);
  if (!isDemoOnly && roleDestination) {
    redirect(roleDestination);
  }

  const { spaces, isDemo } = await resolveDashboardSpaces(
    service,
    session.id,
    session.email,
    profile,
  );

  if (!isDemoOnly) {
    if (spaces.length === 1) {
      redirect(spaces[0].href);
    }
    if (spaces.length === 0) {
      return (
        <UnknownRoleDashboard
          firstName={session.fullName?.trim().split(/\s+/)[0] || session.email?.split("@")[0] || "utilisateur"}
          profileRole={profile?.role ?? profile?.role_type ?? null}
        />
      );
    }
  }

  const cards: DashboardSpace[] = isDemoOnly ? buildDemoCards() : spaces;

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
    tuteur: {
      icon: BriefcaseBusiness,
      glow: "from-slate-400/35 via-slate-500/10 to-transparent",
      ring: "hover:border-slate-300/50 hover:shadow-[0_0_0_1px_rgba(148,163,184,0.35),0_24px_60px_-24px_rgba(71,85,105,0.55)]",
    },
  };

  const subtitle =
    isDemoOnly || isDemo
      ? "Explorez l'ensemble des espaces Beyond"
      : spaces.length > 1
        ? "Choisir votre espace"
        : "Accédez à vos espaces Beyond";

  const title =
    isDemoOnly || isDemo ? "Beyond Suite — Démo" : `Bonjour ${firstName}`;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-gray-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
          {profile?.logo ? (
            <div className="flex flex-col items-start">
              <img
                src={profile.logo}
                alt={profile.name ?? "Logo entreprise"}
                className="h-8 object-contain"
              />
              <span className="mt-1 text-xs text-gray-400">Powered by Beyond</span>
            </div>
          ) : (
            <span className="text-sm font-bold tracking-[0.28em] text-black">BEYOND</span>
          )}
          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
              {firstName.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-sm font-medium text-gray-700">{firstName}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-16 pt-24">
        <div className="mt-6 text-center">
          <h1 className="mb-6 text-5xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-lg text-gray-400">{subtitle}</p>
        </div>

        <main className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className={`group relative flex min-h-[220px] w-full flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-violet-300 hover:shadow-md ${
                isDemoOnly ? "min-h-[400px]" : ""
              }`}
            >
              {isDemoOnly && card.key === "connect" ? (
                <>
                  <img
                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    aria-hidden
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
                </>
              ) : null}
              <div className={isDemoOnly ? "relative z-10" : ""}>
                {card.category && (
                  <p
                    className={`text-xs uppercase tracking-widest ${
                      isDemoOnly ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {card.category}
                  </p>
                )}
                <p
                  className={`mt-1 text-2xl font-bold leading-tight ${
                    isDemoOnly && card.key === "connect" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {card.title}
                </p>
                <p
                  className={`mt-2 text-sm ${
                    isDemoOnly && card.key === "connect" ? "text-white/80" : "text-gray-600"
                  }`}
                >
                  {card.description}
                </p>
              </div>
              <span
                className={`mt-4 inline-flex items-center gap-1 text-sm font-medium ${
                  isDemoOnly ? "relative z-10 text-white" : "text-violet-700"
                }`}
              >
                Ouvrir <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </main>
      </div>
    </div>
  );
}

function UnknownRoleDashboard({
  firstName,
  profileRole,
}: {
  firstName: string;
  profileRole: string | null;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f7] px-6 text-center">
      <p className="text-sm font-bold tracking-[0.28em] text-black">BEYOND</p>
      <h1 className="mt-8 text-2xl font-bold text-gray-900">Bonjour {firstName}</h1>
      <p className="mt-4 max-w-md text-gray-600">
        Votre compte n&apos;est pas encore associé à un espace Beyond.
        {profileRole ? (
          <>
            {" "}
            (rôle en base : <code className="rounded bg-gray-200 px-1">{profileRole}</code>)
          </>
        ) : null}
      </p>
      <p className="mt-6 text-lg font-medium text-gray-900">Contactez l&apos;administrateur</p>
      <p className="mt-2 text-sm text-gray-500">darcy@edgebs.fr</p>
    </div>
  );
}

function buildDemoCards(): DashboardSpace[] {
  return [
    {
      key: "club",
      title: "Beyond Network — Club",
      description: "Pilotez vos partenaires, votre CRM et votre communication.",
      href: "/dashboard/club",
      category: "RÉSEAU",
    },
    {
      key: "partenaire",
      title: "Espace Partenaire",
      description: "L'interface qu'accèdent vos partenaires du club.",
      href: "/dashboard/partenaire",
      category: "RÉSEAU",
    },
    {
      key: "lms-formateur",
      title: "Espace Formateur",
      description: "Créez et gérez vos formations, parcours et contenus pédagogiques.",
      href: "/dashboard/formateur",
      category: "FORMATION",
    },
    {
      key: "school",
      title: "Espace École",
      description: "Votre back-office : pilotez vos alternants, cursus et entreprises partenaires.",
      href: "/dashboard/ecole",
      category: "ÉCOLE",
    },
    {
      key: "lms-apprenant",
      title: "Espace Formation",
      description: "L'interface apprenant pour accéder aux formations et suivre sa progression.",
      href: "/dashboard/student/learning",
      category: "FORMATION",
    },
    {
      key: "connect",
      title: "Espace Apprenant",
      description: "L'interface que verront vos étudiants : profil, tests, badges et matching.",
      href: "/dashboard/apprenant",
      category: "APPRENANT",
    },
    {
      key: "care",
      title: "Beyond Care",
      description: "Suivi bien-être et indicateurs d'accompagnement.",
      href: "/dashboard/care",
      category: "CARE",
    },
    {
      key: "tuteur",
      title: "Beyond Tuteur",
      description: "Suivi alternance, missions et évaluations.",
      href: "/dashboard/tuteur",
      category: "TUTEUR",
    },
    {
      key: "team",
      title: "Beyond Team",
      description: "Espace entreprise et gestion des collaborateurs.",
      href: "/dashboard/entreprise",
      category: "ENTREPRISE",
    },
    {
      key: "praticien",
      title: "Praticien BCT",
      description: "Marketplace psychopédagogues certifiés.",
      href: "/dashboard/praticien",
      category: "PRATICIEN",
    },
  ];
}
