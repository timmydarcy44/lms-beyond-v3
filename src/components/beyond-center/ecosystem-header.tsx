"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EcosystemHeaderProps {
  ecosystem: "care" | "no-school" | "connect" | "play" | "note" | "center";
  title: string;
}

const ECOSYSTEM_BRANDING = {
  care: {
    color: "#FF6B6B",
    bgColor: "#FF6B6B",
    textColor: "#FFFFFF",
  },
  "no-school": {
    color: "#006CFF",
    bgColor: "#006CFF",
    textColor: "#FFFFFF",
  },
  connect: {
    color: "#004D9F", // Bleu PSG
    bgColor: "#004D9F",
    textColor: "#FFFFFF",
  },
  play: {
    color: "#FFE66D",
    bgColor: "#FFE66D",
    textColor: "#000000",
  },
  note: {
    color: "#A8E6CF",
    bgColor: "#A8E6CF",
    textColor: "#000000",
  },
  center: {
    color: "#FF00FF",
    bgColor: "#FF00FF",
    textColor: "#FFFFFF",
  },
};

const LOGIN_LINKS: Record<string, string> = {
  "center": "/beyond-center/login",
  "no-school": "/beyond-no-school/login",
  "care": "/beyond-care/login",
  "connect": "/beyond-connect/login",
  "play": "/beyond-play/login",
  "note": "/beyond-note/login",
};

export function EcosystemHeader({ ecosystem, title }: EcosystemHeaderProps) {
  const branding = ECOSYSTEM_BRANDING[ecosystem];
  const pathname = usePathname();
  const loginLink = LOGIN_LINKS[ecosystem];

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: branding.bgColor,
        borderColor: `${branding.color}20`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/beyond-center">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-white/10"
                style={{ color: branding.textColor }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div
              className="text-lg font-light"
              style={{
                color: branding.textColor,
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              {title}
            </div>
          </div>
          {loginLink && (
            <Link href={loginLink}>
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 hover:bg-white/10"
                style={{ 
                  color: branding.textColor,
                  borderColor: `${branding.textColor}50`
                }}
              >
                Se connecter
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

