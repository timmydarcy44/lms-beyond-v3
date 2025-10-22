import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/admin'); // point d'entrée unique, la logique est gérée par app/admin/page.tsx
}