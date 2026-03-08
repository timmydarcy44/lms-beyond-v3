"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Globe, Mail, MapPin, Phone, Linkedin } from "lucide-react";

const PARTENAIRES_MOCK = {
  "normandie-energie": {
    nom: "Normandie Énergie",
    initiales: "NE",
    color: "bg-yellow-500",
    secteur: "Énergie",
    pack: "Argent",
    logo: null,
    coverPhoto: null,
    adresse: "12 rue de la Paix, 14000 Caen",
    siteWeb: "normandie-energie.fr",
    effectif: "45 collaborateurs",
    creationAnnee: "2008",
    description:
      "Fournisseur d'énergie indépendant implanté en Normandie depuis 2008. Spécialisés dans les solutions d'énergie verte pour les professionnels.",
    expertises: ["Énergie verte", "Audit énergétique", "Photovoltaïque", "Optimisation contrats"],
    services: [
      {
        titre: "Audit énergétique",
        description: "Analyse complète de vos consommations",
        prix: "Sur devis",
      },
      {
        titre: "Fourniture énergie verte",
        description: "Électricité 100% renouvelable",
        prix: "À partir de 0,14€/kWh",
      },
      {
        titre: "Installation photovoltaïque",
        description: "Étude et pose de panneaux",
        prix: "Sur devis",
      },
    ],
    equipe: [
      {
        nom: "Henri Blanc",
        poste: "Directeur Commercial",
        email: "h.blanc@normandie-energie.fr",
        tel: "06 12 34 56 78",
      },
      {
        nom: "Marie Leconte",
        poste: "Chargée de clientèle",
        email: "m.leconte@normandie-energie.fr",
      },
    ],
    contact: {
      nom: "Henri Blanc",
      poste: "Directeur Commercial",
      email: "h.blanc@normandie-energie.fr",
      tel: "06 12 34 56 78",
    },
  },
};

