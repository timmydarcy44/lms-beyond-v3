import { profileRolesIndicateSchoolDashboard } from "@/lib/auth/school-access";
import { isSuperAdminEmailAllowlisted } from "@/lib/auth/super-admin-email-allowlist";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardSpace = {
  key: string;
  title: string;
  href: string;
  description: string;
  category?: string;
};

export type ProfileRoutingInput = {
  id: string;
  email?: string | null;
  role?: string | null;
  role_type?: string | null;
  school_id?: string | null;
  company_id?: string | null;
  /** Colonne optionnelle si présente en base */
  roles?: string[] | null;
};

const normalize = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

const SPACE_BY_KEY: Record<string, DashboardSpace> = {
  super_admin: {
    key: "super_admin",
    title: "Administration Beyond",
    href: "/super",
    description: "Super-administration, CRM et paramètres plateforme.",
    category: "ADMIN",
  },
  entreprise: {
    key: "entreprise",
    title: "Espace Entreprise",
    href: "/dashboard/entreprise",
    description: "RH, collaborateurs, diagnostics et marketplace BCT.",
    category: "ENTREPRISE",
  },
  apprenant: {
    key: "apprenant",
    title: "Espace Apprenant",
    href: "/dashboard/apprenant",
    description: "Formations, tests, badges et parcours personnel.",
    category: "APPRENANT",
  },
  formateur: {
    key: "formateur",
    title: "Espace Formateur",
    href: "/dashboard/formateur",
    description: "Création de formations et suivi des apprenants.",
    category: "FORMATION",
  },
  expert: {
    key: "expert",
    title: "Espace Expert",
    href: "/dashboard/expert",
    description: "Interventions, certifications et activité expert.",
    category: "EXPERT",
  },
  praticien_bct: {
    key: "praticien_bct",
    title: "Espace Praticien BCT",
    href: "/dashboard/praticien",
    description: "Sessions, disponibilités et revenus marketplace.",
    category: "PRATICIEN",
  },
  ecole: {
    key: "ecole",
    title: "Espace École",
    href: "/dashboard/ecole",
    description: "Alternants, classes et partenaires entreprises.",
    category: "ÉCOLE",
  },
  tuteur: {
    key: "tuteur",
    title: "Espace Tuteur",
    href: "/dashboard/tuteur",
    description: "Suivi alternance, missions et évaluations.",
    category: "TUTEUR",
  },
  club: {
    key: "club",
    title: "Beyond Network — Club",
    href: "/dashboard/club",
    description: "Partenaires, CRM et communication réseau.",
    category: "RÉSEAU",
  },
  partenaire: {
    key: "partenaire",
    title: "Espace Partenaire",
    href: "/dashboard/partenaire",
    description: "Interface partenaires du club.",
    category: "RÉSEAU",
  },
  salarie: {
    key: "salarie",
    title: "Espace Collaborateur",
    href: "/dashboard/salarie",
    description: "Diagnostics, coachings et suivi personnel.",
    category: "COLLABORATEUR",
  },
  student_lms: {
    key: "student_lms",
    title: "Mes formations",
    href: "/dashboard/student/learning",
    description: "Parcours LMS et progression.",
    category: "FORMATION",
  },
};

/** Rôles normalisés → clé d'espace dashboard */
const ROLE_TO_SPACE_KEY: Record<string, string> = {
  super_admin: "super_admin",
  admin_hr: "entreprise",
  manager: "entreprise",
  rh: "entreprise",
  entreprise: "entreprise",
  client: "entreprise",
  apprenant: "apprenant",
  student: "apprenant",
  learner: "apprenant",
  particulier: "apprenant",
  formateur: "formateur",
  instructor: "formateur",
  mentor: "formateur",
  expert: "expert",
  praticien_bct: "praticien_bct",
  praticien: "praticien_bct",
  tuteur: "tuteur",
  tutor: "tuteur",
  admin: "ecole",
  ecole: "ecole",
  gestionnaire_ecole: "ecole",
  establishment: "ecole",
  club: "club",
  partenaire: "partenaire",
  salarie: "salarie",
  collaborateur: "salarie",
  employee: "salarie",
};

export function collectProfileRoleKeys(profile: ProfileRoutingInput | null): string[] {
  const keys = new Set<string>();
  if (!profile) return [];

  for (const raw of [profile.role, profile.role_type]) {
    const n = normalize(raw);
    if (n) keys.add(n);
  }

  if (Array.isArray(profile.roles)) {
    for (const r of profile.roles) {
      const n = normalize(r);
      if (n) keys.add(n);
    }
  }

  return [...keys];
}

function addSpace(spaces: DashboardSpace[], seen: Set<string>, key: string) {
  const space = SPACE_BY_KEY[key];
  if (!space || seen.has(space.href)) return;
  seen.add(space.href);
  spaces.push(space);
}

export function spacesFromRoleKeys(roleKeys: string[], profile: ProfileRoutingInput | null): DashboardSpace[] {
  const spaces: DashboardSpace[] = [];
  const seen = new Set<string>();

  if (profile && profileRolesIndicateSchoolDashboard(profile.role, profile.role_type)) {
    addSpace(spaces, seen, "ecole");
  }

  for (const rk of roleKeys) {
    const spaceKey = ROLE_TO_SPACE_KEY[rk];
    if (spaceKey) addSpace(spaces, seen, spaceKey);
  }

  const hasSchool = Boolean(profile?.school_id);
  const isStudentish = roleKeys.some((k) =>
    ["student", "apprenant", "learner", "particulier"].includes(k),
  );
  if (isStudentish && hasSchool) {
    addSpace(spaces, seen, "student_lms");
  }

  return spaces;
}

export async function resolveDashboardSpaces(
  service: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  profile: ProfileRoutingInput | null,
): Promise<{ spaces: DashboardSpace[]; isDemo: boolean }> {
  const emailNorm = String(email ?? profile?.email ?? "").trim().toLowerCase();
  const roleKeys = collectProfileRoleKeys(profile);
  const isDemo = roleKeys.includes("demo");

  const spaces: DashboardSpace[] = [];
  const seen = new Set<string>();

  if (isSuperAdminEmailAllowlisted(emailNorm)) {
    addSpace(spaces, seen, "super_admin");
  } else {
    const { data: superRow } = await service
      .from("super_admins")
      .select("user_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    if (superRow) addSpace(spaces, seen, "super_admin");
  }

  for (const space of spacesFromRoleKeys(roleKeys, profile)) {
    if (!seen.has(space.href)) {
      seen.add(space.href);
      spaces.push(space);
    }
  }

  const [{ data: expertRow }, { data: praticienRow }] = await Promise.all([
    service.from("experts").select("id").eq("id", userId).maybeSingle(),
    service.from("praticiens_bct").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  if (expertRow) addSpace(spaces, seen, "expert");
  if (praticienRow) addSpace(spaces, seen, "praticien_bct");

  return { spaces, isDemo };
}

/** Destination unique pour login / callback (priorité la plus élevée). */
export function pickPrimaryDestination(spaces: DashboardSpace[]): string | null {
  const priority = [
    "/super",
    "/dashboard/entreprise",
    "/dashboard/praticien",
    "/dashboard/expert",
    "/dashboard/formateur",
    "/dashboard/ecole",
    "/dashboard/tuteur",
    "/dashboard/salarie",
    "/dashboard/apprenant",
    "/dashboard/student/learning",
    "/dashboard/club",
    "/dashboard/partenaire",
  ];
  for (const href of priority) {
    if (spaces.some((s) => s.href === href)) return href;
  }
  return spaces[0]?.href ?? null;
}
