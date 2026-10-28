import { CareDirectoryFacets, CareDirectorySearch } from "@/components/care/care-directory-filters";
import { CarePractitionerCard } from "@/components/care/care-practitioner-card";
import { CareLink } from "@/components/care/care-host";
import { CARE_DIRECTORY_COPY as C } from "@/lib/care/directory-copy";
import { carePractitionersCountLabel, parseCareDirectoryQuery } from "@/lib/care/directory-search";
import { loadFilteredCareDirectory } from "@/lib/care/load-directory";
import { carePageMetadata, CARE_SEO } from "@/lib/care/seo";

export const metadata = carePageMetadata({
  title: CARE_SEO.directoryTitle,
  description: CARE_SEO.directoryDescription,
  internalPath: "/care/praticiens",
});

type Search = { q?: string; domaine?: string; format?: string };

export default async function CarePraticiensPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = parseCareDirectoryQuery(await searchParams);
  const { rows, nextSlot } = await loadFilteredCareDirectory(query);
  return (
    <>
      <section className="care-hero care-dir-hero">
        <div className="care-halo" style={{ width: 420, height: 420, background: "var(--care-accent)", top: -160, left: -60 }} />
        <div className="care-halo" style={{ width: 360, height: 360, background: "var(--care-halo)", right: -80, bottom: -140 }} />
        <div className="care-wrap">
          <p className="care-kicker">L'annuaire Byound Care</p>
          <h1 className="care-h1">{C.title}</h1>
          <p className="care-lead">{C.lead}</p>
          <CareDirectorySearch query={query} />
        </div>
      </section>
      <section className="care-section" style={{ paddingTop: 40 }}>
        <div className="care-wrap">
          <CareDirectoryFacets query={query} />
          <p className="care-count" aria-live="polite">
            {carePractitionersCountLabel(rows.length)}
          </p>
          {rows.length ? (
            <div className="care-prac-grid">
              {rows.map((row) => (
                <CarePractitionerCard key={row.expert_id} row={row} nextSlot={nextSlot[row.expert_id] ?? null} />
              ))}
            </div>
          ) : (
            <div className="care-empty">
              <p>{C.empty}</p>
              <CareLink href="/care/praticiens" className="care-pill care-pill--accent">
                {C.clear}
              </CareLink>
            </div>
          )}
          <div className="care-banners">
            <article className="care-banner care-banner--navy">
              <div>
                <h2>{C.unsureTitle}</h2>
                <p>{C.unsureLead}</p>
              </div>
              <CareLink href="/care#formules" className="care-pill care-pill--white">
                {C.unsureCta}
              </CareLink>
            </article>
            <article className="care-banner">
              <div>
                <h2>{C.joinTitle}</h2>
                <p>{C.joinLead}</p>
              </div>
              <CareLink href="/care#devenir" className="care-pill care-pill--accent">
                {C.joinCta}
              </CareLink>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
