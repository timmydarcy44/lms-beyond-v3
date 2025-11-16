"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { LoginHeader } from "@/components/landing/login-header";
import { cn } from "@/lib/utils";

type AuthLayoutShellProps = {
  children: ReactNode;
};

export function AuthLayoutShell({ children }: AuthLayoutShellProps) {
  const pathname = usePathname();
  const normalizedPath = pathname ? pathname.replace(/\/+$/, "") || "/" : "/";
  const showHeader = normalizedPath !== "/login";

  return (
    <div className="min-h-screen bg-white">
      {showHeader ? <LoginHeader /> : null}
      <div
        className={cn(
          "flex items-center justify-center px-4 py-8",
          showHeader ? "pt-24" : "min-h-screen",
        )}
      >
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}


