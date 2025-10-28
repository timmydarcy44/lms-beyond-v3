'use client';
import { useEffect, useState } from 'react';

// Import your real providers here (commented to avoid accidental crashes during diag)
// import { SessionProvider } from 'next-auth/react';
// import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
// import { ThemeProvider } from 'next-themes';
// import { QueryClientProvider } from '@tanstack/react-query';
// import { QueryClient } from '@tanstack/react-query';
import SupabaseSessionProvider from '@/components/auth/supabase-session-provider';

// Optional: instantiate heavy clients lazily after mount
export default function RootProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Delay to ensure we are after mount before any window/document usage
    setReady(true);
  }, []);

  if (!ready) return <>{children}</>; // neutral fallback to avoid early crashes

  return (
    <>
      {/* Re-enable providers one by one when DIAG_MODE=0 to isolate the offender */}
      <SupabaseSessionProvider>
        {children}
      </SupabaseSessionProvider>
    </>
  );
}




