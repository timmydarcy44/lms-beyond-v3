"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { CareLogo } from "@/components/care/care-logo";
import { CareLink, useCareAudience } from "@/components/care/care-host";
import { CARE_HOME } from "@/lib/care/home-copy";

const NAV = [
  { href: "/care#domaines", label: CARE_HOME.nav.domaines },
  { href: "/care#methode", label: CARE_HOME.nav.methode },
  { href: "/care/praticiens", label: CARE_HOME.nav.praticiens },
  { href: "/care#devenir", label: CARE_HOME.nav.devenir },
];

export function CareHeader() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const { audience, setAudience } = useCareAudience();
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`care-header${solid ? " is-solid" : ""}`}>
      <div className="care-halo" style={{ width: 340, height: 340, background: "var(--care-accent)", top: -180, right: 80 }} />
      <div className="care-wrap care-header-inner">
        <CareLogo />
        <div className="care-audience" role="tablist" aria-label="Audience">
          <button
            type="button"
            role="tab"
            aria-selected={audience === "particuliers"}
            onClick={() => setAudience("particuliers")}
          >
            {CARE_HOME.audience.particuliers}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={audience === "entreprises"}
            onClick={() => setAudience("entreprises")}
          >
            {CARE_HOME.audience.entreprises}
          </button>
        </div>
        <nav className={`care-nav${open ? " is-open" : ""}`} aria-label="Byound Care">
          {NAV.map((item) => (
            <CareLink key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </CareLink>
          ))}
        </nav>
        <div className="care-header-cta">
          <CareLink href="/dashboard/patient" className="care-pill care-pill--ghost" style={{ height: 44 }}>
            {CARE_HOME.nav.connexion}
          </CareLink>
          <CareLink href="/care#formules" className="care-pill care-pill--white" style={{ height: 44, paddingInline: 18 }}>
            {CARE_HOME.hero.particuliers.primary}
          </CareLink>
          <button type="button" className="care-menu-btn" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((v) => !v)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
