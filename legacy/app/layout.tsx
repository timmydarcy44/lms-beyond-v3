import type { Metadata } from 'next';
import './globals.css';
import RootProviders from '@/components/providers/RootProviders';

export const metadata: Metadata = {
  title: 'App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const diag = process.env.NEXT_PUBLIC_DIAG_MODE === '1';

  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        {diag ? (
          // DIAG_MODE on: bypass all providers/effects
          <>{children}</>
        ) : (
          // Normal mode: use your real providers (see RootProviders.tsx)
          <RootProviders>{children}</RootProviders>
        )}
      </body>
    </html>
  );
}
