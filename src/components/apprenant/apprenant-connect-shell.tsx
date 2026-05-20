"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LifeBuoy, LogOut, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import { buildApprenantNavItems } from "@/lib/apprenant/connect-nav";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";
import { ApprenantProfileEditModal } from "@/components/apprenant/apprenant-profile-edit-modal";
import { ApprenantShellProvider } from "@/components/apprenant/apprenant-shell-context";

type ProfileSnippet = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  telephone?: string | null;
  avatar_url?: string | null;
  school_id?: string | null;
  school_class?: string | null;
  entreprise_id?: string | null;
};

export function ApprenantConnectShell({ children }: { children: ReactNode }) {
  const supabase = createSupabaseBrowserClient();
  const pathname = usePathname();
  const router = useRouter();
  const { isDyslexiaMode, toggleDyslexiaMode } = useDyslexiaMode();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState<ProfileSnippet | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [snippetVersion, setSnippetVersion] = useState(0);

  const loadProfile = useCallback(async () => {
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, telephone, avatar_url, school_id, school_class, entreprise_id")
      .eq("id", uid)
      .maybeSingle();
    setProfile((data as ProfileSnippet) ?? null);
  }, [supabase]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile, snippetVersion]);

  const hasOrganisation = Boolean(profile?.entreprise_id || profile?.school_id);
  const navItems = useMemo(() => buildApprenantNavItems(hasOrganisation), [hasOrganisation]);

  const firstName = resolveLearnerDisplayFirstName({
    profileFirstName: profile?.first_name,
    email: profile?.email,
  });

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/particuliers";
  };

  const scrollToProfilOrHome = useCallback(() => {
    router.push("/dashboard/apprenant/profil");
  }, [router]);

  const shellContext = useMemo(
    () => ({
      openEditProfile: () => setEditOpen(true),
    }),
    [],
  );

  const openEditProfile = shellContext.openEditProfile;

  return (
    <ApprenantShellProvider value={shellContext}>
      <div data-connect-shell="edge" className="min-h-screen bg-[#0a0a0a]">
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
        `}</style>
        <div className="flex h-screen overflow-hidden font-['Inter']">
          <aside
            className={`no-dyslexia sticky left-0 top-0 z-20 hidden h-screen shrink-0 flex-col border-r-[0.5px] border-white/[0.06] bg-[#0a0a0a] lg:flex ${
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
                  const active =
                    pathname === item.href ||
                    (isParcoursGalaxy && Boolean(pathname?.startsWith("/g/edgelab"))) ||
                    (isEdgeOnlineEntry && Boolean(pathname?.startsWith("/edgeonline")));
                  return (
                    <Link
                      key={item.label + item.href}
                      href={item.href}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`group relative flex items-center rounded-xl text-[13px] font-medium transition ${
                        isSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                      } ${
                        active
                          ? isSidebarCollapsed
                            ? "bg-edge-red/10 text-white ring-1 ring-edge-red/35"
                            : "bg-edge-red/[0.08] text-white before:absolute before:left-0 before:top-1/2 before:h-7 before:w-[2px] before:-translate-y-1/2 before:bg-edge-red before:content-['']"
                          : "text-white/45 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <item.icon
                        className={`h-[18px] w-[18px] shrink-0 ${
                          active ? "text-edge-red" : "text-white/45 group-hover:text-white/70"
                        }`}
                      />
                      <span className={`truncate ${isSidebarCollapsed ? "sr-only" : ""}`}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="shrink-0 space-y-2 border-t border-white/[0.06] bg-[#0a0a0a] p-2">
              {!isSidebarCollapsed ? (
                <div className="rounded-xl border border-white/[0.06] bg-[#141412] p-2">
                  <button
                    type="button"
                    onClick={scrollToProfilOrHome}
                    className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition hover:bg-white/[0.04]"
                  >
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-edge-red/30 p-[2px]">
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#111110]">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-semibold text-edge-red">
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
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#141412] text-xs font-semibold text-edge-red transition hover:border-edge-red/30"
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

          <main
            data-connect-main
            className="flex-1 overflow-y-auto bg-white px-5 py-8 text-[#0a0a0a] sm:px-8 lg:pl-8 lg:pr-10"
          >
            {children}
          </main>
        </div>

        <ApprenantProfileEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          initialProfile={profile}
          refreshToken={snippetVersion}
          onSaved={() => setSnippetVersion((v) => v + 1)}
        />
      </div>
    </ApprenantShellProvider>
  );
}
