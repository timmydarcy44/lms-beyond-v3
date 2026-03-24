import "./globals.css";
import { Suspense } from "react";
import PageViewTracker from "@/components/analytics/page-view-tracker";
import { PomodoroProvider } from "@/components/apprenant/pomodoro-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PomodoroProvider>
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
          {children}
        </PomodoroProvider>
      </body>
    </html>
  );
}
