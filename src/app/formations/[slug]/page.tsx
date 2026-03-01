import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getLearnerContentDetail } from "@/lib/queries/apprenant";
import { LearningSessionTracker } from "@/components/learning-session-tracker";
import { Button } from "@/components/ui/button";
import { getServerClient } from "@/lib/supabase/server";
import { BuyButton } from "@/components/jessica-contentin/buy-button";
import { ResourcePurchaseSection } from "@/components/jessica-contentin/resource-purchase-section";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

interface FormationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function FormationDetailPage({ params }: FormationDetailPageProps) {
  const { slug } = await params;

  console.log("[formations/[slug]] ========================================");
  console.log("[formations/[slug]] PAGE FUNCTION CALLED for slug:", slug);
  console.log("[formations/[slug]] ========================================");

  // Vérifier que c'est bien une formation de Jessica Contentin
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  // Récupérer l'ID de Jessica Contentin (utiliser le service role client pour éviter les erreurs RLS)
  const { getServiceRoleClient } = await import("@/lib/supabase/server");
  const serviceClient = getServiceRoleClient();
  const profileClient = serviceClient || supabase;

  // Récupérer directement le course avec le service role client (contourner RLS)
  const { data: courseDirect, error: courseDirectError } = await profileClient
    .from("courses")
    .select("id, title, description, slug, cover_image, hero_image_url, thumbnail_url, builder_snapshot, status, creator_id")
    .eq("id", slug)
    .maybeSingle();

  console.log("[formations/[slug]] Direct course lookup:", {
    slug,
    courseFound: !!courseDirect,
    courseTitle: courseDirect?.title,
    courseCreatorId: courseDirect?.creator_id,
    courseError: courseDirectError?.message,
  });

  const { data: jessicaProfile, error: jessicaProfileError } = await profileClient
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

  if (jessicaProfileError) {
    console.error("[formations/[slug]] Erreur lors de la récupération du profil de Jessica:", jessicaProfileError);
  }

  if (!jessicaProfile) {
    console.error("[formations/[slug]] Profil de Jessica non trouvé");
    notFound();
  }

  // Vérifier que le course appartient à Jessica
  if (courseDirect && courseDirect.creator_id !== jessicaProfile.id) {
    console.warn("[formations/[slug]] Course creator_id does not match Jessica's profile ID:", {
      courseCreatorId: courseDirect.creator_id,
      jessicaProfileId: jessicaProfile.id,
    });
    notFound();
  }

  // Si courseDirect existe, utiliser son ID, sinon essayer getLearnerContentDetail
  let courseId: string;
  let detail: any = null;

  if (courseDirect) {
    courseId = courseDirect.id;
    console.log("[formations/[slug]] Using courseDirect, courseId:", courseId);
    // Construire un detail minimal depuis courseDirect pour compatibilité avec le reste du code
    // On récupérera le detail complet via getLearnerContentDetail après
  } else {
    console.error("[formations/[slug]] ❌ Course not found directly, trying getLearnerContentDetail...");
    detail = await getLearnerContentDetail("formations", slug);
    console.log("[formations/[slug]] getLearnerContentDetail result:", {
      found: !!detail,
      cardId: detail?.card?.id,
      cardTitle: detail?.card?.title,
    });
    
    if (!detail) {
      console.error("[formations/[slug]] ❌ getLearnerContentDetail also returned null, calling notFound()");
      notFound();
    }
    courseId = detail.card.id;
  }

