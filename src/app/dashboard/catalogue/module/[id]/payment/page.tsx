import { notFound, redirect } from "next/navigation";
import { getCatalogItemById } from "@/lib/queries/catalogue";
import { getServerClient } from "@/lib/supabase/server";
import { CatalogTopNavClient } from "@/components/catalogue/catalog-top-nav-client";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { StripePaymentForm } from "@/components/catalogue/stripe-payment-form";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ModulePaymentPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  // Permettre l'accès même sans être connecté (rediriger vers création de compte si nécessaire)

  let organizationId: string | undefined = undefined;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .maybeSingle();

    organizationId = profile?.org_id || undefined;
  }

  const catalogItem = await getCatalogItemById(id, organizationId, user?.id);

  if (!catalogItem || (catalogItem.item_type !== "module" && catalogItem.item_type !== "parcours")) {
    notFound();
  }

  // Vérifier si l'utilisateur est le créateur du contenu
  const isCreator = user && (catalogItem as any).creator_id === user.id;
  
  // Si déjà acheté, gratuit, ou si c'est le créateur, rediriger vers le module
  if (isCreator || catalogItem.is_free || catalogItem.access_status === "purchased" || catalogItem.access_status === "manually_granted") {
    // Rediriger vers la page de détail du module
    redirect(`/dashboard/catalogue/module/${id}`);
  }

  let branding = null;
  if (catalogItem && (catalogItem as any).creator_id) {
    branding = await getSuperAdminBranding((catalogItem as any).creator_id);
  }

  const bgColor = branding?.background_color || '#F5F0E8';
  const textColor = branding?.text_primary_color || '#5D4037';
  const primaryColor = branding?.primary_color || '#8B6F47';

  return (
    <BrandingProvider initialBranding={branding}>
      <div 
        className="min-h-screen"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <CatalogTopNavClient />
        
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold mb-4" style={{ color: textColor }}>
              Paiement - {catalogItem.title}
            </h1>
            <p className="text-gray-600 mb-4">
              Prix: {catalogItem.price}€
            </p>
            
            {!user && (
              <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}05` }}>
                <p className="text-sm text-center mb-3" style={{ color: textColor }}>
                  Pour procéder au paiement, vous devez avoir un compte.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href={`/jessica-contentin/inscription?redirect=${encodeURIComponent(`/dashboard/catalogue/module/${id}/payment`)}`}
                    className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Créer un compte
                  </Link>
                  <Link
                    href={`/jessica-contentin/login?next=${encodeURIComponent(`/dashboard/catalogue/module/${id}/payment`)}`}
                    className="px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all hover:opacity-90"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    Se connecter
                  </Link>
                </div>
              </div>
            )}
            
            {user ? (
              <StripePaymentForm
              itemId={id}
              itemType={catalogItem.item_type as "module" | "parcours"}
                itemTitle={catalogItem.title}
                price={catalogItem.price}
                primaryColor={primaryColor}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Veuillez créer un compte ou vous connecter pour continuer.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </BrandingProvider>
  );
}

