import { CareLogo } from "@/components/care/care-logo";
import { CareLink } from "@/components/care/care-host";
import { CARE_HOME } from "@/lib/care/home-copy";

export function CareFooter() {
  return (
    <footer className="care-footer">
      <div className="care-halo" style={{ width: 280, height: 280, background: "var(--care-halo)", bottom: -120, left: 40 }} />
      <div className="care-wrap">
        <div className="care-grid-3">
          {CARE_HOME.footer.columns.map((column) => (
            <div key={column.title}>
              <p className="care-eyebrow" style={{ color: "rgba(255,255,255,0.55)" }}>
                {column.title}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {column.links.map((link) => (
                  <li key={link.href + link.label} style={{ marginBottom: 10 }}>
                    <CareLink href={link.href} style={{ color: "rgba(255,255,255,0.86)", textDecoration: "none" }}>
                      {link.label}
                    </CareLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 48, display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <CareLogo />
          <p style={{ maxWidth: 420, color: "rgba(255,255,255,0.7)", margin: 0 }}>{CARE_HOME.footer.tagline}</p>
        </div>
        <p className="care-helpline">{CARE_HOME.footer.helpline}</p>
      </div>
    </footer>
  );
}
