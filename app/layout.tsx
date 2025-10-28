import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LMS — Dashboard',
  description: 'LMS minimal et extensible'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-dvh" style={{ background:'#0A0A0A', color:'#E5E7EB', fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
        <main style={{ padding:'20px 24px', maxWidth: 1200, margin:'0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
