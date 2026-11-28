import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";

/** Liens e-mail / dossier : toujours le site public, jamais localhost ni edgebs. */
export function cfaPublicOrigin() {
  return BYOUND_PUBLIC_ORIGIN.replace(/\/$/, "");
}

export function cfaCandidaterUrl(resumeToken: string) {
  const token = String(resumeToken ?? "").trim();
  return `${cfaPublicOrigin()}/ecole/candidater?resume=${encodeURIComponent(token)}&from=mail`;
}

export function cfaCandidateSetPasswordRedirect(resumeToken: string) {
  const dossier = cfaCandidaterUrl(resumeToken).replace(cfaPublicOrigin(), "");
  return `${cfaPublicOrigin()}/auth/set-password?next=${encodeURIComponent(dossier)}&flow=particulier`;
}
