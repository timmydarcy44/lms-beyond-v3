export type ControlNavCounts = {
  pipelineLate: number;
  admissionsReview: number;
  expertsPending: number;
  opcoToFile: number;
};

export type ControlNavTone = "late" | "queue";

export type ControlNavItem = {
  id: string;
  label: string;
  href?: string;
  soon?: boolean;
  countKey?: keyof ControlNavCounts;
  countTone?: ControlNavTone;
  match: (pathname: string, role: string | null) => boolean;
};

export type ControlNavSection = {
  id: "business" | "cfa" | "formation" | "qualite";
  label: string;
  dot: string;
  items: ControlNavItem[];
};

const exact = (href: string) => (pathname: string) => pathname === href;
const under = (href: string) => (pathname: string) => pathname === href || pathname.startsWith(`${href}/`);

export const CONTROL_NAV_SECTIONS: ControlNavSection[] = [
  {
    id: "business",
    label: "Business",
    dot: "#8B7BFF",
    items: [
      {
        id: "pipeline",
        label: "Pipeline B2B",
        href: "/super/crm/pipeline",
        countKey: "pipelineLate",
        countTone: "late",
        match: (pathname) =>
          pathname === "/super/crm/pipeline" || pathname.startsWith("/super/crm/pipeline-btob"),
      },
      {
        id: "prescripteurs",
        label: "Prescripteurs",
        href: "/super/crm/pipeline/prescripteurs",
        match: under("/super/crm/pipeline/prescripteurs"),
      },
      {
        id: "contacts",
        label: "Contacts",
        href: "/super/utilisateurs",
        match: (pathname, role) => pathname === "/super/utilisateurs" && !role,
      },
      {
        id: "comptes",
        label: "Comptes clients",
        href: "/super/organisations",
        match: under("/super/organisations"),
      },
      {
        id: "particuliers",
        label: "Particuliers",
        href: "/super/utilisateurs?role=btoc",
        match: (pathname, role) => pathname === "/super/utilisateurs" && role === "btoc",
      },
      {
        id: "apprenants",
        label: "Apprenants",
        href: "/super/utilisateurs?role=learner",
        match: (pathname, role) =>
          pathname === "/super/utilisateurs" && (role === "learner" || role === "student" || role === "apprenant"),
      },
      { id: "sessions", label: "Sessions", soon: true, match: () => false },
      {
        id: "opco",
        label: "Dossiers OPCO",
        soon: true,
        countKey: "opcoToFile",
        countTone: "queue",
        match: () => false,
      },
    ],
  },
  {
    id: "cfa",
    label: "CFA",
    dot: "#5EDCC3",
    items: [
      {
        id: "admissions",
        label: "Admissions",
        href: "/super/crm/cfa",
        countKey: "admissionsReview",
        countTone: "queue",
        match: (pathname) => pathname === "/super/crm/cfa" || pathname.startsWith("/super/crm/cfa/apprenants"),
      },
      {
        id: "accueil",
        label: "Entreprises d'accueil",
        href: "/super/crm/cfa/entreprises",
        match: (pathname) =>
          pathname.startsWith("/super/crm/cfa/entreprises") || pathname.startsWith("/super/cfa/entreprises"),
      },
      {
        id: "apprentis",
        label: "Apprentis",
        href: "/super/crm/cfa/admis",
        match: under("/super/crm/cfa/admis"),
      },
      { id: "contrats", label: "Contrats", soon: true, match: () => false },
      {
        id: "tuteurs",
        label: "Tuteurs",
        href: "/super/utilisateurs?role=tutor",
        match: (pathname, role) => pathname === "/super/utilisateurs" && role === "tutor",
      },
      { id: "livrets", label: "Livrets et émargements", soon: true, match: () => false },
    ],
  },
  {
    id: "formation",
    label: "Formation",
    dot: "#8DB8FF",
    items: [
      {
        id: "catalogue",
        label: "Catalogue",
        href: "/super/formations",
        match: (pathname) => pathname === "/super/formations" || pathname.startsWith("/super/formations/"),
      },
      {
        id: "lms",
        label: "LMS",
        href: "/super/lms/formations",
        match: (pathname) => pathname === "/super/lms/formations" || pathname.startsWith("/super/lms/formations/"),
      },
      {
        id: "cursus",
        label: "Cursus",
        href: "/super/crm/cfa/cursus",
        match: under("/super/crm/cfa/cursus"),
      },
      {
        id: "experts",
        label: "Formateurs et experts",
        href: "/super/experts",
        countKey: "expertsPending",
        countTone: "queue",
        match: under("/super/experts"),
      },
      {
        id: "badges",
        label: "Open Badges",
        href: "/super/open-badges/badgeclasses",
        match: under("/super/open-badges"),
      },
      {
        id: "tests",
        label: "Tests",
        href: "/super/studio/tests",
        match: under("/super/studio/tests"),
      },
    ],
  },
  {
    id: "qualite",
    label: "Qualité et pilotage",
    dot: "#9AA3BD",
    items: [
      { id: "qualiopi", label: "Qualiopi", href: "/super/crm/qualiopi", match: under("/super/crm/qualiopi") },
      { id: "validateurs", label: "Validateurs", href: "/super/crm/validators", match: under("/super/crm/validators") },
      {
        id: "ca",
        label: "Chiffre d'affaires",
        href: "/super/chiffre-affaires",
        match: exact("/super/chiffre-affaires"),
      },
      { id: "stats", label: "Statistiques", href: "/super/statistiques", match: exact("/super/statistiques") },
      { id: "emails", label: "E-mails", href: "/super/crm/emails", match: under("/super/crm/emails") },
      { id: "seo", label: "SEO", href: "/super/seo", match: under("/super/seo") },
    ],
  },
];

export const CONTROL_CREATE_LINKS = [
  { label: "Prospect", href: "/super/crm/pipeline?creer=1" },
  { label: "Entreprise", href: "/super/organisations/new" },
  { label: "Apprenant", href: "/super/utilisateurs/new" },
  { label: "Formation", href: "/super/lms/formations/new" },
  { label: "Open Badge", href: "/super/open-badges/badgeclasses/new" },
  { label: "Expert", href: "/super/experts?ajouter=1" },
] as const;
