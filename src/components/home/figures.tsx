"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { HOME_STATS, HOME_VIDEO } from "@/content/home";
import { Section, StatTile } from "@/components/home/ui";
import { Reveal } from "@/components/home/reveal";

export function HomeFigures() {
  const [playing, setPlaying] = useState(false);
  const stats = HOME_STATS.filter((item) => item.value && item.label && item.source);

  return (
    <Section className="bg-[#F4F4F1]">
      <Reveal>
        <h2 className="max-w-5xl text-[32px] font-extrabold leading-[1.05] tracking-[-1px] text-[#07080B] sm:text-[clamp(40px,5.4vw,72px)] sm:leading-[1.02] sm:tracking-[-2px]">
          Les entreprises n&apos;embauchent plus seulement des diplômes.
          <br />
          <span className="text-[#6E5BFF]">Elles recherchent des compétences.</span>
        </h2>
        {stats.length > 0 ? (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {stats.map((item, index) => (
              <StatTile
                key={item.label}
                value={item.value}
                label={item.label}
                source={item.source ?? ""}
                light={index === stats.length - 1}
              />
            ))}
          </div>
        ) : null}
        <div className="relative mt-8 aspect-[4/5] min-h-[420px] overflow-hidden rounded-[28px] bg-[#0B1124] sm:aspect-video sm:min-h-0 sm:rounded-[36px] lg:aspect-[16/7]">
          {playing ? (
            <video className="absolute inset-0 h-full w-full object-cover" controls autoPlay playsInline src={HOME_VIDEO.src}>
              <track kind="captions" />
            </video>
          ) : (
            <button
              type="button"
              className="absolute left-1/2 top-1/2 flex h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#07080B]"
              aria-label="Lire la vidéo"
              onClick={() => setPlaying(true)}
            >
              <Play className="ml-1" fill="currentColor" strokeWidth={2} aria-hidden />
            </button>
          )}
          <p className="pointer-events-none absolute bottom-6 left-6 right-6 max-w-xl text-[28px] font-extrabold leading-[1.05] text-white sm:bottom-8 sm:left-8 sm:right-auto sm:text-[clamp(28px,3.4vw,44px)] sm:leading-none">
            {HOME_VIDEO.title}
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
