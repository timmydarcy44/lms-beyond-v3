import type { Metadata } from "next";
import "./globals.css";
import SupabaseSessionProvider from "@/components/auth/supabase-session-provider";

export const metadata: Metadata = {
  title: "Learning Management System",
  description: "Plateforme de formation immersive",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-[#0A0A0A] text-[#E5E7EB] antialiased">
        <SupabaseSessionProvider>
          {children}
        </SupabaseSessionProvider>
      </body>
    </html>
  );
}
