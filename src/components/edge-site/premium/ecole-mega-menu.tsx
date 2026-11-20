"use client";

import Link from "next/link";
import { Manrope } from "next/font/google";
import { cn } from "@/lib/utils";
import {
  ecoleAdmissionStatusColor,
  getEcoleMenuConfig,
  type EcoleMenuConfig,
  type EcoleSpecialty,
  type EcoleTrack,
} from "@/lib/edge-site/ecole-menu";
import type { EdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import "./ecole-mega-menu.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-ecole-mega",
});

function SpecialtyLink({
  specialty,
  onNavigate,
}: {
  specialty: EcoleSpecialty;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={specialty.href}
      onClick={onNavigate}
      className="group flex items-start justify-between gap-3 rounded-xl px-3 py-[9px] outline-none transition hover:bg-white/[0.05] focus-visible:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-[#A99BFF]"
    >
      <span className="min-w-0">
        <span className="flex flex-wrap items-baseline gap-2">
          <span className="text-[15px] font-bold leading-snug text-[#F2F4FA] transition group-hover:text-white">
            {specialty.name}
          </span>
          {specialty.soon ? (
            <span className="text-[12px] font-medium text-[#6C7593]">Bientôt</span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-[#8A93AE]">
          {specialty.description}
        </span>
      </span>
      <span
        aria-hidden
        className="mt-0.5 shrink-0 text-[15px] font-semibold text-[#A99BFF] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        →
      </span>
    </Link>
  );
}

function TrackColumn({
  track,
  onNavigate,
}: {
  track: EcoleTrack;
  onNavigate?: () => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[13px] font-bold leading-none text-[#C9C2FF]">{track.eyebrow}</p>
      <h3 className="mt-2 text-2xl font-extrabold leading-tight tracking-[-0.02em] text-[#F2F4FA]">
        {track.title}
      </h3>
      <p className="mt-2 text-[13.5px] leading-snug text-[#9AA3BD]">{track.subtitle}</p>
      <div className="mt-[26px] grid grid-cols-2 gap-[26px]">
        {track.families.map((family) => (
          <div key={family.name} className="min-w-0">
            <p className="text-[12.5px] font-bold leading-snug text-[#6C7593]">{family.name}</p>
            {family.credential ? (
              <p className="mt-0.5 text-[12.5px] font-extrabold leading-snug text-[#A99BFF]">
                {family.credential}
              </p>
            ) : null}
            <div className="mt-2 space-y-0.5">
              {family.specialties
                .filter((item) => item.active)
                .map((specialty) => (
                  <SpecialtyLink
                    key={specialty.name}
                    specialty={specialty}
                    onNavigate={onNavigate}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionCard({
  action,
  onNavigate,
}: {
  action: EcoleMenuConfig["action"];
  onNavigate?: () => void;
}) {
  return (
    <aside
      className="w-[300px] shrink-0 rounded-3xl border border-[#2E3570] p-[26px]"
      style={{
        background: "linear-gradient(160deg, #2A2270 0%, #151B3A 60%)",
      }}
    >
      <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#F2F4FA]">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: ecoleAdmissionStatusColor(action.status) }}
          aria-hidden
        />
        {action.statusLabel}
      </p>
      <h3 className="mt-4 text-[26px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
        {action.intakeTitle}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-[#B7BED3]">{action.body}</p>
      <Link
        href={action.candidaterHref}
        onClick={onNavigate}
        className="mt-6 flex h-[50px] w-full items-center justify-center rounded-full bg-white text-[15px] font-bold text-[#070C1C] transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A99BFF]"
      >
        Candidater →
      </Link>
      <Link
        href={action.rendezVousHref}
        onClick={onNavigate}
        className="mt-3 block text-center text-[14px] font-semibold text-[#C9C2FF] transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A99BFF]"
      >
        Prendre rendez-vous
      </Link>
    </aside>
  );
}

export function EcoleMegaMenu({
  routes,
  id,
  onNavigate,
}: {
  routes: EdgeMarketingRoutes;
  id: string;
  onNavigate?: () => void;
}) {
  const menu = getEcoleMenuConfig(routes);

  return (
    <div
      id={id}
      role="region"
      aria-label="Formations Byound School"
      className={cn(
        manrope.variable,
        "ecole-mega-panel overflow-hidden rounded-[30px] border border-[#1F2850] bg-[#0E1430] text-[#F2F4FA] shadow-[0_30px_80px_#00000099]",
      )}
      style={{ fontFamily: "var(--font-ecole-mega), Manrope, sans-serif" }}
    >
      <div className="flex gap-11 px-10 py-9">
        <TrackColumn track={menu.tracks[0]} onNavigate={onNavigate} />
        <div className="w-px shrink-0 self-stretch bg-[#1F2850]" aria-hidden />
        <TrackColumn track={menu.tracks[1]} onNavigate={onNavigate} />
        <ActionCard action={menu.action} onNavigate={onNavigate} />
      </div>
      <div className="flex items-center justify-between gap-6 border-t border-[#1F2850] bg-[#0B1028] px-10 py-[18px]">
        <Link
          href={menu.footer.discover.href}
          onClick={onNavigate}
          className="text-[14px] font-semibold text-[#F2F4FA] transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A99BFF]"
        >
          {menu.footer.discover.label}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-[13.5px] font-semibold text-[#9AA3BD]">
          <Link
            href={menu.footer.finance.href}
            onClick={onNavigate}
            className="transition hover:text-[#F2F4FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A99BFF]"
          >
            {menu.footer.finance.label}
          </Link>
          <span className="hidden h-4 w-px bg-[#26304F] sm:block" aria-hidden />
          <Link
            href={menu.footer.hesitate.href}
            onClick={onNavigate}
            className="transition hover:text-[#F2F4FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A99BFF]"
          >
            {menu.footer.hesitate.label}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function EcoleMobileAccordion({
  routes,
  onNavigate,
}: {
  routes: EdgeMarketingRoutes;
  onNavigate?: () => void;
}) {
  const menu = getEcoleMenuConfig(routes);

  return (
    <div className="space-y-5 pb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
      <div
        className="rounded-3xl border border-[#2E3570] p-5"
        style={{ background: "linear-gradient(160deg, #2A2270 0%, #151B3A 60%)" }}
      >
        <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#F2F4FA]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: ecoleAdmissionStatusColor(menu.action.status) }}
            aria-hidden
          />
          {menu.action.statusLabel}
        </p>
        <h3 className="mt-3 text-[22px] font-extrabold leading-tight text-white">
          {menu.action.intakeTitle}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#B7BED3]">{menu.action.body}</p>
        <Link
          href={menu.action.candidaterHref}
          onClick={onNavigate}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-white text-[15px] font-bold text-[#070C1C]"
        >
          Candidater →
        </Link>
      </div>

      {menu.tracks.map((track) => (
        <details key={track.id} className="group rounded-2xl border border-[#1F2850] bg-[#0E1430] open:pb-2">
          <summary className="cursor-pointer list-none px-4 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-bold text-[#C9C2FF]">{track.eyebrow}</p>
                <p className="mt-1 text-[17px] font-extrabold text-white">{track.title}</p>
              </div>
              <span className="text-[#A99BFF] transition group-open:rotate-90" aria-hidden>
                →
              </span>
            </div>
          </summary>
          <div className="space-y-4 px-2 pb-3">
            {track.families.map((family) => (
              <div key={family.name}>
                <p className="px-3 text-[12.5px] font-bold text-[#6C7593]">{family.name}</p>
                {family.credential ? (
                  <p className="px-3 text-[12.5px] font-extrabold text-[#A99BFF]">
                    {family.credential}
                  </p>
                ) : null}
                <div className="mt-1">
                  {family.specialties
                    .filter((item) => item.active)
                    .map((specialty) => (
                      <SpecialtyLink
                        key={specialty.name}
                        specialty={specialty}
                        onNavigate={onNavigate}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}

      <div className="space-y-1 border-t border-white/10 pt-3">
        {[menu.footer.finance, menu.footer.discover, { label: "Prendre rendez-vous →", href: menu.action.rendezVousHref }].map(
          (link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={onNavigate}
              className="block rounded-xl px-3 py-3 text-[15px] font-semibold text-[#F2F4FA] hover:bg-white/[0.05]"
            >
              {link.label}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
