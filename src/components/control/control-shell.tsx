"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Manrope } from "next/font/google";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, MessageSquare, Plus, Search } from "lucide-react";
import { AiAssistant } from "@/components/crm/ai-assistant";
import { AiAssistantProvider, useAiAssistant } from "@/components/crm/ai-assistant-provider";
import { AlertsBadge } from "@/components/super-admin/alerts-badge";
import { useSurface } from "@/components/theme/surface-toggle";
import { CONTROL_CREATE_LINKS, CONTROL_NAV_SECTIONS, type ControlNavCounts } from "@/lib/control/nav";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });
const NAV_KEY = "byound-control-nav";

const DEFAULT_OPEN: Record<string, boolean> = {
  business: true,
  cfa: true,
  formation: true,
  qualite: false,
};

type SearchGroup = {
  type: string;
  items: Array<{ id: string; label: string; hint?: string; href: string }>;
};

function readOpen() {
  try {
    const raw = localStorage.getItem(NAV_KEY);
    if (!raw) return DEFAULT_OPEN;
    return { ...DEFAULT_OPEN, ...(JSON.parse(raw) as Record<string, boolean>) };
  } catch {
    return DEFAULT_OPEN;
  }
}

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "B") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function ControlFrame({
  counts,
  userName,
  userEmail,
  children,
}: {
  counts: ControlNavCounts;
  userName: string;
  userEmail: string;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const role = useSearchParams().get("role");
  const router = useRouter();
  const { toggle } = useAiAssistant();
  const surface = useSurface("byound-super-surface", ".super-theme", "super-light");
  const [openSections, setOpenSections] = useState(DEFAULT_OPEN);
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOpenSections(readOpen());
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setCreateOpen(false);
        setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGroups([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch(`/api/super/control/search?q=${encodeURIComponent(q)}`)
        .then((response) => (response.ok ? response.json() : { groups: [] }))
        .then((json: { groups?: SearchGroup[] }) => setGroups(json.groups ?? []))
        .catch(() => setGroups([]));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  const homeActive = pathname === "/super";
  const formationTester = /^\/super\/lms\/formations\/[^/]+\/tester(?:\/|$)/.test(pathname);
  const formationBuilder = /^\/super\/lms\/formations\/.+/.test(pathname) && !formationTester;

  const toggleSection = (id: string) => {
    setOpenSections((current) => {
      const next = { ...current, [id]: !current[id] };
      try {
        localStorage.setItem(NAV_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const nav = useMemo(() => CONTROL_NAV_SECTIONS, []);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/super" className="flex items-center gap-2 px-5 pb-4 pt-5" onClick={() => setMobileNav(false)}>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#6E5BFF] text-sm font-extrabold text-white">B</span>
        <span className="text-[15px] font-extrabold text-white">Byound Control</span>
      </Link>
      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        <Link
          href="/super"
          onClick={() => setMobileNav(false)}
          className="block rounded-xl px-3 py-2 text-[14px] font-semibold"
          style={{ background: homeActive ? "#6E5BFF" : "transparent", color: homeActive ? "#fff" : "#C9D2E8" }}
        >
          Accueil
        </Link>
        <Link
          href="/super/entreprises"
          onClick={() => setMobileNav(false)}
          className="block rounded-xl px-3 py-2 text-[14px] font-semibold"
          style={{
            background: pathname.startsWith("/super/entreprises") ? "#6E5BFF" : "transparent",
            color: pathname.startsWith("/super/entreprises") ? "#fff" : "#C9D2E8",
          }}
        >
          Entreprises
        </Link>
        {nav.map((section) => {
          const expanded = openSections[section.id] !== false;
          return (
            <div key={section.id}>
              <button type="button" onClick={() => toggleSection(section.id)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left" aria-expanded={expanded}>
                <span className="h-2 w-2 rounded-full" style={{ background: section.dot }} />
                <span className="flex-1 text-[13px] font-semibold text-[#9AA3BD]">{section.label}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-[#6C7593] transition ${expanded ? "" : "-rotate-90"}`} />
              </button>
              {expanded ? (
                <div className="mt-1 space-y-0.5">
                  {section.items.map((item) => {
                    const count = item.countKey ? counts[item.countKey] : 0;
                    const active = item.match(pathname, role);
                    if (item.soon || !item.href) {
                      return (
                        <span
                          key={item.id}
                          title="Bientôt disponible"
                          className="flex cursor-not-allowed items-center justify-between rounded-xl px-3 py-2 text-[14px] text-[#5C657F]"
                        >
                          {item.label}
                          {count > 0 ? <Count n={count} tone={item.countTone ?? "queue"} /> : null}
                        </span>
                      );
                    }
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileNav(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-[14px] font-medium"
                        style={{ background: active ? "#6E5BFF" : "transparent", color: active ? "#fff" : "#C9D2E8" }}
                      >
                        <span className="min-w-0 truncate">{item.label}</span>
                        {count > 0 ? <Count n={count} tone={item.countTone ?? "queue"} /> : null}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-[#1A2340] p-3">
        <Link
          href="/super/parametres"
          onClick={() => setMobileNav(false)}
          className="block rounded-xl px-3 py-2 text-[14px] font-medium"
          style={{
            background: pathname.startsWith("/super/parametres") ? "#6E5BFF" : "transparent",
            color: pathname.startsWith("/super/parametres") ? "#fff" : "#C9D2E8",
          }}
        >
          Paramètres
        </Link>
      </div>
    </div>
  );

  if (formationTester) {
    return (
      <div className={`${manrope.className} min-h-screen bg-black text-white`}>
        {children}
      </div>
    );
  }

  if (formationBuilder) {
    return (
      <div className={`${manrope.className} min-h-screen bg-[#F4F4F1] text-[#07080B]`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`${manrope.className} control-shell min-h-screen bg-[#0A0F1E] text-white`}>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-[#1A2340] bg-[#080C19] lg:block">{sidebar}</aside>
      {mobileNav ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Fermer le menu" onClick={() => setMobileNav(false)} />
          <aside className="relative h-full w-[260px] border-r border-[#1A2340] bg-[#080C19]">{sidebar}</aside>
        </div>
      ) : null}
      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-[#1A2340] bg-[#0A0F1E]/95 px-4 backdrop-blur">
          <button type="button" className="rounded-lg border border-[#26304F] px-2 py-1 text-sm lg:hidden" onClick={() => setMobileNav(true)}>
            Menu
          </button>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6C7593]" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Rechercher…  ⌘K"
              className="h-10 w-full rounded-full border border-[#26304F] bg-[#0B1122] pl-9 pr-4 text-sm text-white outline-none placeholder:text-[#6C7593]"
            />
            {searchOpen && query.trim().length >= 2 ? (
              <div className="absolute left-0 right-0 top-12 max-h-[420px] overflow-auto rounded-2xl border border-[#1A2340] bg-[#111831] p-2 shadow-2xl">
                {groups.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-[#9AA3BD]">Aucun résultat</p>
                ) : (
                  groups.map((group) => (
                    <div key={group.type} className="mb-2">
                      <p className="px-3 py-1 text-[12px] font-semibold text-[#6C7593]">{group.type}</p>
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-[#0B1122]"
                          onClick={() => {
                            setSearchOpen(false);
                            setQuery("");
                            router.push(item.href);
                          }}
                        >
                          <span className="text-sm text-white">{item.label}</span>
                          {item.hint ? <span className="text-[12px] text-[#9AA3BD]">{item.hint}</span> : null}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
          <button type="button" onClick={toggle} className="hidden h-10 items-center gap-2 rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold text-white sm:inline-flex">
            ✦ Assistant
          </button>
          <div className="relative">
            <button type="button" onClick={() => setCreateOpen((value) => !value)} className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold" style={{ background: "#ffffff", color: "#12141C" }}>
              <Plus className="h-4 w-4" /> Créer <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {createOpen ? (
              <div className="absolute right-0 top-12 w-48 rounded-2xl border border-[#1A2340] bg-[#111831] p-1 shadow-2xl">
                {CONTROL_CREATE_LINKS.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setCreateOpen(false)} className="block rounded-xl px-3 py-2 text-sm text-white hover:bg-[#0B1122]">
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <AlertsBadge />
          <Link href="/dashboard/student/community" title="Messages" className="grid h-8 w-8 place-items-center rounded-full text-[#C9D2E8] hover:bg-[#111831]">
            <MessageSquare className="h-4 w-4" />
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              className="grid h-9 w-9 place-items-center rounded-full bg-[#6E5BFF] text-xs font-bold text-white"
              aria-label="Compte"
            >
              {initials(userName, userEmail)}
            </button>
            {accountOpen ? (
              <div className="absolute right-0 top-12 w-64 rounded-2xl border border-[#1A2340] bg-[#111831] p-2 shadow-2xl">
                <p className="px-3 py-2 text-sm font-semibold text-white">{userName || "Compte"}</p>
                <p className="px-3 pb-2 text-[12px] text-[#9AA3BD]">{userEmail}</p>
                <p className="px-3 pt-1 text-[12px] text-[#6C7593]">Apparence</p>
                <button type="button" onClick={surface.toggle} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-[#0B1122]">
                  {surface.light ? "Fond sombre" : "Fond blanc"}
                </button>
                <form action="/logout" method="POST">
                  <button type="submit" className="block w-full rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-[#0B1122]">
                    Déconnexion
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </header>
        <main>{children}</main>
      </div>
      <AiAssistant hideLauncher />
    </div>
  );
}

function Count({ n, tone }: { n: number; tone: "late" | "queue" }) {
  return (
    <span
      className="ml-2 inline-flex min-w-5 justify-center rounded-full px-1.5 text-[11px] font-bold"
      style={tone === "late" ? { background: "#FF4D6A", color: "#fff" } : { background: "#26304F", color: "#9AA3BD" }}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function ControlShell(props: {
  counts: ControlNavCounts;
  userName: string;
  userEmail: string;
  children: ReactNode;
}) {
  return (
    <AiAssistantProvider>
      <ControlFrame {...props} />
    </AiAssistantProvider>
  );
}
