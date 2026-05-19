"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LifeBuoy, LogOut, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";
import { buildApprenantNavItems } from "@/lib/apprenant/connect-nav";
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

  const fallbackName =
    profile?.first_name?.trim() ||
    (profile?.email ? profile.email.split("@")[0] : null) ||
    "Apprenant";
  const firstName = fallbackName;

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
      <div className="min-h-screen bg-[#0b0e14] text-white">
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
        `}</style>
        <div className="flex h-screen overflow-hidden font-['Inter']">
          <aside
            className={`no-dyslexia sticky left-0 top-0 z-20 hidden h-screen shrink-0 flex-col border-r border-white/[0.06] bg-[#06070b] lg:flex ${
              isSidebarCollapsed ? "w-[76px]" : "w-[248px]"
            }`}
          >
            <div className="flex h-[52px] shrink-0 items-center border-b border-white/[0.06] px-2.5">
              {!isSidebarCollapsed ? (
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="bg-gradient-to-r from-white to-violet-200/90 bg-clip-text text-[10px] font-black tracking-[0.2em] text-transparent">
                    BEYOND
                  </div>
                  <div className="text-[9px] font-bold tracking-[0.38em] text-violet-400/95">CONNECT</div>
                </div>
              ) : (
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-xs font-black text-violet-200">
                  B
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/70 transition hover:border-violet-500/35 hover:bg-violet-500/10 hover:text-white"
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
                            ? "bg-violet-500/20 text-white ring-1 ring-violet-400/35"
                            : "bg-violet-500/[0.14] text-white before:absolute before:left-0 before:top-1/2 before:h-7 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-violet-400 before:content-['']"
                          : "text-white/50 hover:bg-white/[0.04] hover:text-white/90"
                      }`}
                    >
                      <item.icon
                        className={`h-[18px] w-[18px] shrink-0 ${
                          active ? "text-violet-300" : "text-white/35 group-hover:text-white/60"
                        }`}
                      />
                      <span className={`truncate ${isSidebarCollapsed ? "sr-only" : ""}`}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="shrink-0 space-y-2 border-t border-white/[0.06] bg-[#05060a] p-2">
              {!isSidebarCollapsed ? (
                <div className="rounded-xl border border-white/[0.06] bg-[#10151c] p-2">
                  <button
                    type="button"
                    onClick={scrollToProfilOrHome}
                    className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition hover:bg-white/[0.04]"
                  >
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-500/20 p-[2px]">
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#0b0e14]">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-violet-200/90">
                            {(firstName || "?").slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-white">{firstName}</div>
                      <div className="truncate text-[10px] text-white/40">Apprenant</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="mt-2 w-full rounded-lg bg-violet-500/15 py-2 text-[11px] font-semibold text-violet-200 transition hover:bg-violet-500/25"
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
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#10151c] text-xs font-bold text-violet-200 transition hover:border-violet-500/30"
                  >
                    {(firstName || "?").slice(0, 1).toUpperCase()}
                  </button>
                  <button
                    type="button"
                    title="Modifier mon profil"
                    onClick={() => setEditOpen(true)}
                    className="mx-auto rounded-lg bg-violet-500/15 px-2 py-1.5 text-[10px] font-semibold text-violet-200"
                  >
                    Éditer
                  </button>
                </div>
              )}
              <Link
                href="/dashboard/ressources"
                title="Aide & ressources"
                className={`flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] py-2 text-[11px] font-medium text-white/65 transition hover:border-violet-500/25 hover:text-white/90 ${
                  isSidebarCollapsed ? "px-0" : "px-2"
                }`}
              >
                <LifeBuoy className="h-3.5 w-3.5 shrink-0 text-violet-300/80" />
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
                  <Sparkles className="h-3.5 w-3.5 text-violet-300/90" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className={`flex w-full items-center justify-center rounded-xl py-2 text-[11px] font-semibold text-rose-300/90 transition hover:bg-rose-500/10 hover:text-rose-200 ${
                  isSidebarCollapsed ? "px-0" : ""
                }`}
                data-neuro-logout
                title="Se déconnecter"
              >
                {isSidebarCollapsed ? <LogOut className="h-3.5 w-3.5" /> : "Se déconnecter"}
              </button>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto bg-[#0b0e14] px-5 py-8 sm:px-8 lg:pl-8 lg:pr-10">{children}</main>
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
