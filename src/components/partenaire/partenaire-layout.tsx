"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { PartenaireSidebar } from "@/components/partenaire/partenaire-sidebar";
import MobileHeader from "@/components/ui/mobile-header";
import Drawer from "@/components/ui/drawer";
import BottomNav from "@/components/ui/bottom-nav";

type ClubInfo = {
  name: string;
  initials: string;
  logoUrl?: string;
};

type PartnerInfo = {
  name: string;
  initials: string;
};

type PartenaireLayoutProps = {
  children: ReactNode;
  club: ClubInfo;
  partner: PartnerInfo;
  activeItem?: string;
};

export function PartenaireLayout({ children, club, partner, activeItem }: PartenaireLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1424] text-white">
      <MobileHeader title="Brasserie du Port" initials="BP" onMenuOpen={() => setDrawerOpen(true)} />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <PartenaireSidebar
          club={club}
          partner={partner}
          activeItem={activeItem}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>

      <div className="flex flex-1">
        <div className="hidden h-screen w-[220px] flex-shrink-0 overflow-y-auto lg:flex">
          <PartenaireSidebar club={club} partner={partner} activeItem={activeItem} />
        </div>
        <main className="min-w-0 flex-1 h-screen overflow-y-auto px-4 pt-14 pb-16 lg:pt-0 lg:pb-0 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <BottomNav variant="partenaire" activeColor="#C8102E" />
    </div>
  );
}
