"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  useProfilEdgeHubData,
  type ProfilEdgeHubData,
} from "@/hooks/use-profil-edge-hub-data";
import {
  computeProfilEdgeMaturity,
  parseProfessionalProject,
} from "@/lib/particulier/profil-edge-maturity";

const ProfilEdgeHubContext = createContext<ProfilEdgeHubData | null>(null);

/** Un seul chargement hub partagé entre Vue d'ensemble et Mon évolution. */
export function ProfilEdgeHubProvider({ children }: { children: ReactNode }) {
  const value = useProfilEdgeHubData();
  return <ProfilEdgeHubContext.Provider value={value}>{children}</ProfilEdgeHubContext.Provider>;
}

const EMPTY_HUB: ProfilEdgeHubData = {
  loading: false,
  error: null,
  discScores: null,
  hasIdmc: false,
  hasSoftSkills: false,
  softSkillsScores: null,
  idmcAxes: null,
  softSkillsRadar: [],
  badgeAwarded: false,
  badgeName: "",
  selectedCareer: null,
  professionalProject: parseProfessionalProject(null),
  hardSkills: [],
  skillsMetadata: {},
  experiences: [],
  diplomas: [],
  profileRow: {},
  typeProfil: null,
  testsDone: 0,
  profilTestsComplete: false,
  maturity: computeProfilEdgeMaturity({
    profile: {},
    hasDisc: false,
    hasSoftSkills: false,
    hasIdmc: false,
    experiencesCount: 0,
    diplomasCount: 0,
  }),
  matching: null,
  objectiveLabel: "votre objectif professionnel",
  hasProject: false,
  firstName: "",
  lastName: "",
  avatarUrl: null,
  reload: async () => {},
};

export function useProfilEdgeHub(): ProfilEdgeHubData {
  const ctx = useContext(ProfilEdgeHubContext);
  if (!ctx) {
    return EMPTY_HUB;
  }
  return ctx;
}
