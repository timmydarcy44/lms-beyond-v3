import { notFound } from "next/navigation";
import { getCatalogItemById } from "@/lib/queries/catalogue";
import { getServerClient } from "@/lib/supabase/server";
import { CatalogTopNavClient } from "@/components/catalogue/catalog-top-nav-client";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { StripePaymentForm } from "@/components/catalogue/stripe-payment-form";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TestPaymentPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  const organizationId = profile?.org_id || undefined;

  const catalogItem = await getCatalogItemById(id, organizationId);

  if (!catalogItem || catalogItem.item_type !== "test") {
    notFound();
  }

  // Si déjà acheté ou gratuit, rediriger vers le test
  if (catalogItem.is_free || catalogItem.access_status === "purchased" || catalogItem.access_status === "manually_granted") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Vous avez déjà accès à ce test.</p>
      </div>
    );
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
            <p className="text-gray-600 mb-8">
              Prix: {catalogItem.price}€
            </p>
            
            <StripePaymentForm
              itemId={id}
              itemType="test"
              itemTitle={catalogItem.title}
              price={catalogItem.price}
              primaryColor={primaryColor}
            />
          </div>
        </main>
      </div>
    </BrandingProvider>
  );
}





