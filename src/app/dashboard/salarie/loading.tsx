export default function SalarieLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] animate-pulse px-5 py-10 sm:px-8 lg:px-10">
      <div className="h-4 w-32 rounded bg-white/10" />
      <div className="mt-4 h-10 w-64 rounded bg-white/[0.08]" />
      <div className="mt-8 h-40 rounded-2xl bg-white/[0.04]" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="h-32 rounded-2xl bg-white/[0.04]" />
        <div className="h-32 rounded-2xl bg-white/[0.04]" />
      </div>
    </div>
  );
}
