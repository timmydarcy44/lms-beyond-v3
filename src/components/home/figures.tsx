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
        <h2 className="max-w-5xl text-[clamp(40px,5.4vw,72px)] font-extrabold leading-[1.02] tracking-[-2px] text-[#07080B]">
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
        <div className="relative mt-8 min-h-[320px] overflow-hidden rounded-[36px] bg-[#0B1124]" style={{ aspectRatio: "16 / 7" }}>
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
          <p className="pointer-events-none absolute bottom-8 left-8 max-w-xl text-[clamp(28px,3.4vw,44px)] font-extrabold leading-none text-white">
            {HOME_VIDEO.title}
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
