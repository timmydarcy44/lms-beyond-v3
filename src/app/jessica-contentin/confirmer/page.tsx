import { redirect } from "next/navigation";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirmation d'inscription - Jessica Contentin",
  description: "Confirmez votre adresse email pour finaliser votre inscription",
};

export default async function JessicaContentinConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; type?: string; email?: string; code?: string }>;
}) {
  const params = await searchParams;
  const { token, type, email, code } = params;

  const supabaseService = getServiceRoleClient();
  if (!supabaseService) {
    redirect("/jessica-contentin/login?error=service_unavailable");
  }

  // Si on a un code (format Supabase moderne), vérifier et confirmer
  if (code) {
    try {
      // Le code est déjà échangé par Supabase, on vérifie juste que l'utilisateur est confirmé
      // Récupérer l'utilisateur depuis la session si possible
      const supabase = await getServerClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Vérifier si l'email est confirmé
          const { data: userData } = await supabaseService.auth.admin.getUserById(user.id);
          if (userData?.user?.email_confirmed_at) {
            // Email déjà confirmé, rediriger vers login avec succès
            redirect("/jessica-contentin/login?confirmed=true");
          } else {
            // Confirmer l'email manuellement
            await supabaseService.auth.admin.updateUserById(user.id, {
              email_confirm: true,
            });
            redirect("/jessica-contentin/login?confirmed=true");
          }
        }
      }
    } catch (error) {
      console.error("[jessica-contentin/confirmer] Error with code:", error);
      redirect("/jessica-contentin/login?error=confirmation_failed");
    }
  }

  // Si on a un token et un email (ancien format)
  if (token && email) {
    try {
      // Trouver l'utilisateur par email
      const { data: usersList } = await supabaseService.auth.admin.listUsers();
      const userData = usersList?.users?.find((u) => u.email === email);

      if (userData) {
        // Confirmer l'email
        await supabaseService.auth.admin.updateUserById(userData.id, {
          email_confirm: true,
        });
        redirect("/jessica-contentin/login?confirmed=true");
      } else {
        redirect("/jessica-contentin/login?error=user_not_found");
      }
    } catch (error) {
      console.error("[jessica-contentin/confirmer] Error:", error);
      redirect("/jessica-contentin/login?error=confirmation_failed");
    }
  }

  // Si pas de paramètres valides, rediriger vers la page de connexion
  redirect("/jessica-contentin/login?error=invalid_link");
}

