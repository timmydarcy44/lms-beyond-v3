import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/components/providers/session-provider";
import { PomodoroProvider } from "@/components/apprenant/pomodoro-provider";
import { PomodoroFloatingTimer } from "@/components/apprenant/pomodoro-floating-timer";
import { PomodoroCompletionScreen } from "@/components/apprenant/pomodoro-completion-screen";
import { PomodoroFocusManager } from "@/components/apprenant/pomodoro-focus-manager";

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

export const metadata: Metadata = {
  title: "Beyond LMS",
  description: "Plateforme d'apprentissage Beyond",
  // Le favicon est géré automatiquement par Next.js via src/app/favicon.ico
  // Si le loader tourne encore, videz le cache du navigateur (Ctrl+Shift+Delete)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${spaceGrotesk.variable} antialiased`}>
        <SupabaseProvider>
          <SessionProvider>
            <QueryProvider>
              <ThemeProvider>
                <PomodoroProvider>
                  <PomodoroFocusManager />
                  {children}
                  <PomodoroFloatingTimer />
                  <PomodoroCompletionScreen />
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
