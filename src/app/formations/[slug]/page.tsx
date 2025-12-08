import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getLearnerContentDetail } from "@/lib/queries/apprenant";
import { LearningSessionTracker } from "@/components/learning-session-tracker";
import { Button } from "@/components/ui/button";
import { getServerClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

interface FormationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function FormationDetailPage({ params }: FormationDetailPageProps) {
  const { slug } = await params;

  // Récupérer les détails de la formation
  const detail = await getLearnerContentDetail("formations", slug);
  if (!detail) {
    notFound();
  }

  // Vérifier que c'est bien une formation de Jessica Contentin
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  // Récupérer l'ID de Jessica Contentin
  const { data: jessicaProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();

  if (!jessicaProfile) {
    notFound();
  }

  // Récupérer le course et vérifier le creator_id
  const { data: course } = await supabase
    .from("courses")
    .select("id, creator_id")
    .eq("id", slug)
    .maybeSingle();

  if (!course || course.creator_id !== jessicaProfile.id) {
    // Si ce n'est pas une formation de Jessica, rediriger vers la page catalogue normale
    notFound();
  }

  // SÉCURITÉ: Vérifier l'accès de l'utilisateur dans catalog_access
  const { data: { user } } = await supabase.auth.getUser();
  
  // Utiliser le service role client pour contourner RLS si nécessaire
  const { getServiceRoleClient } = await import("@/lib/supabase/server");
  const serviceClient = getServiceRoleClient();
  const catalogClient = serviceClient || supabase;
  
  // Trouver le catalog_item_id pour ce course
  const { data: catalogItem, error: catalogItemError } = await catalogClient
    .from("catalog_items")
    .select("id, is_free, price")
    .eq("content_id", course.id)
    .eq("item_type", "module")
    .maybeSingle();
  
  if (catalogItemError) {
    console.error("[formations/[slug]] Error fetching catalog_item:", catalogItemError);
  }

  console.log("[formations/[slug]] Access check:", {
    courseId: course.id,
    userId: user?.id,
    catalogItemId: catalogItem?.id,
    isFree: catalogItem?.is_free,
    catalogItemExists: !!catalogItem,
  });

  // Si le catalog_item n'existe pas, permettre l'accès au créateur uniquement
  // (pour les anciens cours qui n'ont pas encore de catalog_item)
  if (!catalogItem) {
    console.warn("[formations/[slug]] Catalog item not found for course:", course.id);
    if (user && course.creator_id === user.id) {
      // Le créateur peut toujours accéder
      console.log("[formations/[slug]] Creator access granted (no catalog_item)");
    } else {
      // Pour les autres utilisateurs, rediriger vers le catalogue
      console.log("[formations/[slug]] No catalog_item and not creator, redirecting to catalogue");
      const { redirect } = await import("next/navigation");
      redirect(`/dashboard/catalogue`);
    }
    // Continuer l'exécution si c'est le créateur
  } else if (user) {
    // Vérifier si l'utilisateur est le créateur
    const isCreator = course.creator_id === user.id;
    
    // Vérifier l'accès dans catalog_access
    const { data: userAccess } = await supabase
      .from("catalog_access")
      .select("access_status")
      .eq("catalog_item_id", catalogItem.id)
      .eq("user_id", user.id)
      .is("organization_id", null)
      .maybeSingle();

    const hasExplicitAccess = userAccess && (
      userAccess.access_status === "purchased" ||
      userAccess.access_status === "free" ||
      userAccess.access_status === "manually_granted"
    );

    const hasAccess = isCreator || hasExplicitAccess || catalogItem.is_free;

    console.log("[formations/[slug]] Access decision:", {
      isCreator,
      hasExplicitAccess,
      isFree: catalogItem.is_free,
      hasAccess,
      accessStatus: userAccess?.access_status,
    });

    if (!hasAccess) {
      // Rediriger vers la page de paiement
      console.log("[formations/[slug]] No access, redirecting to payment:", `/dashboard/catalogue/module/${catalogItem.id}/payment`);
      const { redirect } = await import("next/navigation");
      redirect(`/dashboard/catalogue/module/${catalogItem.id}/payment`);
    }
  } else if (!user && !catalogItem.is_free) {
    // Si l'utilisateur n'est pas connecté et le module n'est pas gratuit, rediriger vers la page de paiement
    console.log("[formations/[slug]] User not logged in, redirecting to payment:", `/dashboard/catalogue/module/${catalogItem.id}/payment`);
    const { redirect } = await import("next/navigation");
    redirect(`/dashboard/catalogue/module/${catalogItem.id}/payment`);
  }

  const { card, detail: info, related = [] } = detail;
  const lessons = info.modules.flatMap((module) => module.lessons ?? []);
  const firstLesson = lessons[0];
  // Utiliser la route formations au lieu de catalog/formations
  const baseHref = `/formations/${slug}`;
  const playHref = firstLesson ? `${baseHref}/play/${firstLesson.id}` : baseHref;

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
                  {info.meta.map((item) => (
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
                {info.skills && info.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {info.skills.map((skill) => (
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
                  <Button 
                    asChild 
                    className="rounded-full px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl"
                    style={{
                      backgroundColor: primaryColor,
                    }}
                  >
                    <Link href={playHref}>Accéder au contenu</Link>
                  </Button>
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
                    {info.objectives.map((objective, idx) => (
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
                    {info.skills.map((skill, idx) => (
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

