export default function KpiCard({
  title,
  value,
  href,
  icon,
}: {
  title: string;
  value: number | string;
  href?: string;
  icon?: React.ReactNode;
}) {
  const content = (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5 hover:bg-white/[0.05] transition">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-white/70">{title}</h3>
        {icon ?? null}
      </div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}



