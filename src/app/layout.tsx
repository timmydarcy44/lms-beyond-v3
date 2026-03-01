import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/providers/session-provider";
import { PomodoroProvider } from "@/components/apprenant/pomodoro-provider";
import { PomodoroFloatingTimer } from "@/components/apprenant/pomodoro-floating-timer";
import { FloatingDashboardCTAWrapper } from "@/components/apprenant/floating-dashboard-cta-wrapper";
import { PomodoroFocusManager } from "@/components/apprenant/pomodoro-focus-manager";
import { PomodoroCompletionScreen } from "@/components/apprenant/pomodoro-completion-screen";
import { ThemeFloatingToggle } from "@/components/ui/theme-floating-toggle";
import { NeuroAccessibilityCTA } from "@/components/apprenant/neuro-accessibility-cta";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostname = (headersList.get("host") || "").split(":")[0];

  if (hostname === "jessicacontentin.fr" || hostname === "www.jessicacontentin.fr") {
    const { generateSEOMetadata } = await import("@/lib/seo/jessica-contentin-seo");
    return {
      ...generateSEOMetadata("home"),
      metadataBase: new URL("https://jessicacontentin.fr"),
    };
  }

  if (hostname === "app.jessicacontentin.fr") {
    const { generateSEOMetadata } = await import("@/lib/seo/jessica-contentin-seo");
    return {
      ...generateSEOMetadata("ressources"),
      metadataBase: new URL("https://app.jessicacontentin.fr"),
    };
  }

  return {
    title: "Beyond LMS",
    description: "Plateforme d'apprentissage Beyond",
    // Le favicon est géré automatiquement par Next.js via src/app/favicon.ico
    // Si le loader tourne encore, videz le cache du navigateur (Ctrl+Shift+Delete)
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${spaceGrotesk.variable} antialiased`}>
        <SupabaseProvider>
          <SessionProvider>
            <QueryProvider>
              <ThemeProvider>
                <PomodoroProvider>
                  <PomodoroFocusManager />
                  <FloatingDashboardCTAWrapper>
                    {children}
                    <PomodoroFloatingTimer />
                  </FloatingDashboardCTAWrapper>
                  <PomodoroCompletionScreen />
                  <ThemeFloatingToggle />
                  <NeuroAccessibilityCTA />
                </PomodoroProvider>
                <Toaster richColors position="top-center" />
              </ThemeProvider>
            </QueryProvider>
          </SessionProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
