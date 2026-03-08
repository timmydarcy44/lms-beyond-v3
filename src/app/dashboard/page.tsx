import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, BriefcaseBusiness, HeartPulse, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";

type ProfileAccessRow = {
  id: string;
  email: string | null;
  school_id: string | null;
  logo: string | null;
  name: string | null;
};

const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

export default async function DashboardPage() {
  const session = await requireSession();

  const service = await getServiceRoleClientOrFallback();
  if (!service) {
    redirect("/login");
  }

  const profileSelect = "id, email, school_id, logo, name";
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

  const sessionRole = normalize(session.role);
  const hasSchool = Boolean(profile?.school_id);

  if (sessionRole === "particulier" || (sessionRole === "student" && !hasSchool)) {
    redirect("/dashboard/apprenant");
  }

  let cards: Array<{
    key: string;
    title: string;
    href: string;
    description: string;
    image?: string;
    category?: string;
  }> = [];

  if (sessionRole === "demo") {
    cards = [
      {
        key: "club",
        title: "Beyond Network — Club",
        description: "Pilotez vos partenaires, votre CRM et votre communication.",
        href: "/dashboard/club",
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80",
        category: "RÉSEAU",
      },
      {
        key: "partenaire",
        title: "Espace Partenaire",
        description: "L'interface qu'accèdent vos partenaires du club.",
        href: "/dashboard/partenaire",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
        category: "RÉSEAU",
      },
      {
        key: "lms-formateur",
        title: "Espace Formateur",
        description: "Créez et gérez vos formations, parcours et contenus pédagogiques.",
        href: "/dashboard/formateur",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80",
        category: "FORMATION",
      },
      {
        key: "school",
        title: "Espace École",
        description: "Votre back-office : pilotez vos alternants, cursus et entreprises partenaires.",
        href: "/dashboard/ecole",
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80",
        category: "ÉCOLE",
      },
      {
        key: "lms-apprenant",
        title: "Espace Formation",
        description: "L'interface apprenant pour accéder aux formations et suivre sa progression.",
        href: "/dashboard/student/learning",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80",
        category: "FORMATION",
      },
      {
        key: "connect",
        title: "Espace Apprenant",
        description: "L'interface que verront vos étudiants : profil, tests, badges et matching.",
        href: "/dashboard/apprenant",
        image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80",
        category: "APPRENANT",
      },
      {
        key: "care",
        title: "Beyond Care",
        description: "Suivi bien-être et indicateurs d'accompagnement.",
        href: "/dashboard/care",
        image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
        category: "CARE",
      },
      {
        key: "tuteur",
        title: "Beyond Tuteur",
        description: "Suivi alternance, missions et évaluations.",
        href: "/dashboard/tuteur",
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80",
        category: "TUTEUR",
      },
      {
        key: "team",
        title: "Beyond Team",
        description: "Espace entreprise et gestion des collaborateurs.",
        href: "/dashboard/entreprise",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
        category: "ENTREPRISE",
      },
    ];
  } else if (sessionRole === "admin" || sessionRole === "formateur") {
    cards = [
      {
        key: "lms",
        title: "Beyond LMS",
        href: "/dashboard/formateur",
        description: "Parcours de formation, progression et contenus pedagogiques.",
      },
      {
        key: "connect",
        title: "Beyond Connect",
        href: "/dashboard/ecole",
        description: "Gestion des talents, matching et opportunites.",
      },
      {
        key: "care",
        title: "Beyond Care",
        href: "/dashboard/care",
        description: "Suivi d accompagnement et indicateurs care.",
      },
    ];
  } else if (sessionRole === "ecole") {
    cards = [
      {
        key: "lms",
        title: "Beyond LMS",
        href: "/dashboard/formateur",
        description: "Parcours de formation, progression et contenus pedagogiques.",
      },
      {
        key: "connect",
        title: "Beyond School",
        href: "/dashboard/ecole",
        description: "Gérez vos alternants et vos entreprises partenaires.",
      },
      {
        key: "care",
        title: "Beyond Care",
        href: "/dashboard/care",
        description: "Suivi d accompagnement et indicateurs care.",
      },
    ];
  } else if (sessionRole === "entreprise") {
    cards = [
      {
        key: "pro",
        title: "Beyond Team",
        href: "/dashboard/entreprise",
        description: "Gestion entreprise et suivi pro.",
      },
      {
        key: "lms",
        title: "Beyond LMS",
        href: "/dashboard/formateur",
        description: "Parcours de formation, progression et contenus pedagogiques.",
      },
      {
        key: "care",
        title: "Beyond Care",
        href: "/dashboard/care",
        description: "Suivi d accompagnement et indicateurs care.",
      },
    ];
  } else if (sessionRole === "tuteur") {
    cards = [
      {
        key: "tuteur",
        title: "Beyond Tuteur",
        href: "/dashboard/tuteur",
        description: "Suivi des missions, formulaires et activites tuteur.",
      },
      {
        key: "lms",
        title: "Beyond LMS",
        href: "/dashboard/formateur",
        description: "Parcours de formation, progression et contenus pedagogiques.",
      },
    ];
  } else if (sessionRole === "student" && hasSchool) {
    cards = [
      {
        key: "lms",
        title: "Beyond LMS",
        href: "/dashboard/student/learning",
        description: "Parcours de formation, progression et contenus pedagogiques.",
      },
      {
        key: "connect",
        title: "Beyond Connect",
        href: "/dashboard/apprenant",
        description: "Profil, tests de personnalite et matching.",
      },
    ];
  }

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
          {sessionRole === "demo" ? (
            <>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">Beyond Suite — Démo</h1>
              <p className="mt-2 text-lg text-gray-400">Explorez l'ensemble des espaces Beyond</p>
            </>
          ) : (
            <>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">Bonjour {firstName}</h1>
              <p className="mt-2 text-lg text-gray-400">Accédez à vos espaces Beyond</p>
            </>
          )}
        </div>

        <main className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const category =
              card.category ||
              (card.key === "connect"
                ? "Connexion"
                : card.key === "lms"
                  ? "Formation"
                  : card.key === "care"
                    ? "Suivi"
                    : card.key === "pro"
                      ? "Entreprise"
                      : card.key === "school"
                        ? "École"
                        : "Tuteur");
            const imageSrc =
              card.image ||
              (card.key === "pro"
                ? "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80"
                : card.key === "lms"
                  ? "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80"
                  : card.key === "care"
                    ? "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80"
                    : card.key === "connect"
                      ? "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80"
                      : "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80");

            return (
              <Link
                key={card.key}
                href={card.href}
                className={`group relative w-full cursor-pointer overflow-hidden rounded-3xl ${
                  sessionRole === "demo" ? "min-h-[400px]" : "min-h-[500px]"
                }`}
              >
                <img
                  src={imageSrc}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
                <div className="absolute left-0 top-0 z-10 p-7">
                  <p className="text-xs uppercase tracking-widest text-white/70">{category}</p>
                  <p className="mt-1 text-3xl font-bold leading-tight text-white">{card.title}</p>
                  <p className="mt-2 text-sm text-white/80">{card.description}</p>
                </div>
                <span
                  className="absolute bottom-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl text-white backdrop-blur"
                  aria-hidden
                >
                  +
                </span>
              </Link>
            );
          })}
        </main>
      </div>
    </div>
  );
}
