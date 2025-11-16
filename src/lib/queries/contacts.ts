import { getServerClient } from "@/lib/supabase/server";
import { getFormateurLearners } from "@/lib/queries/formateur";

export type Contact = {
  id: string;
  name: string;
  email: string | null;
  type: "learner" | "instructor" | "admin" | "group";
  avatarUrl?: string;
};

const buildProfileName = (profile: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  email?: string | null;
}) => {
  const fullName = profile.full_name?.trim();
  if (fullName) {
    return fullName;
  }

  const composed = [profile.first_name, profile.last_name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .trim();
  if (composed.length > 0) {
    return composed;
  }

  const display = profile.display_name?.trim();
  if (display) {
    return display;
  }

  const email = profile.email?.trim();
  if (email) {
    return email;
  }

  return "Utilisateur";
};

/**
 * Récupère les contacts disponibles pour la messagerie
 * 
 * Règles :
 * - FORMATEURS : voient uniquement leurs apprenants assignés (via getFormateurLearners)
 * - APPRENANTS : voient uniquement les formateurs/admins de leur organisation (PAS les autres apprenants)
 * - ADMINS : voient tous les membres de leur organisation
 * - Groupes : visibles uniquement pour formateurs et admins
 */
export async function getAvailableContacts(): Promise<Contact[]> {
  const supabase = await getServerClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return [];
    }

    const userId = authData.user.id;

    // Récupérer le rôle de l'utilisateur actuel
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const userRole = profile?.role || "learner";

    const contacts: Contact[] = [];

    // Récupérer les organisations de l'utilisateur
    const { data: userMemberships } = await supabase
      .from("org_memberships")
      .select("org_id, role")
      .eq("user_id", userId);

    const userOrgIds = (userMemberships || []).map((m) => m.org_id);

    if (userOrgIds.length === 0) {
      return contacts;
    }

    // CAS 1 : FORMATEUR - Utiliser getFormateurLearners pour ne voir que les apprenants assignés
    if (userRole === "instructor") {
      const assignedLearners = await getFormateurLearners();
      
      assignedLearners.forEach((learner) => {
        const name = buildProfileName({
          full_name: learner.full_name,
          email: learner.email,
        });

        contacts.push({
          id: learner.id,
          name,
          email: learner.email,
          type: "learner",
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        });
      });

      // Les formateurs peuvent aussi voir les autres formateurs et admins de leur organisation
      const { data: orgMembers } = await supabase
        .from("org_memberships")
        .select("user_id, role, org_id")
        .in("org_id", userOrgIds)
        .in("role", ["instructor", "admin"])
        .neq("user_id", userId);

      const otherMemberIds = [...new Set((orgMembers || []).map((m) => m.user_id))];

      if (otherMemberIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name, display_name, first_name, last_name")
          .in("id", otherMemberIds);

        const roleMap = new Map<string, string>();
        (orgMembers || []).forEach((m) => {
          roleMap.set(m.user_id, m.role);
        });

        (profiles || []).forEach((profile) => {
          const role = roleMap.get(profile.id);
          const name = buildProfileName(profile);
          
          contacts.push({
            id: profile.id,
            name,
            email: profile.email,
            type: role === "admin" ? "admin" : "instructor",
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          });
        });
      }

      // Groupes pour formateurs
      const { data: groups } = await supabase
        .from("groups")
        .select("id, name")
        .in("org_id", userOrgIds);

      (groups || []).forEach((group) => {
        contacts.push({
          id: group.id,
          name: group.name,
          email: null,
          type: "group",
          avatarUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(group.name)}`,
        });
      });
    }
    // CAS 2 : APPRENANT - Voir uniquement les formateurs/admins de son organisation (PAS les autres apprenants)
    else if (userRole === "learner") {
      const { data: orgMembers } = await supabase
        .from("org_memberships")
        .select("user_id, role, org_id")
        .in("org_id", userOrgIds)
        .in("role", ["instructor", "admin"]) // Seulement formateurs et admins
        .neq("user_id", userId);

      const memberUserIds = [...new Set((orgMembers || []).map((m) => m.user_id))];

      if (memberUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name, display_name, first_name, last_name")
          .in("id", memberUserIds);

        const roleMap = new Map<string, string>();
        (orgMembers || []).forEach((m) => {
          roleMap.set(m.user_id, m.role);
        });

        (profiles || []).forEach((profile) => {
          const role = roleMap.get(profile.id);
          const name = buildProfileName(profile);
          
          contacts.push({
            id: profile.id,
            name,
            email: profile.email,
            type: role === "admin" ? "admin" : "instructor",
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          });
        });
      }
    }
    // CAS 3 : ADMIN - Voir tous les membres de son organisation
    else if (userRole === "admin") {
      const { data: orgMembers } = await supabase
        .from("org_memberships")
        .select("user_id, role, org_id")
        .in("org_id", userOrgIds)
        .neq("user_id", userId);

      const memberUserIds = [...new Set((orgMembers || []).map((m) => m.user_id))];

      if (memberUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name, display_name, first_name, last_name")
          .in("id", memberUserIds);

        const roleMap = new Map<string, string>();
        (orgMembers || []).forEach((m) => {
          roleMap.set(m.user_id, m.role);
        });

        (profiles || []).forEach((profile) => {
          const role = roleMap.get(profile.id);
          let contactType: Contact["type"] = "learner";
          if (role === "instructor") contactType = "instructor";
          else if (role === "admin") contactType = "admin";
          else if (role === "learner") contactType = "learner";

          const name = buildProfileName(profile);
          
          contacts.push({
            id: profile.id,
            name,
            email: profile.email,
            type: contactType,
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          });
        });
      }

      // Groupes pour admins
      const { data: groups } = await supabase
        .from("groups")
        .select("id, name")
        .in("org_id", userOrgIds);

      (groups || []).forEach((group) => {
        contacts.push({
          id: group.id,
          name: group.name,
          email: null,
          type: "group",
          avatarUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(group.name)}`,
        });
      });
    }

    // Trier les contacts par type puis par nom
    contacts.sort((a, b) => {
      const typeOrder = { admin: 0, instructor: 1, learner: 2, group: 3 };
      const typeDiff = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      if (typeDiff !== 0) return typeDiff;
      return a.name.localeCompare(b.name);
    });

    console.log("[contacts] Returning contacts for role", userRole, ":", contacts.length, "contacts");
    return contacts;
  } catch (error) {
    console.error("[contacts] Error fetching contacts:", error);
    return [];
  }
}

