"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CRM_PROFILE_ROLES, type CrmProfileRole } from "@/lib/crm/crm-shared";
import { sendCrmUserPasswordInvite } from "@/lib/crm/send-crm-user-password-invite";
import { revalidatePath } from "next/cache";

type CreateUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: CrmProfileRole;
  organizationIds?: string[];
  /** Si false : crée le compte sans envoyer l'email de mot de passe. */
  sendInvite?: boolean;
};

function buildFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim();
}

function isAllowedRole(role: string): role is CrmProfileRole {
  return (CRM_PROFILE_ROLES as readonly string[]).includes(role);
}

function isBtocRole(role: string) {
  const r = role.trim();
  return r === "PARTICULIER" || r === "particulier" || r === "btoc";
}

/**
 * Client BtoC canonique : role=learner + role_type=particulier
 * (aligné inscriptions site). Garde aussi PARTICULIER si la contrainte legacy l'exige.
 */
function buildBtocProfilePayload(base: {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
}) {
  return {
    email: base.email,
    first_name: base.firstName,
    last_name: base.lastName,
    full_name: base.fullName,
    phone: base.phone,
    role: "learner" as const,
    role_type: "particulier" as const,
  };
}

export async function createUserAction(input: CreateUserInput): Promise<{
  success: boolean;
  userId?: string;
  inviteSent?: boolean;
  warning?: string;
  error?: string;
}> {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return { success: false, error: "Accès non autorisé" };
  }

  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const fullName = buildFullName(firstName, lastName);
  const phone = input.phone?.trim() || null;
  const btoc = isBtocRole(input.role);

  if (!email || !firstName || !lastName) {
    return { success: false, error: "Email, prénom et nom sont obligatoires." };
  }
  if (!isAllowedRole(input.role) && !btoc) {
    return { success: false, error: "Rôle invalide." };
  }

  const client = getServiceRoleClient();
  if (!client) {
    return { success: false, error: "Service role client non disponible" };
  }

  try {
    const { data: existingProfile } = await client
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    const profilePayload = btoc
      ? buildBtocProfilePayload({ email, firstName, lastName, fullName, phone })
      : {
          email,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          phone,
          role: input.role,
        };

    const membershipRole = btoc ? "learner" : input.role;
    const metadataRole = btoc ? "learner" : input.role;

    let userId: string;
    let isNewAuthUser = false;

    if (existingProfile) {
      userId = existingProfile.id;
      const { error: updateError } = await client
        .from("profiles")
        .update(profilePayload)
        .eq("id", userId);
      if (updateError) {
        console.error("[super-admin] Error updating profile:", updateError);
        return {
          success: false,
          error: updateError.message || "Erreur lors de la mise à jour du profil",
        };
      }
    } else {
      const { data: authUser, error: authError } = await client.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          phone,
          role: metadataRole,
          ...(btoc ? { role_type: "particulier" } : {}),
          needs_password_setup: true,
          signup_source: btoc ? "crm_btoc" : "crm_edge",
        },
      });

      if (authError || !authUser?.user) {
        console.error("[super-admin] Error creating user:", authError);
        return {
          success: false,
          error: authError?.message || "Erreur lors de la création de l'utilisateur",
        };
      }

      userId = authUser.user.id;
      isNewAuthUser = true;

      // Upsert : un trigger auth peut déjà avoir créé un profil learner sans role_type.
      const { error: profileError } = await client.from("profiles").upsert(
        { id: userId, ...profilePayload },
        { onConflict: "id" },
      );

      if (profileError) {
        // Contrainte role legacy : retenter avec PARTICULIER
        if (btoc && /profiles_role_check|role/i.test(profileError.message)) {
          const { error: retryError } = await client.from("profiles").upsert(
            {
              id: userId,
              ...profilePayload,
              role: "PARTICULIER",
              role_type: "particulier",
            },
            { onConflict: "id" },
          );
          if (retryError) {
            console.error("[super-admin] Error creating B2C profile:", retryError);
            return {
              success: false,
              error: retryError.message || "Erreur lors de la création du profil",
            };
          }
        } else {
          console.error("[super-admin] Error creating profile:", profileError);
          return {
            success: false,
            error: profileError.message || "Erreur lors de la création du profil",
          };
        }
      }
    }

    if (input.organizationIds && input.organizationIds.length > 0) {
      for (const orgId of input.organizationIds) {
        const { error: membershipError } = await client.from("org_memberships").upsert({
          org_id: orgId,
          user_id: userId,
          role: membershipRole,
        });

        if (membershipError) {
          console.error(`[super-admin] Error adding user to org ${orgId}:`, membershipError);
        }
      }
    }

    let inviteSent = false;
    let warning: string | undefined;
    // B2C : jamais d’email auto (sendInvite explicitement false). Autres rôles : true par défaut.
    const shouldSendInvite = btoc ? input.sendInvite === true : input.sendInvite !== false;

    if (isNewAuthUser && shouldSendInvite) {
      const invite = await sendCrmUserPasswordInvite(client, {
        email,
        firstName,
        role: btoc ? "PARTICULIER" : input.role,
      });
      if (invite.ok) {
        inviteSent = true;
      } else {
        console.error("[super-admin] password invite failed:", invite.error);
        warning =
          "Utilisateur créé, mais l'email de création de mot de passe n'a pas pu être envoyé.";
      }
    }

    revalidatePath("/super/utilisateurs");
    revalidatePath("/super");

    return { success: true, userId, inviteSent, warning };
  } catch (error) {
    console.error("[super-admin] Unexpected error:", error);
    return { success: false, error: "Une erreur inattendue est survenue" };
  }
}
