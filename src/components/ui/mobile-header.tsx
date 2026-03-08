"use client";

import { Menu, Bell } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  logo?: string;
  initials?: string;
  onMenuOpen: () => void;
}

export default function MobileHeader({ title, logo, initials, onMenuOpen }: MobileHeaderProps) {
  return (
    <header className="safe-area-top fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-[#0d1b2e]/95 px-4 backdrop-blur-xl lg:hidden">
      <button
        onClick={onMenuOpen}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        {logo ? (
          <img src={logo} className="h-7 w-7 object-contain" alt={title} />
        ) : initials ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white">
            {initials}
          </div>
        ) : null}
        <span className="max-w-[180px] truncate text-sm font-bold text-white">{title}</span>
      </div>

      <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
        <Bell className="h-5 w-5" />
      </button>
    </header>
  );
}
