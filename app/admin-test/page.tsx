// app/admin-test/page.tsx - Test minimal
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-500 mb-4">Admin Test - Static Success!</h1>
      <p>This page renders without any Server Components issues.</p>
      <div className="mt-4 space-x-4">
        <a 
          href="/admin-simple" 
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Simple Admin
        </a>
        <a 
          href="/admin" 
          className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Test Full Admin
        </a>
      </div>
    </div>
  );
}