  // Si on a courseDirect mais pas detail, récupérer detail maintenant (avec courseId connu)
  // Utiliser le slug du course si disponible, sinon l'ID
  if (courseDirect && !detail) {
    const detailSlug = courseDirect.slug || courseId;
    detail = await getLearnerContentDetail("formations", detailSlug);
    if (!detail) {
      // Si getLearnerContentDetail échoue, essayer avec l'ID directement
      detail = await getLearnerContentDetail("formations", courseId);
    }
    if (!detail) {
      // Si getLearnerContentDetail échoue encore, construire un detail minimal depuis courseDirect
      console.warn("[formations/[slug]] getLearnerContentDetail failed, constructing minimal detail from courseDirect");
      detail = {
        card: {
          id: courseDirect.id,
          title: courseDirect.title,
          description: courseDirect.description,
          coverImage: courseDirect.cover_image || courseDirect.hero_image_url || courseDirect.thumbnail_url,
        },
        detail: {
          title: courseDirect.title,
          description: courseDirect.description,
          backgroundImage: courseDirect.hero_image_url || courseDirect.cover_image || courseDirect.thumbnail_url,
          modules: [],
        },
      };
    }
  }
  
  // Utiliser courseDirect si disponible, sinon récupérer le course
  const course = courseDirect || await profileClient
        .from("courses")
    .select("id, creator_id, title")
    .eq("id", courseId)
    .maybeSingle()
    .then(result => result.data);

  console.log("[formations/[slug]] Course lookup:", {
    slug,
    courseId,
    courseFound: !!course,
    courseTitle: course?.title,
    courseCreatorId: course?.creator_id,
    jessicaProfileId: jessicaProfile.id,
    usingCourseDirect: !!courseDirect,
  });

  if (!course) {
    console.error("[formations/[slug]] Course not found for courseId:", courseId);
    notFound();
  }

  if (course.creator_id !== jessicaProfile.id) {
    console.warn("[formations/[slug]] Course creator_id does not match Jessica's profile ID:", {
      courseCreatorId: course.creator_id,
      jessicaProfileId: jessicaProfile.id,
    });
        // Si ce n'est pas une formation de Jessica, rediriger vers la page catalogue normale
        notFound();
      }

