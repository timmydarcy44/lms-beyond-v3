import { getSingleOrg } from '@/lib/org-single';

export const dynamic = 'force-dynamic';

export default async function DiagnosticPage() {
  const org = await getSingleOrg();

  return (
    <main className="p-6">
      <h2 className="text-xl font-semibold text-green-400 mb-4">✅ Configuration OK</h2>
      <div className="space-y-2">
        <p><strong>Organisation ID:</strong> {org.id}</p>
        <p><strong>Slug:</strong> {org.slug || 'N/A'}</p>
      </div>
    </main>
  );
}
