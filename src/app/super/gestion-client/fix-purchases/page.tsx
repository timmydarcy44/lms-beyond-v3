import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { FixPurchasesClient } from "./fix-purchases-client";

export default async function FixPurchasesPage() {
  // Vérifier l'authentification
  const sessionClient = await getServerClient();
  if (!sessionClient) {
    redirect("/login");
  }

  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user?.id) {
    redirect("/login");
  }

  // Vérifier que l'utilisateur est super admin
  const isSuper = await isSuperAdmin();
  if (!isSuper) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ color: "#2F2A25" }}
          >
            Corriger les achats passés
          </h1>
          <p 
            className="text-lg"
            style={{ color: "#2F2A25", opacity: 0.7 }}
          >
            Accorder l'accès aux contenus pour les achats effectués avant la configuration du webhook Stripe.
          </p>
        </div>
        <FixPurchasesClient />
      </div>
    </div>
  );
}

