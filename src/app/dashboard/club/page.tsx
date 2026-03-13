"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ClubLayout } from "@/components/club/club-layout";
import { useClubGuard } from "@/components/club/use-club-guard";
import { getClubTheme } from "@/lib/club-theme";
import { cn } from "@/lib/utils";
import { clubPartners } from "@/lib/mocks/club-partners";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createPartner, getMyClubContext, getClubMatches, getClubNews, getClubPartners } from "@/lib/supabase/club-queries";

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

const demoMatches = [
  { date: "2025-09-15", opponent: "FC Lisieux", home: "Domicile", score_nous: 2, score_eux: 1, affluence: 420 },
  { date: "2025-09-29", opponent: "US Hérouville", home: "Extérieur", score_nous: 0, score_eux: 0, affluence: null },
  { date: "2025-10-13", opponent: "SO Caennais", home: "Domicile", score_nous: 3, score_eux: 1, affluence: 510 },
  { date: "2025-10-27", opponent: "FC Alençon", home: "Extérieur", score_nous: 1, score_eux: 2, affluence: null },
  { date: "2025-11-10", opponent: "Bayeux FC", home: "Domicile", score_nous: 2, score_eux: 0, affluence: 380 },
  { date: "2026-03-15", opponent: "FC Caen B", home: "Domicile", score_nous: null, score_eux: null, affluence: null },
];

const demoClub = {
  id: "demo-club",
  nom: "SU Dives Cabourg",
  division: "National 3",
  slug: "su-dives-cabourg",
  contact_prenom: "Responsable",
};

const activities = [
  { label: "BNP Paribas a consulté le portail", time: "2h" },
  { label: "Sport 2000 — renouvellement dans 15 jours", time: "hier" },
  { label: "Deal : Cabinet Dupont → Normandie Auto", time: "hier" },
  { label: "Hôtel de la Plage a rejoint Beyond Network", time: "3j" },
];

