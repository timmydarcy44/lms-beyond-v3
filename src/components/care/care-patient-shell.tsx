"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  FileText,
  Home,
  Lock,
  MessageCircle,
  Plus,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { patientCssVars } from "@/app/dashboard/patient/_ui/tokens";

export type PatientSearchItem = {
  id: string;
  href: string;
  title: string;
  meta: string;
};

export type PatientAccount = {
  firstName: string;
  lastName: string;
  initials: string;
  greeting: string;
  dateLabel: string;
};

const DESKTOP_NAV = [
  { href: "/dashboard/patient", label: "Accueil", icon: Home, exact: true },
  { href: "/dashboard/patient/rendez-vous", label: "Rendez-vous", icon: CalendarDays, exact: false },
  { href: "/dashboard/patient/documents", label: "Mes documents", icon: FileText, exact: false },
  { href: "/dashboard/patient/messages", label: "Messages", icon: MessageCircle, exact: false },
  { href: "/care/praticiens", label: "Praticiens", icon: Stethoscope, exact: false },
  { href: "/dashboard/patient/compte", label: "Compte", icon: UserRound, exact: false },
];

const MOBILE_NAV = DESKTOP_NAV.filter((item) => item.href !== "/care/praticiens");

function isCurrent(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CarePatientShell({
  account,
  searchItems,
  newDocuments = 0,
  children,
}: {
  account: PatientAccount;
  searchItems: PatientSearchItem[];
  newDocuments?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/dashboard/patient";
  const [query, setQuery] = useState("");
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const fullName = [account.firstName, account.lastName].filter(Boolean).join(" ");

  useEffect(() => {
    setPeopleOpen(false);
    setBellOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    if (!peopleOpen && !bellOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPeopleOpen(false);
        setBellOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [peopleOpen, bellOpen]);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr-FR");
    if (!needle) return [];
    return searchItems.filter((item) => `${item.title} ${item.meta}`.toLocaleLowerCase("fr-FR").includes(needle)).slice(0, 6);
  }, [query, searchItems]);

  return (
    <div className="patient-root" style={patientCssVars}>
      <div className="patient-app">
        <aside className="patient-side">
          <Link href="/dashboard/patient" className="patient-logo">
            <span className="patient-logo-mark">B</span>
            <span className="patient-logo-word">Byound</span>
            <span className="patient-logo-care">Care</span>
          </Link>
          <div className="patient-people">
            <p>Espace de</p>
            <div className="patient-people-active">
              <span className="patient-person-avatar">{account.initials || "Moi"}</span>
              <span>
                {account.firstName || "Moi"}
                <small style={{ display: "block", fontWeight: 500, opacity: 0.8 }}>Moi</small>
              </span>
            </div>
            <button type="button" className="patient-people-add" onClick={() => setPeopleOpen(true)}>
              <Plus size={16} aria-hidden />
              Ajouter un proche
            </button>
          </div>
          <nav className="patient-nav" aria-label="Espace patient">
            {DESKTOP_NAV.map((item) => {
              const Icon = item.icon;
              const current = isCurrent(pathname, item.href, item.exact);
              return (
                <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined}>
                  <Icon size={18} aria-hidden />
                  {item.label}
                  {item.href.endsWith("/documents") && newDocuments > 0 ? (
                    <span className={current ? "patient-count is-on" : "patient-count"}>{newDocuments}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <div className="patient-privacy">
            <strong>
              <Lock size={14} aria-hidden />
              Votre espace est privé
            </strong>
            Vos documents ne sont visibles que par vous et votre praticien(ne). Rien n&apos;est partagé sans votre accord.
          </div>
        </aside>

        <div className="patient-main">
          <header className="patient-top">
            <div className="patient-top-lead">
              <button type="button" className="patient-person-chip" onClick={() => setPeopleOpen(true)}>
                <span>{account.initials || "Moi"}</span>
                {account.firstName || "Moi"}
              </button>
              {isHome ? (
                <div>
                  <p className="patient-kicker">{account.dateLabel}</p>
                  <h1 className="patient-hello">{account.greeting}</h1>
                </div>
              ) : null}
            </div>
            <div className="patient-tools">
              <form className="patient-search" role="search" onSubmit={(event) => event.preventDefault()}>
                <Search size={18} aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher"
                  aria-label="Rechercher"
                />
                {query.trim() ? (
                  <div className="patient-search-panel">
                    {results.length ? (
                      results.map((item) => (
                        <Link key={item.id} href={item.href} onClick={() => setQuery("")}>
                          {item.title}
                          <small style={{ display: "block" }}>{item.meta}</small>
                        </Link>
                      ))
                    ) : (
                      <p className="patient-search-empty">Aucun résultat.</p>
                    )}
                  </div>
                ) : null}
              </form>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="patient-icon-btn"
                  aria-label="Notifications"
                  aria-expanded={bellOpen}
                  onClick={() => setBellOpen((open) => !open)}
                >
                  <Bell size={18} aria-hidden />
                  {newDocuments > 0 ? <span className="patient-bell-dot" /> : null}
                </button>
                {bellOpen ? (
                  <div className="patient-bell-panel">
                    <p>
                      {newDocuments > 0
                        ? newDocuments > 1
                          ? `${newDocuments} nouveaux documents sont disponibles dans votre espace.`
                          : "Un nouveau document est disponible dans votre espace."
                        : "Rien de nouveau."}
                    </p>
                  </div>
                ) : null}
              </div>
              <Link href="/dashboard/patient/compte" className="patient-avatar" aria-label={fullName ? `Compte de ${fullName}` : "Compte"}>
                {account.initials || "Moi"}
              </Link>
            </div>
          </header>
          {children}
        </div>
      </div>

      <nav className="patient-tabs" aria-label="Espace patient">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const current = isCurrent(pathname, item.href, item.exact);
          return (
            <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined}>
              <Icon size={18} aria-hidden />
              {item.label === "Mes documents" ? "Documents" : item.label}
              {item.href.endsWith("/documents") && newDocuments > 0 ? (
                <span className={current ? "patient-count is-on" : "patient-count"}>{newDocuments}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {peopleOpen ? (
        <div className="patient-sheet-backdrop" onClick={() => setPeopleOpen(false)}>
          <div
            className="patient-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-people-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="patient-people-title">Espace de</h2>
              <button type="button" className="patient-icon-btn" aria-label="Fermer" onClick={() => setPeopleOpen(false)}>
                <X size={18} aria-hidden />
              </button>
            </div>
            <button type="button" className="patient-sheet-person">
              <span className="patient-person-avatar">{account.initials || "Moi"}</span>
              <span>
                {fullName || "Moi"}
                <small style={{ display: "block", fontWeight: 500, color: "var(--p-secondary)" }}>Moi</small>
              </span>
            </button>
            <p>Aucun proche n&apos;est rattaché à cet espace.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
