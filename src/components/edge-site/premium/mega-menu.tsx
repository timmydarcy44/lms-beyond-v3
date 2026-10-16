"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Manrope } from "next/font/google";
import { cn } from "@/lib/utils";
import type { NeoMegaMenuConfig, NeoPill, NeoTile } from "@/lib/edge-site/neo-mega-menus";
import "./mega-menu.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-neo-mega",
});

function Pill({ pill, tone }: { pill: NeoPill; tone: NeoTile["tone"] }) {
  const className = cn(
    "neo-mega__pill",
    pill.featured && tone === "navy" && "neo-mega__pill--featured",
  );
  if (!pill.href) return <span className={className}>{pill.label}</span>;
  return (
    <Link href={pill.href} className={className}>
      {pill.label}
    </Link>
  );
}

function TileBody({ tile }: { tile: NeoTile }) {
  return (
    <>
      {tile.eyebrow ? <span className="neo-mega__eyebrow">{tile.eyebrow}</span> : null}
      <p className="neo-mega__title">{tile.title}</p>
      {tile.description ? <p className="neo-mega__desc">{tile.description}</p> : null}
      {tile.pills ? (
        <div className="neo-mega__pills" aria-hidden={!tile.pills.some((pill) => pill.href)}>
          {tile.pills.map((pill) => (
            <Pill key={pill.label} pill={pill} tone={tile.tone} />
          ))}
        </div>
      ) : null}
      {tile.bars ? (
        <div className="neo-mega__bars" aria-hidden>
          {tile.bars.map((bar) => (
            <div key={bar.label} className="neo-mega__bar-row">
              <span>{bar.label}</span>
              <span className="neo-mega__track">
                <span className="neo-mega__fill" style={{ width: bar.width }} />
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {tile.groups ? (
        <div className="neo-mega__groups">
          {tile.groups.map((group) => (
            <div key={group.label} className="space-y-2">
              <Link href={group.href} className="neo-mega__group-link">
                {group.label}
                <ArrowRight size={16} strokeWidth={2} aria-hidden />
              </Link>
              <div className="neo-mega__pills">
                {group.pills.map((pill) => (
                  <Pill key={pill.label} pill={{ ...pill, href: pill.href ?? "#" }} tone={tile.tone} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {tile.cta ? (
        <span className="neo-mega__cta">
          {tile.cta}
          <ArrowRight size={16} strokeWidth={2} aria-hidden />
        </span>
      ) : null}
    </>
  );
}

function Tile({ tile, onNavigate }: { tile: NeoTile; onNavigate?: () => void }) {
  const className = cn("neo-mega__tile", tile.tone === "navy" ? "neo-mega__tile--navy" : "neo-mega__tile--violet");
  if (tile.href) {
    return (
      <Link href={tile.href} className={className} onClick={onNavigate}>
        <TileBody tile={tile} />
      </Link>
    );
  }
  return (
    <div className={className}>
      <TileBody tile={tile} />
    </div>
  );
}

export function MegaMenu({
  menu,
  id,
  onNavigate,
  mobile = false,
}: {
  menu: NeoMegaMenuConfig;
  id: string;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  return (
    <div
      id={id}
      role="region"
      aria-label={menu.label}
      className={cn("neo-mega", manrope.variable, mobile && "neo-mega--mobile")}
    >
      <div className="neo-mega__grid">
        {menu.tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} onNavigate={onNavigate} />
        ))}
        <div className="neo-mega__side">
          {menu.side.map((section) => (
            <div key={section.title}>
              <p className="neo-mega__side-title">{section.title}</p>
              <div className="mt-1">
                {section.links.map((link) => (
                  <Link key={link.title} href={link.href} className="neo-mega__side-link" onClick={onNavigate}>
                    <span>
                      <strong>{link.title}</strong>
                      <span>{link.subtitle}</span>
                    </span>
                    <ArrowRight className="neo-mega__arrow" size={16} strokeWidth={2} aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="neo-mega__footer">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          {menu.bar.note ? <p className="neo-mega__note">{menu.bar.note}</p> : null}
          {menu.bar.textLink ? (
            <Link href={menu.bar.textLink.href} className="neo-mega__text-link" onClick={onNavigate}>
              {menu.bar.textLink.label}
            </Link>
          ) : null}
        </div>
        <div className="neo-mega__actions">
          {menu.bar.actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                "neo-mega__button",
                action.variant === "primary" ? "neo-mega__button--primary" : "neo-mega__button--secondary",
              )}
              onClick={onNavigate}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
