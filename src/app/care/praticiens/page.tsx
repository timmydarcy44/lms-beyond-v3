import { Manrope } from "next/font/google";
import { CareFindCard } from "@/components/care/care-find-card";
import { CareLink } from "@/components/care/care-host";
import { CARE_DIRECTORY_COPY as C } from "@/lib/care/directory-copy";
import { careDirectoryHref, parseCareDirectoryQuery } from "@/lib/care/directory-search";
import { CARE_DOMAINS } from "@/lib/care/domains";
import { isCarePlaceholderText } from "@/lib/care/profile-format";
import { loadFilteredCareDirectory } from "@/lib/care/load-directory";
import { carePageMetadata, CARE_SEO } from "@/lib/care/seo";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

export const revalidate = 600;

export const metadata = carePageMetadata({
  title: CARE_SEO.directoryTitle,
  description: CARE_SEO.directoryDescription,
  internalPath: "/care/praticiens",
});

type Search = {
  q?: string;
  besoin?: string;
  ou?: string;
  quand?: string;
  domaine?: string;
  format?: string;
  affiche?: string;
};

export default async function CarePraticiensPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = parseCareDirectoryQuery(await searchParams);
  const { rows } = await loadFilteredCareDirectory(query);
  const visible = rows.slice(0, query.affiche);
  const cities = [...new Set(rows.map((row) => row.city).filter((city): city is string => Boolean(city && !isCarePlaceholderText(city))))];
  const countLabel = `${rows.length} praticien${rows.length > 1 ? "s" : ""} · ${cities.length ? `${cities.join(", ")} et en visio` : "en visio"}`;
  return (
    <div className={`${manrope.className} cf-page`}>
      <div className="care-wrap">
        <header className="cf-head">
          <div>
            <h1>{C.title}</h1>
            <p>{C.lead}</p>
          </div>
          <p className="cf-count">{countLabel}</p>
        </header>
        <form className="cf-search" action="/care/praticiens" method="get">
          {query.domaine ? <input type="hidden" name="domaine" value={query.domaine} /> : null}
          {query.format ? <input type="hidden" name="format" value={query.format} /> : null}
          <label>
            Besoin
            <input name="besoin" defaultValue={query.besoin} placeholder="Domaine ou prestation" />
          </label>
          <label>
            Où
            <input name="ou" defaultValue={query.ou} placeholder="Ville ou visio" />
          </label>
          <label>
            Quand
            <select name="quand" defaultValue={query.quand ?? ""}>
              <option value="">Peu importe</option>
              <option value="aujourdhui">Aujourd&apos;hui</option>
              <option value="semaine">Cette semaine</option>
              <option value="mois">Ce mois-ci</option>
            </select>
          </label>
          <button type="submit">Rechercher</button>
        </form>
        <div className="cf-pills">
          <CareLink href={careDirectoryHref({ ...query, domaine: null, format: null, quand: null, affiche: 9 })} className={`cf-pill${!query.domaine && !query.format && !query.quand ? " is-on" : ""}`}>
            Tous
          </CareLink>
          {CARE_DOMAINS.map((domain) => (
            <CareLink key={domain.id} href={careDirectoryHref({ ...query, domaine: domain.id, affiche: 9 })} className={`cf-pill${query.domaine === domain.id ? " is-on" : ""}`}>
              {domain.label}
            </CareLink>
          ))}
          <CareLink href={careDirectoryHref({ ...query, format: "visio", affiche: 9 })} className={`cf-pill${query.format === "visio" ? " is-on" : ""}`}>
            En visio
          </CareLink>
          <CareLink href={careDirectoryHref({ ...query, quand: "semaine", affiche: 9 })} className={`cf-pill${query.quand === "semaine" ? " is-on" : ""}`}>
            Disponible cette semaine
          </CareLink>
        </div>
        {visible.length ? (
          <div className="cf-grid">
            {visible.map((row) => (
              <CareFindCard key={row.expert_id} row={row} />
            ))}
          </div>
        ) : (
          <div className="cf-empty">
            <p>Aucun praticien ne correspond</p>
            <CareLink href={careDirectoryHref({ ...query, quand: null, ou: "visio", format: "visio" })} className="cf-btn cf-btn--pink">
              Élargir la recherche
            </CareLink>
          </div>
        )}
        {rows.length > visible.length ? (
          <CareLink href={careDirectoryHref({ ...query, affiche: query.affiche + 9 })} className="cf-more-people">
            Voir plus
          </CareLink>
        ) : null}
      </div>
    </div>
  );
}
