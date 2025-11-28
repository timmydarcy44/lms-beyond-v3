"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, FileText, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export function JessicaHeader() {
  const pathname = usePathname();

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b backdrop-blur-xl"
      style={{
        borderColor: "#D2B48C50",
        backgroundColor: "#F5F5DC80",
      }}
    >
      <nav className="mx-auto max-w-[1440px] px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo Jessica Contentin */}
          <Link href="/super/jessica-dashboard" className="flex items-center">
            <span 
              className="text-lg font-normal tracking-tight"
              style={{ 
                color: "#8B4513",
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              Jessica Contentin
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {/* Agenda */}
            <Link
              href="/super/agenda"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-lg flex items-center gap-2",
                pathname === "/super/agenda" || pathname?.startsWith("/super/agenda/")
                  ? "text-white"
                  : "text-[#A0522D] hover:text-white",
                pathname === "/super/agenda" || pathname?.startsWith("/super/agenda/")
                  ? "bg-[#C6A664]"
                  : "bg-[#E6D9C6] hover:bg-[#C6A664]",
              )}
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
            >
              <Calendar className="h-4 w-4" />
              <span>Agenda</span>
            </Link>

            {/* Catalogue */}
            <Link
              href="/super/catalogue-jessica"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-lg flex items-center gap-2",
                pathname === "/super/catalogue-jessica" || pathname?.startsWith("/super/catalogue-jessica/")
                  ? "text-white"
                  : "text-[#A0522D] hover:text-white",
                pathname === "/super/catalogue-jessica" || pathname?.startsWith("/super/catalogue-jessica/")
                  ? "bg-[#C6A664]"
                  : "bg-[#E6D9C6] hover:bg-[#C6A664]",
              )}
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
            >
              <Package className="h-4 w-4" />
              <span>Catalogue</span>
            </Link>

            {/* Gestion client */}
            <Link
              href="/super/gestion-client"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-lg flex items-center gap-2",
                pathname === "/super/gestion-client" || pathname?.startsWith("/super/gestion-client/")
                  ? "text-white"
                  : "text-[#A0522D] hover:text-white",
                pathname === "/super/gestion-client" || pathname?.startsWith("/super/gestion-client/")
                  ? "bg-[#C6A664]"
                  : "bg-[#E6D9C6] hover:bg-[#C6A664]",
              )}
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
            >
              <Users className="h-4 w-4" />
              <span>Gestion client</span>
            </Link>

            {/* Créer un article de blog */}
            <Link
              href="/super/blog/new"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-lg flex items-center gap-2",
                pathname === "/super/blog/new" || pathname?.startsWith("/super/blog/")
                  ? "text-white"
                  : "text-[#A0522D] hover:text-white",
                pathname === "/super/blog/new" || pathname?.startsWith("/super/blog/")
                  ? "bg-[#C6A664]"
                  : "bg-[#E6D9C6] hover:bg-[#C6A664]",
              )}
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
            >
              <FileText className="h-4 w-4" />
              <span>Créer un article de blog</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

