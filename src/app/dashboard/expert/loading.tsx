export default function ExpertLoading() {
  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6">
      <div className="h-10 w-56 rounded-2xl bg-[#1E2130]" />
      <div className="mt-3 h-4 w-80 max-w-full rounded-full bg-[#12141A]" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-[32px] bg-[#12141A]" />
        <div className="h-64 rounded-[32px] bg-[#1E2130]" />
      </div>
      <div className="mt-4 h-40 rounded-[28px] bg-[#12141A]" />
    </div>
  );
}
