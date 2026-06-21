export default function EntrepriseLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-white lg:pl-[280px] px-10 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto h-4 w-32 rounded bg-gray-100" />
        <div className="mx-auto mt-4 h-10 w-72 rounded bg-gray-100" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-50" />
          ))}
        </div>
        <div className="mt-10 h-64 rounded-2xl bg-gray-50" />
      </div>
    </div>
  );
}
