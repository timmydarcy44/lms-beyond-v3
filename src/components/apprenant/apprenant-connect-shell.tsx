"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bell, ChevronLeft, ChevronRight, LifeBuoy, LogOut, Menu, Sparkles, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import { buildApprenantNavItems } from "@/lib/apprenant/connect-nav";
import {
  getConnectShellTheme,
  type ApprenantConnectVariant,
} from "@/lib/apprenant/connect-theme";
import {
  buildUnifiedLearnerNav,
  flattenUnifiedNav,
  isUnifiedNavItemActive,
  type UnifiedNavGroup,
} from "@/lib/apprenant/unified-nav";
import type { LearnerSituation } from "@/lib/apprenant/learner-situation";
import { edgePerfMark } from "@/lib/edge/perf-marks";
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
import { ProfilEdgeHubProvider } from "@/components/apprenant/profil-edge/profil-edge-hub-provider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { OrgSidebarBrand } from "@/components/enterprise/org-sidebar-brand";

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
  const [orgBranding, setOrgBranding] = useState<{ logoUrl: string | null; name: string | null }>({
    logoUrl: null,
    name: null,
  });
  const useUnifiedNav = variant === "edge";
  const [situation, setSituation] = useState<LearnerSituation>("learner");
  const [showAlternanceNav, setShowAlternanceNav] = useState(false);
  const [profileMissingCount, setProfileMissingCount] = useState(0);
  const carePathActive = Boolean(pathname?.startsWith("/dashboard/apprenant/care"));

  useEffect(() => {
    if (variant === "jessica") return;
    let cancelled = false;
    fetch("/api/organizations/nav-branding", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const b = json?.branding;
        setOrgBranding({
          logoUrl: typeof b?.logoUrl === "string" && b.logoUrl.trim() ? b.logoUrl.trim() : null,
          name: typeof b?.name === "string" && b.name.trim() ? b.name.trim() : null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [variant]);

  const loadProfile = useCallback(async () => {
    if (!supabase) return;
    edgePerfMark("shell-profile-start");
    const { data: userData } = await supabase.auth.getUser();
    edgePerfMark("shell-getUser-done");
    const uid = userData?.user?.id;
    if (userData?.user?.email) setAuthEmail(userData.user.email);
    if (userData?.user?.user_metadata) {
      setAuthMeta(userData.user.user_metadata as Record<string, unknown>);
    }
    if (!uid) return;

    // Preview BtoC : afficher le profil du client, pas celui du staff.
    try {
      const previewRes = await fetch("/api/super/learner-preview");
      if (previewRes.ok) {
        const previewJson = (await previewRes.json()) as {
          active?: boolean;
          firstName?: string | null;
          lastName?: string | null;
          email?: string | null;
          avatarUrl?: string | null;
        };
        if (previewJson.active) {
          setProfile({
            first_name: previewJson.firstName ?? null,
            last_name: previewJson.lastName ?? null,
            email: previewJson.email ?? null,
            avatar_url: previewJson.avatarUrl ?? null,
            role: "learner",
            role_type: "particulier",
          });
          setIsParticulier(true);
          if (previewJson.email) setAuthEmail(previewJson.email);
          // Invalide le snapshot partagé (sinon DISC/parcours du staff).
          try {
            const { invalidateLearnerSnapshotProviderCache } = await import(
              "@/components/learner/learner-snapshot-provider"
            );
            invalidateLearnerSnapshotProviderCache();
          } catch {
            /* ignore */
          }
          edgePerfMark("shell-profiles-done");
          return;
        }
      }
    } catch {
      /* ignore — fallback profil session */
    }

    const { data } = await supabase
      .from("profiles")
      .select(
        "first_name, last_name, email, phone, telephone, birth_date, city, avatar_url, school_id, school_class, entreprise_id, company_id, type_profil, role, role_type",
      )
      .eq("id", uid)
      .maybeSingle();
    edgePerfMark("shell-profiles-done");
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

  useEffect(() => {
    if (!useUnifiedNav) return;
    let cancelled = false;
    fetch("/api/dashboard/apprenant/situation", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !json?.situation) return;
        setSituation(json.situation as LearnerSituation);
        setShowAlternanceNav(Boolean(json.showAlternanceNav));
      })
      .catch(() => {});
    fetch("/api/dashboard/apprenant/home-v2", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !json?.profile) return;
        const missing = Math.max(0, Number(json.profile.total) - Number(json.profile.filled));
        setProfileMissingCount(missing);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [useUnifiedNav, snippetVersion]);

  const unifiedGroups: UnifiedNavGroup[] = useMemo(() => {
    if (!useUnifiedNav) return [];
    return buildUnifiedLearnerNav({
      situation,
      showAlternanceNav,
      profileMissingCount,
    });
  }, [useUnifiedNav, situation, showAlternanceNav, profileMissingCount]);

  const navItems = useMemo(() => {
    if (useUnifiedNav) return flattenUnifiedNav(unifiedGroups);
    return buildApprenantNavItems(hasOrganisation, variant, isParticulier);
  }, [unifiedGroups, hasOrganisation, isParticulier, useUnifiedNav, variant]);

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
          className={`min-h-screen ${
            isDiscImmersive
              ? "bg-white text-[#0a0a0a]"
              : "bg-[#07090f] text-white [background-image:radial-gradient(ellipse_120%_70%_at_0%_-10%,rgba(37,99,235,0.22),transparent_50%),radial-gradient(ellipse_90%_60%_at_100%_0%,rgba(124,58,237,0.14),transparent_45%),linear-gradient(180deg,#0b1220_0%,#07090f_40%,#05060a_100%)]"
          }`}
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

  const hubWrap = (node: ReactNode) =>
    useUnifiedNav ? <ProfilEdgeHubProvider>{node}</ProfilEdgeHubProvider> : node;

  return (
    <LearnerSnapshotProvider>
      <ApprenantShellProvider value={shellContext}>
      {hubWrap(
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
            <div
              className={`flex shrink-0 items-center px-2.5 ${theme.sidebarHeaderBorder} ${
                orgBranding.logoUrl && variant !== "jessica"
                  ? isSidebarCollapsed
                    ? "h-auto flex-col gap-2 py-3"
                    : "h-auto flex-col gap-2 py-4"
                  : variant === "edge" && !isSidebarCollapsed
                    ? "h-auto min-h-[64px] py-3"
                    : "h-[52px]"
              }`}
            >
              {orgBranding.logoUrl && variant !== "jessica" && (!carePathActive) ? (
                <div className="w-full">
                  <OrgSidebarBrand
                    logoUrl={orgBranding.logoUrl}
                    name={orgBranding.name || theme.brandTitle}
                    compact={isSidebarCollapsed}
                  />
                </div>
              ) : !isSidebarCollapsed ? (
                <div className="min-w-0 flex-1 leading-tight">
                  {carePathActive ? (
                    <div className="min-w-0">
                      <div className="text-[15px] font-extrabold leading-tight tracking-[-0.02em] text-white">
                        Byound <span className="text-[#FF5C8A]">Care</span>
                      </div>
                      <p className="mt-1 text-[9px] text-white/20">{theme.brandSubtitle}</p>
                    </div>
                  ) : variant === "edge" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Byound/Logo_byound_blanc_sans_fond.png"
                      alt="Byound"
                      className="h-10 w-auto"
                    />
                  ) : (
                    <div
                      className={`text-[11px] font-semibold tracking-[0.18em] ${
                        variant === "jessica" ? "text-[#2F2A25]" : "text-white"
                      }`}
                    >
                      {theme.brandTitle}
                    </div>
                  )}
                  {(!carePathActive) ? (
                    <p
                      className={`mt-1 text-[9px] tracking-[0.1em] ${
                        variant === "jessica" ? "text-[#8B4513]/55" : "text-white/20"
                      }`}
                    >
                      {theme.brandSubtitle}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className={theme.brandCollapsedClass}>
                  {variant === "edge" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Byound/Logo_byound_blanc_sans_fond.png"
                      alt="Byound"
                      className="h-7 w-auto"
                    />
                  ) : (
                    theme.brandCollapsedLetter
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className={`${theme.collapseBtnClass} ${
                  orgBranding.logoUrl && variant !== "jessica" ? "self-end" : ""
                }`}
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
              <div className="space-y-4">
                {(useUnifiedNav ? unifiedGroups : [{ id: "legacy", label: null, items: navItems }]).map(
                  (group) => {
                    const allHrefs = navItems.map((i) => i.href);
                    return (
                      <div key={group.id} className="space-y-0.5">
                        {group.label && !isSidebarCollapsed ? (
                          <p className="px-3 pb-1 pt-1 text-[12px] font-bold text-[#6C7593]">
                            {group.label}
                          </p>
                        ) : null}
                        {group.items.map((item) => {
                          const careItem = Boolean(
                            "careActive" in item && item.careActive && carePathActive,
                          );
                          const active = isUnifiedNavItemActive(pathname, item.href, allHrefs);
                          const itemClass = `group relative flex w-full items-center rounded-xl text-[13px] font-medium transition ${
                            isSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                          } ${
                            active
                              ? careItem || (carePathActive && item.href.includes("/care"))
                                ? "bg-[#3A0F22] text-white"
                                : "bg-[#1B2350] text-white"
                              : "text-white/45 hover:bg-white/[0.04] hover:text-white"
                          }`;
                          const iconClass = `h-[18px] w-[18px] shrink-0 ${
                            active
                              ? carePathActive && item.href.includes("/care")
                                ? "text-[#FF5C8A]"
                                : "text-[#C9C2FF]"
                              : "text-white/45 group-hover:text-white/70"
                          }`;
                          const badge =
                            "badgeCount" in item && item.badgeCount
                              ? item.badgeCount
                              : undefined;
                          const careDot = "careDot" in item && item.careDot && !active;

                          const shareAction =
                            "action" in item && item.action === "share-profile";
                          const content = (
                            <>
                              <span className="relative shrink-0">
                                <item.icon className={iconClass} />
                                {careDot ? (
                                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#FF5C8A]" />
                                ) : null}
                              </span>
                              <span className={`truncate ${isSidebarCollapsed ? "sr-only" : ""}`}>
                                {item.label}
                              </span>
                              {badge && !isSidebarCollapsed ? (
                                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6E5BFF] px-1.5 text-[10px] font-bold text-white">
                                  {badge}
                                </span>
                              ) : null}
                            </>
                          );
                          if (shareAction) {
                            return (
                              <button
                                key={item.label + item.href}
                                type="button"
                                title={isSidebarCollapsed ? item.label : undefined}
                                className={itemClass}
                                onClick={() => {
                                  setMobileOpen(false);
                                  void handleShareProfile();
                                }}
                              >
                                {content}
                              </button>
                            );
                          }
                          return (
                            <Link
                              key={item.label + item.href}
                              href={item.href}
                              title={isSidebarCollapsed ? item.label : undefined}
                              className={itemClass}
                              onClick={() => setMobileOpen(false)}
                            >
                              {content}
                            </Link>
                          );
                        })}
                      </div>
                    );
                  },
                )}
              </div>
            </nav>

            <div className={theme.sidebarFooterClass}>
              {variant !== "edge" && !isSidebarCollapsed ? (
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
                </div>
              ) : null}
              {variant === "edge" ? (
                <>
                  <Link
                    href="/dashboard/apprenant?premiers-pas=1"
                    title="Premiers pas Byound"
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
            {useUnifiedNav ? (
              <div
                data-connect-topbar
                className="sticky top-0 z-30 hidden px-5 py-3 sm:px-8 lg:block lg:pl-8 lg:pr-10"
              >
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href="/dashboard/ressources"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 text-[12px] font-medium text-white/60 transition hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white"
                    title="Aide & ressources"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    <span>Aide</span>
                  </Link>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.03] text-white/60 transition hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white"
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={openEditProfile}
                    className={`inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border p-[2px] ${theme.profileBorder}`}
                    title="Modifier mon profil"
                    aria-label="Profil"
                  >
                    <span className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full ${theme.profileAvatarBg}`}>
                      {profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className={theme.profileInitialClass}>
                          {(firstName || "?").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Mobile header: burger + back + switcher */}
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
                          {carePathActive ? (
                            <>
                              Byound <span className="text-[#FF5C8A]">Care</span>
                            </>
                          ) : (
                            "Byound"
                          )}
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

                      <div className="mt-4 space-y-4 pb-6">
                        {(useUnifiedNav
                          ? unifiedGroups
                          : [{ id: "legacy", label: null as string | null, items: navItems }]
                        ).map((group) => {
                          const allHrefs = navItems.map((i) => i.href);
                          return (
                            <div key={group.id} className="space-y-0.5">
                              {group.label ? (
                                <p className="px-3 pb-1 text-[12px] font-bold text-[#6C7593]">
                                  {group.label}
                                </p>
                              ) : null}
                              {group.items.map((item) => {
                                const active = isUnifiedNavItemActive(
                                  pathname,
                                  item.href,
                                  allHrefs,
                                );
                                const careItem = carePathActive && item.href.includes("/care");
                                const itemClass = `group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${
                                  active
                                    ? careItem
                                      ? "bg-[#3A0F22] text-white"
                                      : "bg-[#1B2350] text-white"
                                    : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                                }`;
                                const iconEl = (
                                  <item.icon
                                    className={`h-[18px] w-[18px] shrink-0 ${
                                      active
                                        ? careItem
                                          ? "text-[#FF5C8A]"
                                          : "text-[#C9C2FF]"
                                        : "text-white/40"
                                    }`}
                                  />
                                );
                                const shareAction =
                                  "action" in item && item.action === "share-profile";
                                if (shareAction) {
                                  return (
                                    <button
                                      key={item.label + item.href}
                                      type="button"
                                      className={itemClass}
                                      onClick={() => {
                                        handleNavigateMobile();
                                        void handleShareProfile();
                                      }}
                                    >
                                      {iconEl}
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
                                    {iconEl}
                                    <span className="truncate">{item.label}</span>
                                    {"badgeCount" in item && item.badgeCount ? (
                                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6E5BFF] px-1.5 text-[10px] font-bold text-white">
                                        {item.badgeCount}
                                      </span>
                                    ) : null}
                                  </Link>
                                );
                              })}
                            </div>
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

                <div className="flex w-auto shrink-0 items-center justify-end gap-1.5">
                  <div className="w-10" />
                </div>
              </div>
            </div>

            <div className="relative z-10 px-5 py-6 sm:px-8 lg:pl-8 lg:pr-10 lg:py-8">
              {children}
            </div>
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
      </div>,
      )}
    </ApprenantShellProvider>
    </LearnerSnapshotProvider>
  );
}
