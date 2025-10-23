export const dynamic = 'force-dynamic';

export default async function SimpleTestPage() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">✅ Simple Test Page</h1>
      <p>This is a basic Server Component without any external dependencies.</p>
      <p>If you can see this, the basic Server Components are working.</p>
      <div className="mt-4">
        <a href="/diagnostic" className="text-blue-500 underline">Go to Full Diagnostic</a>
      </div>
    </main>
  );
}
