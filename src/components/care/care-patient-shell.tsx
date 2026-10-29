"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { personInitials } from "@/lib/care/person-name";
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
  subjectRelativeId?: string | null;
};

export type PatientShellRelative = {
  id: string;
  firstName: string;
  lastName: string;
  relation: "enfant" | "conjoint" | "autre";
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

const RELATION_LABEL = { enfant: "Enfant", conjoint: "Conjoint", autre: "Proche" } as const;

function isCurrent(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function withPerson(href: string, personId: string | null) {
  if (!personId || !href.startsWith("/dashboard/patient")) return href;
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("personne", personId);
  return `${path}?${params.toString()}`;
}

export function CarePatientShell({
  account,
  relatives,
  searchItems,
  unopenedSubjects = [],
  children,
}: {
  account: PatientAccount;
  relatives: PatientShellRelative[];
  searchItems: PatientSearchItem[];
  unopenedSubjects?: Array<string | null>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHome = pathname === "/dashboard/patient";
  const [query, setQuery] = useState("");
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState("");
  const requested = searchParams.get("personne");
  const active = relatives.find((item) => item.id === requested) ?? null;
  const activeId = active?.id ?? null;
  const fullName = [account.firstName, account.lastName].filter(Boolean).join(" ");
  const activeName = active ? [active.firstName, active.lastName].filter(Boolean).join(" ") : fullName || "Moi";
  const activeInitials = active ? personInitials(active.firstName, active.lastName) : account.initials;
  const newDocuments = unopenedSubjects.filter((id) => (activeId ? id === activeId : id == null)).length;

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

  useEffect(() => {
    if (!peopleOpen) return;
    document.getElementById("patient-people-title")?.closest("[role='dialog']")?.querySelector<HTMLElement>("button, input, select")?.focus();
  }, [peopleOpen]);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr-FR");
    if (!needle) return [];
    return searchItems
      .filter((item) => {
        const same = item.subjectRelativeId === undefined || (activeId ? item.subjectRelativeId === activeId : item.subjectRelativeId == null);
        return same && `${item.title} ${item.meta}`.toLocaleLowerCase("fr-FR").includes(needle);
      })
      .slice(0, 6);
  }, [activeId, query, searchItems]);

  function personHref(personId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (personId) params.set("personne", personId);
    else params.delete("personne");
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  async function addRelative(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setAdding(true);
    const form = new FormData(event.currentTarget);
    const year = String(form.get("birthYear") ?? "").trim();
    const response = await fetch("/api/care/patient/relatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: String(form.get("firstName") ?? ""),
        lastName: String(form.get("lastName") ?? ""),
        birthYear: year ? Number(year) : null,
        relation: String(form.get("relation") ?? ""),
      }),
    });
    const payload = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;
    setAdding(false);
    if (!response.ok || !payload?.id) {
      setFormError(payload?.error || "Le proche n'a pas pu être ajouté.");
      return;
    }
    setPeopleOpen(false);
    router.push(personHref(payload.id));
    router.refresh();
  }

  async function removeRelative(id: string) {
    const response = await fetch(`/api/care/patient/relatives/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    if (activeId === id) router.push(personHref(null));
    router.refresh();
  }

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
            <Link href={personHref(null)} className="patient-people-active" aria-current={activeId ? undefined : "true"}>
              <span className="patient-person-avatar">{account.initials || "Moi"}</span>
              <span>
                {account.firstName || "Moi"}
                <small style={{ display: "block", fontWeight: 500, opacity: 0.8 }}>Moi</small>
              </span>
            </Link>
            {relatives.map((person) => (
              <Link
                key={person.id}
                href={personHref(person.id)}
                className="patient-people-active"
                aria-current={person.id === activeId ? "true" : undefined}
              >
                <span className="patient-person-avatar">{personInitials(person.firstName, person.lastName)}</span>
                <span>
                  {person.firstName}
                  <small style={{ display: "block", fontWeight: 500, opacity: 0.8 }}>{RELATION_LABEL[person.relation]}</small>
                </span>
              </Link>
            ))}
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
                <Link key={item.href} href={withPerson(item.href, activeId)} aria-current={current ? "page" : undefined}>
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
              <button type="button" className="patient-person-chip" onClick={() => setPeopleOpen(true)} aria-label={`Espace de ${activeName}`}>
                <span>{activeInitials || "Moi"}</span>
                {active?.firstName || account.firstName || "Moi"}
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
            <Link key={item.href} href={withPerson(item.href, activeId)} aria-current={current ? "page" : undefined}>
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
            <Link href={personHref(null)} className="patient-sheet-person" aria-current={activeId ? undefined : "true"}>
              <span className="patient-person-avatar">{account.initials || "Moi"}</span>
              <span>
                {fullName || "Moi"}
                <small style={{ display: "block", fontWeight: 500, color: "var(--p-secondary)" }}>Moi</small>
              </span>
            </Link>
            {relatives.length ? (
              relatives.map((person) => (
                <div key={person.id} className="patient-sheet-row">
                  <Link href={personHref(person.id)} className="patient-sheet-person" aria-current={person.id === activeId ? "true" : undefined}>
                    <span className="patient-person-avatar">{personInitials(person.firstName, person.lastName)}</span>
                    <span>
                      {[person.firstName, person.lastName].filter(Boolean).join(" ")}
                      <small style={{ display: "block", fontWeight: 500, color: "var(--p-secondary)" }}>{RELATION_LABEL[person.relation]}</small>
                    </span>
                  </Link>
                  <button type="button" className="patient-text-btn" onClick={() => removeRelative(person.id)}>
                    Retirer
                  </button>
                </div>
              ))
            ) : (
              <p>Aucun proche n&apos;est rattaché à cet espace.</p>
            )}
            <form className="patient-relative-form" onSubmit={addRelative}>
              <label>
                Prénom
                <input name="firstName" required autoComplete="given-name" />
              </label>
              <label>
                Nom
                <input name="lastName" autoComplete="family-name" />
              </label>
              <label>
                Lien
                <select name="relation" defaultValue="enfant" aria-label="Lien">
                  <option value="enfant">Enfant</option>
                  <option value="conjoint">Conjoint</option>
                  <option value="autre">Autre</option>
                </select>
              </label>
              <label>
                Année de naissance
                <input name="birthYear" inputMode="numeric" placeholder="Optionnel" aria-label="Année de naissance, optionnel" />
              </label>
              {formError ? <p>{formError}</p> : null}
              <button type="submit" className="patient-pill patient-pill--dark" disabled={adding}>
                {adding ? "Ajout…" : "Ajouter"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
