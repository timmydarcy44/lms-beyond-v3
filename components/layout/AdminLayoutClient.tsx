// components/layout/AdminLayoutClient.tsx
'use client';
import { usePathname } from 'next/navigation';
import AppShell from './AppShell';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Extraire l'organisation de l'URL
  const orgMatch = pathname.match(/\/admin\/([^\/]+)/);
  const currentOrg = orgMatch ? orgMatch[1] : undefined;
  
  return <AppShell role="admin" currentOrg={currentOrg}>{children}</AppShell>;
}
