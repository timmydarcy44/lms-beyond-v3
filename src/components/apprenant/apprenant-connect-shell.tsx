"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, LifeBuoy, LogOut, Menu, Sparkles, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import { buildApprenantNavItems } from "@/lib/apprenant/connect-nav";
import {
  getConnectShellTheme,
  type ApprenantConnectVariant,
} from "@/lib/apprenant/connect-theme";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";
import {
  buildPublicProfileUrl,
  slugifyPublicProfile,
} from "@/lib/apprenant/public-profile-url";
import { ApprenantProfileEditModal } from "@/components/apprenant/apprenant-profile-edit-modal";
import { ObjectiveDetailStepModal } from "@/components/apprenant/objective-detail-step-modal";
import { ConnectCockpitBackdrop } from "@/components/apprenant/connect-cockpit-backdrop";
import { ApprenantShellProvider } from "@/components/apprenant/apprenant-shell-context";
import { LearnerSnapshotProvider } from "@/components/learner/learner-snapshot-provider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type ProfileSnippet = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  telephone?: string | null;
  birth_date?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  school_id?: string | null;
  school_class?: string | null;
  entreprise_id?: string | null;
  company_id?: string | null;
  type_profil?: string | null;
  role?: string | null;
  role_type?: string | null;
};

export function ApprenantConnectShell({
  children,
  variant = "edge",
}: {
  children: ReactNode;
  variant?: ApprenantConnectVariant;
}) {
  const theme = getConnectShellTheme(variant);
  const supabase = createSupabaseBrowserClient();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openedPostDiscProfileRef = useRef(false);
  const { isDyslexiaMode, toggleDyslexiaMode } = useDyslexiaMode();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileSnippet | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authMeta, setAuthMeta] = useState<Record<string, unknown>>({});
  const [hasOrganisation, setHasOrganisation] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [objectiveModalOpen, setObjectiveModalOpen] = useState(false);
  const [isParticulier, setIsParticulier] = useState(false);
  const [snippetVersion, setSnippetVersion] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (userData?.user?.email) setAuthEmail(userData.user.email);
    if (userData?.user?.user_metadata) {
      setAuthMeta(userData.user.user_metadata as Record<string, unknown>);
    }
    if (!uid) return;
    const { data } = await supabase
      .from("profiles")
      .select(
        "first_name, last_name, email, phone, telephone, birth_date, city, avatar_url, school_id, school_class, entreprise_id, company_id, type_profil, role, role_type",
      )
      .eq("id", uid)
      .maybeSingle();
    setProfile((data as ProfileSnippet) ?? null);

    const role = String((data as ProfileSnippet | null)?.role ?? "").toUpperCase();
    const roleType = String((data as ProfileSnippet | null)?.role_type ?? "").toLowerCase();
    const metaRoleType = String(userData.user?.user_metadata?.role_type ?? "").toLowerCase();
    setIsParticulier(
      role === "PARTICULIER" || roleType === "particulier" || metaRoleType === "particulier",
    );

    const metaOrg =
      (typeof userData.user?.user_metadata?.company_id === "string" &&
        userData.user.user_metadata.company_id) ||
      (typeof userData.user?.user_metadata?.organization_id === "string" &&
        userData.user.user_metadata.organization_id) ||
      null;

    const localOrg = Boolean(
      (data as ProfileSnippet | null)?.school_id ||
        (data as ProfileSnippet | null)?.entreprise_id ||
        (data as ProfileSnippet | null)?.company_id ||
        metaOrg,
    );
    setHasOrganisation(localOrg);

    try {
      const res = await fetch("/api/dashboard/apprenant/org-context");
      if (res.ok) {
        const payload = (await res.json()) as { has_organisation?: boolean };
        if (payload.has_organisation) setHasOrganisation(true);
      }
    } catch {
      // ignore
    }
  }, [supabase]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile, snippetVersion]);

  useEffect(() => {
    if (openedPostDiscProfileRef.current) return;
    if (searchParams.get("disc") !== "done") return;
    openedPostDiscProfileRef.current = true;
    const timer = window.setTimeout(() => {
      setEditOpen(true);
      router.replace("/dashboard/apprenant/profil", { scroll: false });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [router, searchParams]);

  const navItems = useMemo(
    () => buildApprenantNavItems(hasOrganisation, variant, isParticulier),
    [hasOrganisation, isParticulier, variant],
  );

  const handleProfileSaved = useCallback(() => {
    setSnippetVersion((v) => v + 1);
    if (isParticulier && openedPostDiscProfileRef.current) {
      openedPostDiscProfileRef.current = false;
      setObjectiveModalOpen(true);
    }
  }, [isParticulier]);

  const handleObjectiveSaved = useCallback(() => {
    setObjectiveModalOpen(false);
    setSnippetVersion((v) => v + 1);
    router.push("/dashboard/apprenant/profil-comportemental");
  }, [router]);

  const firstName = resolveLearnerDisplayFirstName({
    profileFirstName: profile?.first_name,
    metadataFirstName:
      typeof authMeta.first_name === "string" ? authMeta.first_name : undefined,
    metadataPrenom: typeof authMeta.prenom === "string" ? authMeta.prenom : undefined,
    email: authEmail ?? profile?.email,
  });

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = theme.signOutHref;
  };

  const scrollToProfilOrHome = useCallback(() => {
    router.push("/dashboard/apprenant/profil");
  }, [router]);

  const handleShareProfile = useCallback(async () => {
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return;

    const first = String(profile?.first_name ?? "").trim();
    const last = String(profile?.last_name ?? "").trim();
    const email = String(profile?.email ?? userData.user.email ?? "").trim();
    const emailPrefix = email.split("@")[0] ?? "";
    const slugBase = `${first} ${last}`.trim() || emailPrefix || uid;
    const publicSlug = slugifyPublicProfile(slugBase);

    try {
      await supabase
        .from("user_profile_settings")
        .upsert({ user_id: uid, public_slug: publicSlug }, { onConflict: "user_id" });
    } catch {
      // ignore
    }

    const shareUrl = buildPublicProfileUrl(publicSlug, uid);
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // ignore
    }
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 4500);
  }, [profile?.email, profile?.first_name, profile?.last_name, supabase]);

  const shellContext = useMemo(
    () => ({
      openEditProfile: () => setEditOpen(true),
      sharePublicProfile: () => void handleShareProfile(),
      variant,
    }),
    [handleShareProfile, variant],
  );

  const openEditProfile = shellContext.openEditProfile;

  const isAssessmentImmersive = Boolean(
    pathname?.includes("/dashboard/apprenant/disc/test") ||
      pathname?.includes("/dashboard/apprenant/idmc/test") ||
      pathname?.includes("/dashboard/apprenant/idmc-intro") ||
      pathname?.includes("/dashboard/apprenant/soft-skills-intro") ||
      pathname?.includes("/dashboard/apprenant/test-comportemental-intro") ||
      pathname?.includes("/soft-skills/test") ||
      pathname?.includes("/soft-skills/resultats"),
  );
  const isDiscImmersive = isAssessmentImmersive;
  const isOpenBadgeImmersive = Boolean(pathname?.includes("/dashboard/apprenant/open-badges"));
  const isImmersiveRoute = isOpenBadgeImmersive || isDiscImmersive;
  const isHomeRoute = pathname === "/dashboard/apprenant";
  const showMobileBack = Boolean(pathname) && !isHomeRoute;

  const activeNavLabel = useMemo(() => {
    if (!pathname) return "";
    const exact = navItems.find((item) => item.href === pathname);
    if (exact) return exact.label;
    const nested = [...navItems]
      .filter((item) => !item.href.startsWith("#") && pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return nested?.label ?? "";
  }, [navItems, pathname]);

  const handleBack = useCallback(() => {
    try {
      router.back();
    } catch {
      router.push("/dashboard/apprenant");
    }
  }, [router]);

  const handleNavigateMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  if (isImmersiveRoute) {
    return (
      <LearnerSnapshotProvider>
        <ApprenantShellProvider value={shellContext}>
        <div
          data-connect-shell={isDiscImmersive ? "disc-immersive" : "open-badge-immersive"}
          className={`min-h-screen ${isDiscImmersive ? "bg-white text-[#0a0a0a]" : "bg-[#030303] text-white"}`}
        >
          {children}
        </div>
        <ApprenantProfileEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          initialProfile={profile}
          refreshToken={snippetVersion}
          onSaved={handleProfileSaved}
        />
        <ObjectiveDetailStepModal
          open={objectiveModalOpen}
          typeProfil={profile?.type_profil ?? (authMeta.type_profil as string)}
          onSaved={handleObjectiveSaved}
          onClose={() => setObjectiveModalOpen(false)}
        />
        </ApprenantShellProvider>
      </LearnerSnapshotProvider>
    );
  }

  return (
    <LearnerSnapshotProvider>
      <ApprenantShellProvider value={shellContext}>
      <div data-connect-shell={theme.shellAttr} className={theme.rootClass}>
        {theme.showBackdrop ? <ConnectCockpitBackdrop /> : null}
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
        `}</style>
        <div className="relative z-10 flex h-screen overflow-hidden font-['Inter']">
          <aside
            data-connect-sidebar
            className={`${theme.sidebarClass} ${
              isSidebarCollapsed ? "w-[76px]" : "w-[240px]"
            }`}
          >
            <div className={`flex h-[52px] shrink-0 items-center px-2.5 ${theme.sidebarHeaderBorder}`}>
              {!isSidebarCollapsed ? (
                <div className="min-w-0 flex-1 leading-tight">
                  <div
                    className={`text-[11px] font-semibold tracking-[0.18em] ${
                      variant === "jessica" ? "text-[#2F2A25]" : "text-white"
                    }`}
                  >
                    {theme.brandTitle}
                  </div>
                  <p
                    className={`text-[9px] tracking-[0.1em] ${
                      variant === "jessica" ? "text-[#8B4513]/55" : "text-white/20"
                    }`}
                  >
                    {theme.brandSubtitle}
                  </p>
                </div>
              ) : (
                <div className={theme.brandCollapsedClass}>{theme.brandCollapsedLetter}</div>
              )}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className={theme.collapseBtnClass}
                aria-label={isSidebarCollapsed ? "Développer le menu" : "Réduire le menu"}
              >
                {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>

            <nav
              className={`min-h-0 flex-1 overflow-y-auto py-2 ${
                isSidebarCollapsed ? "px-1.5" : "px-2"
              } [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent]`}
            >
              <div className="space-y-0.5">
                {navItems.map((item) => {
                  const isParcoursGalaxy = item.label === "Parcours" || item.label === "Mes parcours";
                  const isMonAccompagnementEntry = item.label === "Mon accompagnement";
                  const isParcoursGuide = item.label === "Parcours guidé";
                  const isShareProfile = item.action === "share-profile";
                  const longerMatchExists = Boolean(
                    pathname &&
                      navItems.some(
                        (other) =>
                          other.href !== item.href &&
                          other.href.length > item.href.length &&
                          (pathname === other.href || pathname.startsWith(`${other.href}/`)),
                      ),
                  );
                  const active =
                    !isShareProfile &&
                    !longerMatchExists &&
                    (pathname === item.href ||
                      pathname?.startsWith(`${item.href}/`) ||
                      (isParcoursGalaxy && Boolean(pathname?.startsWith("/g/edgelab"))) ||
                      (isMonAccompagnementEntry &&
                        Boolean(
                          pathname?.startsWith("/dashboard/apprenant/coaching") ||
                            pathname?.startsWith("/dashboard/accompagnement"),
                        )) ||
                      (isParcoursGuide && Boolean(pathname?.includes("/parcours-guide"))));
                  const itemClass = `group relative flex w-full items-center rounded-xl text-[13px] font-medium transition ${
                    isSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                  } ${
                    active
                      ? isSidebarCollapsed
                        ? "bg-[rgba(37,99,235,0.15)] text-white ring-1 ring-[rgba(37,99,235,0.25)]"
                        : "bg-[rgba(37,99,235,0.15)] text-white"
                      : "text-white/45 hover:bg-white/[0.04] hover:text-white"
                  }`;

                  if (isShareProfile) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        title={isSidebarCollapsed ? item.label : undefined}
                        onClick={() => void handleShareProfile()}
                        className={itemClass}
                      >
                        <item.icon className={`h-[18px] w-[18px] shrink-0 ${theme.navIconInactive}`} />
                        <span className={`truncate ${isSidebarCollapsed ? "sr-only" : ""}`}>{item.label}</span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.label + item.href}
                      href={item.href}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={itemClass}
                    >
                      <item.icon
                        className={`h-[18px] w-[18px] shrink-0 ${
                          active ? theme.navIconActive : theme.navIconInactive
                        }`}
                      />
                      <span className={`truncate ${isSidebarCollapsed ? "sr-only" : ""}`}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className={theme.sidebarFooterClass}>
              {!isSidebarCollapsed ? (
                <div
                  className={`rounded-xl border p-2 backdrop-blur-sm ${
                    variant === "jessica"
                      ? "border-[#D2B48C]/40 bg-white/60"
                      : "border-white/[0.08] bg-white/[0.04]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={scrollToProfilOrHome}
                    className={`flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition ${
                      variant === "jessica" ? "hover:bg-[#C6A664]/10" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className={`h-9 w-9 shrink-0 overflow-hidden rounded-full border p-[2px] ${theme.profileBorder}`}>
                      <div className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full ${theme.profileAvatarBg}`}>
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className={theme.profileInitialClass}>
                            {(firstName || "?").slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={theme.profileNameClass}>{firstName}</div>
                      <div className={theme.profileRoleClass}>Apprenant</div>
                    </div>
                  </button>
                  <button type="button" onClick={() => setEditOpen(true)} className={theme.profileEditBtnClass}>
                    Modifier mon profil
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    title="Synthèse profil"
                    onClick={scrollToProfilOrHome}
                    className={theme.profileCollapsedBtnClass}
                  >
                    {(firstName || "?").slice(0, 1).toUpperCase()}
                  </button>
                  <button
                    type="button"
                    title="Modifier mon profil"
                    onClick={() => setEditOpen(true)}
                    className={`mx-auto rounded-full border px-2 py-1.5 text-[10px] font-medium ${
                      variant === "jessica"
                        ? "border-[#C6A664]/40 text-[#8B4513]"
                        : "border-white/20 text-white/70"
                    }`}
                  >
                    Éditer
                  </button>
                </div>
              )}
              {variant === "edge" ? (
                <>
                  <Link
                    href="/dashboard/apprenant?premiers-pas=1"
                    title="Premiers pas EDGE"
                    className={`${theme.helpLinkClass} ${isSidebarCollapsed ? "px-0" : "px-2"}`}
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#8BB4FF]/80" />
                    {!isSidebarCollapsed ? <span>Premiers pas</span> : null}
                  </Link>
                  <Link
                    href="/dashboard/ressources"
                    title="Aide & ressources"
                    className={`${theme.helpLinkClass} ${isSidebarCollapsed ? "px-0" : "px-2"}`}
                  >
                    <LifeBuoy className="h-3.5 w-3.5 shrink-0 text-white/45" />
                    {!isSidebarCollapsed ? <span>Aide & ressources</span> : null}
                  </Link>
                </>
              ) : (
                <Link
                  href="/jessica-contentin/parcours-guide"
                  title="Parcours guidé"
                  className={`${theme.helpLinkClass} ${isSidebarCollapsed ? "px-0" : "px-2"}`}
                >
                  <LifeBuoy className="h-3.5 w-3.5 shrink-0 text-[#A0522D]/60" />
                  {!isSidebarCollapsed ? <span>Parcours guidé</span> : null}
                </Link>
              )}
              <button
                type="button"
                onClick={toggleDyslexiaMode}
                title={isDyslexiaMode ? "Désactiver la neuro-adaptation" : "Neuro adaptation"}
                className={`${theme.neuroBtnClass} ${isSidebarCollapsed ? "px-0" : "px-2"}`}
                data-neuro-cta
              >
                {!isSidebarCollapsed ? (
                  isDyslexiaMode ? (
                    "Neuro : désactiver"
                  ) : (
                    "Neuro adaptation"
                  )
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-edge-red" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className={`${theme.logoutBtnClass} ${isSidebarCollapsed ? "px-0" : ""}`}
                data-neuro-logout
                title="Se déconnecter"
              >
                {isSidebarCollapsed ? <LogOut className="h-3.5 w-3.5" /> : "Se déconnecter"}
              </button>
            </div>
          </aside>

          <main data-connect-main className={theme.mainClass}>
            {/* Mobile header: burger + back */}
            <div className={theme.mobileHeaderClass}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                      <button
                        type="button"
                        className={theme.mobileMenuBtnClass}
                        aria-label="Ouvrir le menu"
                      >
                        <Menu className="h-5 w-5" />
                      </button>
                    </SheetTrigger>
                    <SheetContent side="left" className={theme.mobileSheetClass}>
                      <SheetHeader className={`flex flex-row items-center justify-between pb-4 text-left ${variant === "jessica" ? "border-b border-[#D2B48C]/40" : "border-b border-white/10"}`}>
                        <SheetTitle className={variant === "jessica" ? "text-[#2F2A25]" : "text-white"}>
                          Navigation
                        </SheetTitle>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-slate-400"
                          onClick={() => setMobileOpen(false)}
                          aria-label="Fermer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </SheetHeader>

                      <div className="mt-4 space-y-1 pb-6">
                        {navItems.map((item) => {
                          const isShareProfile = item.action === "share-profile";
                          const longerMatchExists = Boolean(
                            pathname &&
                              navItems.some(
                                (other) =>
                                  other.href !== item.href &&
                                  other.href.length > item.href.length &&
                                  (pathname === other.href || pathname.startsWith(`${other.href}/`)),
                              ),
                          );
                          const active =
                            !isShareProfile &&
                            !longerMatchExists &&
                            (pathname === item.href || pathname?.startsWith(`${item.href}/`));
                          const itemClass = `group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${
                            active ? theme.mobileNavActive : theme.mobileNavInactive
                          }`;

                          if (isShareProfile) {
                            return (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => {
                                  handleNavigateMobile();
                                  void handleShareProfile();
                                }}
                                className={itemClass}
                              >
                                <item.icon className={`h-[18px] w-[18px] shrink-0 ${theme.mobileNavIconInactive}`} />
                                <span className="truncate">{item.label}</span>
                              </button>
                            );
                          }

                          return (
                            <Link
                              key={item.label + item.href}
                              href={item.href}
                              onClick={handleNavigateMobile}
                              className={itemClass}
                            >
                              <item.icon
                                className={`h-[18px] w-[18px] shrink-0 ${
                                  active ? theme.mobileNavIconActive : theme.mobileNavIconInactive
                                }`}
                              />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>

                      <div className={`mt-auto space-y-2 border-t pt-4 ${variant === "jessica" ? "border-[#D2B48C]/40" : "border-white/10"}`}>
                        <button
                          type="button"
                          onClick={() => {
                            handleNavigateMobile();
                            toggleDyslexiaMode();
                          }}
                          className="flex w-full items-center justify-between rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm text-black/70"
                        >
                          <span>{isDyslexiaMode ? "Neuro : désactiver" : "Neuro adaptation"}</span>
                          <Sparkles className="h-4 w-4 text-edge-red" aria-hidden />{" "}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleNavigateMobile();
                            void handleSignOut();
                          }}
                          className="flex w-full items-center justify-between rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm text-black/60"
                        >
                          <span>Se déconnecter</span>
                          <LogOut className="h-4 w-4 text-black/40" />
                        </button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {showMobileBack ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-black/70"
                      aria-label="Retour"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className={theme.mobileTitleClass}>
                    {activeNavLabel || theme.mobileBrandFallback}
                  </div>
                </div>

                <div className="w-[88px]" />
              </div>
            </div>

            <div className="relative z-10 px-5 py-6 sm:px-8 lg:pl-8 lg:pr-10 lg:py-8">{children}</div>
          </main>
        </div>

        <ApprenantProfileEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          initialProfile={profile}
          refreshToken={snippetVersion}
          onSaved={handleProfileSaved}
        />

        <ObjectiveDetailStepModal
          open={objectiveModalOpen}
          typeProfil={profile?.type_profil ?? (authMeta.type_profil as string)}
          onSaved={handleObjectiveSaved}
          onClose={() => setObjectiveModalOpen(false)}
        />

        {shareCopied ? (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4"
            role="status"
            aria-live="polite"
          >
            <div className={theme.shareToastClass}>
              <p className={`text-lg font-semibold ${variant === "jessica" ? "text-[#2F2A25]" : "text-white"}`}>
                Lien copié !
              </p>
              <p className={`mt-2 text-sm ${variant === "jessica" ? "text-[#8B4513]/75" : "text-slate-400"}`}>
                Votre page publique est prête à être partagée (profil & wallet).
              </p>
              <button type="button" onClick={() => setShareCopied(false)} className={theme.shareToastBtnClass}>
                OK
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </ApprenantShellProvider>
    </LearnerSnapshotProvider>
  );
}
