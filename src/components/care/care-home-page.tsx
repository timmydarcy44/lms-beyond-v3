import { ArrowUpRight, Check } from "lucide-react";
import { CareDemoButton } from "@/components/care/care-demo-button";
import { CareHero } from "@/components/care/care-hero";
import { CareLink } from "@/components/care/care-host";
import { CARE_PLANS, formatCarePrice } from "@/lib/care/care.config";
import { CARE_HOME } from "@/lib/care/home-copy";
import type { CareDirectoryRow } from "@/lib/care/types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function CareHomePage({ practitioners }: { practitioners: CareDirectoryRow[] }) {
  const plans = [CARE_PLANS.bilan, CARE_PLANS.accompagnement, CARE_PLANS.compagnon];
  return (
    <>
      <CareHero />

      <section className="care-section">
        <div className="care-wrap care-center">
          <p className="care-eyebrow">{CARE_HOME.manifeste.eyebrow}</p>
          <h2 className="care-h2">{CARE_HOME.manifeste.title}</h2>
          <p style={{ color: "var(--care-text-2)", fontSize: 18, lineHeight: 1.6 }}>{CARE_HOME.manifeste.lead}</p>
        </div>
      </section>

      <section id="domaines" className="care-section" style={{ paddingTop: 0 }}>
        <div className="care-wrap">
          <div className="care-section-head">
            <div>
              <p className="care-eyebrow">{CARE_HOME.domaines.eyebrow}</p>
              <h2 className="care-h2" style={{ maxWidth: 720, marginBottom: 0 }}>
                {CARE_HOME.domaines.title}
              </h2>
            </div>
            <CareLink href="/care/praticiens" className="care-pill care-pill--ink">
              {CARE_HOME.domaines.cta}
            </CareLink>
          </div>
          <div className="care-grid-3" style={{ marginTop: 28 }}>
            {CARE_HOME.domaines.cards.map((card) => (
              <CareLink
                key={card.id}
                href={`/care/praticiens?domaine=${card.id}`}
                className={`care-domain${"inverted" in card && card.inverted ? " care-domain--navy" : ""}`}
              >
                <span className="care-chip">{card.program}</span>
                <h3 className="care-domain-title">{card.name}</h3>
                <p style={{ color: "inverted" in card && card.inverted ? "rgba(255,255,255,0.75)" : "var(--care-text-2)", margin: 0 }}>
                  {card.text}
                </p>
                <p style={{ fontSize: 13, marginTop: 14, color: "var(--care-muted)" }}>{card.practitioners}</p>
                <span className="care-arrow">
                  <ArrowUpRight size={18} />
                </span>
              </CareLink>
            ))}
          </div>
        </div>
      </section>

      <section id="methode" className="care-navy care-section">
        <div className="care-halo" style={{ width: 380, height: 380, background: "var(--care-halo)", top: -80, right: 60 }} />
        <div className="care-wrap">
          <h2 className="care-h2" style={{ maxWidth: 820 }}>
            {CARE_HOME.methode.title}
          </h2>
          <div className="care-method-grid">
            {CARE_HOME.methode.steps.map((step) => (
              <article key={step.n} className={`care-step${"inverted" in step && step.inverted ? " care-step--white" : ""}`}>
                <p className="care-step-n">{step.n}</p>
                <h3 style={{ fontWeight: 800, letterSpacing: "-0.03em", fontSize: 22 }}>{step.title}</h3>
                <p style={{ opacity: 0.8, margin: 0 }}>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="care-section">
        <div className="care-wrap">
          <div className="care-network-grid">
            <div className="care-network-copy">
              <h2 className="care-h2">{CARE_HOME.reseau.title}</h2>
              <div style={{ marginTop: 24 }}>
                {CARE_HOME.reseau.guarantees.map((item) => (
                  <p key={item} className="care-check">
                    <Check size={18} color="var(--care-accent)" />
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </div>
            {practitioners.map((person) => (
              <CareLink
                key={person.expert_id}
                href={`/care/praticiens/${person.slug}`}
                className="care-domain"
                style={{ minHeight: 220 }}
              >
                <span className="care-chip" style={{ width: 44, height: 44, justifyContent: "center", fontSize: 14 }}>
                  {initials(person.display_name)}
                </span>
                <h3 style={{ fontWeight: 800, fontSize: 22, margin: "16px 0 6px" }}>{person.display_name}</h3>
                <p style={{ margin: 0, color: "var(--care-text-2)" }}>{person.title}</p>
                <p style={{ marginTop: 8, color: "var(--care-muted)", fontSize: 14 }}>{person.city}</p>
              </CareLink>
            ))}
            <CareLink href="/care/praticiens" className="care-domain care-domain--navy" style={{ minHeight: 220 }}>
              <h3 style={{ fontWeight: 800, fontSize: 26, letterSpacing: "-0.04em" }}>{CARE_HOME.reseau.explorerTitle}</h3>
              <p>{CARE_HOME.reseau.explorerText}</p>
              <span className="care-pill care-pill--white" style={{ height: 44, marginTop: "auto" }}>
                {CARE_HOME.reseau.explorerCta}
              </span>
            </CareLink>
          </div>
        </div>
      </section>

      <section id="entreprises" className="care-section" style={{ paddingTop: 0 }}>
        <div className="care-wrap care-split">
          <div>
            <p className="care-kicker">{CARE_HOME.entreprises.eyebrow}</p>
            <h2 className="care-h2">{CARE_HOME.entreprises.title}</h2>
            <p className="care-lead">{CARE_HOME.entreprises.lead}</p>
            <CareDemoButton label={CARE_HOME.entreprises.cta} className="care-pill care-pill--accent" />
          </div>
          <div className="care-card" aria-hidden="true">
            <p style={{ fontSize: 12, color: "var(--care-muted)", marginTop: 0 }}>{CARE_HOME.entreprises.dashboardLabel}</p>
            <div className="care-tiles" style={{ marginBottom: 18 }}>
              {CARE_HOME.entreprises.tiles.map((tile) => (
                <div key={tile.label}>
                  <span>{tile.label}</span>
                  <strong>{tile.value}</strong>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>{CARE_HOME.entreprises.barsTitle}</p>
            {CARE_HOME.entreprises.bars.map((bar) => (
              <div key={bar.label} className="care-bar-row">
                <span>{bar.label}</span>
                <div className="care-bar">
                  <span style={{ width: `${bar.value}%` }} />
                </div>
              </div>
            ))}
            <p style={{ fontSize: 12, color: "var(--care-muted)", margin: "14px 0 0" }}>{CARE_HOME.entreprises.illustration}</p>
          </div>
        </div>
      </section>

      <section id="formules" className="care-section">
        <div className="care-wrap">
          <p className="care-eyebrow">{CARE_HOME.formules.eyebrow}</p>
          <h2 className="care-h2">{CARE_HOME.formules.title}</h2>
          <div className="care-grid-3" style={{ marginTop: 28 }}>
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`care-domain${"featured" in plan && plan.featured ? " care-plan--featured" : ""}`}
              >
                {"featured" in plan && plan.featured ? <span className="care-chip">{CARE_HOME.formules.featured}</span> : null}
                <h3 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em" }}>{plan.name}</h3>
                <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.05em", margin: "8px 0" }}>{formatCarePrice(plan.priceCents)}</p>
                <p style={{ margin: 0, opacity: 0.75 }}>{plan.sessionsLabel}</p>
                <ul className="care-plan-features">
                  {plan.features.map((item) => (
                    <li key={item}>
                      <Check size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <CareLink href="/care/praticiens" className="care-pill care-pill--choose">
                  {CARE_HOME.formules.choose}
                </CareLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="devenir" className="care-section" style={{ paddingTop: 0 }}>
        <div className="care-wrap">
          <h2 className="care-h2">{CARE_HOME.devenir.title}</h2>
          <div className="care-grid-3" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 28 }}>
            <article className="care-domain">
              <h3 style={{ fontSize: 28, fontWeight: 800 }}>{CARE_HOME.devenir.launch.title}</h3>
              <p>{CARE_HOME.devenir.launch.text}</p>
              <CareLink href="/expert/register" className="care-pill care-pill--accent" style={{ marginTop: "auto" }}>
                {CARE_HOME.devenir.launch.cta}
              </CareLink>
            </article>
            <article className="care-domain">
              <h3 style={{ fontSize: 28, fontWeight: 800 }}>{CARE_HOME.devenir.cabinet.title}</h3>
              <p>{CARE_HOME.devenir.cabinet.text}</p>
              <CareLink href="/expert/register" className="care-pill care-pill--ink" style={{ marginTop: "auto" }}>
                {CARE_HOME.devenir.cabinet.cta}
              </CareLink>
            </article>
          </div>
        </div>
      </section>

      <section className="care-final">
        <div className="care-halo" style={{ width: 400, height: 400, background: "var(--care-accent)", top: -160, left: "30%" }} />
        <div className="care-wrap">
          <h2 className="care-h2">{CARE_HOME.finalCta.title}</h2>
          <CareLink href="/care#formules" className="care-pill care-pill--white">
            {CARE_HOME.finalCta.cta}
          </CareLink>
        </div>
      </section>
    </>
  );
}