const tabs = [
  { id: "about", label: "À propos" },
  { id: "offres", label: "Nos offres" },
  { id: "actus", label: "Actualités" },
  { id: "contact", label: "Contact" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const avatarColors = ["bg-amber-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-rose-500"];

const getAvatarColor = (name: string) => {
  const index = name
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarColors.length;
  return avatarColors[index];
};

export default function PartenaireDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabId>("about");

  useEffect(() => {
    if (tabParam === "contact") {
      setActiveTab("contact");
    }
  }, [tabParam]);

  const partenaire = PARTENAIRES_MOCK[slug as keyof typeof PARTENAIRES_MOCK];

  const gradientStyle = useMemo(() => {
    if (!partenaire) return undefined;
    if (slug === "normandie-energie") {
      return {
        background:
          "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #e94560 100%)",
      };
    }
    return {
      background: "linear-gradient(135deg, #0f172a 0%, #111827 60%, #1f2937 100%)",
    };
  }, [partenaire, slug]);

  if (!partenaire) {
    return (
      <div className="min-h-screen bg-[#080d14] p-8 text-white">
        <Link href="/dashboard/partenaire/annuaire" className="text-sm text-white/60 hover:text-white">
          ← Annuaire partenaires
        </Link>
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#111827] p-6 text-white/70">
          Partenaire introuvable
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d14] text-white">
      <section className="relative h-[300px] overflow-hidden" style={gradientStyle}>
        <div className="absolute inset-0">
          <div className="absolute -top-6 left-16 h-40 w-40 rounded-full bg-yellow-400/20 blur-3xl" />
          <div className="absolute top-20 right-20 h-48 w-48 rounded-full bg-yellow-500/20 blur-3xl" />
          <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-orange-400/20 blur-3xl" />
        </div>
        <div className="relative mx-auto flex h-full max-w-6xl flex-col px-8 py-6">
          <Link href="/dashboard/partenaire/annuaire" className="text-sm text-white/60 hover:text-white">
            ← Annuaire partenaires
          </Link>
        </div>
        <div className="absolute bottom-0 left-8 -translate-y-1/2">
          <div className="flex min-w-[320px] items-center gap-4 rounded-2xl border border-white/20 bg-[#111827] p-5 shadow-2xl">
            {partenaire.logo ? (
              <img src={partenaire.logo} alt={partenaire.nom} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-yellow-500 text-2xl font-black text-white">
                {partenaire.initiales}
              </div>
            )}
            <div>
              <div className="text-xl font-black text-white">{partenaire.nom}</div>
              <div className="text-sm text-white/60">{partenaire.secteur}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-300">
                  ⚡ {partenaire.secteur}
                </span>
                <span className="rounded-full bg-[#C8102E]/20 px-2 py-0.5 text-xs text-[#C8102E]">
                  Partenaire SUDC
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 border-b border-white/10 bg-[#0d1520] px-8 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-white/60">
          <div className="flex flex-wrap items-center gap-2">
            <span>📍 Caen, Calvados</span>
            <span>·</span>
            <span>👥 {partenaire.effectif}</span>
            <span>·</span>
            <span>📅 Fondée en {partenaire.creationAnnee}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {partenaire.expertises.map((item) => (
              <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                {item}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://${partenaire.siteWeb}`}
              className="rounded-full bg-white/10 px-4 py-2 text-sm text-white"
            >
              🌐 Site web
            </a>
            <button className="rounded-full bg-[#C8102E] px-4 py-2 text-sm text-white">🤝 Proposer un deal</button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-2 px-8 py-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-5 py-2 text-sm ${
              activeTab === tab.id
                ? "bg-white text-black font-semibold"
                : "bg-white/5 text-white/50 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "about" && (
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_300px] gap-8 px-8 py-8">
          <div>
            <div className="border-l-4 border-[#C8102E] pl-6 text-2xl font-light italic text-white/80">
              “Être partenaire du SUDC, c'est s'ancrer dans le tissu local...”
              <div className="mt-2 text-sm text-white/50">— Henri Blanc, Directeur Commercial</div>
            </div>
            <div className="mt-6 space-y-4 text-white/60 leading-relaxed">
              <p>
                {partenaire.description}
              </p>
              <p>
                Notre ancrage local est au cœur de notre identité — c'est pourquoi nous avons choisi de soutenir le SU
                Dives Cabourg, un club qui partage nos valeurs de proximité et d'engagement territorial.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { value: partenaire.creationAnnee, label: "Année de création" },
                { value: "1 200+", label: "Clients accompagnés" },
                { value: partenaire.effectif, label: "Collaborateurs" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-4"
                >
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-white/50">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {partenaire.services.map((service) => (
                <div
                  key={service.titre}
                  className="rounded-xl border border-transparent bg-[#111827] p-4 transition-all hover:border-[#C8102E]/40"
                >
                  <div className="text-2xl">⚡</div>
                  <div className="mt-2 font-bold text-white">{service.titre}</div>
                  <div className="mt-1 text-sm text-white/60">{service.description}</div>
                  <div className="mt-2 text-sm font-bold text-[#C8102E]">{service.prix}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              {partenaire.equipe.map((person) => (
                <div key={person.email} className="flex flex-1 items-center gap-3 rounded-xl bg-[#111827] p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getAvatarColor(person.nom)} text-xs font-bold text-white`}>
                    {person.nom
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white">{person.nom}</div>
                    <div className="text-sm text-white/50">{person.poste}</div>
                    <a href={`mailto:${person.email}`} className="text-xs text-blue-300">
                      {person.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl bg-[#111827] p-5">
              <div className="text-sm font-semibold text-white">Prendre contact</div>
              <div className="mt-3 space-y-3">
                <input
                  placeholder="Votre nom"
                  className="w-full rounded-xl bg-white/10 px-4 py-2 text-sm text-white"
                />
                <textarea
                  placeholder="Votre message"
                  rows={3}
                  className="w-full rounded-xl bg-white/10 px-4 py-2 text-sm text-white"
                />
                <button className="w-full rounded-xl bg-[#C8102E] px-4 py-2 text-sm text-white">Envoyer →</button>
              </div>
            </div>
            <div className="rounded-2xl bg-[#111827] p-5">
              <div className="text-sm font-semibold text-white">Coordonnées</div>
              <div className="mt-4 space-y-2 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-white/40" />
                  <span>{partenaire.adresse}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-white/40" />
                  <a href={`https://${partenaire.siteWeb}`} className="text-blue-300">
                    {partenaire.siteWeb}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-white/40" />
                  <a href={`mailto:${partenaire.contact.email}`} className="text-blue-300">
                    {partenaire.contact.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-white/40" />
                  <a href={`tel:${partenaire.contact.tel.replace(/\s/g, "")}`} className="text-blue-300">
                    {partenaire.contact.tel}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-white/40" />
                  <a href="https://linkedin.com/company/normandie-energie" className="text-blue-300">
                    linkedin.com/company/normandie-energie
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== "about" && (
        <div className="mx-auto max-w-6xl px-8 py-8 text-white/60">
          Contenu à venir pour l'onglet {tabs.find((tab) => tab.id === activeTab)?.label}.
        </div>
      )}
    </div>
  );
}
