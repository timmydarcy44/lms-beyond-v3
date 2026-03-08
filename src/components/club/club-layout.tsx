import type { ReactNode } from "react";
import { ClubSidebar } from "@/components/club/club-sidebar";
import { getClubTheme, getThemeVars } from "@/lib/club-theme";

type ClubLayoutProps = {
  children: ReactNode;
  activeItem?: string;
  clubSlug?: string;
};

export function ClubLayout({ children, activeItem, clubSlug }: ClubLayoutProps) {
  const theme = getClubTheme(clubSlug ?? "su-dives-cabourg");

  return (
    <div
      className="min-h-screen bg-[#0d1b2e] text-white"
      style={getThemeVars(theme)}
    >
      <ClubSidebar activeItem={activeItem} theme={theme} />
      <main className="ml-[236px] px-8 py-8">{children}</main>
    </div>
  );
}
