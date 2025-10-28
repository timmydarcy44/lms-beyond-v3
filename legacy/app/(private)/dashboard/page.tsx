import { cookies } from "next/headers";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  getProfile,
  countCoursesForOwner,
  countUnreadMessages,
  getRecentLogins,
  getRecentBadges,
} from "./_data";
import StatCard from "./_components/StatCard";
import MessageTopButton from "./_components/MessageTopButton";
import Hero from "@/components/dashboard/Hero";
import QuickCreateCarousel from "@/components/dashboard/QuickCreateCarousel";
import type { QuickItem } from "@/components/dashboard/QuickCreateCarousel";

function formatTS(ts?: string | null) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="text-center py-20 text-zinc-300">
        Session expirée. <a className="text-indigo-400 underline" href="/login">Se reconnecter</a>
      </div>
    );
  }

  const profile = await getProfile(supabase, user.id);
  const firstName = profile?.first_name ?? "";
  const lastName = profile?.last_name ?? "";

  const coursesCount = await countCoursesForOwner(supabase, user.id);
  const unread = await countUnreadMessages(supabase, user.id);

  // Activité récente
  const recentLogins = await getRecentLogins(supabase); // [{user_name, occurred_at, ip}]
  const recentBadges = await getRecentBadges(supabase); // [{user_name, badge_name, icon_url, awarded_at}]

  // Données pour Hero et Slider
  const heroData = {
    title: "Créer une formation",
    subtitle: "Structurez un parcours d'apprentissage complet et engageant",
    ctaLabel: "Commencer",
    href: "/formations/new",
    imageSrc: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1920&auto=format&fit=crop",
    priority: true,
  };

  const quickItems: QuickItem[] = [
    { key: "program", kicker: "CRÉER", title: "Créer un programme", subtitle: "Séquencez vos modules", href: "/parcours/new" },
    { key: "resource", kicker: "CRÉER", title: "Créer une ressource", subtitle: "PDF, vidéos, liens…", href: "/ressources/new" },
    { key: "test", kicker: "CRÉER", title: "Créer un test", subtitle: "Évaluez les acquis", href: "/tests/new" },
    { key: "learner", kicker: "CRÉER", title: "Créer un apprenant", subtitle: "Ajoutez un profil", href: "/apprenants/new" },
    { key: "group", kicker: "CRÉER", title: "Créer un groupe", subtitle: "Organisez vos cohortes", href: "/groupes/new" },
  ];

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#252525" }}>
      {/* Barre entête : Bonjour X à gauche + Messagerie à droite */}
      <div className="mx-auto max-w-7xl px-6 pt-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          {firstName || lastName ? `Bonjour ${firstName || lastName}` : "Bonjour 👋"}
        </h1>
        
        {/* CTA Messagerie à droite */}
        <Link
          href="/messages"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-black font-medium shadow-sm ring-1 ring-emerald-300/30 hover:bg-emerald-400 hover:ring-emerald-200/60 transition-colors"
          aria-label="Ouvrir la messagerie"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" className="text-black">
            <defs>
              <linearGradient id="msgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981"/>
                <stop offset="100%" stopColor="#34D399"/>
              </linearGradient>
            </defs>
            <path fill="url(#msgGlow)"
              d="M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
            <circle cx="17.5" cy="8.5" r="1.5" fill="white" opacity=".9"/>
          </svg>
          Messagerie
          {unread > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-black/20 text-[12px] h-5 min-w-[20px] px-1">
              {unread}
            </span>
          )}
        </Link>
      </div>

      {/* Hero Premium */}
      <Hero {...heroData} />

      {/* Slider Créer rapidement */}
      <QuickCreateCarousel items={quickItems} />

      {/* Stat cards */}
      <div className="mx-auto max-w-7xl px-6 mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Formations" icon="book" value={coursesCount} />
        <StatCard label="Programmes" icon="stack" value={0} />
        <StatCard label="Ressources" icon="folder" value={0} />
        <StatCard label="Tests" icon="lab" value={0} />
        <StatCard label="Groupes" icon="users" value={0} />
        {/* On garde un emplacement "libre" pour un KPI org/global */}
        <StatCard label="Actifs 7j" icon="pulse" value="—" />
      </div>

      {/* Activité récente */}
      <div className="mx-auto max-w-7xl px-6 mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-16">
        {/* Dernières connexions */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold mb-4">Dernières connexions</h2>
          {recentLogins.length === 0 ? (
            <p className="text-zinc-300/70 text-sm">Aucune connexion récente.</p>
          ) : (
            <ul className="space-y-3">
              {recentLogins.map((l, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
                      👤
                    </div>
                    <div>
                      <div className="font-medium">{l.user_name}</div>
                      <div className="text-xs text-zinc-300/70">{l.ip ?? "—"}</div>
                    </div>
                  </div>
                  <div className="text-sm text-zinc-300/80">{formatTS(l.occurred_at)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Derniers badges */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold mb-4">Derniers badges obtenus</h2>
          {recentBadges.length === 0 ? (
            <p className="text-zinc-300/70 text-sm">Aucun badge récemment attribué.</p>
          ) : (
            <ul className="space-y-3">
              {recentBadges.map((b, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={b.icon_url ?? "/badge.svg"}
                      alt=""
                      className="h-9 w-9 rounded-md object-cover"
                    />
                    <div>
                      <div className="font-medium">{b.badge_name}</div>
                      <div className="text-xs text-zinc-300/70">Attribué à {b.user_name}</div>
                    </div>
                  </div>
                  <div className="text-sm text-zinc-300/80">{formatTS(b.awarded_at)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}