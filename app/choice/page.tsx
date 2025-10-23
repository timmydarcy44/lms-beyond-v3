import Link from 'next/link';
import { getSessionUser, getOrgsForUser } from '@/lib/orgs';

export const dynamic = 'force-dynamic';

export default async function ChoicePage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <main className="p-6">
        <p>Veuillez vous <a className="underline" href="/login/admin">connecter</a>.</p>
      </main>
    );
  }

  const orgs = await getOrgsForUser(user.id);
  if (orgs.length === 1) {
    return (
      <meta httpEquiv="refresh" content={`0;url=/admin/${orgs[0].slug}/dashboard`} />
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Choisissez une organisation</h1>
      <ul className="space-y-2">
        {orgs.map(o => (
          <li key={o.id}>
            <Link className="underline" href={`/admin/${o.slug}/dashboard`}>{o.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
