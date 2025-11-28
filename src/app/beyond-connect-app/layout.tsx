import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { BeyondConnectHeader } from "@/components/beyond-connect/beyond-connect-header";
import { getServerClient } from "@/lib/supabase/server";
import { BeyondConnectAppLayoutWrapper } from "./layout-wrapper";

export default async function BeyondConnectAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/beyond-connect/login?next=/beyond-connect-app");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/beyond-connect/login?next=/beyond-connect-app");
  }

  // Ne pas vérifier le rôle ici pour éviter les boucles de redirection
  // Le layout /companies gérera l'accès pour les admins/instructors
  // La page /beyond-connect-app/page.tsx gérera la redirection pour les admins vers /companies
  // Ce layout ne fait que vérifier la session et fournir le header

  // Vérifier si on est sur une route /companies pour ne pas afficher le header en double
  // Le layout /companies a son propre header
  // Le wrapper client détecte si on est sur /companies pour conditionner l'affichage
  return (
    <BeyondConnectAppLayoutWrapper>
      <div className="min-h-screen bg-white">
        <BeyondConnectHeader user={session} />
        <main>{children}</main>
      </div>
    </BeyondConnectAppLayoutWrapper>
  );
}

