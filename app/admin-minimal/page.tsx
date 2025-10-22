// app/admin-minimal/page.tsx - Version ultra-minimale
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminMinimalPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-500 mb-4">Admin Minimal - Static Success!</h1>
      <p>This is a completely static page with no Server Components.</p>
      <div className="mt-4 space-x-4">
        <a 
          href="/api/debug/production-error" 
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Production Debug
        </a>
        <a 
          href="/admin-test" 
          className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Test Admin Static
        </a>
      </div>
    </div>
  );
}
