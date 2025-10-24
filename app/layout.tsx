import "./globals.css";
import Providers from "../providers";

export const metadata = { title: "LMS", description: "Multi-org LMS" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-dvh bg-bg text-text antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}