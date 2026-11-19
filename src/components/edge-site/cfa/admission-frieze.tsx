"use client";

import { Check } from "lucide-react";

import { DELAI_DECISION } from "@/lib/cfa/admission-delays";
import { cn } from "@/lib/utils";

export type FriezeKey =
  | "profile"
  | "challenge"
  | "send"
  | "interview"
  | "decision"
  | "admission";

type Props = {
  current: FriezeKey;
};

const YOU = [
  { key: "profile" as const, label: "Profil" },
  { key: "challenge" as const, label: "Challenge et parcours", hint: "≈ 8 min" },
  { key: "send" as const, label: "Envoi" },
];

const BYOUND = [
  { key: "interview" as const, label: "Entretien" },
  { key: "decision" as const, label: "Décision", hint: `sous ${DELAI_DECISION}` },
  { key: "admission" as const, label: "Admission" },
];

const ORDER: FriezeKey[] = [
  "profile",
  "challenge",
  "send",
  "interview",
  "decision",
  "admission",
];

function Dot({ state }: { state: "done" | "current" | "todo" }) {
  if (state === "done") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6E5BFF] text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="relative flex h-7 w-7 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-white/25 blur-[6px]" aria-hidden />
        <span className="relative h-7 w-7 rounded-full bg-white" />
      </span>
    );
  }
  return <span className="h-7 w-7 rounded-full border border-[#6C7593]/70 bg-transparent" />;
}

export function AdmissionFrieze({ current }: Props) {
  const currentIndex = Math.max(ORDER.indexOf(current), 0);

  const renderGroup = (
    items: typeof YOU,
    tone: "you" | "byound",
  ) => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      {items.map((item) => {
        const index = ORDER.indexOf(item.key);
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
        return (
          <div key={item.key} className="flex items-center gap-2.5">
            <Dot state={state} />
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  state === "todo" ? "text-[#6C7593]" : "text-[#F2F4FA]",
                )}
              >
                {item.label}
              </p>
              {"hint" in item && item.hint ? (
                <p
                  className={cn(
                    "text-[11px]",
                    tone === "byound" ? "text-[#5EDCC3]/80" : "text-[#9AA3BD]",
                  )}
                >
                  {item.hint}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="mt-8 rounded-[28px] border border-[#1F2850] bg-[#0E1430] px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1">
          <p className="mb-3 text-xs font-semibold text-[#9AA3BD]">Toi</p>
          {renderGroup(YOU, "you")}
        </div>
        <div className="hidden h-16 w-px bg-[#26304F] lg:block" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="mb-3 text-xs font-semibold text-[#5EDCC3]">Byound</p>
          {renderGroup(BYOUND, "byound")}
        </div>
      </div>
    </div>
  );
}

/** Mappe le status DB vers la frise v2. */
export function friezeFromStatus(status: string, reviewing = false): FriezeKey {
  if (!status || status === "profile" || status === "brochure") return "profile";
  if (status === "challenge" || status === "dossier") return reviewing ? "send" : "challenge";
  if (status === "interview") return "interview";
  if (status === "review") return "decision";
  if (status === "administrative" || status === "admitted" || status === "contract") return "admission";
  if (status === "rejected") return "decision";
  return "challenge";
}
