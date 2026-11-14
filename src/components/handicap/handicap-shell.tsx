"use client";

import { usePathname } from "next/navigation";
import { Bell, Lock, Search } from "lucide-react";
import { Manrope } from "next/font/google";
import { HANDICAP_THEME as T } from "@/lib/handicap/theme";
import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

type NavCounts = {
  people: number;
  meetings: number;
  requests: number;
};

const BASE = "/handicap";

const NAV = [
  { id: "accueil", label: "Accueil", href: BASE },
  { id: "personnes", label: "Personnes accompagnées", href: `${BASE}/personnes`, countKey: "people" as const },
  { id: "rdv", label: "Rendez-vous", href: `${BASE}/rendez-vous`, countKey: "meetings" as const },
  { id: "demandes", label: "Demandes", href: `${BASE}/demandes`, countKey: "requests" as const, amber: true },
  { id: "partenaires", label: "Partenaires", href: `${BASE}/partenaires` },
  { id: "ressources", label: "Ressources", href: `${BASE}/ressources` },
  { id: "registre", label: "Registre Qualiopi", href: `${BASE}/registre` },
];

export function HandicapShell({
  children,
  userLabel,
  userInitials,
  counts,
}: {
  children: React.ReactNode;
  userLabel: string;
  userInitials: string;
  counts: NavCounts;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(manrope.className, "flex min-h-screen text-[15px] antialiased")}
      style={{ background: T.bg, color: T.text }}
    >
      <aside
        className="flex w-[260px] shrink-0 flex-col border-r px-4 py-5"
        style={{ background: T.sidebar, borderColor: T.border }}
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          <div
            className="grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold"
            style={{ background: T.accent, color: T.accentOn }}
          >
            B
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold" style={{ color: T.muted }}>
              Byound
            </p>
            <p className="text-[17px] font-extrabold" style={{ color: T.accent }}>
              Handicap
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active =
              item.href === BASE
                ? pathname === BASE
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const count =
              item.countKey === "people"
                ? counts.people
                : item.countKey === "meetings"
                  ? counts.meetings
                  : item.countKey === "requests"
                    ? counts.requests
                    : null;
            return (
              <a
                key={item.id}
                href={item.href}
                className="flex items-center justify-between rounded-full px-3 py-2.5 text-[13.5px] font-semibold transition"
                style={{
                  background: active ? T.accent : "transparent",
                  color: active ? T.accentOn : T.muted,
                }}
              >
                <span>{item.label}</span>
                {count != null && count > 0 ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{
                      background: active
                        ? "rgba(255,255,255,0.22)"
                        : item.amber
                          ? "rgba(242,207,107,0.2)"
                          : "rgba(255,255,255,0.08)",
                      color: active ? T.accentOn : item.amber ? T.amber : T.text,
                    }}
                  >
                    {count}
                  </span>
                ) : null}
              </a>
            );
          })}
        </nav>

        <div
          className="mt-4 rounded-2xl border px-3 py-3 text-[12px] leading-relaxed"
          style={{
            background: T.accentSoft,
            borderColor: T.accentSoftBorder,
            color: T.muted,
          }}
        >
          <p className="mb-1 flex items-center gap-1.5 font-bold" style={{ color: T.accent }}>
            <Lock className="h-3.5 w-3.5" />
            Espace confidentiel
          </p>
          Accès réservé à la référente handicap. Chaque consultation est enregistrée.
        </div>

        <div className="mt-4 flex items-center gap-3 px-1">
          <div
            className="grid h-10 w-10 place-items-center rounded-full text-xs font-extrabold"
            style={{ background: T.inner, color: T.accent, border: `1px solid ${T.borderSoft}` }}
          >
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold">{userLabel}</p>
            <p className="text-[11px]" style={{ color: T.tertiary }}>
              Byound
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center gap-3 border-b px-6 py-4"
          style={{ borderColor: T.border }}
        >
          <div
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full border px-4 py-2.5"
            style={{ background: T.card, borderColor: T.border }}
          >
            <Search className="h-4 w-4 shrink-0" style={{ color: T.tertiary }} />
            <input
              type="search"
              placeholder="Rechercher une personne…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#6C7593]"
              style={{ color: T.text }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const q = (e.target as HTMLInputElement).value.trim();
                if (!q) return;
                window.location.href = `${BASE}/personnes?q=${encodeURIComponent(q)}`;
              }}
            />
          </div>
          <a
            href={`${BASE}/personnes?nouveau=1`}
            className="shrink-0 rounded-full bg-white px-4 py-2.5 text-[13px] font-bold text-[#0A0F1E]"
          >
            ＋ Nouvel accompagnement
          </a>
          <a
            href={`${BASE}/demandes`}
            className="relative grid h-10 w-10 place-items-center rounded-full border"
            style={{ borderColor: T.border, background: T.card, color: T.muted }}
            aria-label="Notifications — demandes"
          >
            <Bell className="h-4 w-4" />
            {counts.requests > 0 ? (
              <span
                className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold"
                style={{ background: T.amber, color: T.bg }}
              >
                {counts.requests > 9 ? "9+" : counts.requests}
              </span>
            ) : null}
          </a>
        </header>

        <main className="min-h-0 flex-1 overflow-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
