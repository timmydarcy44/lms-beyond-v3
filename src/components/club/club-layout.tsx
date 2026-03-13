"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ClubSidebar } from "@/components/club/club-sidebar";
import { getClubTheme, getThemeVars } from "@/lib/club-theme";
import MobileHeader from "@/components/ui/mobile-header";
import Drawer from "@/components/ui/drawer";
import BottomNav from "@/components/ui/bottom-nav";

type ClubLayoutProps = {
  children: ReactNode;
  activeItem?: string;
  clubSlug?: string;
};

export function ClubLayout({ children, activeItem, clubSlug }: ClubLayoutProps) {
  const theme = getClubTheme(clubSlug ?? "su-dives-cabourg");
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d1b2e] text-white" style={getThemeVars(theme)}>
      <MobileHeader
        title="SU Dives Cabourg"
        logo="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Beyond%20Network/Logo_SU_Dives_Cabourg_-_2024.svg"
        onMenuOpen={() => setDrawerOpen(true)}
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <ClubSidebar activeItem={activeItem} theme={theme} onClose={() => setDrawerOpen(false)} />
      </Drawer>

      <div className="flex flex-1">
        <div className="hidden h-screen w-[220px] flex-shrink-0 overflow-y-auto lg:flex">
          <ClubSidebar activeItem={activeItem} theme={theme} />
        </div>
        <main className="min-w-0 flex-1 h-screen overflow-y-auto px-4 pt-14 pb-16 lg:pt-0 lg:pb-0 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
