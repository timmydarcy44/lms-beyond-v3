import type { DiscLabel } from "@/lib/disc/disc-questions-types";
import { DISC_PROFILE_LABELS } from "@/lib/disc/disc-constants";
import {
  normalizeDiscScores,
  resolveDiscProfile,
  type DiscNormalizedScores,
} from "@/lib/disc/disc-scoring";

export { DISC_PROFILE_LABELS };

export function getDominantDiscLabel(scores: DiscNormalizedScores): DiscLabel {
  return resolveDiscProfile(scores).dominant;
}

export function formatDiscProfileSentence(scores: DiscNormalizedScores): string {
  const { isMixed, dominant, secondary } = resolveDiscProfile(scores);
  if (isMixed && secondary) {
    return `Votre profil comportemental est principalement ${DISC_PROFILE_LABELS[dominant]}, avec une influence ${DISC_PROFILE_LABELS[secondary]}.`;
  }
  return `Votre profil comportemental est principalement ${DISC_PROFILE_LABELS[dominant]}.`;
}

export { normalizeDiscScores };