  // SÉCURITÉ: Vérifier l'accès de l'utilisateur dans catalog_access
  // Gérer les erreurs d'authentification gracieusement
  let user = null;
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.warn("[formations/[slug]] Erreur d'authentification (non bloquante):", authError.message);
      // Continuer sans utilisateur (accès public si gratuit)
    } else {
      user = authUser;
    }
  } catch (authException) {
    console.warn("[formations/[slug]] Exception lors de l'authentification (non bloquante):", authException);
    // Continuer sans utilisateur (accès public si gratuit)
  }
  
  // Utiliser le service role client pour contourner RLS si nécessaire (déjà créé plus haut)
  const catalogClient = serviceClient || supabase;
  
  // Trouver le catalog_item_id pour ce course (utiliser courseId depuis detail si course n'est pas trouvé)
  const actualCourseId = course?.id || courseId;
  const { data: catalogItem, error: catalogItemError } = await catalogClient
    .from("catalog_items")
    .select("id, is_free, price")
    .eq("content_id", actualCourseId)
    .eq("item_type", "module")
    .maybeSingle();
  
  if (catalogItemError) {
    console.error("[formations/[slug]] Error fetching catalog_item:", catalogItemError);
  }

  console.log("[formations/[slug]] Access check:", {
    courseId: actualCourseId,
    userId: user?.id,
    catalogItemId: catalogItem?.id,
    isFree: catalogItem?.is_free,
    catalogItemExists: !!catalogItem,
    courseFound: !!course,
  });

  // Si le catalog_item n'existe pas, permettre l'accès au créateur uniquement
  // (pour les anciens cours qui n'ont pas encore de catalog_item)
  if (!catalogItem) {
    console.warn("[formations/[slug]] Catalog item not found for course:", actualCourseId);
    // Si on a le course et que l'utilisateur est le créateur, lui donner accès
    if (course && user && course.creator_id === user.id) {
      // Le créateur peut toujours accéder
      console.log("[formations/[slug]] Creator access granted (no catalog_item)");
    } else {
      // Pour les autres utilisateurs, rediriger vers le catalogue
      console.log("[formations/[slug]] No catalog_item and not creator, redirecting to catalogue");
      const { redirect } = await import("next/navigation");
      redirect(`/dashboard/catalogue`);
    }
    // Continuer l'exécution si c'est le créateur
  }
  
  // Déterminer si l'utilisateur a accès (pour afficher le bon bouton)
  // Ne pas rediriger - toujours afficher la page de présentation
  let hasAccess = false;
  if (catalogItem) {
    if (catalogItem.is_free) {
      hasAccess = true;
    } else if (user) {
      const isCreator = course && course.creator_id === user.id;
      const { data: userAccessCheck } = await supabase
        .from("catalog_access")
        .select("access_status")
        .eq("catalog_item_id", catalogItem.id)
        .eq("user_id", user.id)
        .is("organization_id", null)
        .maybeSingle();
      
      const hasExplicitAccess =
        !!userAccessCheck &&
        (userAccessCheck.access_status === "purchased" ||
          userAccessCheck.access_status === "free" ||
          userAccessCheck.access_status === "manually_granted");
      
      hasAccess = isCreator || hasExplicitAccess;
    }
  } else if (course && user && course.creator_id === user.id) {
    // Si pas de catalog_item mais que l'utilisateur est le créateur
    hasAccess = true;
  }
  
  console.log("[formations/[slug]] Final access decision:", {
    hasAccess,
    catalogItemId: catalogItem?.id,
    isFree: catalogItem?.is_free,
    userId: user?.id,
  });

  const { card, detail: info, related = [] } = detail;
  type LessonSummary = { id?: string } & Record<string, unknown>;

  const modules = Array.isArray(info.modules)
    ? (info.modules as Array<{ lessons?: LessonSummary[] }>)
    : ([] as Array<{ lessons?: LessonSummary[] }>);
  const lessons = modules.flatMap((module) => module.lessons ?? []);
  const metaItems = Array.isArray(info.meta) ? (info.meta as string[]) : [];
  const skillItems = Array.isArray(info.skills) ? (info.skills as string[]) : [];
  const objectiveItems = Array.isArray(info.objectives) ? (info.objectives as string[]) : [];
  const firstLesson = lessons[0] as LessonSummary | undefined;
  const catalogContentId =
    (catalogItem as { content_id?: string } | null | undefined)?.content_id ??
    catalogItem?.id ??
    card.id;
  // Utiliser la route formations au lieu de catalog/formations
  const baseHref = `/formations/${slug}`;
  const playHref = firstLesson?.id ? `${baseHref}/play/${firstLesson.id}` : baseHref;

  // Couleurs de branding Jessica Contentin
  const bgColor = "#FFFFFF"; // Blanc
  const surfaceColor = "#F8F5F0"; // Beige clair
  const textColor = "#2F2A25"; // Marron foncé
  const primaryColor = "#C6A664"; // Doré
  const accentColor = "#D4AF37"; // Doré accent

  return (
      <LearningSessionTracker
        contentType="course"
        contentId={card.id}
        showIndicator={false}
      >
        <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
          {/* Hero Section */}
          <section 
            className="relative overflow-hidden rounded-3xl border mx-6 mt-6 mb-8 shadow-lg"
            style={{ 
              borderColor: `${primaryColor}30`,
              backgroundColor: surfaceColor,
            }}
          >
            <div className="absolute inset-0">
              {info.backgroundImage && info.backgroundImage.trim() !== "" ? (
                <Image
                  src={info.backgroundImage}
                  alt={info.title}
                  fill
                  priority
                  className="object-cover opacity-20"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/95" />
            </div>

            <div className="relative z-10 flex flex-col gap-10 px-6 py-12 md:px-12 md:py-16 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-6" style={{ color: textColor }}>
                <span 
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
                  style={{ 
                    backgroundColor: `${primaryColor}20`,
                    color: primaryColor,
                  }}
                >
                  Formation
                </span>
                <div className="space-y-3">
                  <h1 
                    className="text-3xl font-semibold leading-tight md:text-5xl"
                    style={{ color: textColor }}
                  >
                    {info.title}
                  </h1>
                  {info.subtitle ? (
                    <p className="text-sm md:text-base" style={{ color: `${textColor}CC` }}>
                      {info.subtitle}
                    </p>
                  ) : null}
                </div>
                {info.badge ? (
                  <div 
                    className="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]"
                    style={{ 
                      borderColor: `${accentColor}50`,
                      backgroundColor: `${accentColor}15`,
                      color: accentColor,
                    }}
                  >
                    🎖️ {info.badge.label}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm" style={{ color: `${textColor}AA` }}>
                  {metaItems.map((item) => (
                    <span 
                      key={item} 
                      className="rounded-full border px-3 py-1"
                      style={{ 
                        borderColor: `${primaryColor}40`,
                        backgroundColor: `${primaryColor}10`,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                {info.description && (
                  <p className="max-w-2xl text-sm md:text-base" style={{ color: `${textColor}CC` }}>
                    {info.description}
                  </p>
                )}
                {skillItems.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skillItems.map((skill) => (
                      <span 
                        key={skill} 
                        className="rounded-full px-3 py-1 text-xs uppercase tracking-wide"
                        style={{ 
                          backgroundColor: `${primaryColor}20`,
                          color: textColor,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  {hasAccess ? (
                    <Button 
                      asChild 
                      className="rounded-full px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                    >
                      <Link href={playHref}>Accéder au contenu</Link>
                    </Button>
                  ) : catalogItem ? (
                    <ResourcePurchaseSection
                      user={user}
                      hasAccess={hasAccess}
                      catalogItemId={catalogItem.id}
                      contentId={catalogContentId}
                      price={catalogItem.price || 0}
                      title={card.title}
                      contentType="module"
                      isFree={catalogItem.is_free || false}
                      stripeCheckoutUrl={null}
                      primaryColor={primaryColor}
                      textColor={textColor}
                      currentPath={`/formations/${slug}`}
                    />
                  ) : null}
                </div>
              </div>
              <div 
                className="w-full max-w-sm space-y-4 rounded-3xl p-5 lg:max-w-xs"
                style={{ 
                  backgroundColor: `${primaryColor}10`,
                  color: textColor,
                }}
              >
                <p className="text-xs uppercase tracking-[0.35em]" style={{ color: `${textColor}80` }}>
                  En un coup d&apos;œil
                </p>
                <div className="space-y-3 text-sm">
                  <p 
                    className="rounded-2xl border px-4 py-3"
                    style={{ 
                      borderColor: `${primaryColor}30`,
                      backgroundColor: "white",
                    }}
                  >
                    {card.meta ?? "Disponible immédiatement"}
                  </p>
                  {info.objectives && info.objectives.length > 0 && (
                    <p 
                      className="rounded-2xl border px-4 py-3"
                      style={{ 
                        borderColor: `${primaryColor}30`,
                        backgroundColor: "white",
                      }}
                    >
                      {info.objectives[0]}
                    </p>
                  )}
                  {info.badge?.description ? (
                    <p 
                      className="rounded-2xl border px-4 py-3"
                      style={{ 
                        borderColor: `${accentColor}50`,
                        backgroundColor: `${accentColor}15`,
                        color: accentColor,
                      }}
                    >
                      {info.badge.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Objectifs et Structure */}
          <section 
            className="grid gap-8 rounded-3xl border mx-6 mb-8 px-6 py-10 md:grid-cols-[0.9fr_1.1fr] md:px-10"
            style={{ 
              borderColor: `${primaryColor}30`,
              backgroundColor: surfaceColor,
            }}
          >
            <div className="space-y-8">
              {info.objectives && info.objectives.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold" style={{ color: textColor }}>
                    Objectifs pédagogiques
                  </h2>
                  <ul className="space-y-3 text-sm" style={{ color: `${textColor}CC` }}>
                    {objectiveItems.map((objective, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span 
                          className="mt-1 inline-flex h-2 w-2 flex-none rounded-full"
                          style={{ backgroundColor: accentColor }}
                        />
                        <span className="leading-relaxed">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {info.badge ? (
                <div 
                  className="space-y-2 rounded-3xl border p-5"
                  style={{ 
                    borderColor: `${accentColor}50`,
                    backgroundColor: `${accentColor}15`,
                    color: accentColor,
                  }}
                >
                  <span className="text-xs uppercase tracking-[0.32em]" style={{ color: `${accentColor}CC` }}>
                    Badge à obtenir
                  </span>
                  <p className="text-lg font-semibold">{info.badge.label}</p>
                  {info.badge.description ? (
                    <p className="text-sm" style={{ color: `${accentColor}CC` }}>
                      {info.badge.description}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {info.skills && info.skills.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold" style={{ color: textColor }}>
                    Compétences développées
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillItems.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide"
                        style={{ 
                          borderColor: `${primaryColor}40`,
                          backgroundColor: `${primaryColor}10`,
                          color: textColor,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div 
              className="space-y-6 rounded-3xl border p-6"
              style={{ 
                borderColor: `${primaryColor}30`,
                backgroundColor: "white",
              }}
            >
              <h2 className="text-lg font-semibold" style={{ color: textColor }}>
                Structure du programme
              </h2>
              {info.backgroundImage ? (
                <Image
                  src={info.backgroundImage}
                  alt={`${info.title} thumbnail`}
                  width={640}
                  height={360}
                  className="h-52 w-full rounded-2xl object-cover"
                />
              ) : null}
              <ul className="space-y-4 text-sm" style={{ color: `${textColor}CC` }}>
                {info.modules.map((module: any) => (
                  <li 
                    key={module.id} 
                    className="flex items-start justify-between gap-4 rounded-2xl px-4 py-3"
                    style={{ backgroundColor: surfaceColor }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: textColor }}>
                        {module.title}
                      </p>
                      {module.description ? (
                        <p className="text-xs" style={{ color: `${textColor}80` }}>
                          {module.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-xs uppercase tracking-wide" style={{ color: `${textColor}80` }}>
                      {module.length}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Sommaire détaillé */}
          <section 
            className="space-y-4 rounded-3xl border mx-6 mb-8 p-6"
            style={{ 
              borderColor: `${primaryColor}30`,
              backgroundColor: surfaceColor,
            }}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-semibold" style={{ color: textColor }}>
                Sommaire détaillé
              </h2>
              <p className="text-sm" style={{ color: `${textColor}80` }}>
                Déployez chaque module pour accéder aux ressources et lancer une leçon.
              </p>
            </div>
            <div className="space-y-3">
              {info.modules.map((module: any) => (
                <details
                  key={module.id}
                  className="group rounded-2xl border p-4 transition"
                  style={{ 
                    borderColor: `${primaryColor}30`,
                    backgroundColor: "white",
                  }}
                  open={module === info.modules[0]}
                >
                  <summary 
                    className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold"
                    style={{ color: textColor }}
                  >
                    <span>{module.title}</span>
                    <span className="text-xs uppercase tracking-wide" style={{ color: `${textColor}80` }}>
                      {module.length}
                    </span>
                  </summary>
                  {module.description ? (
                    <p className="mt-3 text-sm" style={{ color: `${textColor}CC` }}>
                      {module.description}
                    </p>
                  ) : null}
                  {module.lessons?.length ? (
                    <ul className="mt-4 space-y-2 text-sm" style={{ color: `${textColor}CC` }}>
                      {module.lessons.map((lesson: any) => {
                        const lessonHref = `${baseHref}/play/${lesson.id}`;
                        return (
                          <li 
                            key={lesson.id} 
                            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                            style={{ backgroundColor: surfaceColor }}
                          >
                            <div className="flex flex-col">
                              <Link 
                                href={lessonHref} 
                                className="font-medium transition hover:opacity-80"
                                style={{ color: primaryColor }}
                              >
                                {lesson.title}
                              </Link>
                              {lesson.description ? (
                                <span className="text-xs" style={{ color: `${textColor}80` }}>
                                  {lesson.description}
                                </span>
                              ) : null}
                            </div>
                            <span className="text-xs uppercase tracking-wide" style={{ color: `${textColor}80` }}>
                              {lesson.duration}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </details>
              ))}
            </div>
          </section>
        </div>
      </LearningSessionTracker>
  );
}

