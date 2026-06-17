import { DISC_QUESTIONS_LOT1 } from "@/lib/disc/disc-questions-lot1";
import { DISC_QUESTIONS_LOT2 } from "@/lib/disc/disc-questions-lot2";
import { DISC_QUESTIONS_LOT3 } from "@/lib/disc/disc-questions-lot3";
import type { DiscQuestion } from "@/lib/disc/disc-questions-types";

export type { DiscLabel, DiscQuestion, DiscQuestionOption, DiscIpsativeResponse, DiscResultsPayload } from "@/lib/disc/disc-questions-types";

export const DISC_QUESTIONS: DiscQuestion[] = [
  ...DISC_QUESTIONS_LOT1,
  ...DISC_QUESTIONS_LOT2,
  ...DISC_QUESTIONS_LOT3,
];

export const DISC_QUESTION_COUNT = DISC_QUESTIONS.length;
