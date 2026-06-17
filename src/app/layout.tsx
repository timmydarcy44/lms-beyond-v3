import './globals.css';
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import PageViewTracker from "@/components/analytics/page-view-tracker";
import { PomodoroProvider } from "@/components/apprenant/pomodoro-provider";
import { AuthHashRedirect } from "@/components/auth/auth-hash-redirect";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { headers } from "next/headers";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1b2e",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const orgSlug = (h.get("x-org-slug") ?? "").trim() || null;

  let orgLogoUrl: string | null = null;
  let primaryColor: string | null = null;
  if (orgSlug) {
    const supabase = await getServerClient();
    if (supabase) {
      const { data: org } = await supabase
        .from("organizations")
        .select("logo_url, logo, primary_color")
        .eq("slug", orgSlug)
        .maybeSingle();
      orgLogoUrl = String((org as any)?.logo_url ?? (org as any)?.logo ?? "").trim() || null;
      primaryColor = String((org as any)?.primary_color ?? "").trim() || null;
    }
  }

  return (
    <html lang="en">
      <body
        data-org-slug={orgSlug ?? undefined}
        data-org-logo-url={orgLogoUrl ?? undefined}
        style={
          (primaryColor
            ? ({ ["--primary" as any]: primaryColor } as React.CSSProperties)
            : undefined)
        }
      >
        <SupabaseProvider>
          <AuthHashRedirect />
          <PomodoroProvider>
            <Suspense fallback={null}>
              <PageViewTracker />
            </Suspense>
            {children}
          </PomodoroProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
