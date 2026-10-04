"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import { cn } from "@/lib/utils";

export type DiagnosticInviteCard = {
  id: "disc" | "idmc" | "soft";
  kicker: string;
  title: string;
  duration: string;
  body: string;
  href: string;
  imageSrc: string;
};

export const DIAGNOSTIC_INVITE_CARDS: DiagnosticInviteCard[] = [
  {
    id: "disc",
    kicker: "Comportement",
    title: "DISC",
    duration: "Environ 8 minutes",
    body: "Le DISC mesure votre style dominant (Dominant, Influent, Stable, Consciencieux) : comment vous décidez, communiquez et agissez au travail.",
    href: "/dashboard/apprenant/test-comportemental-intro",
    imageSrc: "/images/parcours-commercial-ia.jpg",
  },
  {
    id: "idmc",
    kicker: "Motivation",
    title: "IDMC",
    duration: "Environ 10 minutes",
    body: "L’IDMC évalue huit axes cognitifs — organisation, adaptation, méthodes, résolution de problèmes — pour orienter vos priorités d’apprentissage.",
    href: "/dashboard/apprenant/idmc-intro",
    imageSrc: "/images/beyond-hero-abstract.png",
  },
  {
    id: "soft",
    kicker: "Compétences",
    title: "Soft skills",
    duration: "Environ 12 minutes",
    body: "Vingt compétences comportementales classées de la plus forte à la plus fragile, pour alimenter votre matching métier et vos formations.",
    href: "/dashboard/apprenant/soft-skills-intro",
    imageSrc:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/objectifs%20pro.png",
  },
];

type Props = {
  discDone?: boolean;
  idmcDone?: boolean;
  softDone?: boolean;
  className?: string;
};

function cardDone(id: DiagnosticInviteCard["id"], props: Props): boolean {
  if (id === "disc") return Boolean(props.discDone);
  if (id === "idmc") return Boolean(props.idmcDone);
  return Boolean(props.softDone);
}

export function DiagnosticTestInviteCards({ discDone, idmcDone, softDone, className }: Props) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {DIAGNOSTIC_INVITE_CARDS.map((card) => {
        const done = cardDone(card.id, { discDone, idmcDone, softDone });
        return (
          <Link
            key={card.id}
            href={card.href}
            className={cn(
              "group relative isolate flex min-h-[300px] overflow-hidden rounded-[1.35rem] sm:min-h-[340px]",
              "ring-1 ring-white/[0.08] transition-shadow hover:ring-white/20",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3D7BFF]",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.imageSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
            />

            <div
              className="absolute inset-0 bg-gradient-to-t from-[#05060a]/90 via-[#05060a]/35 to-transparent transition duration-500 group-hover:bg-[#05060a]/78"
              aria-hidden
            />

            {done ? (
              <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 ring-1 ring-emerald-400/30">
                <Check className="h-3.5 w-3.5" />
                Fait
              </span>
            ) : null}

            <div className="relative z-10 mt-auto flex w-full flex-col p-5 sm:p-6">
              <div className="transition duration-300 group-hover:opacity-0 group-focus-visible:opacity-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  {card.kicker}
                </p>
                <h3 className="mt-1.5 text-[1.45rem] font-bold tracking-[-0.03em] text-white">
                  {card.title}
                </h3>
                <p className="mt-1 text-[12px] font-medium text-white/50">{card.duration}</p>
                {!done ? (
                  <span
                    className={cn(
                      CONNECT_BTN_PRIMARY,
                      "mt-4 inline-flex w-fit px-4 py-2 text-[12px]",
                    )}
                  >
                    Passer le test
                  </span>
                ) : (
                  <span className="mt-4 inline-block text-[12px] font-semibold text-[#9EC0FF]">
                    Revoir ou mettre à jour →
                  </span>
                )}
              </div>

              <div className="pointer-events-none absolute inset-x-5 bottom-5 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:inset-x-6 sm:bottom-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                  {card.kicker} · {card.title}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/88">{card.body}</p>
                <p className="mt-3 text-[11px] text-white/45">{card.duration}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
