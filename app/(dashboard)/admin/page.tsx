import { redirect } from 'next/navigation';

export default async function AdminIndex() {
  // Cette page ne devrait plus être atteinte car le login redirige directement
  // vers /admin/[slug]. Redirection de sécurité vers le login.
  redirect('/login/admin');
}