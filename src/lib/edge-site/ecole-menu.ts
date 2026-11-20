import type { EdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";

export type EcoleAdmissionStatus = "open" | "soon" | "closed";

export type EcoleSpecialty = {
  name: string;
  description: string;
  href: string;
  active: boolean;
  /** Affiché en petit gris à côté du nom si true et active. */
  soon?: boolean;
};

export type EcoleFamily = {
  name: string;
  /** Ex. « Titre pro NTC » — affiché sous le nom de famille. */
  credential?: string;
  /** Intitulé officiel complet (pour pages / revue). */
  credentialFull?: string;
  specialties: EcoleSpecialty[];
};

export type EcoleTrack = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  families: EcoleFamily[];
};

export type EcoleMenuActionCard = {
  status: EcoleAdmissionStatus;
  statusLabel: string;
  intakeTitle: string;
  body: string;
  candidaterHref: string;
  rendezVousHref: string;
};

export type EcoleMenuFooterLink = {
  label: string;
  href: string;
};

export type EcoleMenuConfig = {
  tracks: EcoleTrack[];
  action: EcoleMenuActionCard;
  footer: {
    discover: EcoleMenuFooterLink;
    finance: EcoleMenuFooterLink;
    hesitate: EcoleMenuFooterLink;
  };
};

const STATUS_COLORS: Record<EcoleAdmissionStatus, string> = {
  open: "#6BE39B",
  soon: "#A99BFF",
  closed: "#8A93AE",
};

export function ecoleAdmissionStatusColor(status: EcoleAdmissionStatus): string {
  return STATUS_COLORS[status];
}

/**
 * Source unique du méga-menu École, du menu mobile et des liens pied de page école.
 * TODO_MEM_INTITULE · TODO_POURSUITE_DIPLOME — visibles en revue, jamais inventés en prod.
 */
export function getEcoleMenuConfig(routes: EdgeMarketingRoutes): EcoleMenuConfig {
  return {
    tracks: [
      {
        id: "bac2",
        eyebrow: "Après le bac",
        title: "Bac+2 en 1 an",
        subtitle: "Titre professionnel reconnu par l’État · en alternance",
        families: [
          {
            name: "Commerce et vente",
            credential: "Titre pro NTC",
            credentialFull:
              "Négociateur technico-commercial, niveau 5, ministère du Travail",
            specialties: [
              {
                name: "AI Business",
                description: "Vendre avec l’intelligence artificielle",
                href: routes.ecoleNtcAiBusiness,
                active: true,
              },
              {
                name: "Business Sport",
                description: "Le business des clubs et du sport",
                href: routes.ecoleNtcBusinessSport,
                active: true,
              },
              {
                name: "Real Estate",
                description: "Les métiers de l’immobilier",
                href: routes.ecoleNtcRealEstate,
                active: true,
              },
            ],
          },
          {
            name: "Commerce en boutique",
            credential: "Titre pro MEM",
            // TODO_MEM_INTITULE — intitulé officiel à confirmer
            credentialFull: undefined,
            specialties: [
              {
                name: "Retail Experience",
                description: "L’expérience client en magasin",
                href: routes.ecoleMemRetailExperience,
                active: true,
              },
              {
                name: "Merchandising",
                description: "Mettre les produits en valeur",
                href: routes.ecoleMemMerchandising,
                active: true,
              },
              {
                name: "Luxury & Premium",
                description: "Les marques haut de gamme",
                href: routes.ecoleMemLuxuryPremium,
                active: true,
              },
              {
                name: "Sport Retail",
                description: "La vente d’articles de sport",
                href: routes.ecoleMemSportRetail,
                active: true,
              },
            ],
          },
        ],
      },
      {
        id: "poursuite",
        eyebrow: "Après un Bac+2",
        title: "Poursuite d’études",
        // TODO_POURSUITE_DIPLOME — diplôme et niveau visés à confirmer
        subtitle: "Après un BTS ou un titre pro · en alternance",
        families: [
          {
            name: "Management",
            specialties: [
              {
                name: "AI Management",
                description: "Piloter une équipe avec l’IA",
                href: routes.ecoleRemAiManagement,
                active: true,
              },
              {
                name: "Business Performance",
                description: "Améliorer les résultats",
                href: routes.ecoleRemBusinessPerformance,
                active: true,
              },
              {
                name: "Transition & Innovation",
                description: "Conduire le changement",
                href: routes.ecoleRemTransitionInnovation,
                active: true,
              },
            ],
          },
          {
            name: "Développement commercial",
            specialties: [
              {
                name: "Growth & Acquisition",
                description: "Trouver de nouveaux clients",
                href: routes.ecoleRdcGrowthAcquisition,
                active: true,
              },
              {
                name: "Entrepreneurship",
                description: "Créer et lancer son projet",
                href: routes.ecoleRdcEntrepreneurship,
                active: true,
              },
              {
                name: "International Business",
                description: "Vendre à l’international",
                href: routes.ecoleRdcInternationalBusiness,
                active: true,
              },
              {
                name: "Strategic Partnerships",
                description: "Construire des partenariats",
                href: routes.ecoleRdcStrategicPartnerships,
                active: true,
              },
            ],
          },
        ],
      },
    ],
    action: {
      status: "open",
      statusLabel: "Candidatures ouvertes",
      intakeTitle: "Rentrée septembre 2027",
      body: "Candidature en ligne en 10 minutes. Pas besoin d’avoir déjà une entreprise.",
      candidaterHref: routes.ecoleCandidater,
      rendezVousHref: routes.contact,
    },
    footer: {
      discover: { label: "Découvrir Byound School →", href: routes.ecole },
      finance: {
        label: "L’alternance est financée : Financer ma formation →",
        href: routes.financerMaFormation,
      },
      // Pas de page « comparer les spécialités » — fallback rendez-vous
      hesitate: {
        label: "Tu hésites ? Prendre rendez-vous →",
        href: routes.contact,
      },
    },
  };
}

export function ecoleMenuFooterLinks(routes: EdgeMarketingRoutes): EcoleMenuFooterLink[] {
  const menu = getEcoleMenuConfig(routes);
  const specialties = menu.tracks.flatMap((track) =>
    track.families.flatMap((family) =>
      family.specialties.filter((item) => item.active).map((item) => ({
        label: item.name,
        href: item.href,
      })),
    ),
  );
  return specialties;
}