export default function ClubDashboardPage() {
  const status = useClubGuard();
  const [club, setClub] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("responsable");
  const [isDemo, setIsDemo] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [newPartner, setNewPartner] = useState({
    nom: "",
    secteur: "",
    contact: "",
    email: "",
    telephone: "",
    colonne_tunnel: "prospects",
  });
  const theme = useMemo(
    () => getClubTheme(club?.slug ?? club?.code ?? club?.nom_slug ?? "su-dives-cabourg"),
    [club?.slug, club?.code, club?.nom_slug]
  );
  useEffect(() => {
    async function load() {
      const { club: clubData, role } = await getMyClubContext();
      const isDemo = role === "demo";
      setIsDemo(isDemo);
      if (!clubData || isDemo) {
        setClub(demoClub);
        setFirstName(demoClub.contact_prenom);
        setPartners(clubPartners);
        setMatches(demoMatches);
        setLoading(false);
        return;
      }
      setClub(clubData);
      setFirstName(clubData?.contact_prenom || clubData?.responsable_prenom || "responsable");

      const [p, n, m] = await Promise.all([
        getClubPartners(clubData.id),
        getClubNews(clubData.id),
        getClubMatches(clubData.id),
      ]);
      setPartners(p);
      setNews(n);
      setMatches(m);
      setLoading(false);
    }
    load();
  }, []);

  const totalValeur = partners.reduce((sum, partner) => sum + (partner.valeur || 0), 0);
  const partenairesActifs = partners.length;
  const dernierMatch = matches.find((match) => match.score_nous !== null && match.score_nous !== undefined);
  const prochainsMatch = matches.find((match) => match.score_nous === null || match.score_nous === undefined);

  const kpis = useMemo(
    () => [
      { label: "Partenaires actifs", value: String(partenairesActifs), highlight: true },
      { label: "Valeur annuelle", value: `${totalValeur.toLocaleString("fr-FR")}€` },
      { label: "Taux renouvellement", value: "78%" },
      { label: "Renouvellements ce mois", value: "3", badge: true },
    ],
    [partenairesActifs, totalValeur]
  );

  const formattedMatches = useMemo(() => {
    return matches.map((match) => {
      const opponent =
        match.opponent ||
        match.adversaire ||
        match.equipe_adverse ||
        match.nom_adversaire ||
        "Adversaire";
      const isHome = Boolean(
        match.is_home ?? match.domicile ?? match.home ?? match.stade === "Domicile"
      );
      const scoreNous = match.score_nous ?? match.score_home ?? match.scoreOur;
      const scoreEux = match.score_eux ?? match.score_away ?? match.scoreOpp;
      const score =
        scoreNous !== null && scoreNous !== undefined && scoreEux !== null && scoreEux !== undefined
          ? `${scoreNous}-${scoreEux}`
          : "À venir";
      const result =
        scoreNous === null || scoreNous === undefined
          ? "upcoming"
          : scoreNous > scoreEux
            ? "win"
            : scoreNous < scoreEux
              ? "loss"
              : "draw";
      return {
        id: match.id ?? `${match.date}-${opponent}`,
        date: match.date ? new Date(match.date).toLocaleDateString("fr-FR") : "—",
        opponent,
        home: isHome ? "Domicile" : "Extérieur",
        score,
        result,
        attendance: match.affluence ?? match.attendance ?? null,
      };
    });
  }, [matches]);

  const handleCreatePartner = async () => {
    if (!newPartner.nom.trim()) return;
    if (!club?.id || isDemo) {
      setPartners((prev) => [
        {
          id: `demo-${Date.now()}`,
          nom: newPartner.nom,
          secteur: newPartner.secteur || "—",
          valeur: 0,
          statut: "Prospect",
          contact_prenom: newPartner.contact.split(" ")[0] || "",
          contact_nom: newPartner.contact.split(" ").slice(1).join(" "),
          contact_email: newPartner.email,
          contact_tel: newPartner.telephone,
          colonne_tunnel: newPartner.colonne_tunnel,
        },
        ...prev,
      ]);
      setShowAddPartner(false);
      setNewPartner({ nom: "", secteur: "", contact: "", email: "", telephone: "", colonne_tunnel: "prospects" });
      toast.success("Partenaire créé ✓");
      return;
    }
    await createPartner(club.id, {
      nom: newPartner.nom,
      secteur: newPartner.secteur,
      contact_prenom: newPartner.contact.split(" ")[0] || "",
      contact_nom: newPartner.contact.split(" ").slice(1).join(" "),
      contact_email: newPartner.email,
      contact_tel: newPartner.telephone,
      colonne_tunnel: newPartner.colonne_tunnel,
      statut: "Prospect",
      valeur: 0,
    });
    const refreshed = await getClubPartners(club.id);
    setPartners(refreshed);
    setShowAddPartner(false);
    setNewPartner({ nom: "", secteur: "", contact: "", email: "", telephone: "", colonne_tunnel: "prospects" });
    toast.success("Partenaire créé ✓");
  };

  if (status !== "allowed") {
    return null;
  }

  if (loading) {
    return (
      <ClubLayout activeItem="Dashboard">
        <div className="flex h-64 items-center justify-center">
          <div className="text-white/50">Chargement...</div>
        </div>
      </ClubLayout>
    );
  }

  return (
    <ClubLayout activeItem="Dashboard">
      <div className="-mx-4 -my-4 min-h-screen bg-[#0d1b2e] px-4 pb-4 pt-6 text-white lg:-mx-8 lg:-my-8 lg:px-8 lg:pb-8 lg:pt-8">
        <section className="relative overflow-hidden rounded-3xl">
          <div className="h-[250px] bg-gradient-to-r from-[#1B2A4A] to-[#C8102E] lg:h-[500px]" />
          <div className="absolute inset-0 flex flex-col justify-between p-6 text-white lg:flex-row lg:items-center lg:p-10">
            <div>
              <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
                BEYOND NETWORK
              </span>
              <div className="mt-3 text-sm text-white/60">{club?.nom ?? theme.nom}</div>
              <h1 className="mt-2 text-2xl font-black lg:text-4xl">Bienvenue, {firstName}</h1>
              <p className="mt-2 text-white/70">
                Gérez vos partenaires et
                <br />
                développez votre réseau.
              </p>
            </div>
            <div className="text-left lg:text-right">
              <div className="ml-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-lg font-black text-[#1B2A4A]">
                {theme.logo_initiales}
          </div>
              <div className="mt-3 text-sm text-white/60">{club?.division ?? theme.division}</div>
          </div>
        </div>
      </section>

        <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
              className="rounded-2xl border border-white/20 bg-[#1B2A4A] p-5 shadow-sm"
            >
              <div
                className={`text-xl font-black lg:text-3xl ${
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
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => {
              const isAddPartner = action.titre === "Créer un partenaire";
              return (
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
                  {isAddPartner ? (
                    <button
                      onClick={(event) => {
                        event.preventDefault();
                        setShowAddPartner(true);
                      }}
                      className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-[#1B2A4A] shadow-lg"
                    >
                      {action.cta_icon}
                    </button>
                  ) : (
                    <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-[#1B2A4A] shadow-lg">
                      {action.cta_icon}
                    </div>
                  )}
                </Link>
              );
            })}
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
                {formattedMatches.map((match) => (
                  <tr key={match.id} className="border-t border-white/10">
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

      <Dialog open={showAddPartner} onOpenChange={setShowAddPartner}>
        <DialogContent className="max-w-lg bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>Ajouter un partenaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nom de l'entreprise"
              value={newPartner.nom}
              onChange={(event) => setNewPartner((prev) => ({ ...prev, nom: event.target.value }))}
              className="border-white/10 bg-white/5 text-white"
            />
            <Input
              placeholder="Secteur"
              value={newPartner.secteur}
              onChange={(event) => setNewPartner((prev) => ({ ...prev, secteur: event.target.value }))}
              className="border-white/10 bg-white/5 text-white"
            />
            <Input
              placeholder="Nom du contact"
              value={newPartner.contact}
              onChange={(event) => setNewPartner((prev) => ({ ...prev, contact: event.target.value }))}
              className="border-white/10 bg-white/5 text-white"
            />
            <Input
              placeholder="Email"
              value={newPartner.email}
              onChange={(event) => setNewPartner((prev) => ({ ...prev, email: event.target.value }))}
              className="border-white/10 bg-white/5 text-white"
            />
            <Input
              placeholder="Téléphone"
              value={newPartner.telephone}
              onChange={(event) => setNewPartner((prev) => ({ ...prev, telephone: event.target.value }))}
              className="border-white/10 bg-white/5 text-white"
            />
            <select
              value={newPartner.colonne_tunnel}
              onChange={(event) => setNewPartner((prev) => ({ ...prev, colonne_tunnel: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="prospects">Prospect</option>
              <option value="premier_contact">Premier contact</option>
              <option value="negociation">Négociation</option>
            </select>
          </div>
          <DialogFooter>
            <button
              className="rounded-full bg-white/10 px-4 py-2 text-sm"
              onClick={() => setShowAddPartner(false)}
            >
              Annuler
            </button>
            <button
              className="rounded-full px-4 py-2 text-sm text-white"
              style={{ backgroundColor: "var(--club-primary)" }}
              onClick={handleCreatePartner}
            >
              Créer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClubLayout>
  );
}
