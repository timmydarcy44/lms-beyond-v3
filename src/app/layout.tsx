import "./globals.css";
import { Suspense } from "react";
import PageViewTracker from "@/components/analytics/page-view-tracker";
import { PomodoroProvider } from "@/components/apprenant/pomodoro-provider";
import { SupabaseProvider } from "@/components/providers/supabase-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
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
