/** Candidats référent handicap OF (dropdown Paramètres). */

export const HANDICAP_REFERENT_CANDIDATES = [
  {
    key: "timmy",
    label: "Timmy Darcy",
    email: "timmydarcy44@gmail.com",
  },
  {
    key: "jessica",
    label: "Jessica Contentin",
    email: "contentin.cabinet@gmail.com",
  },
] as const;

export type HandicapReferentCandidateKey = (typeof HANDICAP_REFERENT_CANDIDATES)[number]["key"];
