"use client";

import { useState } from "react";
import { CareHeader } from "@/components/care/care-header";
import { CareDemoDialog } from "@/components/care/care-demo-dialog";
import { CareLink } from "@/components/care/care-host";
import { CARE_HOME } from "@/lib/care/home-copy";

export function CareHero() {
  const [audience, setAudience] = useState<"particuliers" | "entreprises">("particuliers");
  const [demoOpen, setDemoOpen] = useState(false);
  const copy = CARE_HOME.hero[audience];

  return (
    <section className="care-hero">
      <div className="care-halo" style={{ width: 520, height: 520, background: "var(--care-accent)", top: -160, left: -80 }} />
      <div className="care-halo" style={{ width: 420, height: 420, background: "var(--care-halo)", bottom: -180, right: -40 }} />
      <CareHeader audience={audience} onAudience={setAudience} />
      <div className="care-wrap care-hero-grid">
        <div>
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
        <div className="care-mocks" aria-hidden="true">
          <div className="care-card" style={{ width: "86%" }}>
            <p style={{ margin: "0 0 16px", fontWeight: 800 }}>{CARE_HOME.mocks.bilanTitle}</p>
            {[72, 48, 61].map((value) => (
              <div key={value} style={{ marginBottom: 12 }}>
                <div className="care-bar">
                  <span style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="care-card care-card--glass" style={{ position: "absolute", right: 0, bottom: 12, width: 220 }}>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>{CARE_HOME.mocks.practitionerLabel}</p>
            <p style={{ margin: "8px 0 0", fontWeight: 800 }}>{CARE_HOME.mocks.practitionerName}</p>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>{CARE_HOME.mocks.practitionerRole}</p>
          </div>
        </div>
      </div>
      <CareDemoDialog open={demoOpen} onClose={() => setDemoOpen(false)} />
    </section>
  );
}
