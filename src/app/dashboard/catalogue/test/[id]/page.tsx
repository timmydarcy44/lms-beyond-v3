import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCatalogItemById } from "@/lib/queries/catalogue";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { CatalogTopNavClient } from "@/components/catalogue/catalog-top-nav-client";
import { JessicaContentinHeader } from "@/components/jessica-contentin/header";
import { HeroImage } from "@/components/catalogue/hero-image";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { Clock, Target, Award, CheckCircle2, Brain, Users, TrendingUp, BarChart3 } from "lucide-react";
import { AddToCartButton } from "@/components/catalogue/add-to-cart-button";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CatalogTestDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // Récupérer l'item du catalogue AVANT de vérifier l'utilisateur pour détecter si c'est Jessica
  // On utilise le service role pour pouvoir lire sans authentification
  const serviceClient = await getServiceRoleClient();
  const tempCatalogItem = serviceClient 
    ? await getCatalogItemById(id, undefined, undefined, serviceClient)
    : null;

  // Détecter si c'est un test de Jessica Contentin AVANT la redirection
  let isJessicaContentin = false;
  let creatorEmail = null;
  if (tempCatalogItem && (tempCatalogItem as any).creator_id && serviceClient) {
    const { data: creatorProfile } = await serviceClient
      .from("profiles")
      .select("email")
      .eq("id", (tempCatalogItem as any).creator_id)
      .maybeSingle();
    
    creatorEmail = creatorProfile?.email || null;
    isJessicaContentin = creatorEmail === "contentin.cabinet@gmail.com";
  }

  // Récupérer l'organisation de l'utilisateur
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Rediriger vers la bonne page de login selon le créateur
    if (isJessicaContentin) {
      redirect(`/jessica-contentin/login?next=${encodeURIComponent(`/dashboard/catalogue/test/${id}`)}`);
    } else {
      redirect(`/login?next=${encodeURIComponent(`/dashboard/catalogue/test/${id}`)}`);
    }
  }

  // Récupérer le profil pour obtenir l'organisation
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  const organizationId = profile?.org_id || undefined;

  // Récupérer l'item du catalogue (peut être dans catalog_items ou directement dans tests)
  const catalogItem = await getCatalogItemById(id, organizationId, user.id);

  if (!catalogItem) {
    console.error("[catalogue/test] Catalog item not found for ID:", id);
    notFound();
  }

  if (catalogItem.item_type !== "test") {
    console.error("[catalogue/test] Item is not a test, type:", catalogItem.item_type);
    notFound();
  }

  // Récupérer le branding du Super Admin créateur du test
  let branding = null;
  if (catalogItem && (catalogItem as any).creator_id) {
    branding = await getSuperAdminBranding((catalogItem as any).creator_id);
    
    // Récupérer l'email du créateur pour détecter si c'est Jessica (si pas déjà fait)
    if (!creatorEmail) {
      const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", (catalogItem as any).creator_id)
        .maybeSingle();
      
      creatorEmail = creatorProfile?.email || null;
      isJessicaContentin = creatorEmail === "contentin.cabinet@gmail.com";
    }
  }

  // Récupérer les détails du test depuis la table tests
  let testData = null;
  if (catalogItem.content_id) {
    const { data: test } = await supabase
      .from("tests")
      .select("id, title, description, duration, evaluation_type, skills, display_format, questions, slug, builder_snapshot")
      .eq("id", catalogItem.content_id)
      .single();

    if (test) {
      testData = test;
    }
  }

  // Déterminer l'image hero
  let heroImage = catalogItem.hero_image_url || catalogItem.thumbnail_url;

  // Déterminer l'accroche
  let accroche = catalogItem.short_description || catalogItem.description || testData?.description;

  // Extraire les informations du test
  const duration = testData?.duration || catalogItem.duration;
  const evaluationType = testData?.evaluation_type;
  const skills = testData?.skills;
  const displayFormat = testData?.display_format;

  // Vérifier si l'utilisateur est le créateur du contenu
  const isCreator = (catalogItem as any).creator_id === user.id;
  
  // Déterminer le statut d'accès
  // Le créateur a toujours accès, même si le contenu est payant
  const hasAccess = isCreator ||
                    catalogItem.access_status === "purchased" || 
                    catalogItem.access_status === "manually_granted" || 
                    catalogItem.access_status === "free" ||
                    catalogItem.is_free;

  // URL vers la page de test (si accès)
  // Vérifier si le test utilise un questionnaire mental_health
  let testUrl = null;
  if (hasAccess && testData) {
    const builderSnapshot = (testData as any)?.builder_snapshot as any;
    const questionnaireId = builderSnapshot?.questionnaireId;

    if (questionnaireId) {
      // Rediriger vers la page du questionnaire mental_health
      testUrl = `/dashboard/apprenant/questionnaires/${questionnaireId}`;
    } else {
      // Sinon, utiliser la page de test classique
      const testSlug = (testData as any)?.slug || null;
      testUrl = testSlug
        ? `/dashboard/tests/${testSlug}`
        : catalogItem.content_id
          ? `/dashboard/tests/${catalogItem.content_id}`
          : null;
    }
  }

  // URL vers la page de paiement (si pas d'accès)
  const paymentUrl = `/dashboard/catalogue/test/${id}/payment`;

  // Couleurs du branding
  const bgColor = branding?.background_color || '#F5F0E8';
  const surfaceColor = branding?.surface_color || '#F5F0E8';
  const textColor = branding?.text_primary_color || '#5D4037';
  const primaryColor = branding?.primary_color || '#8B6F47';
  const accentColor = branding?.accent_color || '#D4AF37';

  // Vérifier si c'est le test des soft skills
  const isSoftSkillsTest = catalogItem.title?.toLowerCase().includes("soft skills") || 
                           catalogItem.title === "Soft Skills – Profil 360";

  return (
    <BrandingProvider initialBranding={branding}>
      <div 
        className="min-h-screen"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {/* Utiliser le header de Jessica si c'est son test, sinon le header catalogue standard */}
        {isJessicaContentin ? (
          <JessicaContentinHeader />
        ) : (
          <CatalogTopNavClient />
        )}
      
        {/* Section Hero avec image cover */}
        <div 
          className="relative h-[80vh] min-h-[700px] overflow-hidden"
          style={{ backgroundColor: bgColor }}
        >
          {/* Image de fond (cover) */}
          {heroImage ? (
            <>
              <HeroImage
                src={heroImage}
                alt={catalogItem.title}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-violet-900 to-purple-900" />
          )}
          
          {/* Contenu Hero centré */}
          <div className="relative z-10 flex h-full items-center justify-center px-6 md:px-12">
            <div className="max-w-4xl text-center">
              <h1 
                className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  color: '#FFFFFF',
                  textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                }}
              >
                {catalogItem.title}
              </h1>
              
              {/* CTA "Ajouter à ma liste" ou "Démarrer le test" */}
              <div className="flex justify-center mt-12">
                {hasAccess && testUrl ? (
                  <a
                    href={testUrl}
                    className="px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all text-white"
                    style={{
                      backgroundColor: primaryColor,
                    }}
                  >
                    Démarrer le test
                  </a>
                ) : (
                  <AddToCartButton
                    contentId={catalogItem.content_id || catalogItem.id}
                    contentType="test"
                    title={catalogItem.title}
                    price={catalogItem.price || 0}
                    thumbnailUrl={heroImage}
                    size="lg"
                    className="px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section de présentation du test des soft skills */}
        {isSoftSkillsTest && (
          <div className="py-16 px-6 md:px-12" style={{ backgroundColor: bgColor }}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 
                  className="text-4xl md:text-5xl font-bold mb-4"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    color: textColor,
                  }}
                >
                  Découvrez votre profil de soft skills
                </h2>
                <p 
                  className="text-lg md:text-xl max-w-3xl mx-auto"
                  style={{ color: textColor, opacity: 0.8 }}
                >
                  Un diagnostic complet pour identifier vos forces et vos axes de développement
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Colonne gauche : Description */}
                <div className="space-y-6">
                  <div>
                    <h3 
                      className="text-2xl font-semibold mb-4 flex items-center gap-3"
                      style={{ color: textColor }}
                    >
                      <Brain className="h-6 w-6" style={{ color: primaryColor }} />
                      Qu'est-ce que ce test ?
                    </h3>
                    <p style={{ color: textColor, opacity: 0.9, lineHeight: 1.8 }}>
                      Le test "Soft Skills – Profil 360" est un outil d'évaluation complet qui vous permet 
                      de mesurer 10 dimensions clés de vos compétences comportementales. En quelques minutes, 
                      vous obtiendrez un classement personnalisé de vos soft skills et des recommandations 
                      adaptées à votre profil.
                    </p>
                  </div>

                  <div>
                    <h3 
                      className="text-2xl font-semibold mb-4 flex items-center gap-3"
                      style={{ color: textColor }}
                    >
                      <Target className="h-6 w-6" style={{ color: primaryColor }} />
                      Les 10 dimensions évaluées
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Gestion des émotions & du stress",
                        "Communication & influence",
                        "Persévérance & passage à l'action",
                        "Organisation, temps & priorités",
                        "Empathie & écoute active",
                        "Résolution de problèmes & pensée critique",
                        "Collaboration & gestion des conflits",
                        "Créativité & adaptabilité",
                        "Leadership & vision",
                        "Confiance en soi & prise de décision"
                      ].map((dimension, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                          <span style={{ color: textColor, opacity: 0.9 }}>{dimension}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Colonne droite : Avantages et résultats */}
                <div className="space-y-6">
                  <div>
                    <h3 
                      className="text-2xl font-semibold mb-4 flex items-center gap-3"
                      style={{ color: textColor }}
                    >
                      <BarChart3 className="h-6 w-6" style={{ color: primaryColor }} />
                      Ce que vous obtiendrez
                    </h3>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                        <div>
                          <strong style={{ color: textColor }}>Un classement personnalisé</strong>
                          <p style={{ color: textColor, opacity: 0.8, fontSize: '0.95rem' }}>
                            Découvrez quelles sont vos soft skills les plus développées et celles à renforcer
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                        <div>
                          <strong style={{ color: textColor }}>Une analyse détaillée</strong>
                          <p style={{ color: textColor, opacity: 0.8, fontSize: '0.95rem' }}>
                            Comprenez votre profil avec des explications claires et bienveillantes
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                        <div>
                          <strong style={{ color: textColor }}>Des recommandations pratiques</strong>
                          <p style={{ color: textColor, opacity: 0.8, fontSize: '0.95rem' }}>
                            Recevez des pistes d'action concrètes pour développer vos compétences
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                        <div>
                          <strong style={{ color: textColor }}>Un outil pour votre orientation</strong>
                          <p style={{ color: textColor, opacity: 0.8, fontSize: '0.95rem' }}>
                            Utilisez vos résultats pour affiner vos choix de métiers ou d'études
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div 
                    className="p-6 rounded-2xl"
                    style={{ 
                      backgroundColor: surfaceColor,
                      border: `2px solid ${primaryColor}20`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <Users className="h-8 w-8 flex-shrink-0" style={{ color: primaryColor }} />
                      <div>
                        <h4 className="font-semibold mb-2" style={{ color: textColor }}>
                          Pour qui ?
                        </h4>
                        <p style={{ color: textColor, opacity: 0.9, fontSize: '0.95rem' }}>
                          Ce test s'adresse à tous : étudiants en réflexion sur leur orientation, 
                          professionnels souhaitant mieux se connaître, ou toute personne curieuse 
                          de découvrir ses forces naturelles.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="p-6 rounded-2xl"
                    style={{ 
                      backgroundColor: surfaceColor,
                      border: `2px solid ${primaryColor}20`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <Clock className="h-8 w-8 flex-shrink-0" style={{ color: primaryColor }} />
                      <div>
                        <h4 className="font-semibold mb-2" style={{ color: textColor }}>
                          Durée du test
                        </h4>
                        <p style={{ color: textColor, opacity: 0.9, fontSize: '0.95rem' }}>
                          Environ 25 minutes pour répondre aux 40 questions. Vous pouvez le faire 
                          à votre rythme et reprendre où vous vous êtes arrêté si nécessaire.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA final */}
              <div className="text-center mt-12">
                {!hasAccess && (
                  <div className="inline-block">
                    <AddToCartButton
                      contentId={catalogItem.content_id || catalogItem.id}
                      contentType="test"
                      title={catalogItem.title}
                      price={catalogItem.price || 0}
                      thumbnailUrl={heroImage}
                      size="lg"
                      className="px-10 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </BrandingProvider>
  );
}

