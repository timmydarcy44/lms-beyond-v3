"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClubLayout } from "@/components/club/club-layout";
import { useClubGuard } from "@/components/club/use-club-guard";
import { useSupabase } from "@/components/providers/supabase-provider";
import { getClubTheme } from "@/lib/club-theme";
import { cn } from "@/lib/utils";

const theme = getClubTheme("su-dives-cabourg");

const kpis = [
  { label: "Partenaires actifs", value: "23", highlight: true },
  { label: "Valeur annuelle", value: "87 500€" },
  { label: "Taux renouvellement", value: "78%" },
  { label: "Renouvellements ce mois", value: "3", badge: true },
];

const actions = [
  {
    titre: "Créer un partenaire",
    sous_titre: "Ajouter une entreprise",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    href: "/dashboard/club/partenaires",
    cta_icon: "+",
  },
  {
    titre: "Publier une news",
    sous_titre: "Actualité du club",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    href: "/dashboard/club/news",
    cta_icon: "📰",
  },
  {
    titre: "Créer une offre",
    sous_titre: "Pack partenariat",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    href: "/dashboard/club/offres",
    cta_icon: "🎁",
  },
  {
    titre: "Mettre en relation",
    sous_titre: "Connecter des partenaires",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
    href: "/dashboard/club/tunnel",
    cta_icon: "🤝",
  },
];

const activities = [
  { label: "BNP Paribas a consulté le portail", time: "2h" },
  { label: "Sport 2000 — renouvellement dans 15 jours", time: "hier" },
  { label: "Deal : Cabinet Dupont → Normandie Auto", time: "hier" },
  { label: "Hôtel de la Plage a rejoint Beyond Network", time: "3j" },
];

const matches = [
  { date: "15/09", opponent: "FC Lisieux", home: "Domicile", score: "2-1", result: "win", attendance: 420 },
  { date: "29/09", opponent: "US Hérouville", home: "Extérieur", score: "0-0", result: "draw", attendance: null },
  { date: "13/10", opponent: "SO Caennais", home: "Domicile", score: "3-1", result: "win", attendance: 510 },
  { date: "27/10", opponent: "FC Alençon", home: "Extérieur", score: "1-2", result: "loss", attendance: null },
  { date: "10/11", opponent: "Bayeux FC", home: "Domicile", score: "2-0", result: "win", attendance: 380 },
  { date: "24/11", opponent: "US Vire", home: "Extérieur", score: "1-1", result: "draw", attendance: null },
  { date: "08/12", opponent: "FC Flers", home: "Domicile", score: "4-2", result: "win", attendance: 490 },
  { date: "15/03", opponent: "FC Caen B", home: "Domicile", score: "À venir", result: "upcoming", attendance: null },
];


