"use client";

import { useState } from "react";
import { CareDemoDialog } from "@/components/care/care-demo-dialog";
import { CareLink, useCareAudience } from "@/components/care/care-host";
import { CARE_HOME } from "@/lib/care/home-copy";

export function CareHero() {
  const { audience } = useCareAudience();
  const [demoOpen, setDemoOpen] = useState(false);
  const copy = CARE_HOME.hero[audience];

  return (
    <section className="care-hero">
      <figure className="care-hero-photo">
        <img src={CARE_HOME.heroPhoto.src} alt={CARE_HOME.heroPhoto.alt} />
      </figure>
      <div className="care-halo" style={{ width: 420, height: 420, background: "var(--care-accent)", top: -240, left: -180, opacity: 0.22 }} />
      <div className="care-halo" style={{ width: 420, height: 420, background: "var(--care-halo)", bottom: -180, right: -40 }} />
      <div className="care-wrap care-hero-copy">
        <p className="care-kicker">{copy.eyebrow}</p>
        <h1 className="care-h1">{copy.title}</h1>
        <p className="care-lead">{copy.lead}</p>
        <div className="care-hero-actions">
          {audience === "entreprises" ? (
            <button type="button" className="care-pill care-pill--accent" onClick={() => setDemoOpen(true)}>
              {copy.primary}
            </button>
          ) : (
            <CareLink href="/care#formules" className="care-pill care-pill--accent">
              {copy.primary}
            </CareLink>
          )}
          <CareLink
            href={audience === "entreprises" ? "/care#entreprises" : "/care/praticiens"}
            className="care-pill care-pill--ghost"
          >
            {copy.secondary}
          </CareLink>
        </div>
      </div>
      <CareDemoDialog open={demoOpen} onClose={() => setDemoOpen(false)} />
    </section>
  );
}
