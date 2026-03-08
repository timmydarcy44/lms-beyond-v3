import type { ReactNode } from "react";
import { PartenaireSidebar } from "@/components/partenaire/partenaire-sidebar";

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
  return (
    <div className="min-h-screen bg-[#0b1424] text-white">
      <PartenaireSidebar club={club} partner={partner} activeItem={activeItem} />
      <main className="ml-[220px] px-8 py-8">{children}</main>
    </div>
  );
}
