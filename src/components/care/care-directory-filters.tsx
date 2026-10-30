"use client";

import { CareLink, useCarePublicHost, careFormAction } from "@/components/care/care-host";
import { CARE_DOMAINS } from "@/lib/care/domains";
import {
  CARE_QUICK_SEARCHES,
  careDirectoryHref,
  type CareDirectoryQuery,
} from "@/lib/care/directory-search";
import { CARE_DIRECTORY_COPY as C } from "@/lib/care/directory-copy";

export function CareDirectorySearch({ query }: { query: CareDirectoryQuery }) {
  const publicHost = useCarePublicHost();
  return (
    <>
      <form className="care-search" action={careFormAction("/care/praticiens", publicHost)} method="get" key={`${query.q}|${query.domaine}|${query.format}`}>
        {query.domaine ? <input type="hidden" name="domaine" value={query.domaine} /> : null}
        {query.format ? <input type="hidden" name="format" value={query.format} /> : null}
        <label htmlFor="care-q" className="care-sr-only">
          {C.searchLabel}
        </label>
        <input
          id="care-q"
          type="search"
          name="q"
          defaultValue={query.q}
          placeholder={C.searchPlaceholder}
          autoComplete="off"
        />
        <button type="submit" className="care-sr-only">
          {C.searchLabel}
        </button>
        <CareLink href="/care/praticiens" className="care-pill care-pill--accent" style={{ height: 56 }}>
          {C.reset}
        </CareLink>
      </form>
      <div className="care-quick">
        {CARE_QUICK_SEARCHES.map((label) => (
          <CareLink
            key={label}
            href={careDirectoryHref({ ...query, q: label })}
            className={`care-chip-link care-chip-link--on-dark${query.q === label ? " is-on" : ""}`}
          >
            {label}
          </CareLink>
        ))}
      </div>
    </>
  );
}

export function CareDirectoryFacets({ query }: { query: CareDirectoryQuery }) {
  return (
    <div className="care-filters">
      <div className="care-filter-row">
        <CareLink
          href={careDirectoryHref({ ...query, domaine: null })}
          className={`care-chip-link${query.domaine ? "" : " is-on"}`}
          aria-pressed={!query.domaine}
        >
          {C.tous}
        </CareLink>
        {CARE_DOMAINS.map((domain) => (
          <CareLink
            key={domain.id}
            href={careDirectoryHref({ ...query, domaine: domain.id })}
            className={`care-chip-link${query.domaine === domain.id ? " is-on" : ""}`}
            aria-pressed={query.domaine === domain.id}
          >
            {domain.label}
          </CareLink>
        ))}
      </div>
      <div className="care-segment" role="group" aria-label="Format">
        {(
          [
            [null, C.tous],
            ["cabinet", C.cabinet],
            ["visio", C.visio],
          ] as const
        ).map(([format, label]) => (
          <CareLink
            key={label}
            href={careDirectoryHref({ ...query, format })}
            className={!format && !query.format ? "is-on" : query.format === format ? "is-on" : ""}
            aria-pressed={format ? query.format === format : !query.format}
          >
            {label}
          </CareLink>
        ))}
      </div>
    </div>
  );
}
