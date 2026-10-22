export function CarePlaceholder({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-semibold text-[#9096A3]">Byound Care</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.04em] text-[#F4F5F7]">{title}</h1>
      <p className="mt-6 rounded-[28px] bg-[#12141A] p-8 text-lg font-semibold text-[#DADDE4]">Bientôt disponible</p>
    </div>
  );
}
