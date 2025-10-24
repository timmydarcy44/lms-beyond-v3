import "./globals.css";
import Providers from "../providers";

export const metadata = { title: "LMS", description: "Multi-org LMS" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-neutral-950 text-neutral-200 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}