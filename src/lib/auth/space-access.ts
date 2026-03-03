import type { SessionUser } from "@/lib/auth/session";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export type PortalProduct = {
  key: "lms" | "connect" | "care" | "play" | "note";
  label: string;
  description: string;
  href: string;
  isEnabled: boolean;
};

const SCHOOL_ROLES = new Set(["ecole", "school", "cfa", "admin_ecole", "admin_school"]);
const ENTERPRISE_ROLES = new Set(["entreprise", "enterprise"]);
const TRAINER_ROLES = new Set(["formateur", "instructor", "teacher"]);
const ADMIN_ROLES = new Set(["admin", "super_admin"]);

const normalizeRole = (value: unknown) => String(value ?? "").trim().toLowerCase();

export async function resolvePortalProducts(session: SessionUser): Promise<PortalProduct[]> {
  const supabase = await getServerClient();
  if (!supabase) {
    return [
      {
        key: "lms",
        label: "LMS",
        description: "Espace de formation neuro-adapte",
        href: "/portail/apprenant",
        isEnabled: true,
      },
      {
        key: "connect",
        label: "Beyond Connect",
        description: "Matching, offres et recrutement",
        href: "/dashboard/apprenant",
        isEnabled: false,
      },
      {
        key: "care",
        label: "Beyond Care",
        description: "Suivi bien-etre et indicateurs",
        href: "/dashboard/formateur/beyond-care",
        isEnabled: false,
      },
      {
        key: "play",
        label: "Beyond Play",
        description: "Serious games et activations",
        href: "/beyond-play",
        isEnabled: false,
      },
      {
        key: "note",
        label: "Beyond Note",
        description: "Prise de notes intelligente",
        href: "/beyond-note-app",
        isEnabled: false,
      },
    ];
  }

  const { data: profileById } = await supabase
    .from("profiles")
    .select("id, email, role_type, role, school_id, school_subscription")
    .eq("id", session.id)
    .maybeSingle();
  let profile = profileById;
  if (!profile && session.email) {
    const { data: profileByEmail } = await supabase
      .from("profiles")
      .select("id, email, role_type, role, school_id, school_subscription")
      .eq("email", session.email)
      .maybeSingle();
    profile = profileByEmail ?? null;
  }

  const roleType = normalizeRole(profile?.role_type);
  const role = normalizeRole(profile?.role);
  const isSchool = SCHOOL_ROLES.has(roleType) || SCHOOL_ROLES.has(role) || Boolean(profile?.school_id);
  const isEnterprise = ENTERPRISE_ROLES.has(roleType) || ENTERPRISE_ROLES.has(role);
  const isTrainer = TRAINER_ROLES.has(roleType) || TRAINER_ROLES.has(role);
  const isAdmin = ADMIN_ROLES.has(roleType) || ADMIN_ROLES.has(role);
  const lmsHref = isAdmin ? "/portail/admin" : isTrainer ? "/portail/formateur" : "/portail/apprenant";
  const connectHref = isSchool ? "/dashboard/ecole" : isEnterprise ? "/dashboard/entreprise" : "/dashboard/apprenant";

  let hasConnect = String(profile?.school_subscription ?? "").trim().toLowerCase() === "connect";
  hasConnect = hasConnect || isSchool || isEnterprise || isTrainer || isAdmin;
  let hasCare = false;
  let hasPlay = false;
  let hasNote = false;

  const service = getServiceRoleClient();
  if (service) {
    const { data: memberships } = await service
      .from("org_memberships")
      .select("org_id, role")
      .eq("user_id", session.id);
    const orgIds = (memberships ?? []).map((item) => item.org_id).filter(Boolean) as string[];
    if (orgIds.length > 0) {
      const { data: features } = await service
        .from("organization_features")
        .select("feature_key")
        .in("org_id", orgIds)
        .in("feature_key", ["beyond_connect", "beyond_care", "beyond_play", "beyond_note"])
        .eq("is_enabled", true);
      const featureKeys = new Set((features ?? []).map((f) => String(f.feature_key)));
      hasConnect = hasConnect || featureKeys.has("beyond_connect");
      const isOrgAdmin = (memberships ?? []).some((item) => String(item.role ?? "").toLowerCase() === "admin");
      hasCare = featureKeys.has("beyond_care") && isOrgAdmin;
      hasPlay = featureKeys.has("beyond_play");
      hasNote = featureKeys.has("beyond_note");
    }
  }

  const spaces: PortalProduct[] = [
    {
      key: "lms",
      label: "Beyond LMS",
      description: "Contenu neuro-adapte, parcours et flashcards",
      href: lmsHref,
      isEnabled: true,
    },
    {
      key: "connect",
      label: "Beyond Connect",
      description: "Matching, offres et suivi recrutement",
      href: connectHref,
      isEnabled: hasConnect,
    },
    {
      key: "care",
      label: "Beyond Care",
      description: "Pilotage bien-etre et suivi des indicateurs",
      href: "/dashboard/care",
      isEnabled: hasCare,
    },
    {
      key: "play",
      label: "Beyond Play",
      description: "Activites immersives et experiences d'apprentissage",
      href: "/beyond-play",
      isEnabled: hasPlay,
    },
    {
      key: "note",
      label: "Beyond Note",
      description: "Notes, syntheses et intelligence documentaire",
      href: "/beyond-note-app",
      isEnabled: hasNote,
    },
  ];

  return spaces;
}
