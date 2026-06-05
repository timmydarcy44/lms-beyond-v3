"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, LifeBuoy, LogOut, Menu, Sparkles, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import { buildApprenantNavItems } from "@/lib/apprenant/connect-nav";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";
import {
  buildPublicProfileUrl,
  slugifyPublicProfile,
} from "@/lib/apprenant/public-profile-url";
import { ApprenantProfileEditModal } from "@/components/apprenant/apprenant-profile-edit-modal";
import { ConnectCockpitBackdrop } from "@/components/apprenant/connect-cockpit-backdrop";
import { ApprenantShellProvider } from "@/components/apprenant/apprenant-shell-context";
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
};

export function ApprenantConnectShell({ children }: { children: ReactNode }) {
  const supabase = createSupabaseBrowserClient();
  const pathname = usePathname();
  const router = useRouter();
  const { isDyslexiaMode, toggleDyslexiaMode } = useDyslexiaMode();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileSnippet | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authMeta, setAuthMeta] = useState<Record<string, unknown>>({});
  const [editOpen, setEditOpen] = useState(false);
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
        "first_name, last_name, email, phone, telephone, birth_date, city, avatar_url, school_id, school_class, entreprise_id, company_id",
      )
      .eq("id", uid)
      .maybeSingle();
    setProfile((data as ProfileSnippet) ?? null);
  }, [supabase]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile, snippetVersion]);

  const hasOrganisation = Boolean(
    profile?.school_id || profile?.entreprise_id || profile?.company_id,
  );
  const navItems = useMemo(() => buildApprenantNavItems(hasOrganisation), [hasOrganisation]);

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
    window.location.href = "/particuliers";
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

    const shareUrl = buildPublicProfileUrl(publicSlug);
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
    }),
    [handleShareProfile],
  );

  const openEditProfile = shellContext.openEditProfile;

  const isOpenBadgeImmersive = Boolean(pathname?.includes("/dashboard/apprenant/open-badges"));
  const isHomeRoute = pathname === "/dashboard/apprenant";
  const showMobileBack = Boolean(pathname) && !isHomeRoute;

  const activeNavLabel = useMemo(() => {
    if (!pathname) return "";
    const exact = navItems.find((item) => item.href === pathname);
    if (exact) return exact.label;
    const nested = navItems.find((item) => pathname.startsWith(item.href + "/"));
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

  if (isOpenBadgeImmersive) {
    return (
      <ApprenantShellProvider value={shellContext}>
        <div data-connect-shell="open-badge-immersive" className="min-h-screen bg-[#030303] text-white">
          {children}
        </div>
        <ApprenantProfileEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          initialProfile={profile}
          refreshToken={snippetVersion}
          onSaved={() => setSnippetVersion((v) => v + 1)}
        />
      </ApprenantShellProvider>
    );
  }

  return (
    <ApprenantShellProvider value={shellContext}>
      <div data-connect-shell="edge" className="relative min-h-screen bg-[#0D0D12]">
        <ConnectCockpitBackdrop />
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
        `}</style>
        <div className="relative z-10 flex h-screen overflow-hidden font-['Inter']">
          <aside
            data-connect-sidebar
            className={`no-dyslexia sticky left-0 top-0 z-20 hidden h-screen shrink-0 flex-col bg-[#0a0a0f] lg:flex ${
              isSidebarCollapsed ? "w-[76px]" : "w-[240px]"
            }`}
          >
            <div className="flex h-[52px] shrink-0 items-center border-b border-white/[0.06] px-2.5">
              {!isSidebarCollapsed ? (
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-[11px] font-semibold tracking-[0.18em] text-white">EDGE</div>
                  <p className="text-[9px] tracking-[0.1em] text-white/20">Propulsé par Beyond</p>
                </div>
              ) : (
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-edge-red/10 text-xs font-semibold text-edge-red">
                  E
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/70 transition hover:border-edge-red/35 hover:bg-edge-red/10 hover:text-white"
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
                  const isParcoursGalaxy = item.label === "Parcours";
                  const isEdgeOnlineEntry = item.label === "EDGE Online";
                  const isShareProfile = item.action === "share-profile";
                  const active =
                    !isShareProfile &&
                    (pathname === item.href ||
                      (isParcoursGalaxy && Boolean(pathname?.startsWith("/g/edgelab"))) ||
                      (isEdgeOnlineEntry && Boolean(pathname?.startsWith("/edgeonline"))));
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
                        <item.icon className="h-[18px] w-[18px] shrink-0 text-white/45 group-hover:text-white/70" />
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
                          active ? "text-[#60a5fa]" : "text-white/45 group-hover:text-white/70"
                        }`}
                      />
                      <span className={`truncate ${isSidebarCollapsed ? "sr-only" : ""}`}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="shrink-0 space-y-2 border-t border-white/[0.06] bg-[#0a0a0f] p-2">
              {!isSidebarCollapsed ? (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2 backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={scrollToProfilOrHome}
                    className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition hover:bg-white/[0.04]"
                  >
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[rgba(37,99,235,0.35)] p-[2px]">
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#111110]">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-semibold text-[#60a5fa]">
                            {(firstName || "?").slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-white">{firstName}</div>
                      <div className="truncate text-[10px] text-white/45">Apprenant</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="mt-2 w-full rounded-full border border-white/20 bg-transparent py-2 text-[11px] font-medium text-white/70 transition hover:border-white/30"
                  >
                    Modifier mon profil
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    title="Synthèse profil"
                    onClick={scrollToProfilOrHome}
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-xs font-semibold text-[#E53935] transition hover:border-[#E53935]/40"
                  >
                    {(firstName || "?").slice(0, 1).toUpperCase()}
                  </button>
                  <button
                    type="button"
                    title="Modifier mon profil"
                    onClick={() => setEditOpen(true)}
                    className="mx-auto rounded-full border border-white/20 px-2 py-1.5 text-[10px] font-medium text-white/70"
                  >
                    Éditer
                  </button>
                </div>
              )}
              <Link
                href="/dashboard/ressources"
                title="Aide & ressources"
                className={`flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-transparent py-2 text-[11px] font-medium text-white/45 transition hover:bg-white/[0.04] hover:text-white/70 ${
                  isSidebarCollapsed ? "px-0" : "px-2"
                }`}
              >
                <LifeBuoy className="h-3.5 w-3.5 shrink-0 text-white/45" />
                {!isSidebarCollapsed ? <span>Aide & ressources</span> : null}
              </Link>
              <button
                type="button"
                onClick={toggleDyslexiaMode}
                title={isDyslexiaMode ? "Désactiver la neuro-adaptation" : "Neuro adaptation"}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-transparent py-2 text-[11px] font-medium text-white/55 transition hover:border-white/15 hover:bg-white/[0.03] hover:text-white/85 ${
                  isSidebarCollapsed ? "px-0" : "px-2"
                }`}
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
                className={`flex w-full items-center justify-center rounded-xl py-2 text-[11px] font-medium text-white/25 transition hover:bg-white/[0.04] hover:text-white/40 ${
                  isSidebarCollapsed ? "px-0" : ""
                }`}
                data-neuro-logout
                title="Se déconnecter"
              >
                {isSidebarCollapsed ? <LogOut className="h-3.5 w-3.5" /> : "Se déconnecter"}
              </button>
            </div>
          </aside>

          <main data-connect-main className="relative flex-1 overflow-y-auto bg-transparent text-slate-100">
            {/* Mobile header: burger + back */}
            <div className="sticky top-0 z-30 border-b border-sky-500/10 bg-[#050810]/60 px-4 py-3 backdrop-blur-md lg:hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/20 bg-white/[0.06] text-slate-200"
                        aria-label="Ouvrir le menu"
                      >
                        <Menu className="h-5 w-5" />
                      </button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="border-sky-500/15 bg-[#050810]/95 text-slate-100 backdrop-blur-xl"
                    >
                      <SheetHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4 text-left">
                        <SheetTitle className="text-white">Navigation</SheetTitle>
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
                          const active =
                            !isShareProfile &&
                            (pathname === item.href || pathname?.startsWith(item.href + "/"));
                          const itemClass = `group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${
                            active
                              ? "bg-sky-500/15 text-white ring-1 ring-sky-400/30"
                              : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
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
                                <item.icon className="h-[18px] w-[18px] shrink-0 text-slate-500 group-hover:text-slate-300" />
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
                                  active ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"
                                }`}
                              />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>

                      <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
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
                  <div className="truncate text-center text-sm font-semibold text-white">
                    {activeNavLabel || "EDGE"}
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
          onSaved={() => setSnippetVersion((v) => v + 1)}
        />

        {shareCopied ? (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4"
            role="status"
            aria-live="polite"
          >
            <div className="max-w-md rounded-2xl border border-sky-500/20 bg-[#0a1020] px-6 py-5 text-center shadow-2xl shadow-black/50">
              <p className="text-lg font-semibold text-white">Lien copié !</p>
              <p className="mt-2 text-sm text-slate-400">
                Votre page publique est prête à être partagée (profil & wallet).
              </p>
              <button
                type="button"
                onClick={() => setShareCopied(false)}
                className="mt-4 rounded-full bg-[#6C5CE7] px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-6px_rgba(108,92,231,0.5)] hover:bg-[#7B6EF6]"
              >
                OK
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </ApprenantShellProvider>
  );
}
