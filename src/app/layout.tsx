import "./globals.css";
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
          <PageViewTracker />
          {children}
        </PomodoroProvider>
      </body>
    </html>
  );
}
