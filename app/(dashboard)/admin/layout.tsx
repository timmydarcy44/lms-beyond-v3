// app/(dashboard)/admin/layout.tsx
export const dynamic = 'force-dynamic'; export const revalidate = 0;
import AdminLayoutClient from '@/components/layout/AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Pas de vérification d'auth ici - laisser les pages individuelles gérer
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}