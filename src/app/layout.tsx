import './globals.css';
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import PageViewTracker from "@/components/analytics/page-view-tracker";
import { PomodoroProvider } from "@/components/apprenant/pomodoro-provider";
import { AuthHashRedirect } from "@/components/auth/auth-hash-redirect";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { Toaster } from "sonner";
import { headers } from "next/headers";
import { getServerClient } from "@/lib/supabase/server";

const EDGE_ICON = "/icons/edge/edge-icon-E.png";
const EDGE_APPLE_ICON = "/icons/edge/apple-touch-icon-180.png";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("host")?.split(":")[0]?.replace(/^www\./i, "").toLowerCase() ?? "";

  if (host === "edgebs.fr") {
    return {
      metadataBase: new URL("https://edgebs.fr"),
      title: {
        default: "EDGE",
        template: "%s · EDGE",
      },
      applicationName: "EDGE",
      manifest: "/manifest-edge.json",
      icons: {
        icon: [
          { url: `${EDGE_ICON}?v=2`, type: "image/png", sizes: "1024x1024" },
        ],
        shortcut: [`${EDGE_ICON}?v=2`],
        apple: [
          { url: `${EDGE_APPLE_ICON}?v=2`, sizes: "180x180", type: "image/png" },
          { url: `${EDGE_ICON}?v=2`, sizes: "1024x1024", type: "image/png" },
        ],
      },
      appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "EDGE",
      },
      other: {
        "apple-mobile-web-app-title": "EDGE",
        "mobile-web-app-capable": "yes",
      },
    };
  }

  return {
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const h = await headers();
  const host = h.get("host")?.split(":")[0]?.replace(/^www\./i, "").toLowerCase() ?? "";
  if (host === "edgebs.fr") {
    return { themeColor: "#0a0a0a" };
  }
  return { themeColor: "#0d1b2e" };
}

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
          <Toaster richColors position="top-center" />
        </SupabaseProvider>
      </body>
    </html>
  );
}