export default function ClubDashboardPage() {
  const status = useClubGuard();
  const supabase = useSupabase();
  const [firstName, setFirstName] = useState("responsable");
  useEffect(() => {
    const loadProfile = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      const name =
        profile?.full_name?.trim().split(/\s+/)[0] ||
        profile?.email?.split("@")[0] ||
        "responsable";
      setFirstName(name);
    };
    loadProfile();
  }, [supabase]);

  if (status !== "allowed") {
    return null;
  }

  return (
    <ClubLayout activeItem="Dashboard">
      <div className="-mx-8 -my-8 min-h-screen bg-[#0d1b2e] px-8 py-8 text-white">
        <section className="relative overflow-hidden rounded-3xl">
          <div className="h-[280px] bg-gradient-to-r from-[#1B2A4A] to-[#C8102E]" />
          <div className="absolute inset-0 flex items-center justify-between p-10 text-white">
            <div>
              <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
                BEYOND NETWORK
              </span>
              <div className="mt-3 text-sm text-white/60">{theme.nom}</div>
              <h1 className="mt-2 text-4xl font-black">Bienvenue, {firstName}</h1>
              <p className="mt-2 text-white/70">
                Gérez vos partenaires et
                <br />
                développez votre réseau.
              </p>
            </div>
            <div className="text-right">
              <div className="ml-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-lg font-black text-[#1B2A4A]">
                {theme.logo_initiales}
          </div>
              <div className="mt-3 text-sm text-white/60">{theme.division}</div>
          </div>
        </div>
      </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
              className="rounded-2xl border border-white/20 bg-[#1B2A4A] p-5 shadow-sm"
            >
              <div
                className={`text-3xl font-black ${
                  kpi.highlight ? "text-[#C8102E]" : "text-white"
                }`}
              >
                {kpi.value}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs uppercase tracking-wider text-white/60">
                {kpi.label}
                {kpi.badge && Number(kpi.value) > 0 && (
                  <span className="rounded-full bg-[#C8102E]/10 px-2 py-0.5 text-[10px] font-semibold text-[#C8102E]">
                    +{kpi.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <div className="grid gap-4 md:grid-cols-2">
            {actions.map((action) => (
              <Link
                key={action.titre}
                href={action.href}
                className="group relative h-[200px] overflow-hidden rounded-2xl transition-transform hover:scale-[1.02]"
              >
                <img src={action.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/70 via-[#1B2A4A]/30 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <div className="text-sm text-white/70">{action.sous_titre}</div>
                  <div className="text-lg font-bold text-white">{action.titre}</div>
                </div>
                <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-[#1B2A4A] shadow-lg">
                  {action.cta_icon}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/20 bg-[#1B2A4A]/40 p-6">
          <div className="text-lg font-bold text-white">Saison 2025/2026 — Résultats & Affluence</div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="bg-white/5 text-xs uppercase text-white/50">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Adversaire</th>
                  <th className="px-4 py-3">Domicile/Extérieur</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Affluence</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={`${match.date}-${match.opponent}`} className="border-t border-white/10">
                    <td className="px-4 py-3">{match.date}</td>
                    <td className="px-4 py-3">{match.opponent}</td>
                    <td className="px-4 py-3">{match.home}</td>
                    <td
                      className={cn(
                        "px-4 py-3 font-semibold",
                        match.result === "win"
                          ? "text-green-400"
                          : match.result === "loss"
                            ? "text-red-400"
                            : match.result === "draw"
                              ? "text-white/60"
                              : "text-white/60"
                      )}
                    >
                      {match.score}
                    </td>
                    <td className="px-4 py-3">
                      {match.home === "Domicile" && match.attendance ? (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                          {match.attendance}
                        </span>
                      ) : match.home === "Domicile" ? (
                        <button className="text-xs text-[#C8102E]">Saisir</button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">Modifier</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-white/60">
            <div>Affluence moyenne domicile : 450 spectateurs</div>
            <div>Total spectateurs saison : 3 600</div>
          </div>
        </section>

        <section className="mt-8">
          <div className="text-lg font-bold text-white">Réseaux sociaux</div>
          <div className="text-sm text-white/60">
            Connectez vos comptes pour automatiser le reporting partenaires
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-5">
              <div className="text-sm font-semibold text-white">Instagram</div>
              <div className="mt-2 inline-flex rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300">
                Non connecté
              </div>
              <div className="mt-3 text-sm text-white/40">— abonnés • — posts • — vues moy.</div>
              <button
                onClick={() => toast.info("Connexion API Instagram disponible prochainement")}
                className="mt-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 text-sm text-white"
              >
                Connecter Instagram →
              </button>
            </div>
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-900/40 to-blue-800/40 p-5">
              <div className="text-sm font-semibold text-white">Facebook / Page club</div>
              <div className="mt-2 inline-flex rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-300">
                Non connecté
              </div>
              <div className="mt-3 text-sm text-white/40">— abonnés • — posts • — vues moy.</div>
              <button
                onClick={() => toast.info("Connexion API Facebook disponible prochainement")}
                className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm text-white"
              >
                Connecter Facebook →
              </button>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-white/40">
            La connexion des réseaux sociaux permettra de générer automatiquement les rapports ROI pour vos partenaires
        </div>
      </section>

        <section className="mt-8 rounded-2xl border border-white/20 bg-[#1B2A4A] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white">Activité récente</h3>
          <div className="mt-4 space-y-4">
          {activities.map((activity) => (
              <div key={activity.label} className="flex items-center justify-between text-sm text-white/80">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#C8102E]" />
                  <span>{activity.label}</span>
                </div>
                <span className="text-white/50">{activity.time}</span>
            </div>
          ))}
        </div>
      </section>
      </div>
    </ClubLayout>
  );
}
